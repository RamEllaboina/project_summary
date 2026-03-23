const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs-extra');
const path = require('path');
const AppError = require('../utils/AppError');

const SANDBOX_URL = process.env.SANDBOX_URL || 'http://localhost:4001/api/run';

/**
 * Execute the project in the Sandbox
 */
exports.runInSandbox = async (projectId, projectPath) => {
    try {
        console.log(`Sending execution request for ${projectId} to Sandbox at ${SANDBOX_URL}`);

        const form = new FormData();
        
        let fileCount = 0;
        // Recursively walk the projectPath to get all files
        async function walk(dir) {
            const files = await fs.readdir(dir);
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const stat = await fs.stat(fullPath);
                
                if (stat.isDirectory()) {
                    // Skip common ignored dirs to save upload time and size
                    if (file === 'node_modules' || file === '__pycache__' || file.startsWith('.git') || file === 'venv') {
                        continue;
                    }
                    await walk(fullPath);
                } else {
                    const relativePath = path.relative(projectPath, fullPath).replace(/\\/g, '/');
                    form.append('files', fs.createReadStream(fullPath), {
                        filename: relativePath
                    });
                    fileCount++;
                }
            }
        }

        await walk(projectPath);

        if (fileCount === 0) {
            console.warn(`Sandbox skipped: No valid files found for ${projectId} in ${projectPath}`);
            return null;
        }

        console.log(`Uploading ${fileCount} files to sandbox...`);

        const response = await axios.post(SANDBOX_URL, form, {
            headers: {
                ...form.getHeaders()
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 300000 // 5 minutes timeout for fast execution tasks
        });

        console.log(`Sandbox execution completed for ${projectId}. Status: ${response.data.status}`);
        return response.data;
    } catch (error) {
        console.error('Sandbox service error:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
        // Don't fail the whole job if the sandbox fails. Return partial error.
        return {
            status: 'error',
            message: `Sandbox Evaluation failed: ${error.message}`
        };
    }
};
