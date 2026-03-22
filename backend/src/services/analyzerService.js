const axios = require('axios');
const AppError = require('../utils/AppError');

const ANALYZER_URL = process.env.ANALYZER_URL || 'http://localhost:8000/api/v1/analyze';

exports.analyzeProject = async (projectId, projectPath) => {
    try {
        console.log(`Sending analysis request for ${projectId} to ${ANALYZER_URL}`);

        // In a real scenario, we post the path or upload the file content if the services are on different machines.
        // Assuming shared filesystem for simplicity as per "path" requirement in prompt.
        const response = await axios.post(ANALYZER_URL, {
            projectId,
            path: projectPath
        }, {
            timeout: 300000 // 5 minutes timeout
        });

        if (response.data && response.data.projectId) {
            return response.data;
        } else {
            console.error('Invalid response format from analyzer service:', response.data);
            throw new Error('Invalid response format from analyzer service');
        }
    } catch (error) {
        console.error('Analyzer service error:', error.message);
        // If the service is unreachable, we might return a mock result for demonstration if needed, 
        // but better to throw so we can mark as failed.
        throw new AppError(`Analysis failed: ${error.message}`, 503);
    }
};
