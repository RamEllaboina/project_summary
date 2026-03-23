const express = require('express');
const projectController = require('../controllers/projectController');
const upload = require('../middlewares/upload');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Backend API is running',
        timestamp: new Date().toISOString(),
        services: {
            ai_engine: 'http://localhost:8002',
            ai_detection: 'http://localhost:8003',
            sandbox: 'http://localhost:4000'
        }
    });
});

// Use standard upload for now to test the filtering
router.post('/upload', upload.multiple, projectController.uploadProject);
router.get('/status/:projectId', projectController.getProjectStatus);
router.get('/report/:projectId', projectController.getProjectReport);

module.exports = router;
