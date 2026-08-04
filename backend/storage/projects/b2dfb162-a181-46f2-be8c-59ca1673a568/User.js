const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters long'],
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email address'
        ]
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long'],
        select: false // Don't return password by default
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'premium'],
        default: 'user'
    },
    profileImage: {
        type: String,
        default: null
    },
    preferences: {
        language: {
            type: String,
            enum: ['en', 'es', 'fr', 'hi', 'zh'],
            default: 'en'
        },
        notifications: {
            email: { type: Boolean, default: true },
            push: { type: Boolean, default: true }
        },
        theme: {
            type: String,
            enum: ['light', 'dark'],
            default: 'light'
        }
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: {
        type: String,
        select: false
    },
    resetPasswordToken: {
        type: String,
        select: false
    },
    resetPasswordExpire: {
        type: Date,
        select: false
    },
    lastLogin: {
        type: Date,
        default: null
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    stats: {
        scansCount: { type: Number, default: 0 },
        diseasesDetected: { type: Number, default: 0 },
        plantsSaved: { type: Number, default: 0 }
    }
}, {
    timestamps: true // Adds createdAt and updatedAt
});

// ========== Indexes ==========
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ role: 1 });

// ========== Pre-save Hooks ==========
userSchema.pre('save', async function(next) {
    // Only hash password if it's modified
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// ========== Instance Methods ==========
userSchema.methods = {
    // Compare password
    async comparePassword(candidatePassword) {
        if (!candidatePassword || !this.password) {
            return false;
        }
        return await bcrypt.compare(candidatePassword, this.password);
    },

    // Generate auth token
    generateAuthToken() {
        const jwtManager = require('../config/jwt');
        return jwtManager.generateTokenPair(this);
    },

    // Check if account is locked
    isAccountLocked() {
        if (!this.lockUntil) return false;
        return this.lockUntil > new Date();
    },

    // Increment login attempts
    async incrementLoginAttempts() {
        this.loginAttempts += 1;

        // Lock account after 5 failed attempts
        if (this.loginAttempts >= 5) {
            this.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        }

        await this.save();
        return this.loginAttempts;
    },

    // Reset login attempts
    async resetLoginAttempts() {
        this.loginAttempts = 0;
        this.lockUntil = null;
        await this.save();
    },

    // Update last login
    async updateLastLogin() {
        this.lastLogin = new Date();
        await this.save();
    },

    // Get public profile
    getPublicProfile() {
        return {
            id: this._id,
            name: this.name,
            email: this.email,
            role: this.role,
            profileImage: this.profileImage,
            preferences: this.preferences,
            stats: this.stats,
            emailVerified: this.emailVerified,
            createdAt: this.createdAt
        };
    }
};

// ========== Static Methods ==========
userSchema.statics = {
    // Find by email with password
    async findByEmailWithPassword(email) {
        return await this.findOne({ email }).select('+password');
    },

    // Check if email exists
    async emailExists(email) {
        const user = await this.findOne({ email });
        return !!user;
    },

    // Get user statistics
    async getStats() {
        const stats = await this.aggregate([
            {
                $group: {
                    _id: null,
                    totalUsers: { $sum: 1 },
                    totalScans: { $sum: '$stats.scansCount' },
                    totalDiseases: { $sum: '$stats.diseasesDetected' },
                    avgScans: { $avg: '$stats.scansCount' }
                }
            }
        ]);
        return stats[0] || { totalUsers: 0, totalScans: 0, totalDiseases: 0, avgScans: 0 };
    }
};

const User = mongoose.model('User', userSchema);

module.exports = User;