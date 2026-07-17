/**
 * OTP Service
 * Handles OTP generation, storage, and email delivery.
 */

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

function readZeptoMailConfig() {
  const host = process.env.ZEPTOMAIL_HOST || 'api.zeptomail.com';
  const sendMailToken =
    process.env.ZEPTOMAIL_SEND_MAIL_TOKEN ||
    process.env.ZEPTOMAIL_PASSWORD ||
    '';
  const fromAddress = process.env.ZEPTOMAIL_FROM || '';
  const fromName = process.env.ZEPTOMAIL_FROM_NAME || 'Junto';

  const missing = [
    !isNonEmpty(sendMailToken) ? 'ZEPTOMAIL_SEND_MAIL_TOKEN' : null,
    !isNonEmpty(fromAddress) ? 'ZEPTOMAIL_FROM' : null,
  ].filter(Boolean);

  return {
    host,
    sendMailToken,
    fromAddress,
    fromName,
    missing,
  };
}

function buildOtpEmailBody(otp, displayName) {
  return {
    htmlbody: `
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
  };
}

function extractZeptoMailError(payload, responseStatus) {
  const details = payload?.error?.details;
  if (Array.isArray(details) && details.length > 0) {
    const detailMessage = details
      .map((item) => item?.message)
      .filter(Boolean)
      .join(', ');
    if (detailMessage) {
      return detailMessage;
    }
  }

  return (
    payload?.error?.message ||
    payload?.error?.details?.message ||
    payload?.message ||
    payload?.error ||
    `ZeptoMail API send failed (${responseStatus})`
  );
}

/**
 * Initialize email sender.
 */
export const initializeEmailTransporter = () => {
  if (transporter || emailProvider) return transporter || { provider: emailProvider };

  const zeptoConfig = readZeptoMailConfig();
  if (zeptoConfig.missing.length === 0) {
    transporter = { provider: 'zeptomail-api', config: zeptoConfig };
    emailProvider = 'zeptomail-api';
    console.log('✓ ZeptoMail API sender initialized');
    console.log(`  Host: ${zeptoConfig.host}`);
    console.log(`  Sender: ${zeptoConfig.fromAddress}`);
    return transporter;
  }

  const missing = zeptoConfig.missing;
  console.warn(
    `⚠️ Email is not configured. Missing: ${missing.join(', ')}. OTP requests will fail until ZeptoMail API variables are set.`
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
 * Send OTP via ZeptoMail REST API.
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

    const config = transporter?.config || readZeptoMailConfig();
    if (config.missing.length > 0) {
      return {
        success: false,
        error: `Missing ZeptoMail API config: ${config.missing.join(', ')}`,
        code: 'ZEPTOMAIL_API_NOT_CONFIGURED',
      };
    }

    const payload = {
      from: {
        address: config.fromAddress,
        name: config.fromName,
      },
      to: [
        {
          email_address: {
            address: email,
            name: displayName,
          },
        },
      ],
      subject: 'Your Junto Verification Code',
      ...buildOtpEmailBody(otp, displayName),
      track_clicks: false,
      track_opens: false,
      client_reference: `otp-${Date.now()}`,
    };

    const response = await fetch(`https://${config.host}/v1.1/email`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Zoho-enczapikey ${config.sendMailToken}`,
      },
      body: JSON.stringify(payload),
    });

    const responsePayload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(extractZeptoMailError(responsePayload, response.status));
    }

    const messageId =
      responsePayload?.request_id ||
      responsePayload?.data?.[0]?.request_id ||
      responsePayload?.data?.request_id ||
      null;

    console.log(`✅ OTP email sent to ${email} via ZeptoMail API:`, messageId || 'no-request-id');
    return { success: true, messageId, provider: 'zeptomail-api' };
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

    const zeptoConfig = transporter?.config || readZeptoMailConfig();
    if (zeptoConfig.missing.length > 0) {
      return { success: false, error: `Missing ZeptoMail API config: ${zeptoConfig.missing.join(', ')}` };
    }

    transporterVerified = true;
    console.log('✅ ZeptoMail API configuration verified');
    return { success: true, provider: 'zeptomail-api' };
  } catch (error) {
    transporterVerified = false;
    console.error('❌ Email connection failed:', error.message);
    return { success: false, error: error.message };
  }
};

export const getEmailTransportStatus = () => {
  try {
    const zeptoConfig = readZeptoMailConfig();
    const provider = zeptoConfig.missing.length === 0 ? 'zeptomail-api' : null;

    return {
      configured: provider !== null,
      provider,
      verified: transporterVerified,
      host: provider === 'zeptomail-api' ? zeptoConfig.host : '',
      sender: provider === 'zeptomail-api' ? zeptoConfig.fromAddress : '',
      missing: zeptoConfig.missing,
    };
  } catch (error) {
    return {
      configured: false,
      verified: false,
      error: error.message,
      missing: [
        'ZEPTOMAIL_HOST',
        'ZEPTOMAIL_SEND_MAIL_TOKEN',
        'ZEPTOMAIL_FROM',
      ],
    };
  }
};
