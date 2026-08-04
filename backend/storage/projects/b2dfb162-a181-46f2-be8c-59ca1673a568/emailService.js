const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

class EmailService {
    constructor() {
        this.transporter = null;
        this.initialize();
    }

    initialize() {
        // Only initialize if email config exists
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            this.transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.EMAIL_PORT) || 587,
                secure: false,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                },
                tls: {
                    rejectUnauthorized: false
                }
            });
            console.log('📧 Email service initialized');
        } else {
            console.warn('⚠️ Email service not configured - skipping initialization');
        }
    }

    async sendEmail({ to, subject, html, text }) {
        if (!this.transporter) {
            console.warn('⚠️ Email service not configured, skipping send');
            return { success: false, message: 'Email service not configured' };
        }

        try {
            const mailOptions = {
                from: `"Leaf Lens" <${process.env.EMAIL_USER}>`,
                to,
                subject,
                html,
                text: text || html.replace(/<[^>]*>/g, '')
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('📧 Email sent:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('❌ Email send error:', error);
            return { success: false, error: error.message };
        }
    }

    // ========== Email Templates ==========

    async sendVerificationEmail(email, token) {
        const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${token}`;
        
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #16a34a; padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">🌿 Leaf Lens</h1>
                </div>
                <div style="padding: 30px; background: #f9fafb;">
                    <h2>Verify Your Email</h2>
                    <p>Thank you for signing up with Leaf Lens! Please click the button below to verify your email address:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationUrl}" 
                           style="background: #16a34a; color: white; padding: 12px 30px; 
                                  text-decoration: none; border-radius: 6px; font-weight: bold;">
                            Verify Email
                        </a>
                    </div>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; background: white; padding: 10px; border-radius: 4px;">
                        ${verificationUrl}
                    </p>
                    <p>This link will expire in 24 hours.</p>
                    <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
                    <p style="font-size: 12px; color: #6b7280;">
                        If you didn't create an account with Leaf Lens, please ignore this email.
                    </p>
                </div>
            </div>
        `;

        return await this.sendEmail({
            to: email,
            subject: 'Verify Your Email - Leaf Lens',
            html
        });
    }

    async sendPasswordResetEmail(email, token) {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${token}`;
        
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #16a34a; padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">🌿 Leaf Lens</h1>
                </div>
                <div style="padding: 30px; background: #f9fafb;">
                    <h2>Reset Your Password</h2>
                    <p>We received a request to reset your password. Click the button below to create a new password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" 
                           style="background: #16a34a; color: white; padding: 12px 30px; 
                                  text-decoration: none; border-radius: 6px; font-weight: bold;">
                            Reset Password
                        </a>
                    </div>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; background: white; padding: 10px; border-radius: 4px;">
                        ${resetUrl}
                    </p>
                    <p>This link will expire in 10 minutes.</p>
                    <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
                    <p style="font-size: 12px; color: #6b7280;">
                        If you didn't request a password reset, please ignore this email.
                    </p>
                </div>
            </div>
        `;

        return await this.sendEmail({
            to: email,
            subject: 'Reset Your Password - Leaf Lens',
            html
        });
    }

    async sendWelcomeEmail(email, name) {
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #16a34a; padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">🌿 Leaf Lens</h1>
                </div>
                <div style="padding: 30px; background: #f9fafb;">
                    <h2>Welcome to Leaf Lens, ${name}! 👋</h2>
                    <p>We're excited to have you on board. Leaf Lens helps you detect plant diseases instantly using AI.</p>
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3>Getting Started:</h3>
                        <ul>
                            <li>📸 Take a photo of a plant leaf</li>
                            <li>🤖 Let our AI analyze it</li>
                            <li>📊 Get instant disease detection and treatment recommendations</li>
                        </ul>
                    </div>
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
                           style="background: #16a34a; color: white; padding: 12px 30px; 
                                  text-decoration: none; border-radius: 6px; font-weight: bold;">
                            Go to Dashboard
                        </a>
                    </div>
                    <p style="font-size: 14px; color: #4b5563;">
                        If you have any questions, feel free to reply to this email.
                    </p>
                    <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
                    <p style="font-size: 12px; color: #6b7280;">
                        Happy planting! 🌱
                    </p>
                </div>
            </div>
        `;

        return await this.sendEmail({
            to: email,
            subject: 'Welcome to Leaf Lens! 🌿',
            html
        });
    }
}

module.exports = new EmailService();