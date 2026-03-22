const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

class MathService {
    constructor() {
        this.history = [];
    }

    calculateSum(a, b) {
        const result = a + b;
        this.addToHistory('sum', { a, b, result });
        return result;
    }

    calculateProduct(a, b) {
        const result = a * b;
        this.addToHistory('product', { a, b, result });
        return result;
    }

    calculateDifference(a, b) {
        const result = a - b;
        this.addToHistory('difference', { a, b, result });
        return result;
    }

    addToHistory(operation, data) {
        this.history.push({
            timestamp: new Date().toISOString(),
            operation,
            input: data,
            result: data.result
        });
        
        // Keep only last 100 operations
        if (this.history.length > 100) {
            this.history = this.history.slice(-100);
        }
    }

    getHistory() {
        return this.history;
    }

    clearHistory() {
        this.history = [];
    }
}

class APIServer {
    constructor(mathService) {
        this.app = express();
        this.mathService = mathService;
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    setupMiddleware() {
        this.app.use(helmet());
        this.app.use(cors());
        this.app.use(express.json());
        
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100 // limit each IP to 100 requests per windowMs
        });
        
        this.app.use('/api/', limiter);
    }

    setupRoutes() {
        this.app.get('/api/health', (req, res) => {
            res.json({ 
                status: 'ok', 
                service: 'Math Calculator API',
                version: '1.0.0'
            });
        });

        this.app.post('/api/calculate/sum', (req, res) => {
            try {
                const { a, b } = req.body;
                if (typeof a !== 'number' || typeof b !== 'number') {
                    return res.status(400).json({ 
                        error: 'Invalid input: a and b must be numbers' 
                    });
                }
                
                const result = this.mathService.calculateSum(a, b);
                res.json({ operation: 'sum', a, b, result });
            } catch (error) {
                res.status(500).json({ error: 'Internal server error' });
            }
        });

        this.app.post('/api/calculate/product', (req, res) => {
            try {
                const { a, b } = req.body;
                if (typeof a !== 'number' || typeof b !== 'number') {
                    return res.status(400).json({ 
                        error: 'Invalid input: a and b must be numbers' 
                    });
                }
                
                const result = this.mathService.calculateProduct(a, b);
                res.json({ operation: 'product', a, b, result });
            } catch (error) {
                res.status(500).json({ error: 'Internal server error' });
            }
        });

        this.app.get('/api/history', (req, res) => {
            try {
                const history = this.mathService.getHistory();
                res.json({ history });
            } catch (error) {
                res.status(500).json({ error: 'Failed to retrieve history' });
            }
        });

        this.app.delete('/api/history', (req, res) => {
            try {
                this.mathService.clearHistory();
                res.json({ message: 'History cleared successfully' });
            } catch (error) {
                res.status(500).json({ error: 'Failed to clear history' });
            }
        });
    }

    setupErrorHandling() {
        // 404 handler
        this.app.use((req, res) => {
            res.status(404).json({ 
                error: 'Endpoint not found',
                path: req.path 
            });
        });

        // Global error handler
        this.app.use((err, req, res, next) => {
            console.error('Unhandled error:', err);
            res.status(500).json({ 
                error: 'Internal server error',
                message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
            });
        });
    }

    start(port = 3000) {
        this.app.listen(port, () => {
            console.log(`Math Calculator API server running on port ${port}`);
            console.log('Available endpoints:');
            console.log('  GET  /api/health');
            console.log('  POST /api/calculate/sum');
            console.log('  POST /api/calculate/product');
            console.log('  GET  /api/history');
            console.log('  DELETE /api/history');
        });
    }
}

// Initialize and start server
const mathService = new MathService();
const apiServer = new APIServer(mathService);

// Only start server if this file is run directly
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    apiServer.start(PORT);
}

module.exports = { MathService, APIServer };
