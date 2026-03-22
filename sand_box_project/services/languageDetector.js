const fs = require('fs-extra');
const path = require('path');

async function detect(jobDir) {
    let hasPythonFiles = false;
    let hasNodeFiles = false;

    // Recursive function to scan directory
    async function scan(dir) {
        const files = await fs.readdir(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = await fs.stat(fullPath);

            if (stat.isDirectory()) {
                await scan(fullPath);
            } else {
                if (file === 'requirements.txt' || file.endsWith('.py')) {
                    hasPythonFiles = true;
                }
                if (file === 'package.json' || file.endsWith('.js')) {
                    hasNodeFiles = true;
                }
            }
        }
    }

    try {
        await scan(jobDir);
    } catch (err) {
        console.error('Error scanning for language:', err);
    }

    // Priorities
    if (hasPythonFiles) return 'python';
    if (hasNodeFiles) return 'nodejs';

    return null;
}

module.exports = { detect };
