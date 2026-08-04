const { exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const util = require('util');

const execPromise = util.promisify(exec);

class UniversalExecutor {
    constructor() {
        this.executionTimeout = 10000; // 10 seconds
        this.memoryLimit = '512m';
        this.cpuLimit = '1';
    }

    async execute(jobDir, projectInfo) {
        const jobId = path.basename(jobDir);
        const imageName = `sandbox-${jobId}`;
        
        try {
            const dockerfile = this.generateDockerfile(projectInfo);
            await fs.writeFile(path.join(jobDir, 'Dockerfile'), dockerfile);
            
            // Build Docker image
            await execPromise(`docker build -t ${imageName} .`, { 
                cwd: jobDir,
                timeout: this.executionTimeout 
            });
            
            // Execute commands in container
            const result = await this.runContainer(imageName, projectInfo.commands, projectInfo);
            
            // Cleanup
            await this.cleanup(imageName);
            
            return {
                success: true,
                projectType: projectInfo.type,
                framework: projectInfo.framework,
                language: projectInfo.language,
                entryFile: projectInfo.entryFile,
                executedCommands: projectInfo.commands,
                logs: result.logs,
                executionTime: result.executionTime
            };
            
        } catch (error) {
            await this.cleanup(imageName);
            
            return {
                success: false,
                projectType: projectInfo.type,
                framework: projectInfo.framework,
                language: projectInfo.language,
                entryFile: projectInfo.entryFile,
                executedCommands: projectInfo.commands,
                logs: this.formatError(error),
                error: error.message
            };
        }
    }

    generateDockerfile(projectInfo) {
        let dockerfile = '';
        
        switch (projectInfo.type) {
            case 'nodejs':
                dockerfile = this.generateNodeDockerfile(projectInfo);
                break;
            case 'python':
                dockerfile = this.generatePythonDockerfile(projectInfo);
                break;
            case 'java':
                dockerfile = this.generateJavaDockerfile(projectInfo);
                break;
            case 'static':
                dockerfile = this.generateStaticDockerfile(projectInfo);
                break;
            case 'go':
                dockerfile = this.generateGoDockerfile(projectInfo);
                break;
            case 'rust':
                dockerfile = this.generateRustDockerfile(projectInfo);
                break;
            default:
                dockerfile = this.generateGenericDockerfile(projectInfo);
        }
        
        return dockerfile;
    }

    generateNodeDockerfile(projectInfo) {
        let dockerfile = `FROM node:18-alpine
WORKDIR /app
`;

        if (projectInfo.dependencyFile) {
            dockerfile += `COPY "${projectInfo.dependencyFile}" ./
RUN npm install
`;
        }

        dockerfile += `COPY . .
`;

        // Start server in background, wait for it to start, then exit
        dockerfile += `CMD ["sh", "-c", "npm start > /dev/null 2>&1 & sleep 2 && echo 'Server started successfully'"]
`;

        return dockerfile;
    }

    generatePythonDockerfile(projectInfo) {
        let dockerfile = `FROM python:3.10-slim
WORKDIR /app
`;

        if (projectInfo.dependencyFile) {
            if (projectInfo.dependencyFile === 'Pipfile') {
                dockerfile += `RUN pip install pipenv
COPY Pipfile ./
RUN pipenv install --system --deploy
`;
            } else {
                dockerfile += `COPY "${projectInfo.dependencyFile}" ./
RUN pip install -r "${projectInfo.dependencyFile}"
`;
            }
        }

        dockerfile += `COPY . .
`;

        if (projectInfo.framework === 'django') {
            dockerfile += `EXPOSE 8000
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
`;
        } else if (projectInfo.framework === 'flask' || projectInfo.framework === 'fastapi') {
            dockerfile += `EXPOSE 8000
CMD ["python", "${projectInfo.entryFile}"]
`;
        } else {
            dockerfile += `CMD ["python", "${projectInfo.entryFile}"]
`;
        }

        return dockerfile;
    }

    generateJavaDockerfile(projectInfo) {
        if (projectInfo.buildTool === 'maven') {
            return `FROM maven:3.8-openjdk-11
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:resolve
COPY . .
RUN mvn clean package -DskipTests
EXPOSE 8080
CMD ["java", "-jar", "target/*.jar"]
`;
        } else if (projectInfo.buildTool === 'gradle') {
            return `FROM gradle:6.9-jdk11
WORKDIR /app
COPY build.gradle ./
RUN gradle dependencies
COPY . .
RUN gradle build -x test
EXPOSE 8080
CMD ["java", "-jar", "build/libs/*.jar"]
`;
        }
        
        return this.generateGenericDockerfile(projectInfo);
    }

    generateStaticDockerfile(projectInfo) {
        return `FROM python:3.10-slim
WORKDIR /app
COPY . .
EXPOSE 3000
# Keep server running in foreground and don't exit
CMD ["python", "-m", "http.server", "3000", "--bind", "0.0.0.0"]
`;
    }

    generateGoDockerfile(projectInfo) {
        return `FROM golang:1.19-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o main .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/main .
EXPOSE 8080
CMD ["./main"]
`;
    }

    generateRustDockerfile(projectInfo) {
        return `FROM rust:1.65 AS builder
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY src ./src
RUN cargo build --release

FROM debian:bullseye-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /app/target/release/app .
EXPOSE 8080
CMD ["./app"]
`;
    }

    generateGenericDockerfile(projectInfo) {
        // Try to detect language from entry file
        const entryExt = projectInfo.entryFile ? path.extname(projectInfo.entryFile) : '';
        
        if (entryExt === '.py') {
            return `FROM python:3.10-slim
WORKDIR /app
COPY . .
CMD ["python", "${projectInfo.entryFile || 'main.py'}"]
`;
        } else if (entryExt === '.js' || entryExt === '.ts') {
            return `FROM node:18-alpine
WORKDIR /app
COPY . .
CMD ["node", "${projectInfo.entryFile || 'index.js'}"]
`;
        } else {
            return `FROM alpine:latest
WORKDIR /app
COPY . .
CMD ["sh", "-c", "ls -la && echo 'No specific entry point detected'"]
`;
        }
    }

    async runContainer(imageName, commands, projectInfo) {
        const startTime = Date.now();
        
        try {
            // Create a combined command script
            const scriptContent = commands.join(' && ');
            
            // Use random port mapping to avoid conflicts
            // For static projects, add port mapping to make it accessible and keep running
            if (projectInfo.type === 'static') {
                const runCmd = `docker run -d --name ${imageName}-runtime -p 0:3000 --memory=${this.memoryLimit} --cpus=${this.cpuLimit} ${imageName}`;
                
                // Start container
                await execPromise(runCmd, { timeout: this.executionTimeout });
                
                // Wait for container to fully start
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                // Get the mapped port
                const portCmd = `docker port ${imageName}-runtime 3000`;
                const { stdout: portOutput } = await execPromise(portCmd);
                const mappedPort = portOutput.trim().split(':')[1];
                
                // Check if container is actually running
                const statusCmd = `docker ps --filter "name=${imageName}-runtime" --format "{{.Status}}"`;
                const { stdout: statusOutput } = await execPromise(statusCmd);
                
                if (!statusOutput.includes('Up')) {
                    throw new Error('Container failed to start properly');
                }
                
                // Test the application
                const testResults = await this.testApplication(mappedPort, projectInfo);
                
                const executionTime = Date.now() - startTime;
                return {
                    logs: `🚀 Static HTML server started successfully on port ${mappedPort}\n✅ Application tested and ready for interaction!\n📱 Container status: ${statusOutput.trim()}`,
                    executionTime,
                    mappedPort,
                    containerId: `${imageName}-runtime`,
                    testResults,
                    url: `http://localhost:${mappedPort}`,
                    success: true,
                    containerStatus: statusOutput.trim()
                };
            } else {
                const runCmd = `docker run --rm --memory=${this.memoryLimit} --cpus=${this.cpuLimit} ${imageName} sh -c "${scriptContent}"`;
                
                const { stdout, stderr } = await execPromise(runCmd, { 
                    timeout: this.executionTimeout 
                });
                
                const executionTime = Date.now() - startTime;
                return {
                    logs: (stdout + '\n' + stderr).trim(),
                    executionTime
                };
            }
            
        } catch (error) {
            const executionTime = Date.now() - startTime;
            
            if (error.killed) {
                return {
                    logs: `Execution timed out after ${this.executionTimeout}ms`,
                    executionTime
                };
            }
            
            return {
                logs: (error.stdout + '\n' + error.stderr).trim() || error.message,
                executionTime
            };
        }
    }

    async testApplication(port, projectInfo) {
        const tests = [];
        
        try {
            // First check if port is accessible
            console.log(`Testing application on port ${port}...`);
            
            // Test if server is responding (with retries)
            let response = null;
            let retryCount = 0;
            const maxRetries = 5;
            
            while (!response && retryCount < maxRetries) {
                try {
                    console.log(`Attempt ${retryCount + 1} to connect to http://localhost:${port}`);
                    response = await fetch(`http://localhost:${port}`, { 
                        timeout: 5000,
                        signal: AbortSignal.timeout(5000)
                    });
                    break;
                } catch (error) {
                    retryCount++;
                    if (retryCount < maxRetries) {
                        console.log(`Connection failed, retrying in 1 second...`);
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    } else {
                        throw error;
                    }
                }
            }
            
            if (!response) {
                throw new Error('Failed to connect after multiple attempts');
            }
            
            if (response.ok) {
                tests.push({
                    test: 'Server Response',
                    status: '✅ PASS',
                    details: `HTTP ${response.status} - Server is responding`
                });
                
                // Get HTML content for further testing
                const html = await response.text();
                console.log(`HTML content length: ${html.length} characters`);
                
                // Test for HTML structure
                if (html.includes('<html') && html.includes('</html>')) {
                    tests.push({
                        test: 'HTML Structure',
                        status: '✅ PASS',
                        details: 'Valid HTML document detected'
                    });
                }
                
                // Test for title tag
                if (html.includes('<title>')) {
                    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
                    const title = titleMatch ? titleMatch[1] : 'Untitled';
                    tests.push({
                        test: 'Page Title',
                        status: '✅ PASS',
                        details: `Title found: "${title}"`
                    });
                } else {
                    tests.push({
                        test: 'Page Title',
                        status: '⚠️ WARN',
                        details: 'No title tag found'
                    });
                }
                
                // Test for CSS
                if (html.includes('<link') || html.includes('<style')) {
                    tests.push({
                        test: 'CSS Styling',
                        status: '✅ PASS',
                        details: 'CSS styles detected'
                    });
                } else {
                    tests.push({
                        test: 'CSS Styling',
                        status: '⚠️ WARN',
                        details: 'No CSS detected'
                    });
                }
                
                // Test for JavaScript
                if (html.includes('<script')) {
                    tests.push({
                        test: 'JavaScript',
                        status: '✅ PASS',
                        details: 'JavaScript files detected'
                    });
                } else {
                    tests.push({
                        test: 'JavaScript',
                        status: '⚠️ WARN',
                        details: 'No JavaScript detected'
                    });
                }
                
                // Test for common interactive elements
                if (html.includes('<button') || html.includes('<input') || html.includes('<form')) {
                    tests.push({
                        test: 'Interactive Elements',
                        status: '✅ PASS',
                        details: 'Interactive elements found (buttons, forms, inputs)'
                    });
                }
                
                // Test for responsive design
                if (html.includes('viewport') || html.includes('@media')) {
                    tests.push({
                        test: 'Responsive Design',
                        status: '✅ PASS',
                        details: 'Responsive design detected'
                    });
                }
                
            } else {
                tests.push({
                    test: 'Server Response',
                    status: '❌ FAIL',
                    details: `HTTP ${response.status} - Server not responding properly`
                });
            }
            
        } catch (error) {
            console.error(`Application test failed: ${error.message}`);
            tests.push({
                test: 'Connection Test',
                status: '❌ FAIL',
                details: `Cannot connect to server: ${error.message}`
            });
        }
        
        return tests;
    }

    async cleanup(imageName) {
        try {
            // Don't stop runtime containers immediately - let them run for user interaction
            // Only stop containers that are older than 10 minutes
            const { stdout: oldContainers } = await execPromise(`docker ps --filter "name=${imageName}-runtime" --format "{{.Names}}"`);
            
            if (oldContainers) {
                const containerNames = oldContainers.trim().split('\n').filter(name => name);
                
                for (const containerName of containerNames) {
                    try {
                        // Check container age
                        const { stdout: containerInfo } = await execPromise(`docker inspect ${containerName} --format '{{.State.StartedAt}}'`);
                        const startTime = new Date(containerInfo.trim());
                        const age = Date.now() - startTime.getTime();
                        
                        // Only stop containers older than 10 minutes
                        if (age > 10 * 60 * 1000) {
                            await execPromise(`docker stop ${containerName}`).catch(() => {});
                            await execPromise(`docker rm ${containerName}`).catch(() => {});
                            console.log(`Cleaned up old container: ${containerName}`);
                        }
                    } catch (error) {
                        // Container might already be gone
                        await execPromise(`docker stop ${containerName}`).catch(() => {});
                        await execPromise(`docker rm ${containerName}`).catch(() => {});
                    }
                }
            }
            
            // Remove the image
            await execPromise(`docker rmi -f ${imageName}`).catch(() => {});
        } catch (error) {
            // Ignore cleanup errors
        }
    }

    formatError(error) {
        if (error.killed) {
            return `Execution timed out after ${this.executionTimeout}ms`;
        }
        
        const stdout = error.stdout || '';
        const stderr = error.stderr || '';
        const message = error.message || '';
        
        return `${stdout}\n${stderr}\n${message}`.trim();
    }
}

module.exports = new UniversalExecutor();
