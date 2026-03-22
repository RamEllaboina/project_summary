const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const AppError = require('../utils/AppError');

// Ensure uploads directory exists
const uploadDir = 'storage/uploads';
fs.ensureDirSync(uploadDir);

// ── KEY FIX: Use memoryStorage so that file.originalname keeps the full
// relative path set by the browser (e.g. "src/components/App.jsx").
// DiskStorage was renaming files with random suffixes, destroying folder structure.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'application/zip',
        'application/x-zip-compressed',
        'application/octet-stream',
        'text/plain',
        'text/html',
        'text/css',
        'text/javascript',
        'application/javascript',
        'application/json',
        'application/xml',
        'text/x-python',
        'text/x-java-source',
        'text/x-c++src',
        'text/x-csrc'
    ];

    const allowedExtensions = [
        '.zip', '.js', '.jsx', '.ts', '.tsx', '.py',
        '.java', '.cpp', '.c', '.h', '.css', '.html',
        '.json', '.xml', '.txt', '.md', '.env', '.yaml', '.yml', '.toml'
    ];

    const hasAllowedMimeType = allowedMimeTypes.includes(file.mimetype);
    const hasAllowedExtension = allowedExtensions.some(ext =>
        file.originalname.toLowerCase().endsWith(ext)
    );

    if (hasAllowedMimeType || hasAllowedExtension) {
        cb(null, true);
    } else {
        // Don't reject unknown types - just accept them so folder uploads work fully
        cb(null, true);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB per file
        files: 500                   // support large folder uploads
    }
});

// Export variants
const uploadSingle   = upload.single('project');
const uploadMultiple = upload.array('project', 500);
const uploadAny      = upload.any();

module.exports = upload;
module.exports.single   = uploadSingle;
module.exports.multiple = uploadMultiple;
module.exports.any      = uploadAny;
