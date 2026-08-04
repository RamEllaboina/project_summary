require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const uploadRoute = require('./routes/upload');

const app = express();
// Port 4000 to avoid conflict with backend (port 3000)
const PORT = process.env.PORT || 4002;

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

// Endpoint to get running containers with ports
app.get('/api/containers', async (req, res) => {
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
                const parts = line.split(':');
                if (parts.length >= 2) {
                    const name = parts[0];
                    const ports = parts.slice(1).join(':');
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
        }
        
        console.log('Running containers:', containers);
        res.json({
            containers,
            count: containers.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Container fetch error:', error);
        res.json({ error: error.message, containers: [] });
    }
});

// Debug endpoint to check running containers
app.get('/api/debug/containers', async (req, res) => {
    try {
        const { exec } = require('child_process');
        const util = require('util');
        const execPromise = util.promisify(exec);
        
        // Get all running containers
        const { stdout: runningContainers } = await execPromise('docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"');
        
        // Get all sandbox containers (including stopped)
        const { stdout: allContainers } = await execPromise('docker ps -a --filter "name=sandbox-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"');
        
        res.json({
            running: runningContainers,
            all: allContainers,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.json({ error: error.message });
    }
});

// Endpoint to clean up old containers
app.post('/api/debug/cleanup', async (req, res) => {
    try {
        const { exec } = require('child_process');
        const util = require('util');
        const execPromise = util.promisify(exec);
        
        // Stop and remove all sandbox containers
        await execPromise('docker stop $(docker ps -q --filter "name=sandbox-")').catch(() => {});
        await execPromise('docker rm $(docker ps -aq --filter "name=sandbox-")').catch(() => {});
        
        res.json({ message: 'Cleanup completed', timestamp: new Date().toISOString() });
    } catch (error) {
        res.json({ error: error.message });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Code Sandbox is running on port 4000!' });
});

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Code Sandbox running on http://localhost:${PORT}`);
    console.log(`🌐 Also accessible at http://0.0.0.0:${PORT}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please stop other instances or use a different port.`);
        process.exit(1);
    } else {
        console.error('❌ Server startup error:', err);
    }
});
