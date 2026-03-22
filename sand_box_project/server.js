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

// Original manual file upload route (drag+drop ui)
app.use('/api/run', uploadRoute);

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
