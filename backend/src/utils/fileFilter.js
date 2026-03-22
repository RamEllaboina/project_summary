const fs = require('fs-extra');
const path = require('path');

// Directories to completely ignore
const IGNORED_DIRECTORIES = new Set([
    'node_modules',
    'venv',
    '.venv',
    '__pycache__',
    '.git',
    'dist',
    'build',
    '.next',
    'out',
    'target',
    'coverage',
    '.vscode',
    '.idea',
    'vendor',
    '.nyc_output',
    '.pytest_cache',
    '.mypy_cache',
    '.tox',
    'site-packages',
    'bower_components',
    '.npm',
    '.cache',
    'tmp',
    'temp'
]);

// File extensions to ignore
const IGNORED_EXTENSIONS = new Set([
    '.log',
    '.tmp',
    '.lock',
    '.cache',
    '.DS_Store',
    '.env',
    '.env.local',
    '.env.development',
    '.env.test',
    '.env.production',
    '.pid',
    '.seed',
    '.pid.lock',
    '.swp',
    '.swo',
    '.bak',
    '.backup',
    '.old',
    '.orig',
    '.rej',
    '~',
    '.lprof',
    '.pyc',
    '.pyo',
    '.pyd',
    '.pyi',
    '.py class',
    '.pyo',
    '.pyd',
    '.pyi',
    '.py class',
    '.jar',
    '.war',
    '.ear',
    '.zip',
    '.tar',
    '.tar.gz',
    '.tgz',
    '.rar',
    '.7z',
    '.exe',
    '.dll',
    '.so',
    '.dylib',
    '.bin',
    '.dat',
    '.db',
    '.sqlite',
    '.sqlite3'
]);

// Allowed source code extensions
const ALLOWED_EXTENSIONS = new Set([
    '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
    '.py', '.pyx', '.pyi',
    '.java', '.kt', '.scala', '.groovy',
    '.cpp', '.c', '.h', '.hpp', '.cc', '.cxx',
    '.cs', '.vb',
    '.php', '.phtml',
    '.rb', '.rbw',
    '.go', '.mod', '.sum',
    '.rs',
    '.swift', '.m', '.mm',
    '.dart',
    '.lua',
    '.r', '.R',
    '.sql',
    '.sh', '.bash', '.zsh', '.fish',
    '.html', '.htm', '.xhtml',
    '.css', '.scss', '.sass', '.less',
    '.json', '.jsonc', '.json5',
    '.xml', '.yaml', '.yml', '.toml', '.ini',
    '.md', '.mdx', '.txt', '.rst',
    '.dockerfile', '.docker-compose.yml', '.docker-compose.yaml',
    '.graphql', '.gql',
    '.proto',
    '.vue', '.svelte'
]);

/**
 * Check if a file/directory should be ignored
 * @param {string} filePath - Path to check
 * @param {boolean} isDirectory - Whether it's a directory
 * @returns {boolean} - True if should be ignored
 */
function shouldIgnore(filePath, isDirectory = false) {
    const fileName = path.basename(filePath);
    const parsedPath = path.parse(filePath);
    
    // Check if it's an ignored directory
    if (isDirectory && IGNORED_DIRECTORIES.has(fileName)) {
        return true;
    }
    
    // Check if it's an ignored file extension
    if (!isDirectory && IGNORED_EXTENSIONS.has(parsedPath.ext.toLowerCase())) {
        return true;
    }
    
    // Check hidden files/directories (starting with .)
    if (fileName.startsWith('.') && !fileName.startsWith('.env') && fileName !== '.gitignore') {
        return true;
    }
    
    // Check for lock files
    if (fileName.includes('package-lock') || fileName.includes('yarn.lock') || fileName.includes('pipfile.lock')) {
        return true;
    }
    
    return false;
}

/**
 * Check if a file is a source code file we should analyze
 * @param {string} filePath - Path to check
 * @returns {boolean} - True if it's a source code file
 */
function isSourceCodeFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return ALLOWED_EXTENSIONS.has(ext);
}

/**
 * Filter files from a directory recursively
 * @param {string} dirPath - Directory path to scan
 * @param {Object} options - Filtering options
 * @returns {Array} - Array of filtered file paths
 */
async function filterFiles(dirPath, options = {}) {
    const {
        maxDepth = 10,
        currentDepth = 0,
        includeNonSourceCode = false,
        logIgnored = false
    } = options;
    
    const result = [];
    const ignored = [];
    
    try {
        const items = await fs.readdir(dirPath);
        
        for (const item of items) {
            const itemPath = path.join(dirPath, item);
            const stats = await fs.stat(itemPath);
            const isDirectory = stats.isDirectory();
            
            // Check if should ignore
            if (shouldIgnore(itemPath, isDirectory)) {
                if (logIgnored) {
                    ignored.push({
                        path: itemPath,
                        reason: isDirectory ? 'ignored_directory' : 'ignored_file'
                    });
                }
                continue;
            }
            
            if (isDirectory) {
                // Recursively scan subdirectories (with depth limit)
                if (currentDepth < maxDepth) {
                    const subResult = await filterFiles(itemPath, {
                        ...options,
                        currentDepth: currentDepth + 1
                    });
                    result.push(...subResult.files);
                    ignored.push(...subResult.ignored);
                }
            } else {
                // It's a file
                if (includeNonSourceCode || isSourceCodeFile(itemPath)) {
                    result.push(itemPath);
                } else {
                    if (logIgnored) {
                        ignored.push({
                            path: itemPath,
                            reason: 'non_source_code'
                        });
                    }
                }
            }
        }
    } catch (error) {
        console.error(`Error scanning directory ${dirPath}:`, error);
    }
    
    return { files: result, ignored };
}

/**
 * Get file stats for a file
 * @param {string} filePath - Path to file
 * @returns {Object} - File stats
 */
async function getFileStats(filePath) {
    try {
        const stats = await fs.stat(filePath);
        return {
            size: stats.size,
            modified: stats.mtime,
            created: stats.birthtime || stats.ctime
        };
    } catch (error) {
        return null;
    }
}

/**
 * Read file content with size limit
 * @param {string} filePath - Path to file
 * @param {number} maxSize - Maximum size in bytes (default: 1MB)
 * @returns {string|null} - File content or null if too large
 */
async function readFileContent(filePath, maxSize = 1024 * 1024) {
    try {
        const stats = await fs.stat(filePath);
        if (stats.size > maxSize) {
            console.warn(`File too large, skipping: ${filePath} (${stats.size} bytes)`);
            return null;
        }
        
        return await fs.readFile(filePath, 'utf8');
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        return null;
    }
}

/**
 * Create a custom ignore file parser
 * @param {string} ignoreFilePath - Path to ignore file
 * @returns {Set} - Set of ignore patterns
 */
async function parseIgnoreFile(ignoreFilePath) {
    const patterns = new Set();
    
    try {
        if (await fs.pathExists(ignoreFilePath)) {
            const content = await fs.readFile(ignoreFilePath, 'utf8');
            const lines = content.split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.startsWith('#'));
            
            lines.forEach(line => {
                patterns.add(line);
            });
        }
    } catch (error) {
        console.error(`Error reading ignore file ${ignoreFilePath}:`, error);
    }
    
    return patterns;
}

module.exports = {
    shouldIgnore,
    isSourceCodeFile,
    filterFiles,
    getFileStats,
    readFileContent,
    parseIgnoreFile,
    IGNORED_DIRECTORIES,
    IGNORED_EXTENSIONS,
    ALLOWED_EXTENSIONS
};
