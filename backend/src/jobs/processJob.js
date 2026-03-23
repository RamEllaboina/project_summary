const Project = require('../models/Project');
const fileService = require('../services/fileService');
const analyzerService = require('../services/analyzerService');
const sandboxService = require('../services/sandboxService');
const aiService = require('../services/aiService');
const aiDetectionService = require('../services/aiDetectionService');
const path = require('path');
const fs = require('fs-extra');

const logToFile = (msg) => {
    try {
        fs.appendFileSync('job_log.txt', new Date().toISOString() + ': ' + msg + '\n');
    } catch (e) {
        console.error('Logging failed', e);
    }
};

/**
 * @param {string} projectId
 * @param {string} projectPath  — Already extracted directory (no zip).
 *                                The controller writes files there before calling us.
 */
exports.processSubmission = async (projectId, projectPath) => {
    console.log(`[Job] Starting for ${projectId} at ${projectPath}`);
    logToFile(`Starting processing job for project: ${projectId}`);

    try {
        // ── 1. Mark as cleaning ────────────────────────────────────────────
        await Project.findOneAndUpdate({ projectId }, { status: 'cleaning' });

        // ── 2. Clean project (remove node_modules, dist, __pycache__ etc.) ─
        logToFile(`Cleaning project at ${projectPath}`);
        await fileService.cleanProject(projectPath);

        // ── 3. Mark as analyzing ───────────────────────────────────────────
        await Project.findOneAndUpdate({ projectId }, { status: 'analyzing' });

        // ── 4. Call Static Analyzer ────────────────────────────────────────
        const absolutePath = path.resolve(projectPath);
        logToFile(`Calling analyzer for ${projectId} at ${absolutePath}`);
        console.log(`[Job] Sending to analyzer: ${absolutePath}`);

        const report = await analyzerService.analyzeProject(projectId, absolutePath);

        // ── 5. Mark as generating (AI evaluation) ─────────────────────────
        // NOTE: 'generating' is a valid status in the schema (not ai_evaluation)
        await Project.findOneAndUpdate({ projectId }, { status: 'generating' });
        logToFile(`Analyzer done. Calling AI Engine for ${projectId}`);
        console.log(`[Job] Calling AI Engine for ${projectId}`);

        // ── 5a. Read README for AI context ────────────────────────────────
        let readmeContent = '';
        for (const name of ['README.md', 'readme.md', 'ReadMe.md', 'README.txt']) {
            const p = path.join(projectPath, name);
            if (await fs.pathExists(p)) {
                readmeContent = await fs.readFile(p, 'utf8');
                break;
            }
        }

        // ── 5b. Build importantFiles input for AI ─────────────────────────
        let evaluation = null;
        let aiDetectionResult = null;
        
        try {
            console.log(`[Job] Processing ${report.importantFiles?.length || 0} important files for AI analysis`);
            
            // Process files in parallel for faster chunking
            const importantFilesInput = await Promise.all(
                (report.importantFiles || []).map(async (f) => {
                    let content = f.summary || '';
                    if (!content || content.length < 50) {
                        try {
                            const fp = path.join(projectPath, f.path);
                            if (await fs.pathExists(fp)) {
                                // Read only first 2000 characters for faster processing
                                content = (await fs.readFile(fp, 'utf8')).substring(0, 2000);
                            }
                        } catch (e) {
                            console.warn(`Could not read file ${f.path} for AI`);
                        }
                    }
                    return { path: f.path, content: content || 'No content available' };
                })
            );

            console.log(`[Job] Prepared ${importantFilesInput.length} files for AI analysis`);

            // Call AI Engine for comprehensive analysis
            console.log(`[Job] Calling AI Engine for ${projectId}`);
            evaluation = await aiService.evaluateProject(projectId, {
                ...report,
                importantFiles: importantFilesInput,
                readme: readmeContent
            });
            
            // Call dedicated AI Detection Service for AI generation analysis
            console.log(`[Job] Calling AI Detection Service for ${projectId}`);
            aiDetectionResult = await aiDetectionService.detectAIGeneration(projectId, {
                ...report,
                importantFiles: importantFilesInput,
                readme: readmeContent
            });
            
        } catch (aiError) {
            console.error('[Job] AI Evaluation failed:', aiError.message);
            evaluation = { error: 'AI Evaluation Failed', details: aiError.message };
        }

        // ── 5c. Call Sandbox Execution ────────────────────────────────────
        await Project.findOneAndUpdate({ projectId }, { status: 'sandbox' });
        logToFile(`Calling Sandbox for ${projectId}`);
        console.log(`[Job] Calling Sandbox for ${projectId}`);
        let sandboxResult = null;
        try {
            sandboxResult = await sandboxService.runInSandbox(projectId, absolutePath);
        } catch (sandboxError) {
            console.error('[Job] Sandbox failed:', sandboxError.message);
            sandboxResult = { status: 'error', message: sandboxError.message };
        }

        // ── 6. Merge and Save Final Report ─────────────────────────────────
        const finalReport = {
            ...report,
            aiEvaluation: evaluation,
            aiDetection: aiDetectionResult?.aiDetection || null,
            sandbox: sandboxResult
        };

        console.log(`[Job] Complete for ${projectId}`);
        await Project.findOneAndUpdate({ projectId }, {
            status: 'completed',
            report: finalReport
        });

    } catch (error) {
        console.error(`[Job] Failed for ${projectId}:`, error.message);
        logToFile(`Job FAILED for ${projectId}: ${error.message}`);
        await Project.findOneAndUpdate({ projectId }, {
            status: 'failed',
            error: { message: error.message, stack: error.stack }
        });
    }
};
