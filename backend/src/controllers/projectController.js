const Project = require('../models/Project');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { processSubmission } = require('../jobs/processJob');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs-extra');
const path = require('path');
const JSZip = require('jszip');
const { filterFiles, shouldIgnore, isSourceCodeFile } = require('../utils/fileFilter');

exports.uploadProject = catchAsync(async (req, res, next) => {
    if (!req.file && (!req.files || req.files.length === 0)) {
        return next(new AppError('Please upload files or a zip file', 400));
    }

    const projectId = uuidv4();
    // Write files directly into a structured project directory (no intermediate zip needed)
    const projectDir = path.join('storage', 'projects', projectId);
    await fs.ensureDir(projectDir);

    let originalName = 'uploaded-project';
    let totalFilesUploaded = 0;
    let filesIgnored = 0;
    let sourceCodeFiles = 0;

    try {
        const allFiles = req.files && req.files.length > 0 ? req.files : [req.file];

        console.log(`🚀 Starting intelligent file processing for ${allFiles.length} files...`);

        for (const file of allFiles) {
            // file.originalname carries the relative path (e.g. "src/App.jsx")
            // Strip any leading path traversal attempts
            const safePath = path.normalize(file.originalname).replace(/^(\.\.[\\/])+/, '');
            const destPath = path.join(projectDir, safePath);
            
            // Apply intelligent filtering
            if (shouldIgnore(file.originalname, false)) {
                console.log(`🚫 Ignoring: ${file.originalname}`);
                filesIgnored++;
                continue;
            }
            
            // Write the file
            await fs.outputFile(destPath, file.buffer);
            totalFilesUploaded++;
            
            // Check if it's a source code file
            if (isSourceCodeFile(file.originalname)) {
                sourceCodeFiles++;
                console.log(`📄 Source code: ${file.originalname}`);
            } else {
                console.log(`📄 Other file: ${file.originalname}`);
            }
        }

        originalName = allFiles[0].originalname.split('/')[0] || 'uploaded-project';

        // Apply additional filtering on the extracted files
        console.log(`🔍 Applying intelligent filtering to extracted files...`);
        const filterResult = await filterFiles(projectDir, {
            maxDepth: 15,
            includeNonSourceCode: false, // Only keep source code files
            logIgnored: true
        });

        // Remove ignored files from the project directory
        for (const ignored of filterResult.ignored) {
            try {
                await fs.remove(ignored.path);
                console.log(`🗑️  Removed ignored file: ${ignored.path} (${ignored.reason})`);
            } catch (error) {
                console.warn(`⚠️  Could not remove ${ignored.path}:`, error.message);
            }
        }

        // Check if files extracted into a single root subfolder — if so, point to that
        const items = await fs.readdir(projectDir);
        const visible = items.filter(i => !i.startsWith('.') && i !== '__MACOSX');
        let analysisRoot = projectDir;
        if (visible.length === 1) {
            const potential = path.join(projectDir, visible[0]);
            const stat = await fs.lstat(potential);
            if (stat.isDirectory()) analysisRoot = potential;
        }

        // Final count of source code files
        const finalSourceCount = filterResult.files.length;

        console.log(`📊 Upload Summary:`);
        console.log(`   Total files uploaded: ${allFiles.length}`);
        console.log(`   Files after initial filtering: ${totalFilesUploaded}`);
        console.log(`   Source code files for analysis: ${finalSourceCount}`);
        console.log(`   Files ignored: ${filesIgnored + filterResult.ignored.length}`);

        // Create project record — store path directly (no zip path needed)
        const newProject = await Project.create({
            projectId,
            originalName,
            status: 'uploaded',
            localPath: analysisRoot,
            zipPath: null,
            metadata: {
                totalFilesUploaded: allFiles.length,
                filesAfterFiltering: totalFilesUploaded,
                sourceCodeFiles: finalSourceCount,
                filesIgnored: filesIgnored + filterResult.ignored.length,
                processingTimestamp: new Date()
            }
        });

        // Trigger background job (do not await)
        processSubmission(projectId, analysisRoot).catch(err => {
            console.error('Background job failed to start properly:', err);
        });

        res.status(201).json({
            status: 'success',
            projectId,
            message: `${finalSourceCount} source code file(s) ready for analysis. Processing started.`,
            metadata: {
                totalFilesUploaded: allFiles.length,
                sourceCodeFiles: finalSourceCount,
                filesIgnored: filesIgnored + filterResult.ignored.length
            }
        });

    } catch (error) {
        // Clean up on error
        await fs.remove(projectDir).catch(() => {});
        throw error;
    }
});

exports.getProjectStatus = catchAsync(async (req, res, next) => {
    const { projectId } = req.params;
    const project = await Project.findOne({ projectId }).select('status projectId updatedAt');

    if (!project) {
        return next(new AppError('Project not found', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            projectId: project.projectId,
            status: project.status,
            lastUpdated: project.updatedAt
        }
    });
});

exports.getProjectReport = catchAsync(async (req, res, next) => {
    const { projectId } = req.params;
    const project = await Project.findOne({ projectId });

    if (!project) {
        return next(new AppError('Project not found', 404));
    }

    if (project.status === 'failed') {
        return res.status(422).json({
            status: 'fail',
            message: 'Analysis failed for this project.',
            error: project.error
        });
    }

    if (project.status !== 'completed') {
        return res.status(202).json({
            status: 'success',
            message: 'Analysis is still in progress.',
            currentState: project.status
        });
    }

    res.status(200).json({
        status: 'success',
        data: {
            projectId: project.projectId,
            report: project.report,
            completedAt: project.updatedAt
        }
    });
});
