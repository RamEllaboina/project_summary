const axios = require('axios');
const AppError = require('../utils/AppError');

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8002/evaluate';

exports.evaluateProject = async (projectId, analysisReport) => {
    try {
        console.log(`Sending evaluation request for ${projectId} to ${AI_ENGINE_URL}`);

        // analysisReport contains the full payload prepared in processJob.js
        // including projectId, language, metrics, importantFiles, readme
        const response = await axios.post(AI_ENGINE_URL, analysisReport, {
            timeout: 120000 // 2 minutes timeout
        });

        if (response.data) {
            return response.data;
        } else {
            throw new Error('Invalid response format from AI Engine');
        }
    } catch (error) {
        console.error('AI Engine service error:', error.message);
        // We don't want to fail the whole job if AI fails, maybe? 
        // Or we do? The prompt said "integrate". Let's assume we want it.
        // But for robustness, let's return a partial error object or throw.
        // Let's throw for now to make it visible.
        throw new AppError(`AI Evaluation failed: ${error.message}`, 503);
    }
};
