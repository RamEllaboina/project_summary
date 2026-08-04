const User = require('../models/User');
const jwtManager = require('../config/jwt');
const emailService = require('../utils/emailService');
const crypto = require('crypto');

class AuthController {
    // ========== REGISTER ==========
    async register(req, res) {
        try {
            const { name, email, password } = req.body;

            // Check if user already exists
            const userExists = await User.emailExists(email);
            if (userExists) {
                return res.status(400).json({
                    success: false,
                    message: 'User with this email already exists'
                });
            }

            // Create user
            const user = await User.create({
                name,
                email,
                password
            });

            // Generate email verification token (optional)
            // await this.sendVerificationEmail(user);

            // Generate tokens
            const { accessToken, refreshToken } = user.generateAuthToken();

            // Update last login
            await user.updateLastLogin();

            // Prepare response (exclude password)
            const userData = user.getPublicProfile();

            return res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {
                    user: userData,
                    accessToken,
                    refreshToken
                }
            });

        } catch (error) {
            console.error('Registration error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to register user',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // ========== LOGIN ==========
    async login(req, res) {
        try {
            const { email, password } = req.body;

            // Find user with password
            const user = await User.findByEmailWithPassword(email);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            // Check if account is locked
            if (user.isAccountLocked()) {
                const remainingTime = Math.ceil((user.lockUntil - new Date()) / 60000);
                return res.status(401).json({
                    success: false,
                    message: `Account is locked. Please try again in ${remainingTime} minutes`
                });
            }

            // Check password
            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
                // Increment login attempts
                await user.incrementLoginAttempts();
                
                const attemptsLeft = 5 - user.loginAttempts;
                return res.status(401).json({
                    success: false,
                    message: `Invalid email or password. ${attemptsLeft} attempts remaining`
                });
            }

            // Check if account is active
            if (!user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'Your account has been deactivated. Please contact support.'
                });
            }

            // Reset login attempts on successful login
            await user.resetLoginAttempts();

            // Update last login
            await user.updateLastLogin();

            // Generate tokens
            const { accessToken, refreshToken } = user.generateAuthToken();

            // Prepare response
            const userData = user.getPublicProfile();

            return res.status(200).json({
                success: true,
                message: 'Login successful',
                data: {
                    user: userData,
                    accessToken,
                    refreshToken
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to login',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // ========== GET CURRENT USER ==========
    async getCurrentUser(req, res) {
        try {
            const user = await User.findById(req.user.id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            return res.status(200).json({
                success: true,
                data: {
                    user: user.getPublicProfile()
                }
            });

        } catch (error) {
            console.error('Get current user error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to get user data'
            });
        }
    }

    // ========== REFRESH TOKEN ==========
    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    message: 'Refresh token is required'
                });
            }

            // Verify refresh token
            const decoded = jwtManager.verifyToken(refreshToken);
            
            // Get user
            const user = await User.findById(decoded.id);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid refresh token'
                });
            }

            // Generate new tokens
            const { accessToken, refreshToken: newRefreshToken } = user.generateAuthToken();

            return res.status(200).json({
                success: true,
                data: {
                    accessToken,
                    refreshToken: newRefreshToken
                }
            });

        } catch (error) {
            console.error('Refresh token error:', error);
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired refresh token'
            });
        }
    }

    // ========== LOGOUT ==========
    async logout(req, res) {
        try {
            // In JWT-based auth, logout is client-side
            // But we can add token blacklisting here if needed
            
            return res.status(200).json({
                success: true,
                message: 'Logged out successfully'
            });

        } catch (error) {
            console.error('Logout error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to logout'
            });
        }
    }

    // ========== FORGOT PASSWORD ==========
    async forgotPassword(req, res) {
        try {
            const { email } = req.body;

            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User with this email not found'
                });
            }

            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            
            // Hash token and save to database (simplified)
            user.resetPasswordToken = resetToken;
            user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
            await user.save();

            // Send email with reset link
            // await emailService.sendPasswordResetEmail(user.email, resetToken);

            return res.status(200).json({
                success: true,
                message: 'Password reset email sent',
                // In development, return token for testing
                ...(process.env.NODE_ENV === 'development' && { resetToken })
            });

        } catch (error) {
            console.error('Forgot password error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to process password reset request'
            });
        }
    }

    // ========== RESET PASSWORD ==========
    async resetPassword(req, res) {
        try {
            const { token, newPassword } = req.body;

            // Find user with valid reset token
            const user = await User.findOne({
                resetPasswordToken: token,
                resetPasswordExpire: { $gt: new Date() }
            });

            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or expired reset token'
                });
            }

            // Update password
            user.password = newPassword;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();

            return res.status(200).json({
                success: true,
                message: 'Password reset successful'
            });

        } catch (error) {
            console.error('Reset password error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to reset password'
            });
        }
    }

    // ========== CHANGE PASSWORD ==========
    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;

            // Get user with password
            const user = await User.findById(req.user.id).select('+password');
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Verify current password
            const isPasswordValid = await user.comparePassword(currentPassword);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
            }

            // Update password
            user.password = newPassword;
            await user.save();

            return res.status(200).json({
                success: true,
                message: 'Password changed successfully'
            });

        } catch (error) {
            console.error('Change password error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to change password'
            });
        }
    }

    // ========== UPDATE PROFILE ==========
    async updateProfile(req, res) {
        try {
            const { name, email, preferences } = req.body;

            // Check if email is being changed
            if (email && email !== req.user.email) {
                const emailExists = await User.emailExists(email);
                if (emailExists) {
                    return res.status(400).json({
                        success: false,
                        message: 'Email already in use'
                    });
                }
            }

            // Prepare update data
            const updateData = {};
            if (name) updateData.name = name;
            if (email) updateData.email = email;
            if (preferences) updateData.preferences = preferences;

            // Update user
            const user = await User.findByIdAndUpdate(
                req.user.id,
                updateData,
                { new: true, runValidators: true }
            );

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                data: {
                    user: user.getPublicProfile()
                }
            });

        } catch (error) {
            console.error('Update profile error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update profile'
            });
        }
    }

    // ========== VERIFY EMAIL ==========
    async verifyEmail(req, res) {
        try {
            const { token } = req.params;

            // Find user with verification token
            const user = await User.findOne({
                verificationToken: token
            });

            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid verification token'
                });
            }

            user.emailVerified = true;
            user.verificationToken = undefined;
            await user.save();

            return res.status(200).json({
                success: true,
                message: 'Email verified successfully'
            });

        } catch (error) {
            console.error('Verify email error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to verify email'
            });
        }
    }
}

module.exports = new AuthController();