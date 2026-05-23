const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let transporter;

const initTransporter = () => {
  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    logger.info('Email transporter configured');
  } else {
    logger.warn('SMTP not configured — email notifications disabled');
  }
};

const sendEmail = async ({ to, subject, html }) => {
  if (!transporter) {
    logger.warn(`Email skipped (no SMTP): ${subject} → ${to}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"ProFlow" <noreply@proflow.dev>',
      to,
      subject,
      html,
    });
    logger.info(`Email sent: ${subject} → ${to}`);
  } catch (err) {
    logger.error(`Email failed: ${err.message}`);
  }
};

const sendTaskAssignment = async (email, taskTitle, assignerName) => {
  await sendEmail({
    to: email,
    subject: `New Task Assigned: ${taskTitle}`,
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #0f172a; color: #e2e8f0; border-radius: 12px;">
        <h2 style="color: #818cf8;">📋 New Task Assigned</h2>
        <p>${assignerName} assigned you a new task:</p>
        <div style="background: #1e293b; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #818cf8;">
          <h3 style="margin: 0; color: #f8fafc;">${taskTitle}</h3>
        </div>
        <p>Log in to ProFlow to view details and get started.</p>
        <p style="color: #64748b; font-size: 12px;">— ProFlow Team</p>
      </div>
    `,
  });
};

const sendDeadlineReminder = async (email, taskTitle, deadline) => {
  await sendEmail({
    to: email,
    subject: `⚠️ Deadline Approaching: ${taskTitle}`,
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #0f172a; color: #e2e8f0; border-radius: 12px;">
        <h2 style="color: #f59e0b;">⏰ Deadline Reminder</h2>
        <p>Your task deadline is approaching:</p>
        <div style="background: #1e293b; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #f59e0b;">
          <h3 style="margin: 0; color: #f8fafc;">${taskTitle}</h3>
          <p style="margin: 8px 0 0; color: #f59e0b;">Due: ${new Date(deadline).toLocaleDateString()}</p>
        </div>
        <p>Log in to ProFlow to complete it on time.</p>
        <p style="color: #64748b; font-size: 12px;">— ProFlow Team</p>
      </div>
    `,
  });
};

const sendPasswordReset = async (email, resetUrl) => {
  await sendEmail({
    to: email,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #0f172a; color: #e2e8f0; border-radius: 12px;">
        <h2 style="color: #818cf8;">🔐 Password Reset</h2>
        <p>You requested a password reset. Click the button below:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #818cf8, #6366f1); color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">Reset Password</a>
        <p style="color: #64748b; font-size: 12px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
};

module.exports = { initTransporter, sendEmail, sendTaskAssignment, sendDeadlineReminder, sendPasswordReset };
