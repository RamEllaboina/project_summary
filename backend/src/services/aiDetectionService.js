const axios = require('axios');
const AppError = require('../utils/AppError');

const AI_DETECTION_URL = process.env.AI_DETECTION_URL || 'http://localhost:8005/detect';

exports.detectAIGeneration = async (projectId, analysisReport) => {
    try {
        console.log(`[AI Detection] Sending request for ${projectId} to ${AI_DETECTION_URL}`);
        console.log(`[AI Detection] Request payload includes: ${analysisReport.importantFiles?.length || 0} important files`);

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
            timeout: 15000 // 15 seconds timeout to fail faster
        });

        if (response.data) {
            console.log(`[AI Detection] Successfully analyzed ${projectId}`);
            console.log(`[AI Detection] Response keys:`, Object.keys(response.data));
            
            // Ensure the response has the expected structure
            const result = response.data;
            
            // Verify required fields exist
            if (!result.aiDetection) {
                console.warn('[AI Detection] Missing aiDetection field, adding default');
                result.aiDetection = {
                    level: 'medium',
                    score: 5.0,
                    confidence: 0.5,
                    reasoning: 'AI detection analysis completed with fallback',
                    signals: {
                        ai_phrases: 'Limited analysis available',
                        naming_issues: 'Limited analysis available',
                        structure_patterns: 'Limited analysis available',
                        comment_analysis: 'Limited analysis available',
                        complexity_analysis: 'Limited analysis available'
                    }
                };
            }
            
            return result;
        } else {
            throw new Error('Invalid response format from AI Detection Service');
        }
    } catch (error) {
        console.error('[AI Detection] Service error:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('[AI Detection] Connection refused - service may not be running at', AI_DETECTION_URL);
        } else if (error.code === 'ECONNABORTED') {
            console.error('[AI Detection] Request timed out after 15 seconds');
        }
        
        // Return a fallback response instead of throwing to avoid complete failure
        console.log('[AI Detection] Returning fallback response');
        return {
            projectId,
            aiDetection: {
                level: 'medium',
                score: 5.0,
                confidence: 0.5,
                reasoning: 'Fallback AI detection analysis due to service issues',
                signals: {
                    ai_phrases: 'Limited analysis available due to service connectivity',
                    naming_issues: 'Limited analysis available due to service connectivity',
                    structure_patterns: 'Limited analysis available due to service connectivity',
                    comment_analysis: 'Limited analysis available due to service connectivity',
                    complexity_analysis: 'Limited analysis available due to service connectivity'
                }
            }
        };
    }
};
