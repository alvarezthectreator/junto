/**
 * OTP Service
 * Handles OTP generation, storage, and email delivery.
 */

import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';

let transporter = null;
let emailProvider = null;
let transporterVerified = false;
const inMemoryOtpStore = new Map();

function readBooleanEnv(value, fallback = false) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function isNonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function readGmailApiConfig() {
  const useDevelopmentFallbacks = process.env.NODE_ENV !== 'production';
  const clientId = process.env.GMAIL_CLIENT_ID || '';
  const clientSecret = process.env.GMAIL_CLIENT_SECRET || '';
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN || '';
  const senderEmail =
    process.env.GMAIL_SENDER_EMAIL ||
    process.env.GMAIL_FROM_EMAIL ||
    process.env.GMAIL_USER_EMAIL ||
    process.env.GMAIL_USER ||
    (useDevelopmentFallbacks ? 'testmail@gmail.com' : '');
  const accessTokenUrl = process.env.GMAIL_TOKEN_URL || 'https://oauth2.googleapis.com/token';

  const missing = [
    !isNonEmpty(clientId) ? 'GMAIL_CLIENT_ID' : null,
    !isNonEmpty(clientSecret) ? 'GMAIL_CLIENT_SECRET' : null,
    !isNonEmpty(refreshToken) ? 'GMAIL_REFRESH_TOKEN' : null,
    !isNonEmpty(senderEmail) ? 'GMAIL_SENDER_EMAIL' : null,
  ].filter(Boolean);

  return {
    clientId,
    clientSecret,
    refreshToken,
    senderEmail,
    tokenUrl: accessTokenUrl,
    missing,
  };
}

function readSMTPConfig() {
  const useDevelopmentFallbacks = process.env.NODE_ENV !== 'production';

  const host =
    process.env.ZEPTOMAIL_HOST ||
    process.env.ZEPTO_MAIL_HOST ||
    'smtp.zeptomail.com';

  const portValue =
    process.env.ZEPTOMAIL_PORT ||
    process.env.ZEPTO_MAIL_PORT ||
    '465';

  const port = Number.parseInt(portValue, 10);
  const user =
    process.env.ZEPTOMAIL_USER ||
    process.env.ZEPTO_MAIL_USER ||
    (useDevelopmentFallbacks ? 'emailapikey' : '');
  const pass =
    process.env.ZEPTOMAIL_PASSWORD ||
    process.env.ZEPTO_MAIL_PASSWORD ||
    (useDevelopmentFallbacks ? '' : '');
  const from =
    process.env.ZEPTOMAIL_FROM ||
    process.env.ZEPTO_MAIL_FROM ||
    user ||
    'no-reply@wantuu.com';

  const missing = [
    !user ? 'ZEPTOMAIL_USER' : null,
    !pass ? 'ZEPTOMAIL_PASSWORD' : null,
    !from ? 'ZEPTOMAIL_FROM' : null,
  ].filter(Boolean);

  return {
    host,
    port,
    user,
    pass,
    from,
    secure:
      process.env.SMTP_SECURE !== undefined
        ? readBooleanEnv(process.env.SMTP_SECURE)
        : port === 465,
    requireTLS:
      process.env.SMTP_REQUIRE_TLS !== undefined
        ? readBooleanEnv(process.env.SMTP_REQUIRE_TLS)
        : port === 587,
    connectionTimeout: Number.parseInt(process.env.SMTP_CONNECTION_TIMEOUT || '10000', 10),
    greetingTimeout: Number.parseInt(process.env.SMTP_GREETING_TIMEOUT || '10000', 10),
    socketTimeout: Number.parseInt(process.env.SMTP_SOCKET_TIMEOUT || '15000', 10),
    missing,
  };
}

function getEmailProvider() {
  const smtpConfig = readSMTPConfig();
  if (smtpConfig.missing.length === 0) {
    return { provider: 'smtp', config: smtpConfig };
  }

  return {
    provider: null,
    config: {
      missing: smtpConfig.missing,
    },
  };
}

function encodeBase64Url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function buildEmailMessage({ from, to, subject, html, text }) {
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    html || text,
  ];

  return headers.join('\r\n');
}

async function getGmailAccessToken(config) {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: config.refreshToken,
    grant_type: 'refresh_token',
  });

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error_description || payload.error || `Token request failed (${response.status})`);
  }

  if (!payload.access_token) {
    throw new Error('No Gmail access token returned');
  }

  return payload.access_token;
}

async function sendViaGmailApi(email, otp, displayName = 'User') {
  const config = readGmailApiConfig();
  if (config.missing.length > 0) {
    return {
      success: false,
      error: `Missing Gmail API config: ${config.missing.join(', ')}`,
      code: 'GMAIL_API_NOT_CONFIGURED',
    };
  }

  try {
    const accessToken = await getGmailAccessToken(config);
    const message = buildEmailMessage({
      from: config.senderEmail,
      to: email,
      subject: 'Your Junto Verification Code',
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
            <div style="background-color: white; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 8px;">
              <h2 style="color: #333; margin-bottom: 20px;">Junto Verification Code</h2>
              <p style="color: #555; font-size: 14px; margin-bottom: 20px;">Hi ${displayName},</p>
              <p style="color: #555; font-size: 14px; margin-bottom: 30px;">Your verification code is:</p>
              <div style="background-color: #f0f0f0; padding: 15px; text-align: center; border-radius: 5px; margin-bottom: 20px;">
                <p style="font-size: 32px; font-weight: bold; letter-spacing: 2px; color: #333; margin: 0;">${otp}</p>
              </div>
              <p style="color: #777; font-size: 13px; margin-bottom: 10px;">This code will expire in 5 minutes.</p>
              <p style="color: #777; font-size: 13px; margin-bottom: 20px;">If you did not request this code, please ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="color: #999; font-size: 12px;">Junto - Social Companionship Platform</p>
            </div>
          </body>
        </html>
      `,
      text: `Your Junto verification code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nIf you did not request this code, please ignore this email.`,
    });

    const raw = encodeBase64Url(message);

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error?.message || payload.error || `Gmail API send failed (${response.status})`);
    }

    console.log(`✅ OTP email sent to ${email} via Gmail API:`, payload.id || 'no-message-id');
    return { success: true, messageId: payload.id || null, provider: 'gmail-api' };
  } catch (error) {
    console.error('❌ Error sending OTP email via Gmail API:', error.message);
    return {
      success: false,
      error: error.message,
      code: error.code || 'GMAIL_API_SEND_FAILED',
    };
  }
}

/**
 * Initialize email sender.
 */
export const initializeEmailTransporter = () => {
  if (transporter || emailProvider) return transporter || { provider: emailProvider };

  const smtpConfig = readSMTPConfig();
  if (smtpConfig.missing.length === 0) {
    transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      requireTLS: smtpConfig.requireTLS,
      connectionTimeout: smtpConfig.connectionTimeout,
      greetingTimeout: smtpConfig.greetingTimeout,
      socketTimeout: smtpConfig.socketTimeout,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass,
      },
    });

    emailProvider = 'smtp';
    console.log('✓ SMTP email sender initialized');
    console.log(`  Host: ${smtpConfig.host}:${smtpConfig.port} (${smtpConfig.secure ? 'secure' : 'tls'})`);
    console.log(`  Sender: ${smtpConfig.from}`);
    return transporter;
  }

  const missing = smtpConfig.missing;
  console.warn(
    `⚠️ Email is not configured. Missing: ${missing.join(', ')}. OTP requests will fail until ZeptoMail SMTP variables are set.`
  );
  return null;
};

/**
 * Generate 6-digit OTP code
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP via email through SMTP
 * FROM: verified ZeptoMail sender address
 * TO: user's email (Gmail, Yahoo, etc.)
 */
export const sendOTPEmail = async (email, otp, displayName = 'User') => {
  try {
    if (!transporter && !emailProvider) {
      const initialized = initializeEmailTransporter();
      if (!initialized) {
        return {
          success: false,
          error: 'Email not configured',
          code: 'EMAIL_NOT_CONFIGURED',
        };
      }
    }

    if (emailProvider === 'gmail-api') {
      return sendViaGmailApi(email, otp, displayName);
    }

    const config = readSMTPConfig();
    const mailOptions = {
      from: config.from,
      replyTo: config.from,
      to: email,
      subject: 'Your Junto Verification Code',
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
            <div style="background-color: white; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 8px;">
              <h2 style="color: #333; margin-bottom: 20px;">Junto Verification Code</h2>
              <p style="color: #555; font-size: 14px; margin-bottom: 20px;">Hi ${displayName},</p>
              <p style="color: #555; font-size: 14px; margin-bottom: 30px;">Your verification code is:</p>
              <div style="background-color: #f0f0f0; padding: 15px; text-align: center; border-radius: 5px; margin-bottom: 20px;">
                <p style="font-size: 32px; font-weight: bold; letter-spacing: 2px; color: #333; margin: 0;">${otp}</p>
              </div>
              <p style="color: #777; font-size: 13px; margin-bottom: 10px;">This code will expire in 5 minutes.</p>
              <p style="color: #777; font-size: 13px; margin-bottom: 20px;">If you did not request this code, please ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="color: #999; font-size: 12px;">Junto - Social Companionship Platform</p>
            </div>
          </body>
        </html>
      `,
      text: `Your Junto verification code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nIf you did not request this code, please ignore this email.`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${email}:`, info.messageId);
    return { success: true, messageId: info.messageId, provider: 'smtp' };
  } catch (error) {
    console.error('❌ Error sending OTP email:', error.message);
    return {
      success: false,
      error: error.message,
      code: error.code || 'OTP_EMAIL_FAILED',
    };
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
    if (!transporter && !emailProvider) {
      const initialized = initializeEmailTransporter();
      if (!initialized) {
        return { success: false, error: 'Email not configured' };
      }
    }

    await transporter.verify();
    transporterVerified = true;
    console.log('✅ Email connection verified');
    return { success: true, provider: 'smtp' };
  } catch (error) {
    transporterVerified = false;
    console.error('❌ Email connection failed:', error.message);
    return { success: false, error: error.message };
  }
};

export const getEmailTransportStatus = () => {
  try {
    const config = readSMTPConfig();
    const provider = config.missing.length === 0 ? 'smtp' : null;

    return {
      configured: provider !== null,
      provider,
      verified: transporterVerified,
      host: provider === 'smtp' ? config.host : '',
      port: provider === 'smtp' ? config.port : null,
      secure: provider === 'smtp' ? config.secure : false,
      sender: provider === 'smtp' ? config.from : '',
      missing: provider === 'smtp' ? config.missing : config.missing,
    };
  } catch (error) {
    return {
      configured: false,
      verified: false,
      error: error.message,
      missing: [
        'ZEPTOMAIL_HOST',
        'ZEPTOMAIL_PORT',
        'ZEPTOMAIL_USER',
        'ZEPTOMAIL_PASSWORD',
        'ZEPTOMAIL_FROM',
      ],
    };
  }
};
