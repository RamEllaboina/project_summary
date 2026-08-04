const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const validationMiddleware = require('../middleware/validation');

// ========== Public Routes ==========

// Register
router.post(
    '/register',
    validationMiddleware.registerRules(),
    validationMiddleware.validate,
    authController.register
);

// Login
router.post(
    '/login',
    validationMiddleware.loginRules(),
    validationMiddleware.validate,
    authController.login
);

// Refresh token
router.post(
    '/refresh-token',
    authController.refreshToken
);

// Forgot password
router.post(
    '/forgot-password',
    validationMiddleware.forgotPasswordRules(),
    validationMiddleware.validate,
    authController.forgotPassword
);

// Reset password
router.post(
    '/reset-password',
    validationMiddleware.resetPasswordRules(),
    validationMiddleware.validate,
    authController.resetPassword
);

// Verify email
router.get(
    '/verify-email/:token',
    authController.verifyEmail
);

// ========== Protected Routes ==========

// Get current user
router.get(
    '/me',
    authMiddleware.protect,
    authController.getCurrentUser
);

// Update profile
router.put(
    '/profile',
    authMiddleware.protect,
    validationMiddleware.updateProfileRules(),
    validationMiddleware.validate,
    authController.updateProfile
);

// Change password
router.put(
    '/change-password',
    authMiddleware.protect,
    validationMiddleware.changePasswordRules(),
    validationMiddleware.validate,
    authController.changePassword
);

// Logout
router.post(
    '/logout',
    authMiddleware.protect,
    authController.logout
);

module.exports = router;