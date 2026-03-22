const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
    {
        projectId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        originalName: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['uploaded', 'cleaning', 'analyzing', 'generating', 'sandbox', 'completed', 'failed'],
            default: 'uploaded'
        },
        localPath: {
            type: String,
            // Path to the extracted folder
        },
        zipPath: {
            type: String,
            // Path to the uploaded zip file
        },
        report: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        error: {
            message: String,
            code: String
        }
    },
    {
        timestamps: true
    }
);

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
