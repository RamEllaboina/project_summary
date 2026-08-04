const { validationResult, body, param, query } = require('express-validator');

class ValidationMiddleware {
    // Validate request
    validate(req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array().map(err => ({
                    field: err.path,
                    message: err.msg,
                    value: err.value
                }))
            });
        }
        next();
    }

    // ========== User Validation Rules ==========
    registerRules() {
        return [
            body('name')
                .trim()
                .notEmpty().withMessage('Name is required')
                .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
                .matches(/^[a-zA-Z\s'-]+$/).withMessage('Name contains invalid characters'),

            body('email')
                .trim()
                .notEmpty().withMessage('Email is required')
                .isEmail().withMessage('Please provide a valid email address')
                .normalizeEmail(),

            body('password')
                .notEmpty().withMessage('Password is required')
                .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
                .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
                .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
                .matches(/[0-9]/).withMessage('Password must contain at least one number')
                .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character')
        ];
    }

    loginRules() {
        return [
            body('email')
                .trim()
                .notEmpty().withMessage('Email is required')
                .isEmail().withMessage('Please provide a valid email address')
                .normalizeEmail(),

            body('password')
                .notEmpty().withMessage('Password is required')
        ];
    }

    updateProfileRules() {
        return [
            body('name')
                .optional()
                .trim()
                .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
                .matches(/^[a-zA-Z\s'-]+$/).withMessage('Name contains invalid characters'),

            body('email')
                .optional()
                .trim()
                .isEmail().withMessage('Please provide a valid email address')
                .normalizeEmail(),

            body('preferences')
                .optional()
                .isObject().withMessage('Preferences must be an object')
        ];
    }

    changePasswordRules() {
        return [
            body('currentPassword')
                .notEmpty().withMessage('Current password is required'),

            body('newPassword')
                .notEmpty().withMessage('New password is required')
                .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
                .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
                .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
                .matches(/[0-9]/).withMessage('Password must contain at least one number')
                .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character')
        ];
    }

    forgotPasswordRules() {
        return [
            body('email')
                .trim()
                .notEmpty().withMessage('Email is required')
                .isEmail().withMessage('Please provide a valid email address')
                .normalizeEmail()
        ];
    }

    resetPasswordRules() {
        return [
            body('token')
                .notEmpty().withMessage('Reset token is required'),

            body('newPassword')
                .notEmpty().withMessage('New password is required')
                .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
                .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
                .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
                .matches(/[0-9]/).withMessage('Password must contain at least one number')
                .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character')
        ];
    }

    // ========== Common Validation ==========
    idParam() {
        return [
            param('id')
                .isMongoId().withMessage('Invalid ID format')
        ];
    }

    paginationQuery() {
        return [
            query('page')
                .optional()
                .isInt({ min: 1 }).withMessage('Page must be a positive integer')
                .toInt(),

            query('limit')
                .optional()
                .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
                .toInt()
        ];
    }
}

module.exports = new ValidationMiddleware();