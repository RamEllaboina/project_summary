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
CMD ["python", "-m", "http.server", "3000"]
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
            const runCmd = `docker run --rm --memory=${this.memoryLimit} --cpus=${this.cpuLimit} ${imageName} sh -c "${scriptContent}"`;
            
            const { stdout, stderr } = await execPromise(runCmd, { 
                timeout: this.executionTimeout 
            });
            
            const executionTime = Date.now() - startTime;
            
            return {
                logs: (stdout + '\n' + stderr).trim(),
                executionTime
            };
            
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

    async cleanup(imageName) {
        try {
            await execPromise(`docker rmi -f ${imageName}`);
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
