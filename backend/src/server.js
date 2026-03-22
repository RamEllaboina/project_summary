const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Handle uncaught exceptions
process.on('uncaughtException', err => {
    console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
});

const app = require('./app');

const DB = process.env.DATABASE_LOCAL || 'mongodb://localhost:27017/ai-code-analyzer';
const PORT = process.env.PORT || 3000;

mongoose
    .connect(DB)
    .then(() => console.log('DB connection successful!'))
    .catch(err => console.error('DB connection error:', err));

const server = app.listen(PORT, () => {
    console.log(`App running on port ${PORT}...`);
});

// Handle unhandled rejections
process.on('unhandledRejection', err => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});
