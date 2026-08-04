const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');

// Services
const universalDetector = require('../services/universalDetector');
const universalExecutor = require('../services/universalExecutor');
const flowGenerator = require('../services/flowGenerator');
const fileFilter = require('../services/fileFilter');
const projectStructureAnalyzer = require('../services/projectStructureAnalyzer');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.array('files'), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ status: 'error', message: 'No files uploaded.' });
        }

        // ── 1. Save files to a unique job directory (with filtering) ──────────────────
        const jobId = uuidv4();
        const jobDir = path.join(__dirname, '..', 'uploads', jobId);

        let processedFiles = 0;
        let skippedFiles = 0;

        for (const file of req.files) {
            // file.originalname may contain relative path (e.g. "project/src/main.py")
            const safePath = path.normalize(file.originalname).replace(/^(\.\.[\/\\])+/, '');
            
            // Filter out excluded directories and files
            if (!fileFilter.shouldProcessFile(safePath)) {
                skippedFiles++;
                continue;
            }

            const pathParts = safePath.split(/[\/\\]/);
            const finalPath = path.join(jobDir, ...pathParts);
            await fs.outputFile(finalPath, file.buffer);
            processedFiles++;
        }

        // ── 2. Clean up any excluded directories that might have been created ──────────────────
        const cleanupResult = await fileFilter.cleanExcludedItems(jobDir);

        // ── 3. Universal Project Detection ────────────────────────────────────
        const projectInfo = await universalDetector.detectProjectType(jobDir);

        // ── 4. Project Structure Analysis ───────────────────────────────────
        let projectStructure = {};
        try {
            projectStructure = await projectStructureAnalyzer.analyzeProjectStructure(jobDir);
        } catch (error) {
            console.error('Error in project structure analysis:', error);
            projectStructure = { error: error.message };
        }

        // ── 5. Universal Execution ────────────────────────────────────────
        const executionResult = await universalExecutor.execute(jobDir, projectInfo);

        // ── 5. Generate Execution Flow ─────────────────────────────────
        const flow = flowGenerator.generate(executionResult.projectType, executionResult.language, executionResult);

        // Build response with enhanced execution data
        const response = {
            status: executionResult.success ? 'success' : 'error',
            detected_project_type: executionResult.projectType,
            framework: executionResult.framework,
            language: executionResult.language,
            entry_file: executionResult.entryFile,
            executed_command: executionResult.executedCommands.join(' && '),
            execution_status: executionResult.success ? 'success' : 'failed',
            logs: executionResult.logs,
            execution_time: executionResult.executionTime,
            flow,
            filtering: {
                processedFiles,
                skippedFiles,
                cleanedItems: cleanupResult.removedCount,
                removedItems: cleanupResult.removedItems
            },
            project_structure: projectStructure
        };

        // Add enhanced execution data for successful static projects
        if (executionResult.success && executionResult.mappedPort) {
            response.url = executionResult.url;
            response.port = executionResult.mappedPort;
            response.container_id = executionResult.containerId;
            response.test_results = executionResult.testResults;
            response.message = `🚀 Application is running live on http://localhost:${executionResult.mappedPort}!`;
        }

        return res.json(response);

    } catch (err) {
        console.error('Sandbox execution error:', err);
        return res.status(500).json({ status: 'error', message: err.message });
    }
});

// Add endpoint to get running containers and their ports
router.get('/containers', async (req, res) => {
    try {
        const { exec } = require('child_process');
        const util = require('util');
        const execPromise = util.promisify(exec);
        
        // Get running sandbox containers with port info
        const { stdout: runningContainers } = await execPromise(
            `docker ps --filter "name=sandbox-" --format "{{.Names}}:{{.Ports}}"`
        );
        
        const containers = [];
        if (runningContainers.trim()) {
            const lines = runningContainers.trim().split('\n');
            for (const line of lines) {
                const [name, ports] = line.split(':');
                const portMatch = ports.match(/:(\d+)->/);
                if (portMatch) {
                    containers.push({
                        name,
                        port: portMatch[1],
                        url: `http://localhost:${portMatch[1]}`
                    });
                }
            }
        }
        
        res.json({
            containers,
            count: containers.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        res.json({ error: error.message, containers: [] });
    }
});

module.exports = router;
