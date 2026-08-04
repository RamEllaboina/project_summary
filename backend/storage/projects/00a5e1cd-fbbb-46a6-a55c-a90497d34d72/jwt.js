const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

class JWTManager {
    constructor() {
        this.secret = process.env.JWT_SECRET;
        this.expire = process.env.JWT_EXPIRE || '7d';
        this.refreshExpire = process.env.JWT_REFRESH_EXPIRE || '30d';
        
        if (!this.secret) {
            throw new Error('JWT_SECRET is not defined in environment variables');
        }
    }

    generateToken(payload) {
        try {
            const token = jwt.sign(
                payload,
                this.secret,
                { expiresIn: this.expire }
            );
            return token;
        } catch (error) {
            console.error('Error generating JWT:', error);
            throw new Error('Failed to generate authentication token');
        }
    }

    generateRefreshToken(payload) {
        try {
            const token = jwt.sign(
                payload,
                this.secret,
                { expiresIn: this.refreshExpire }
            );
            return token;
        } catch (error) {
            console.error('Error generating refresh token:', error);
            throw new Error('Failed to generate refresh token');
        }
    }

    verifyToken(token) {
        try {
            const decoded = jwt.verify(token, this.secret);
            return decoded;
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Token expired');
            }
            if (error.name === 'JsonWebTokenError') {
                throw new Error('Invalid token');
            }
            throw error;
        }
    }

    decodeToken(token) {
        try {
            return jwt.decode(token);
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    }

    // Generate token pair (access + refresh)
    generateTokenPair(user) {
        const payload = {
            id: user._id,
            email: user.email,
            role: user.role || 'user'
        };

        return {
            accessToken: this.generateToken(payload),
            refreshToken: this.generateRefreshToken(payload)
        };
    }
}

module.exports = new JWTManager();