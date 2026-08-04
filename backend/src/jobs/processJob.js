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
        await Project.findOneAndUpdate(
            { projectId }, 
            { 
                status: 'cleaning',
                progress: {
                    currentStep: 'cleaning',
                    totalSteps: 5,
                    currentStepNumber: 1,
                    message: 'Cleaning project files...',
                    percentage: 10
                }
            }
        );

        // ── 2. Clean project (remove node_modules, dist, __pycache__ etc.) ─
        logToFile(`Cleaning project at ${projectPath}`);
        await fileService.cleanProject(projectPath);

        // ── 3. Mark as analyzing ───────────────────────────────────────────
        await Project.findOneAndUpdate(
            { projectId }, 
            { 
                status: 'analyzing',
                progress: {
                    currentStep: 'analyzing',
                    totalSteps: 5,
                    currentStepNumber: 2,
                    message: 'Running static code analysis...',
                    percentage: 30
                }
            }
        );

        // ── 4. Call Static Analyzer ────────────────────────────────────────
        const absolutePath = path.resolve(projectPath);
        logToFile(`Calling analyzer for ${projectId} at ${absolutePath}`);
        console.log(`[Job] Sending to analyzer: ${absolutePath}`);

        const report = await analyzerService.analyzeProject(projectId, absolutePath);

        // ── 5. Mark as generating (AI evaluation) ─────────────────────────
        await Project.findOneAndUpdate(
            { projectId }, 
            { 
                status: 'generating',
                progress: {
                    currentStep: 'ai_evaluation',
                    totalSteps: 5,
                    currentStepNumber: 3,
                    message: 'Running AI analysis and evaluation...',
                    percentage: 50
                }
            }
        );
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
            
            // Update progress for file processing
            await Project.findOneAndUpdate(
                { projectId }, 
                { 
                    'progress.message': `Processing ${report.importantFiles?.length || 0} files for AI analysis...`,
                    'progress.percentage': 55
                }
            );
            
            // Process files in parallel for faster chunking
            const importantFilesInput = await Promise.all(
                (report.importantFiles || []).map(async (f) => {
                    let content = f.summary || '';
                    if (!content || content.length < 50) {
                        try {
                            const fp = path.join(projectPath, f.path);
                            if (await fs.pathExists(fp)) {
                                content = (await fs.readFile(fp, 'utf8')).substring(0, 1000);
                            }
                        } catch (e) {
                            console.warn(`Could not read file ${f.path} for AI`);
                        }
                    }
                    return { path: f.path, content: content || 'No content available' };
                })
            );

            console.log(`[Job] Prepared ${importantFilesInput.length} files for AI analysis`);

            // Update progress for AI service calls
            await Project.findOneAndUpdate(
                { projectId }, 
                { 
                    'progress.message': 'Running AI evaluation and detection...',
                    'progress.percentage': 60
                }
            );

            // Call AI Engine and AI Detection in parallel
            console.log(`[Job] Calling AI services in parallel for ${projectId}`);
            
            // Wrap each service call with try-catch to prevent one failing the other
            let evalResult, detectionResult;
            
            try {
                console.log(`[AI Engine] Starting evaluation for ${projectId}`);
                evalResult = await aiService.evaluateProject(projectId, {
                    ...report,
                    importantFiles: importantFilesInput,
                    readme: readmeContent
                });
                console.log(`[AI Engine] Successfully completed for ${projectId}`);
            } catch (aiError) {
                console.error(`[AI Engine] Failed for ${projectId}:`, aiError.message);
                evalResult = { error: 'AI Evaluation Failed', details: aiError.message };
            }

            try {
                console.log(`[AI Detection] Starting detection for ${projectId}`);
                detectionResult = await aiDetectionService.detectAIGeneration(projectId, {
                    ...report,
                    importantFiles: importantFilesInput,
                    readme: readmeContent
                });
                console.log(`[AI Detection] Successfully completed for ${projectId}`);
            } catch (detectionError) {
                console.error(`[AI Detection] Failed for ${projectId}:`, detectionError.message);
                detectionResult = { error: 'AI Detection Failed', details: detectionError.message };
            }

            evaluation = evalResult;
            aiDetectionResult = detectionResult;

            console.log(`[Job] AI Engine completed`);
            console.log(`[Job] AI Detection completed`);
            
        } catch (aiError) {
            console.error('[Job] AI Evaluation failed:', aiError.message);
            evaluation = { error: 'AI Evaluation Failed', details: aiError.message };
        }

        // ── 5c. Call Sandbox Execution ────────────────────────────────────
        await Project.findOneAndUpdate(
            { projectId }, 
            { 
                status: 'sandbox',
                progress: {
                    currentStep: 'sandbox_execution',
                    totalSteps: 5,
                    currentStepNumber: 4,
                    message: 'Running sandbox execution tests...',
                    percentage: 80
                }
            }
        );
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
        console.log(`[Job] Merging final report for ${projectId}`);
        
        const finalReport = {
            ...report,
            aiEvaluation: evaluation,
            aiDetection: aiDetectionResult?.aiDetection || null,
            sandbox: sandboxResult
        };

        console.log(`[Job] Saving final report to database for ${projectId}`);
        
        // Update to completed status
        const updatedProject = await Project.findOneAndUpdate(
            { projectId }, 
            {
                status: 'completed',
                report: finalReport,
                progress: {
                    currentStep: 'completed',
                    totalSteps: 5,
                    currentStepNumber: 5,
                    message: 'Analysis completed successfully',
                    percentage: 100
                }
            },
            { new: true } // Return the updated document
        );

        if (!updatedProject) {
            console.error(`[Job] Failed to update project ${projectId} - project not found`);
            throw new Error(`Project ${projectId} not found in database`);
        }

        console.log(`[Job] ✅ COMPLETED for ${projectId}`);
        console.log(`[Job] Report saved with status: ${updatedProject.status}`);
        logToFile(`Job COMPLETED successfully for ${projectId}`);

    } catch (error) {
        console.error(`[Job] ❌ FAILED for ${projectId}:`, error.message);
        console.error(`[Job] Stack trace:`, error.stack);
        logToFile(`Job FAILED for ${projectId}: ${error.message}`);
        
        try {
            await Project.findOneAndUpdate(
                { projectId }, 
                {
                    status: 'failed',
                    error: { 
                        message: error.message, 
                        stack: error.stack,
                        timestamp: new Date().toISOString()
                    },
                    progress: {
                        currentStep: 'failed',
                        totalSteps: 5,
                        currentStepNumber: 0,
                        message: `Analysis failed: ${error.message}`,
                        percentage: 0
                    }
                }
            );
        } catch (updateError) {
            console.error(`[Job] Failed to update error status for ${projectId}:`, updateError.message);
        }
    }
};