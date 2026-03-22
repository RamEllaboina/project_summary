const axios = require('axios');
const AppError = require('../utils/AppError');

const AI_DETECTION_URL = process.env.AI_DETECTION_URL || 'http://localhost:8003/detect';

exports.detectAIGeneration = async (projectId, analysisReport) => {
    try {
        console.log(`[AI Detection] Sending request for ${projectId} to ${AI_DETECTION_URL}`);

        // Prepare data for AI detection service
        const detectionPayload = {
            projectId: projectId,
            language: analysisReport.language || 'Unknown',
            metrics: analysisReport.metrics || {
                qualityScore: 0,
                structureScore: 0,
                securityScore: 0
            },
            importantFiles: analysisReport.importantFiles || []
        };

        const response = await axios.post(AI_DETECTION_URL, detectionPayload, {
            timeout: 60000 // 1 minute timeout
        });

        if (response.data) {
            console.log(`[AI Detection] Successfully analyzed ${projectId}`);
            return response.data;
        } else {
            throw new Error('Invalid response format from AI Detection Service');
        }
    } catch (error) {
        console.error('[AI Detection] Service error:', error.message);
        // Return fallback result instead of throwing
        return {
            projectId: projectId,
            aiDetection: {
                level: 'low',
                score: 0,
                confidence: 0,
                reasoning: `AI detection analysis failed: ${error.message}`,
                signals: {
                    ai_phrases: [],
                    naming_issues: [],
                    structure_patterns: [],
                    comment_analysis: 'Analysis unavailable due to error',
                    complexity_analysis: 'Analysis unavailable due to error'
                }
            }
        };
    }
};
