const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import modules
const database = require('./config/database');
const authRoutes = require('./routes/authRoutes');

// Initialize express
const app = express();
const PORT = process.env.PORT || 5000;

// ========== Security Middleware ==========
// Helmet for security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https:"]
        }
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// ========== Standard Middleware ==========
// Compression
app.use(compression());

// Logging
app.use(morgan('dev'));

// JSON and URL-encoded body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ========== Rate Limiting ==========
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000 || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Apply rate limiting to all routes
app.use('/api', limiter);

// ========== Static Files ==========
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ========== API Routes ==========
app.get('/api/health', (req, res) => {
    const dbStatus = database.getStatus();
    res.status(200).json({
        success: true,
        message: 'Server is healthy',
        timestamp: new Date().toISOString(),
        database: dbStatus,
        environment: process.env.NODE_ENV,
        uptime: process.uptime()
    });
});

// Auth routes
app.use('/api/auth', authRoutes);

// ========== 404 Handler ==========
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

// ========== Error Handler ==========
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors
        });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(400).json({
            success: false,
            message: `${field} already exists`
        });
    }

    // Default error
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ========== Start Server ==========
const startServer = async () => {
    try {
        // Connect to database
        await database.connect();

        // Start server
        app.listen(PORT, () => {
            console.log(`\n🚀 Server running on http://localhost:${PORT}`);
            console.log(`📚 API Documentation: http://localhost:${PORT}/api/health`);
            console.log(`🌿 Leaf Lens Backend v1.0.0`);
            console.log(`📦 Environment: ${process.env.NODE_ENV}\n`);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer();

// ========== Graceful Shutdown ==========
const shutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    
    // Close database connection
    await database.disconnect();
    
    // Exit process
    process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = app;