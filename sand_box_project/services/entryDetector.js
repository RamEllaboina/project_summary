const fs = require('fs-extra');
const path = require('path');

const pythonEntryFiles = ['main.py', 'app.py', 'run.py', 'index.py'];
const nodeEntryFiles = ['server.js', 'index.js', 'app.js', 'main.js'];

async function detect(jobDir, language) {
    const entryFiles = language === 'python' ? pythonEntryFiles : nodeEntryFiles;
    let foundEntry = null;
    let minDepth = Infinity;
    let highestPriority = Infinity;

    async function walk(currentDir, currentDepth) {
        const files = await fs.readdir(currentDir);

        for (const file of files) {
            const fullPath = path.join(currentDir, file);
            const relativePath = path.relative(jobDir, fullPath);
            const stat = await fs.stat(fullPath);

            if (stat.isDirectory()) {
                await walk(fullPath, currentDepth + 1);
            } else if (stat.isFile()) {
                const priorityIndex = entryFiles.indexOf(file);
                if (priorityIndex !== -1) {
                    if (currentDepth < minDepth || (currentDepth === minDepth && priorityIndex < highestPriority)) {
                        foundEntry = relativePath;
                        minDepth = currentDepth;
                        highestPriority = priorityIndex;
                    }
                }
            }
        }
    }

    await walk(jobDir, 0);

    // If predefined names aren't found, pick the first .py or .js file found
    if (!foundEntry) {
        async function fallbackWalk(currentDir) {
            const files = await fs.readdir(currentDir);
            for (const file of files) {
                const fullPath = path.join(currentDir, file);
                const stat = await fs.stat(fullPath);

                if (stat.isDirectory()) {
                    await fallbackWalk(fullPath);
                } else if (stat.isFile()) {
                    if ((language === 'python' && file.endsWith('.py')) ||
                        (language === 'nodejs' && file.endsWith('.js'))) {
                        if (!foundEntry) {
                            foundEntry = path.relative(jobDir, fullPath);
                        }
                    }
                }
            }
        }
        await fallbackWalk(jobDir);
    }

    return foundEntry; // Returns relative path (e.g., 'src/main.py')
}

module.exports = { detect };
