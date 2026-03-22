const fs = require('fs-extra');
const path = require('path');
const unzipper = require('unzipper');

const IGNORED = [
    'node_modules',
    'dist',
    'build',
    'coverage',
    '.git',
    '.idea',
    '.vscode',
    '__pycache__',
    'venv',
    'env',
    '.DS_Store'
];

exports.extractArchive = (zipFilePath, targetDir) => {
    return new Promise((resolve, reject) => {
        fs.createReadStream(zipFilePath)
            .pipe(unzipper.Extract({ path: targetDir }))
            .on('close', resolve)
            .on('error', reject);
    });
};

exports.cleanProject = async (dirPath) => {
    try {
        const files = await fs.readdir(dirPath);
        for (const file of files) {
            const fullPath = path.join(dirPath, file);
            const stat = await fs.stat(fullPath);

            if (IGNORED.includes(file) || file.endsWith('.log')) {
                // console.log(`Deleting ignored item: ${fullPath}`);
                await fs.remove(fullPath);
            } else if (stat.isDirectory()) {
                await exports.cleanProject(fullPath);
            }
        }
    } catch (err) {
        console.error(`Error cleaning ${dirPath}:`, err);
    }
};
