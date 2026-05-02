import nodemailer from 'nodemailer';
import { getSmtpConfig, isEmailConfigured } from '../config';
import { logger } from '../logger/logger';

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  private static getTransporter() {
    if (this.transporter) {
      return this.transporter;
    }

    const config = getSmtpConfig();
    
    if (!isEmailConfigured()) {
      logger.warn('Email service not configured. Emails will be logged to console.');
      return null;
    }

    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });

    return this.transporter;
  }

  static async sendPasswordResetEmail(to: string, name: string, token: string): Promise<void> {
    const encodedToken = encodeURIComponent(token);
    const resetUrl = `nearme://reset-password?token=${encodedToken}`;
    const webUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${encodedToken}`;
    const subject = 'Reset Your NearMe Password';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 500px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #6366f1; }
            .content { background: #f9fafb; border-radius: 12px; padding: 30px; }
            .token { background: #fff; border: 2px dashed #e5e7eb; border-radius: 8px; padding: 20px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 4px; color: #6366f1; margin: 20px 0; }
            .button { display: inline-block; background: #6366f1; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #9ca3af; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <span class="logo">NearMe</span>
            </div>
            <div class="content">
              <h2>Password Reset Request</h2>
              <p>Hi ${name},</p>
              <p>We received a request to reset your password. Use the token below or click the button:</p>
              <div class="token">${token}</div>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              <p>This link will expire in 1 hour.</p>
              <p style="text-align: center; margin-top: 15px;">
                <a href="${webUrl}" style="color: #6366f1; font-size: 12px; text-decoration: underline;">
                  Open in browser
                </a>
              </p>
              <p style="color: #9ca3af; font-size: 12px;">If you didn't request this, please ignore this email or contact support if you have concerns.</p>
            </div>
            <div class="footer">
              <p>NearMe — Stay connected with friends nearby</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const transporter = this.getTransporter();

    if (!transporter) {
      logger.info(`[MOCK EMAIL] To: ${to}, Subject: ${subject}, Token: ${token}`);
      return;
    }

    try {
      await transporter.sendMail({
        from: getSmtpConfig().from,
        to,
        subject,
        html,
      });
      logger.info(`Password reset email sent to ${to}`);
    } catch (error) {
      logger.error(error, `Failed to send email to ${to}`);
      throw new Error('Failed to send password reset email');
    }
  }
}
