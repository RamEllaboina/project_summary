const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

class Database {
    constructor() {
        this.connection = null;
        this.isConnected = false;
    }

    async connect() {
        if (this.isConnected) {
            console.log('📊 Database already connected');
            return;
        }

        try {
            const options = {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                autoIndex: true,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                family: 4
            };

            const conn = await mongoose.connect(process.env.MONGODB_URI, options);
            
            this.connection = conn;
            this.isConnected = true;
            
            console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
            console.log(`📁 Database: ${conn.connection.name}`);
            
            // Handle connection events
            mongoose.connection.on('error', (err) => {
                console.error('❌ MongoDB connection error:', err);
                this.isConnected = false;
            });

            mongoose.connection.on('disconnected', () => {
                console.warn('⚠️ MongoDB disconnected');
                this.isConnected = false;
            });

            mongoose.connection.on('reconnected', () => {
                console.log('🔄 MongoDB reconnected');
                this.isConnected = true;
            });

        } catch (error) {
            console.error('❌ Failed to connect to MongoDB:', error.message);
            process.exit(1);
        }
    }

    async disconnect() {
        if (this.isConnected) {
            await mongoose.disconnect();
            this.isConnected = false;
            console.log('📊 Database disconnected');
        }
    }

    getConnection() {
        return this.connection;
    }

    getStatus() {
        return {
            isConnected: this.isConnected,
            host: this.connection?.connection?.host || 'N/A',
            database: this.connection?.connection?.name || 'N/A'
        };
    }
}

// Singleton instance
const database = new Database();

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('🛑 Shutting down gracefully...');
    await database.disconnect();
    process.exit(0);
});

module.exports = database;