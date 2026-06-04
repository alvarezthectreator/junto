/**
 * OTP Service
 * Handles OTP generation, storage, and email delivery via cPanel SMTP
 * Sends FROM cPanel email, TO user's email (Gmail, Yahoo, etc.)
 */

import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';

let transporter = null;
const inMemoryOtpStore = new Map();

/**
 * Initialize email transporter with cPanel SMTP
 * Sender: testmail@orquex.com
 * Recipient: Any email address (user's Gmail, Yahoo, etc.)
 */
export const initializeEmailTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.CPANEL_EMAIL_HOST || 'mail.orquex.com',
    port: parseInt(process.env.CPANEL_EMAIL_PORT || '465'),
    secure: true, // SSL
    auth: {
      user: process.env.CPANEL_EMAIL_USER || 'testmail@orquex.com',
      pass: process.env.CPANEL_EMAIL_PASSWORD || '100000000',
    },
  });

  console.log('✓ Email transporter initialized with cPanel SMTP');
  console.log(`  Sender: ${process.env.CPANEL_EMAIL_FROM || 'testmail@orquex.com'}`);
  return transporter;
};

/**
 * Generate 6-digit OTP code
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP via email through cPanel SMTP
 * FROM: testmail@orquex.com (cPanel)
 * TO: user's email (Gmail, Yahoo, etc.)
 */
export const sendOTPEmail = async (email, otp, displayName = 'User') => {
  try {
    if (!transporter) {
      initializeEmailTransporter();
    }

    const mailOptions = {
      from: process.env.CPANEL_EMAIL_FROM || 'testmail@orquex.com',
      to: email,
      subject: 'Your Junto Verification Code',
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
            <div style="background-color: white; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 8px;">
              <h2 style="color: #333; margin-bottom: 20px;">Junto Verification Code</h2>
              
              <p style="color: #555; font-size: 14px; margin-bottom: 20px;">
                Hi ${displayName},
              </p>
              
              <p style="color: #555; font-size: 14px; margin-bottom: 30px;">
                Your verification code is:
              </p>
              
              <div style="background-color: #f0f0f0; padding: 15px; text-align: center; border-radius: 5px; margin-bottom: 20px;">
                <p style="font-size: 32px; font-weight: bold; letter-spacing: 2px; color: #333; margin: 0;">${otp}</p>
              </div>
              
              <p style="color: #777; font-size: 13px; margin-bottom: 10px;">
                This code will expire in 5 minutes.
              </p>
              
              <p style="color: #777; font-size: 13px; margin-bottom: 20px;">
                If you did not request this code, please ignore this email.
              </p>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              
              <p style="color: #999; font-size: 12px;">
                Junto - Social Companionship Platform
              </p>
            </div>
          </body>
        </html>
      `,
      text: `Your Junto verification code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nIf you did not request this code, please ignore this email.`,
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
    db.run('DELETE FROM otp_codes WHERE email = ?', [email], (deleteErr) => {
      if (deleteErr) {
        console.warn(`⚠️  Warning deleting old OTP for ${email}:`, deleteErr.message);
      } else {
        console.log(`✓ Cleaned up old OTP for ${email}`);
      }

      // Then insert new OTP
      const sql = `
        INSERT INTO otp_codes (id, email, code, expires_at, attempts, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      db.run(
        sql,
        [id, email, otp, expiresAt.toISOString(), 0, now],
        function(err) {
          if (err) {
            console.error(`❌ Error storing OTP for ${email}:`, err.message);
            console.error('   Error code:', err.code);
            console.error('   SQL: INSERT INTO otp_codes');
            reject({
              message: 'Failed to store OTP in database',
              originalError: err.message,
              code: err.code,
            });
          } else {
            inMemoryOtpStore.delete(email);
            console.log(`✓ OTP successfully stored for ${email}, expires at ${expiresAt.toISOString()}`);
            resolve({ id, expiresAt });
          }
        }
      );
    });
  });
};

/**
 * Store OTP in memory as a fallback if database write fails
 */
export const storeOTPInMemory = (email, otp) => {
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  inMemoryOtpStore.set(email, {
    id: uuidv4(),
    email,
    code: otp,
    expiresAt: expiresAt.toISOString(),
    attempts: 0,
    createdAt: new Date().toISOString(),
  });

  console.warn(`⚠️ OTP stored in memory fallback for ${email}`);
  return { id: inMemoryOtpStore.get(email).id, expiresAt };
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
        const memoryRow = inMemoryOtpStore.get(email);
        if (!memoryRow) {
          resolve({ valid: false, reason: 'Invalid or expired code' });
          return;
        }

        if (memoryRow.expiresAt <= now) {
          inMemoryOtpStore.delete(email);
          resolve({ valid: false, reason: 'Invalid or expired code' });
          return;
        }

        if (memoryRow.attempts >= 3) {
          inMemoryOtpStore.delete(email);
          resolve({ valid: false, reason: 'Too many failed attempts. Request a new code.' });
          return;
        }

        if (memoryRow.code !== code) {
          resolve({ valid: false, reason: 'Invalid or expired code' });
          return;
        }

        inMemoryOtpStore.delete(email);
        resolve({
          valid: true,
          email,
          expiresAt: memoryRow.expiresAt,
        });
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
      inMemoryOtpStore.delete(email);

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
        const memoryRow = inMemoryOtpStore.get(email);
        if (memoryRow) {
          memoryRow.attempts += 1;
          inMemoryOtpStore.set(email, memoryRow);
        }
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
        const memoryRow = inMemoryOtpStore.get(email);
        if (!memoryRow) {
          resolve(null);
          return;
        }

        const expiryTime = new Date(memoryRow.expiresAt).getTime();
        const remainingMs = expiryTime - Date.now();
        const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));

        resolve({
          expiresAt: memoryRow.expiresAt,
          remainingSeconds,
          attempts: memoryRow.attempts,
          attemptsRemaining: Math.max(0, 3 - memoryRow.attempts),
        });
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
