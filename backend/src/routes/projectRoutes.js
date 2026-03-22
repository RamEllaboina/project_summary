const express = require('express');
const projectController = require('../controllers/projectController');
const upload = require('../middlewares/upload');

const router = express.Router();

// Use standard upload for now to test the filtering
router.post('/upload', upload.multiple, projectController.uploadProject);
router.get('/status/:projectId', projectController.getProjectStatus);
router.get('/report/:projectId', projectController.getProjectReport);

module.exports = router;
