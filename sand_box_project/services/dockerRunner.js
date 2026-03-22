const { exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const util = require('util');

const execPromise = util.promisify(exec);

async function findDependencyFile(jobDir, language) {
    const filename = language === 'python' ? 'requirements.txt' : 'package.json';

    // We will do a quick recursive search to find where the dependency file is
    // so we can copy it correctly in Dockerfile
    let foundPath = null;
    let minDepth = Infinity;

    async function walk(currentDir, currentDepth) {
        const files = await fs.readdir(currentDir);
        for (const file of files) {
            const fullPath = path.join(currentDir, file);
            const relativePath = path.relative(jobDir, fullPath);
            const stat = await fs.stat(fullPath);

            if (stat.isDirectory()) {
                await walk(fullPath, currentDepth + 1);
            } else if (file === filename) {
                if (currentDepth < minDepth) {
                    foundPath = relativePath.replace(/\\/g, '/');
                    minDepth = currentDepth;
                }
            }
        }
    }

    await walk(jobDir, 0);
    return foundPath;
}

async function run(jobDir, language, entryFile) {
    const jobId = path.basename(jobDir);
    const imageName = `sandbox-${jobId}`;

    // Find dependency file to leverage Docker layer caching
    const depFile = await findDependencyFile(jobDir, language);
    let dockerfileContent = "";

    // IMPORTANT: Docker requires linux paths (forward slashes)
    const linuxEntryFile = entryFile.replace(/\\/g, '/');

    if (language === 'python') {
        dockerfileContent = `
FROM python:3.10-slim
WORKDIR /app
`;
        if (depFile) {
            dockerfileContent += `
COPY "${depFile}" ./
RUN pip install -r "${path.basename(depFile)}"
`;
        }
        dockerfileContent += `
COPY . .
# Convert windows line endings to unix just in case
RUN sed -i 's/\\r$//' "${linuxEntryFile}" || true
CMD ["python", "${linuxEntryFile}"]
`;
    } else if (language === 'nodejs') {
        dockerfileContent = `
FROM node:18-alpine
WORKDIR /app
`;
        if (depFile) {
            dockerfileContent += `
COPY "${depFile}" ./
RUN npm install
`;
        }
        dockerfileContent += `
COPY . .
CMD ["node", "${linuxEntryFile}"]
`;
    }

    // Write Dockerfile
    await fs.writeFile(path.join(jobDir, 'Dockerfile'), dockerfileContent);

    try {
        // Build image
        // Building leverages Docker layer caching for the dependency step
        await execPromise(`docker build -t ${imageName} .`, { cwd: jobDir });

        // Run container
        // --rm: remove container after run
        // --network none: restrict network
        // memory and cpu limits
        const runCmd = `docker run --rm --memory=200m --cpus=1 --network none ${imageName}`;

        // Timeout execution to 10 seconds to avoid infinite loops
        const { stdout, stderr } = await execPromise(runCmd, { timeout: 10000 });

        // Cleanup image to avoid disk exhaustion
        execPromise(`docker rmi -f ${imageName}`).catch(() => { });

        return {
            error: false,
            logs: (stdout + '\\n' + stderr).trim()
        };

    } catch (err) {
        // Cleanup on failure mapping
        execPromise(`docker rmi -f ${imageName}`).catch(() => { });

        // If error killed by timeout
        if (err.killed) {
            return { error: true, logs: "Execution timed out (10s limit exceeded)." };
        }

        // Return error logs
        const out = err.stdout ? err.stdout : '';
        const stderr = err.stderr ? err.stderr : '';
        const combined = `${out}\n${stderr}`.trim();

        return {
            error: true,
            logs: combined ? combined : err.message
        };
    }
}

module.exports = { run };
