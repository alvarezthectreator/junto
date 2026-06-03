/**
 * OTP Service
 * Handles OTP generation, storage, and email delivery via cPanel
 */

import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';

let transporter = null;

/**
 * Initialize email transporter with cPanel SMTP
 */
export const initializeEmailTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.CPANEL_EMAIL_HOST || 'mail.orquex.com',
    port: parseInt(process.env.CPANEL_EMAIL_PORT || '465'),
    secure: process.env.CPANEL_EMAIL_PORT === '465' || process.env.CPANEL_EMAIL_PORT === '25', // true for 465, false for 587
    auth: {
      user: process.env.CPANEL_EMAIL_USER || 'testmail@orquex.com',
      pass: process.env.CPANEL_EMAIL_PASSWORD || '100000000',
    },
    // Add these for better compatibility
    tls: {
      rejectUnauthorized: false, // For self-signed certificates
    },
  });

  console.log('✓ Email transporter initialized with cPanel SMTP');
  return transporter;
};

/**
 * Generate 6-digit OTP code
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP via email through cPanel
 */
export const sendOTPEmail = async (email, otp, displayName = 'User') => {
  try {
    if (!transporter) {
      initializeEmailTransporter();
    }

    const mailOptions = {
      from: process.env.CPANEL_EMAIL_FROM || 'testmail@orquex.com',
      to: email,
      subject: '🔐 Your Junto Login Code',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 12px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🔐 Junto Login</h1>
          </div>
          
          <div style="padding: 30px 20px; background: white; border-radius: 0 0 12px 12px;">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
              Hi ${displayName},
            </p>
            
            <p style="color: #666; font-size: 14px; margin-bottom: 30px;">
              Enter this code to verify your Junto account:
            </p>
            
            <div style="background: #f0f0f0; padding: 25px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 4px; border-radius: 8px; color: #667eea; font-family: 'Courier New', monospace;">
              ${otp.split('').join(' ')}
            </div>
            
            <p style="color: #999; font-size: 12px; margin-top: 25px; margin-bottom: 5px; text-align: center;">
              ⏱️ This code expires in 5 minutes
            </p>
            
            <p style="color: #999; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
              If you didn't request this code, please ignore this email. Your account is safe.
            </p>
            
            <p style="color: #bbb; font-size: 11px; margin-top: 20px; text-align: center;">
              © 2026 Junto. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${email}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending OTP email:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Store OTP in database
 */
export const storeOTP = (db, email, otp) => {
  return new Promise((resolve, reject) => {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    const id = uuidv4();
    const now = new Date().toISOString();

    // First try to delete any existing OTP for this email
    db.run('DELETE FROM otp_codes WHERE email = ?', [email], (err) => {
      if (err) console.warn('Warning deleting old OTP:', err);

      // Then insert new OTP
      const sql = `
        INSERT INTO otp_codes (id, email, code, expires_at, attempts, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      db.run(
        sql,
        [id, email, otp, expiresAt.toISOString(), 0, now],
        (err) => {
          if (err) {
            console.error('Error storing OTP:', err);
            reject(err);
          } else {
            console.log(`✓ OTP stored for ${email}, expires at ${expiresAt.toISOString()}`);
            resolve({ id, expiresAt });
          }
        }
      );
    });
  });
};

/**
 * Verify OTP code
 */
export const verifyOTP = (db, email, code) => {
  return new Promise((resolve, reject) => {
    const now = new Date().toISOString();

    const sql = `
      SELECT * FROM otp_codes
      WHERE email = ? AND code = ? AND expires_at > ?
    `;

    db.get(sql, [email, code, now], async (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      // OTP not found or expired
      if (!row) {
        resolve({ valid: false, reason: 'Invalid or expired code' });
        return;
      }

      // Check attempt count
      if (row.attempts >= 3) {
        // Delete the OTP as it's now locked
        db.run('DELETE FROM otp_codes WHERE id = ?', [row.id], (err) => {
          if (err) console.error('Error deleting locked OTP:', err);
        });
        resolve({ valid: false, reason: 'Too many failed attempts. Request a new code.' });
        return;
      }

      // Valid OTP - delete it (one-time use)
      db.run('DELETE FROM otp_codes WHERE id = ?', [row.id], (err) => {
        if (err) console.error('Error deleting used OTP:', err);
      });

      resolve({
        valid: true,
        email: row.email,
        expiresAt: row.expires_at,
      });
    });
  });
};

/**
 * Increment failed attempt count
 */
export const incrementOTPAttempts = (db, email) => {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE otp_codes
      SET attempts = attempts + 1
      WHERE email = ?
    `;

    db.run(sql, [email], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

/**
 * Get OTP expiry info (for frontend countdown)
 */
export const getOTPExpiry = (db, email) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT expires_at, attempts FROM otp_codes
      WHERE email = ?
    `;

    db.get(sql, [email], (err, row) => {
      if (err) {
        reject(err);
      } else if (!row) {
        resolve(null);
      } else {
        const expiryTime = new Date(row.expires_at).getTime();
        const remainingMs = expiryTime - Date.now();
        const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));

        resolve({
          expiresAt: row.expires_at,
          remainingSeconds,
          attempts: row.attempts,
          attemptsRemaining: Math.max(0, 3 - row.attempts),
        });
      }
    });
  });
};

/**
 * Test email connection
 */
export const testEmailConnection = async () => {
  try {
    if (!transporter) {
      initializeEmailTransporter();
    }

    await transporter.verify();
    console.log('✅ Email connection verified');
    return { success: true };
  } catch (error) {
    console.error('❌ Email connection failed:', error.message);
    return { success: false, error: error.message };
  }
};
