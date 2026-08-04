const jwtManager = require('../config/jwt');
const User = require('../models/User');

class AuthMiddleware {
    // Protect routes - require authentication
    async protect(req, res, next) {
        try {
            let token;

            // Check for token in Authorization header
            if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
                token = req.headers.authorization.split(' ')[1];
            }

            // Check for token in cookie (optional)
            if (!token && req.cookies?.token) {
                token = req.cookies.token;
            }

            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Not authorized to access this route'
                });
            }

            // Verify token
            const decoded = jwtManager.verifyToken(token);
            
            // Get user from database
            const user = await User.findById(decoded.id);
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Check if user is active
            if (!user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'Your account has been deactivated'
                });
            }

            // Check if account is locked
            if (user.isAccountLocked()) {
                return res.status(401).json({
                    success: false,
                    message: 'Account is temporarily locked. Please try again later.'
                });
            }

            // Attach user to request
            req.user = user;
            next();

        } catch (error) {
            console.error('Auth middleware error:', error);
            
            let message = 'Not authorized to access this route';
            if (error.message === 'Token expired') {
                message = 'Session expired. Please login again.';
            } else if (error.message === 'Invalid token') {
                message = 'Invalid token. Please login again.';
            }

            return res.status(401).json({
                success: false,
                message
            });
        }
    }

    // Restrict access based on roles
    restrictTo(...roles) {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Not authorized'
                });
            }

            if (!roles.includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to perform this action'
                });
            }

            next();
        };
    }

    // Optional authentication - allow both authenticated and unauthenticated
    async optionalAuth(req, res, next) {
        try {
            let token;

            if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
                token = req.headers.authorization.split(' ')[1];
            }

            if (token) {
                const decoded = jwtManager.verifyToken(token);
                const user = await User.findById(decoded.id);
                if (user && user.isActive) {
                    req.user = user;
                }
            }

            next();
        } catch (error) {
            // Continue without authentication
            next();
        }
    }

    // Check if user is admin
    isAdmin(req, res, next) {
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }
    }
}

module.exports = new AuthMiddleware();