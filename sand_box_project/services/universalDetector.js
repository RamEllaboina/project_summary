const fs = require('fs-extra');
const path = require('path');

class UniversalDetector {
    constructor() {
        this.frameworkPatterns = {
            // Node.js frameworks
            react: ['react', 'react-dom'],
            next: ['next'],
            vue: ['vue'],
            angular: ['@angular/core'],
            express: ['express'],
            nest: ['@nestjs/core'],
            
            // Python frameworks
            django: ['django'],
            flask: ['flask'],
            fastapi: ['fastapi'],
            
            // Java build tools
            maven: ['pom.xml'],
            gradle: ['build.gradle', 'build.gradle.kts'],
            
            // Other
            go: ['go.mod'],
            rust: ['Cargo.toml'],
            php: ['composer.json']
        };
    }

    async detectProjectType(jobDir) {
        const projectInfo = {
            type: 'unknown',
            language: 'unknown',
            framework: 'none',
            buildTool: 'none',
            entryFile: null,
            dependencyFile: null,
            commands: []
        };

        const files = await this.scanDirectory(jobDir);
        
        // Check for Java projects
        if (files.some(f => f.name === 'pom.xml')) {
            projectInfo.type = 'java';
            projectInfo.language = 'java';
            projectInfo.buildTool = 'maven';
            projectInfo.dependencyFile = 'pom.xml';
            projectInfo.commands = ['mvn clean install', 'mvn spring-boot:run'];
            return projectInfo;
        }

        if (files.some(f => f.name === 'build.gradle' || f.name === 'build.gradle.kts')) {
            projectInfo.type = 'java';
            projectInfo.language = 'java';
            projectInfo.buildTool = 'gradle';
            projectInfo.dependencyFile = 'build.gradle';
            projectInfo.commands = ['gradle build', 'gradle run'];
            return projectInfo;
        }

        // Check for Node.js projects
        const packageJson = files.find(f => f.name === 'package.json');
        if (packageJson) {
            projectInfo.type = 'nodejs';
            projectInfo.language = 'javascript';
            projectInfo.dependencyFile = 'package.json';
            
            try {
                const packageContent = await fs.readFile(packageJson.path, 'utf-8');
                const packageData = JSON.parse(packageContent);
                
                // Detect framework
                const deps = { ...packageData.dependencies, ...packageData.devDependencies };
                
                if (deps.react || deps['react-dom']) {
                    projectInfo.framework = 'react';
                    projectInfo.commands = ['npm install', 'npm start'];
                } else if (deps.next) {
                    projectInfo.framework = 'next';
                    projectInfo.commands = ['npm install', 'npm run dev'];
                } else if (deps.vue) {
                    projectInfo.framework = 'vue';
                    projectInfo.commands = ['npm install', 'npm run serve'];
                } else if (deps['@angular/core']) {
                    projectInfo.framework = 'angular';
                    projectInfo.commands = ['npm install', 'ng serve'];
                } else if (deps.express) {
                    projectInfo.framework = 'express';
                    projectInfo.commands = ['npm install', 'npm start'];
                } else if (deps['@nestjs/core']) {
                    projectInfo.framework = 'nest';
                    projectInfo.commands = ['npm install', 'npm run start:dev'];
                } else {
                    projectInfo.framework = 'generic';
                    projectInfo.commands = ['npm install', 'npm start'];
                }

                // Determine entry file
                if (packageData.main) {
                    projectInfo.entryFile = packageData.main;
                } else if (packageData.scripts && packageData.scripts.start) {
                    const startScript = packageData.scripts.start;
                    if (startScript.includes('node ')) {
                        projectInfo.entryFile = startScript.replace('node ', '').trim();
                    }
                }

            } catch (err) {
                projectInfo.framework = 'generic';
                projectInfo.commands = ['npm install', 'npm start'];
            }

            return projectInfo;
        }

        // Check for Python projects
        const pyFiles = files.filter(f => f.ext === '.py');
        const requirementsTxt = files.find(f => f.name === 'requirements.txt');
        const pipfile = files.find(f => f.name === 'Pipfile');

        if (pyFiles.length > 0) {
            projectInfo.type = 'python';
            projectInfo.language = 'python';
            
            if (requirementsTxt) {
                projectInfo.dependencyFile = 'requirements.txt';
            } else if (pipfile) {
                projectInfo.dependencyFile = 'Pipfile';
            }

            // Detect entry file
            const entryCandidates = ['app.py', 'main.py', 'run.py', 'server.py'];
            for (const candidate of entryCandidates) {
                const found = pyFiles.find(f => f.name === candidate);
                if (found) {
                    projectInfo.entryFile = candidate;
                    break;
                }
            }

            if (!projectInfo.entryFile && pyFiles.length > 0) {
                projectInfo.entryFile = pyFiles[0].name;
            }

            // Detect framework
            try {
                for (const pyFile of pyFiles.slice(0, 5)) { // Check first 5 files
                    const content = await fs.readFile(pyFile.path, 'utf-8');
                    
                    if (content.includes('from django') || content.includes('import django')) {
                        projectInfo.framework = 'django';
                        projectInfo.commands = ['pip install -r requirements.txt', 'python manage.py runserver'];
                        break;
                    } else if (content.includes('from flask') || content.includes('import flask')) {
                        projectInfo.framework = 'flask';
                        projectInfo.commands = ['pip install -r requirements.txt', `python ${projectInfo.entryFile}`];
                        break;
                    } else if (content.includes('from fastapi') || content.includes('import fastapi')) {
                        projectInfo.framework = 'fastapi';
                        projectInfo.commands = ['pip install -r requirements.txt', `python ${projectInfo.entryFile}`];
                        break;
                    }
                }
            } catch (err) {
                // Ignore read errors
            }

            if (projectInfo.framework === 'none') {
                projectInfo.framework = 'generic';
                if (projectInfo.dependencyFile) {
                    projectInfo.commands = [`pip install -r ${projectInfo.dependencyFile}`, `python ${projectInfo.entryFile}`];
                } else {
                    projectInfo.commands = [`python ${projectInfo.entryFile}`];
                }
            }

            return projectInfo;
        }

        // Check for static web projects
        const htmlFiles = files.filter(f => f.ext === '.html');
        if (htmlFiles.length > 0) {
            projectInfo.type = 'static';
            projectInfo.language = 'html';
            projectInfo.framework = 'static';
            
            const indexHtml = htmlFiles.find(f => f.name === 'index.html');
            if (indexHtml) {
                projectInfo.entryFile = 'index.html';
            } else {
                projectInfo.entryFile = htmlFiles[0].name;
            }
            
            projectInfo.commands = ['python -m http.server 3000'];
            return projectInfo;
        }

        // Check for Go projects
        const goMod = files.find(f => f.name === 'go.mod');
        if (goMod) {
            projectInfo.type = 'go';
            projectInfo.language = 'go';
            projectInfo.dependencyFile = 'go.mod';
            projectInfo.commands = ['go mod download', 'go run .'];
            
            const goFiles = files.filter(f => f.ext === '.go');
            if (goFiles.length > 0) {
                projectInfo.entryFile = goFiles[0].name;
            }
            
            return projectInfo;
        }

        // Check for Rust projects
        const cargoToml = files.find(f => f.name === 'Cargo.toml');
        if (cargoToml) {
            projectInfo.type = 'rust';
            projectInfo.language = 'rust';
            projectInfo.dependencyFile = 'Cargo.toml';
            projectInfo.commands = ['cargo build', 'cargo run'];
            return projectInfo;
        }

        // Fallback - try to find common entry files
        const fallbackEntries = ['main.py', 'app.py', 'index.js', 'app.js', 'server.js', 'main.js'];
        for (const entry of fallbackEntries) {
            const found = files.find(f => f.name === entry);
            if (found) {
                projectInfo.type = found.ext === '.py' ? 'python' : 'nodejs';
                projectInfo.language = found.ext === '.py' ? 'python' : 'javascript';
                projectInfo.entryFile = entry;
                projectInfo.framework = 'generic';
                projectInfo.commands = found.ext === '.py' ? [`python ${entry}`] : ['npm install', `node ${entry}`];
                break;
            }
        }

        return projectInfo;
    }

    async scanDirectory(jobDir) {
        const files = [];
        
        async function walk(dir) {
            try {
                const items = await fs.readdir(dir);
                for (const item of items) {
                    // Skip excluded directories
                    if (item === 'node_modules' || item === '.git' || item === '__pycache__' || 
                        item === 'venv' || item === '.venv' || item === 'dist' || item === 'build') {
                        continue;
                    }
                    
                    const fullPath = path.join(dir, item);
                    const stat = await fs.stat(fullPath);
                    
                    if (stat.isDirectory()) {
                        await walk(fullPath);
                    } else {
                        files.push({
                            name: item,
                            path: fullPath,
                            ext: path.extname(item).toLowerCase(),
                            size: stat.size
                        });
                    }
                }
            } catch (err) {
                // Ignore permission errors
            }
        }
        
        await walk(jobDir);
        return files;
    }
}

module.exports = new UniversalDetector();
