require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const uploadRoute = require('./routes/upload');

const app = express();
// Port 4000 to avoid conflict with backend (port 3000)
const PORT = process.env.PORT || 4001;

app.use(cors());
app.use(express.json());

// Serve Static Frontend UI
app.use(express.static(path.join(__dirname, 'public')));

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
fs.ensureDirSync(uploadsDir);

// Store latest execution result
let latestExecution = null;

// Middleware to capture execution results
app.use('/api/run', (req, res, next) => {
    const originalSend = res.json;
    res.json = function(data) {
        latestExecution = data;
        return originalSend.call(this, data);
    };
    next();
}, uploadRoute);

// Endpoint to get latest execution
app.get('/api/latest-execution', (req, res) => {
    if (latestExecution) {
        res.json(latestExecution);
    } else {
        res.json({ status: 'info', message: 'No execution data available' });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Code Sandbox is running on port 4000!' });
});

const server = app.listen(PORT, () => {
    console.log(`🚀 Code Sandbox running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please stop other instances or use a different port.`);
        process.exit(1);
    } else {
        console.error('❌ Server startup error:', err);
    }
});
