const fs = require('fs-extra');
const path = require('path');

class ProjectStructureAnalyzer {
    async analyzeProjectStructure(projectDir) {
        const structure = {
            folders: {},
            files: [],
            uiFiles: [],
            totalFiles: 0,
            totalFolders: 0,
            frameworks: [],
            languages: new Set(),
            fileTypes: new Set()
        };

        try {
            await this.walkDirectory(projectDir, '', structure);
            
            // Analyze patterns to identify frameworks and UI files
            this.analyzeFrameworks(structure);
            this.identifyUIFiles(structure);
            
            return {
                ...structure,
                languages: Array.from(structure.languages),
                fileTypes: Array.from(structure.fileTypes),
                framework: this.detectPrimaryFramework(structure.frameworks)
            };
        } catch (error) {
            console.error('Error analyzing project structure:', error);
            return structure;
        }
    }

    async walkDirectory(dir, relativePath, structure) {
        try {
            const items = await fs.readdir(dir);
            
            for (const item of items) {
                const itemPath = path.join(dir, item);
                const itemRelativePath = path.join(relativePath, item);
                const stats = await fs.stat(itemPath);
                
                if (stats.isDirectory()) {
                    structure.totalFolders++;
                    structure.folders[itemRelativePath] = {
                        name: item,
                        path: itemRelativePath,
                        type: this.identifyFolderType(item, itemRelativePath)
                    };
                    
                    await this.walkDirectory(itemPath, itemRelativePath, structure);
                } else {
                    structure.totalFiles++;
                    const fileInfo = {
                        name: item,
                        path: itemRelativePath,
                        size: stats.size,
                        extension: path.extname(item).toLowerCase(),
                        type: this.identifyFileType(item)
                    };
                    
                    structure.files.push(fileInfo);
                    structure.fileTypes.add(fileInfo.extension);
                    structure.languages.add(this.identifyLanguage(fileInfo.extension));
                }
            }
        } catch (error) {
            console.error(`Error walking directory ${dir}:`, error);
        }
    }

    identifyFolderType(folderName, folderPath) {
        const name = folderName.toLowerCase();
        
        // UI/View folders
        if (['views', 'pages', 'templates', 'components', 'layouts', 'partials', 'screens'].includes(name)) {
            return 'ui';
        }
        
        // Static asset folders
        if (['assets', 'static', 'public', 'images', 'css', 'styles', 'scripts', 'js', 'fonts'].includes(name)) {
            return 'assets';
        }
        
        // Source code folders
        if (['src', 'source', 'lib', 'modules', 'services', 'controllers', 'models', 'routes'].includes(name)) {
            return 'source';
        }
        
        // Config folders
        if (['config', 'configs', 'settings', 'env'].includes(name)) {
            return 'config';
        }
        
        // Build/output folders
        if (['build', 'dist', 'out', 'target', 'bin'].includes(name)) {
            return 'build';
        }
        
        // Test folders
        if (['test', 'tests', '__tests__', 'spec', 'specs'].includes(name)) {
            return 'test';
        }
        
        // Documentation
        if (['docs', 'doc', 'documentation', 'readme'].includes(name)) {
            return 'docs';
        }
        
        return 'general';
    }

    identifyFileType(fileName) {
        const name = fileName.toLowerCase();
        const ext = path.extname(name);
        
        // UI Files
        if (ext === '.html' || ext === '.htm' || ext === '.jsx' || ext === '.tsx' || ext === '.vue') {
            return 'ui';
        }
        
        // Style files
        if (ext === '.css' || ext === '.scss' || ext === '.sass' || ext === '.less') {
            return 'style';
        }
        
        // Script files
        if (ext === '.js' || ext === '.ts' || ext === '.mjs') {
            return 'script';
        }
        
        // Config files
        if (name.includes('config') || name.includes('package') || name.includes('webpack') || 
            name.includes('babel') || name.includes('eslint') || name.includes('prettier')) {
            return 'config';
        }
        
        // Documentation
        if (ext === '.md' || ext === '.txt' || ext === '.rst') {
            return 'docs';
        }
        
        return 'other';
    }

    identifyLanguage(extension) {
        const langMap = {
            '.js': 'JavaScript',
            '.ts': 'TypeScript',
            '.jsx': 'React',
            '.tsx': 'React/TypeScript',
            '.vue': 'Vue',
            '.py': 'Python',
            '.html': 'HTML',
            '.htm': 'HTML',
            '.css': 'CSS',
            '.scss': 'SCSS',
            '.sass': 'Sass',
            '.less': 'Less',
            '.json': 'JSON',
            '.xml': 'XML',
            '.yml': 'YAML',
            '.yaml': 'YAML',
            '.md': 'Markdown',
            '.txt': 'Text',
            '.java': 'Java',
            '.cpp': 'C++',
            '.c': 'C',
            '.go': 'Go',
            '.rs': 'Rust',
            '.php': 'PHP',
            '.rb': 'Ruby',
            '.swift': 'Swift',
            '.kt': 'Kotlin',
            '.sql': 'SQL'
        };
        
        return langMap[extension] || 'Unknown';
    }

    analyzeFrameworks(structure) {
        const frameworks = new Set();
        
        // Check for framework indicators in file names and folder structure
        structure.files.forEach(file => {
            const name = file.name.toLowerCase();
            
            // React
            if (name.includes('react') || file.extension === '.jsx' || file.extension === '.tsx') {
                frameworks.add('React');
            }
            
            // Vue
            if (name.includes('vue') || file.extension === '.vue') {
                frameworks.add('Vue');
            }
            
            // Angular
            if (name.includes('angular') || name.includes('ng-')) {
                frameworks.add('Angular');
            }
            
            // Express
            if (name.includes('express') || name.includes('app.js')) {
                frameworks.add('Express');
            }
            
            // Django
            if (name.includes('django') || name.includes('manage.py')) {
                frameworks.add('Django');
            }
            
            // Flask
            if (name.includes('flask') || name.includes('app.py')) {
                frameworks.add('Flask');
            }
            
            // Next.js
            if (name.includes('next') || structure.folders['pages']) {
                frameworks.add('Next.js');
            }
            
            // Nuxt.js
            if (name.includes('nuxt')) {
                frameworks.add('Nuxt.js');
            }
        });
        
        // Check folder structure for frameworks
        if (structure.folders['components'] || structure.folders['src/components']) {
            frameworks.add('Component-based');
        }
        
        if (structure.folders['views'] || structure.folders['templates']) {
            frameworks.add('Template-based');
        }
        
        structure.frameworks = Array.from(frameworks);
    }

    identifyUIFiles(structure) {
        structure.uiFiles = structure.files.filter(file => {
            return file.type === 'ui' || 
                   file.extension === '.html' || 
                   file.extension === '.htm' ||
                   file.extension === '.jsx' ||
                   file.extension === '.tsx' ||
                   file.extension === '.vue';
        });
    }

    detectPrimaryFramework(frameworks) {
        if (frameworks.length === 0) return 'None';
        
        // Priority order for framework detection
        const priority = ['React', 'Vue', 'Angular', 'Next.js', 'Nuxt.js', 'Express', 'Django', 'Flask'];
        
        for (const fw of priority) {
            if (frameworks.includes(fw)) return fw;
        }
        
        return frameworks[0];
    }
}

module.exports = new ProjectStructureAnalyzer();
