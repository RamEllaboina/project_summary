const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const projectRoutes = require('./routes/projectRoutes');
const errorHandler = require('./middlewares/errorHandler');
const AppError = require('./utils/AppError');

const app = express();

// Global Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', projectRoutes);

// Health check endpoint (must be before 404 handler)
app.get('/api/health', (req, res) => {
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

// 404 Handler
app.all(/(.*)/, (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
