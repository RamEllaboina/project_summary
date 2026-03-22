const fs = require('fs-extra');
const path = require('path');

class FileFilter {
    constructor() {
        this.excludedDirectories = new Set([
            'node_modules',
            'venv',
            '.venv',
            '__pycache__',
            'dist',
            'build',
            '.git',
            '.idea',
            '.vscode',
            'coverage',
            'tmp',
            'temp'
        ]);

        this.excludedExtensions = new Set([
            '.log',
            '.pyc',
            '.cache'
        ]);

        this.allowedLockFiles = new Set([
            'package-lock.json',
            'yarn.lock'
        ]);

        this.alwaysIncludeFiles = new Set([
            'package.json',
            'package-lock.json',
            'yarn.lock',
            'requirements.txt',
            'Pipfile'
        ]);

        this.alwaysIncludeDirectories = new Set([
            'src',
            'public'
        ]);
    }

    shouldExcludeDirectory(dirName) {
        return this.excludedDirectories.has(dirName);
    }

    shouldExcludeFile(filePath, fileName) {
        const ext = path.extname(fileName);
        
        if (this.alwaysIncludeFiles.has(fileName)) {
            return false;
        }

        if (ext === '.lock' && !this.allowedLockFiles.has(fileName)) {
            return true;
        }

        return this.excludedExtensions.has(ext);
    }

    async filterDirectory(dirPath) {
        const items = await fs.readdir(dirPath);
        const results = {
            excluded: [],
            included: []
        };

        for (const item of items) {
            const itemPath = path.join(dirPath, item);
            const stats = await fs.stat(itemPath);

            if (stats.isDirectory()) {
                if (this.shouldExcludeDirectory(item)) {
                    results.excluded.push({
                        path: itemPath,
                        type: 'directory',
                        name: item
                    });
                } else {
                    const subResults = await this.filterDirectory(itemPath);
                    results.excluded.push(...subResults.excluded);
                    results.included.push(...subResults.included);
                }
            } else if (stats.isFile()) {
                if (this.shouldExcludeFile(itemPath, path.basename(itemPath))) {
                    results.excluded.push({
                        path: itemPath,
                        type: 'file',
                        name: path.basename(itemPath)
                    });
                } else {
                    results.included.push({
                        path: itemPath,
                        type: 'file',
                        name: path.basename(itemPath)
                    });
                }
            }
        }

        return results;
    }

    async cleanExcludedItems(dirPath) {
        const results = await this.filterDirectory(dirPath);
        
        for (const item of results.excluded) {
            try {
                await fs.remove(item.path);
            } catch (error) {
                console.warn(`Warning: Could not remove ${item.type} ${item.path}:`, error.message);
            }
        }

        return {
            removedCount: results.excluded.length,
            removedItems: results.excluded.map(item => item.name)
        };
    }

    shouldProcessFile(originalPath) {
        const pathParts = originalPath.split(/[\/\\]/);
        const fileName = pathParts[pathParts.length - 1];

        // Check if any directory in the path should be excluded
        for (const part of pathParts.slice(0, -1)) {
            if (this.shouldExcludeDirectory(part)) {
                return false;
            }
        }

        if (this.shouldExcludeFile(originalPath, fileName)) {
            return false;
        }

        return true;
    }
}

module.exports = new FileFilter();
