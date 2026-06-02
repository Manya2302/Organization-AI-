// ============================================================
// Infrastructure: Email Service (SMTP via nodemailer)
// ============================================================
import nodemailer from 'nodemailer';
import { logger } from '../logging/logger.js';

class EmailService {
  constructor() {
    this.transporter = null;
    this.init();
  }

  init() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      logger.warn('⚠️ SMTP settings not fully configured in .env. Emails will only be logged.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for 465, false for other ports
        auth: {
          user,
          pass,
        },
        tls: {
          rejectUnauthorized: false
        }
      });
      logger.info('📧 Mailer transporter initialized successfully.');
    } catch (err) {
      logger.error('Failed to initialize nodemailer transporter:', err);
    }
  }

  async sendMail({ to, subject, text, html }) {
    if (!this.transporter) {
      logger.info(`✉️ [SMTP Log Only] To: ${to} | Subject: ${subject}`);
      logger.info(`Body:\n${text}`);
      return true;
    }

    try {
      const from = process.env.SMTP_FROM_EMAIL || 'noreply-stackvision@gmail.com';
      await this.transporter.sendMail({
        from: `"SecureVault AI" <${from}>`,
        to,
        subject,
        text,
        html,
      });
      logger.info(`📧 Email sent successfully to ${to}`);
      return true;
    } catch (err) {
      logger.error(`❌ Failed to send email to ${to}:`, err);
      return false;
    }
  }

  async sendOTP(email, otp, purpose) {
    const subject = `SecureVault AI - Verification Code: ${otp}`;
    const text = `Your verification code is: ${otp}. It will expire in 10 minutes.\n\nPurpose: ${purpose}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
        <h2 style="color: #2563eb; text-align: center;">SecureVault AI</h2>
        <p>You requested a security verification code for <strong>${purpose}</strong>.</p>
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
          <span style="font-size: 24px; font-weight: bold; letter-spacing: 4px; font-family: monospace; color: #1e293b;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 12px; text-align: center;">This code will expire in 10 minutes. If you did not request this code, please ignore this email.</p>
      </div>
    `;
    return await this.sendMail({ to: email, subject, text, html });
  }
}

export default new EmailService();
