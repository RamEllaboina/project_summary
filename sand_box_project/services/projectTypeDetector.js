const fs = require('fs-extra');
const path = require('path');

/**
 * Scans a project directory and classifies it as:
 * - "frontend" : Has HTML, CSS, browser-specific DOM code (document/window), no backend entry points
 * - "backend"  : Has server-side entry files (server.js, main.py), package.json, requirements.txt
 * - "fullstack": Has BOTH frontend AND backend indicators present together
 */
async function detect(jobDir) {
    const indicators = {
        hasDomCode: false,
        hasHtml: false,
        hasCss: false,
        hasPackageJson: false,
        hasRequirementsTxt: false,
        hasBackendEntry: false,
        hasServerCode: false,
    };

    const backendEntryFileNames = ['server.js', 'app.js', 'index.js', 'main.js', 'main.py', 'app.py', 'run.py'];
    const domPatterns = [
        'document.',
        'window.',
        'document.addEventListener',
        'document.getElementById',
        'getElementById',
        'querySelector',
        'DOMContentLoaded',
    ];

    async function walk(dir) {
        let files;
        try {
            files = await fs.readdir(dir);
        } catch {
            return;
        }

        for (const file of files) {
            // skip node_modules and hidden dirs
            if (file === 'node_modules' || file.startsWith('.') || file === 'Dockerfile') continue;

            const fullPath = path.join(dir, file);
            const stat = await fs.stat(fullPath);

            if (stat.isDirectory()) {
                await walk(fullPath);
            } else {
                const ext = path.extname(file).toLowerCase();
                const baseName = file.toLowerCase();

                if (ext === '.html') indicators.hasHtml = true;
                if (ext === '.css') indicators.hasCss = true;
                if (baseName === 'package.json') indicators.hasPackageJson = true;
                if (baseName === 'requirements.txt') indicators.hasRequirementsTxt = true;

                if (backendEntryFileNames.includes(baseName)) {
                    indicators.hasBackendEntry = true;
                }

                // Scan JS/PY files for DOM usage patterns
                if (ext === '.js' || ext === '.py') {
                    try {
                        const content = await fs.readFile(fullPath, 'utf-8');
                        const hasDOM = domPatterns.some(pattern => content.includes(pattern));
                        if (hasDOM) indicators.hasDomCode = true;

                        // Check for node-specific imports
                        const hasNodeImports = content.includes("require('http')") ||
                            content.includes('require("http")') ||
                            content.includes("require('express')") ||
                            content.includes('require("express")') ||
                            content.includes("require('fs')");
                        if (hasNodeImports) indicators.hasServerCode = true;
                    } catch {
                        // Binary or unreadable files
                    }
                }
            }
        }
    }

    await walk(jobDir);

    // Classification Logic
    const isFrontend = (indicators.hasHtml || indicators.hasCss || indicators.hasDomCode) && !indicators.hasServerCode;
    const isBackend = (indicators.hasPackageJson || indicators.hasRequirementsTxt || indicators.hasBackendEntry) && !indicators.hasDomCode;
    const isFullstack = (indicators.hasHtml || indicators.hasDomCode) && (indicators.hasPackageJson || indicators.hasBackendEntry);

    if (isFullstack) return 'fullstack';
    if (isFrontend) return 'frontend';
    if (isBackend) return 'backend';

    // Default: if only JS files and no HTML → treat as backend
    if (indicators.hasBackendEntry) return 'backend';
    if (indicators.hasHtml) return 'frontend';

    return 'backend'; // safe fallback
}

module.exports = { detect };
