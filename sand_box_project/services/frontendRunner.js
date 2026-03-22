const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs-extra');

// Try to find the Chrome/Chromium binary on the host machine
const CHROME_PATHS = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
];

function findChrome() {
    for (const p of CHROME_PATHS) {
        try {
            fs.accessSync(p);
            return p;
        } catch { }
    }
    return null;
}

/**
 * Runs a frontend project using a Puppeteer headless Chrome browser.
 * Captures:
 *  - console.log / console.error / console.warn messages
 *  - JS runtime errors
 *  - DOM snapshot (title, element count, scripts, body text)
 *  - Resources loaded
 */
async function run(jobDir) {
    const logs = [];
    const errors = [];

    // ── Locate HTML entry file ────────────────────────────────────
    const priorityHtml = ['index.html', 'app.html', 'main.html'];
    let htmlEntry = null;

    async function searchHtml(dir) {
        const files = await fs.readdir(dir);
        for (const name of priorityHtml) {
            if (files.includes(name)) {
                htmlEntry = path.join(dir, name);
                return;
            }
        }
        for (const f of files) {
            const fp = path.join(dir, f);
            const stat = await fs.stat(fp);
            if (stat.isDirectory() && f !== 'node_modules') {
                await searchHtml(fp);
            } else if (!htmlEntry && f.endsWith('.html')) {
                htmlEntry = fp;
            }
        }
    }

    await searchHtml(jobDir);

    if (!htmlEntry) {
        return {
            error: true,
            logs: 'No HTML entry point found in the uploaded project.',
            flow: ['Project Upload', 'HTML Entry Search', 'FAILED: No index.html found']
        };
    }

    const entryRelative = path.relative(jobDir, htmlEntry).replace(/\\/g, '/');
    const fileUrl = `file:///${htmlEntry.replace(/\\/g, '/')}`;

    // ── Find Chrome executable ────────────────────────────────────
    const executablePath = findChrome();
    if (!executablePath) {
        return {
            error: true,
            entryFile: entryRelative,
            logs: 'Chrome/Chromium not found. Please install Google Chrome to run frontend projects.'
        };
    }

    let browser;
    try {
        browser = await puppeteer.launch({
            executablePath,
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-web-security',   // allow file:// to load local JS/CSS
                '--allow-file-access-from-files',
            ],
            timeout: 12000
        });

        const page = await browser.newPage();

        // Intercept browser console messages
        page.on('console', (msg) => {
            const text = `[console.${msg.type()}] ${msg.text()}`;
            if (msg.type() === 'error') {
                errors.push(text);
            } else {
                logs.push(text);
            }
        });

        // Intercept JS runtime errors
        page.on('pageerror', (err) => {
            errors.push(`[JS Error] ${err.message}`);
        });

        // Track loaded resources
        const resourcesLoaded = [];
        page.on('requestfinished', req => {
            const url = req.url();
            if (url.startsWith('file://')) {
                resourcesLoaded.push(url);
            }
        });

        // Navigate to local HTML
        await page.goto(fileUrl, { waitUntil: 'domcontentloaded', timeout: 8000 });

        // Wait briefly for async scripts
        await new Promise(r => setTimeout(r, 1500));

        // Capture DOM details
        const domInfo = await page.evaluate(() => ({
            title: document.title,
            elementCount: document.querySelectorAll('*').length,
            scriptTags: document.querySelectorAll('script').length,
            stylesheets: document.querySelectorAll('link[rel="stylesheet"]').length,
            bodyText: document.body ? document.body.innerText.slice(0, 400) : ''
        }));

        await browser.close();

        const allLogs = [
            `[DOM] Title          : "${domInfo.title || '(no title)'}"`,
            `[DOM] Total Elements : ${domInfo.elementCount}`,
            `[DOM] Script Tags    : ${domInfo.scriptTags}`,
            `[DOM] Stylesheets    : ${domInfo.stylesheets}`,
            `[DOM] Body Text      : ${domInfo.bodyText || '(empty body)'}`,
            `[Resources Loaded]`,
            ...resourcesLoaded.map(r => `  → ${decodeURIComponent(path.basename(r))}`),
            '',
            '--- Console Output ---',
            ...logs,
            ...(errors.length ? ['', '--- Errors ---', ...errors] : [])
        ];

        return {
            error: errors.length > 0,
            entryFile: entryRelative,
            logs: allLogs.join('\n'),
            domInfo
        };

    } catch (err) {
        if (browser) await browser.close().catch(() => { });
        return {
            error: true,
            entryFile: entryRelative || 'unknown',
            logs: `Puppeteer execution error:\n${err.message}`
        };
    }
}

module.exports = { run };
