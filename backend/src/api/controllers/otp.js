/**
 * OTP API Controller
 * Handles OTP authentication endpoints
 */

import crypto from 'crypto';
import {
  generateOTP,
  sendOTPEmail,
  storeOTP,
  storeOTPInMemory,
  verifyOTP,
  incrementOTPAttempts,
  getOTPExpiry,
  initializeEmailTransporter,
  getEmailTransportStatus,
  testEmailConnection,
} from '../../services/otpService.js';
import db from '../../db/connection.js';
import { generateToken } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

// Rate limiting in-memory store (use Redis in production)
const requestLimits = new Map();
const verifyLimits = new Map();

const MAX_OTP_REQUESTS_PER_HOUR = 5;
const MAX_OTP_VERIFICATION_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

function getDatabase(req) {
  return req.db || db;
}

function getDisplayNameFromEmail(email) {
  const base = email.split('@')[0] || 'User';
  const cleaned = base.replace(/[^a-zA-Z0-9]+/g, ' ').trim();
  return cleaned || 'User';
}

function buildOtpErrorResponse(emailResult) {
  const status = getEmailTransportStatus();

  if (!status.configured) {
    return {
      status: 503,
      body: {
        error: 'Email delivery is not configured on the server. Set the ZEPTOMAIL_* API variables.',
        details: emailResult?.error || status.error || 'Missing email configuration',
      },
    };
  }

  return {
    status: 502,
    body: {
      error: 'Failed to send OTP email through the configured ZeptoMail API.',
      details: emailResult?.error || 'ZeptoMail API send failure',
    },
  };
}

function normalizeProfilePhotos(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).map(String);
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean).map(String);
      }
    } catch {
      return value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function buildOtpUserPayload(userRow) {
  const profilePhotos = normalizeProfilePhotos(userRow.profile_photos);
  const avatarImage = userRow.avatar_image || profilePhotos[0] || null;

  return {
    id: userRow.id,
    email: userRow.email,
    display_name: userRow.display_name,
    profile_id: userRow.profile_id,
    avatar_image: avatarImage,
    avatar_url: avatarImage,
    profile_photos: profilePhotos,
  };
}

/**
 * POST /api/auth/request-otp
 * Request an OTP code to be sent to email
 */
export const requestOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Rate limiting: max 5 requests per hour
    const now = Date.now();
    if (!requestLimits.has(normalizedEmail)) {
      requestLimits.set(normalizedEmail, []);
    }

    const emailRequests = requestLimits.get(normalizedEmail);
    const recentRequests = emailRequests.filter((ts) => now - ts < RATE_LIMIT_WINDOW);

    if (recentRequests.length >= MAX_OTP_REQUESTS_PER_HOUR) {
      return res.status(429).json({
        error: 'Too many requests. Please try again in an hour.',
        retryAfter: Math.ceil((recentRequests[0] + RATE_LIMIT_WINDOW - now) / 1000),
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const displayName = getDisplayNameFromEmail(normalizedEmail);

    // Store OTP in database first so expiry endpoints and retries can find it
    const database = getDatabase(req);
    try {
      await storeOTP(database, normalizedEmail, otp);

      // Track request for rate limiting
      recentRequests.push(now);
      requestLimits.set(normalizedEmail, recentRequests);

      console.log(`✓ OTP stored for ${normalizedEmail} (before send)`);
    } catch (dbError) {
      console.error('❌ Database error storing OTP:', dbError.message);
      console.warn('Attempting memory fallback for:', normalizedEmail);

      // Fallback to in-memory storage if database fails
      try {
        storeOTPInMemory(normalizedEmail, otp);

        recentRequests.push(now);
        requestLimits.set(normalizedEmail, recentRequests);

        console.log(`✓ OTP stored in memory for ${normalizedEmail}`);
      } catch (fallbackError) {
        console.error('❌ Both database and memory storage failed:', fallbackError);
        return res.status(500).json({
          error: 'Failed to store OTP. Please try again in a moment.',
          retryAfter: 5,
        });
      }
    }

    // Now attempt to send email
    const emailResult = await sendOTPEmail(normalizedEmail, otp, displayName);
    if (!emailResult.success) {
      console.error('Email send failed:', emailResult.error);
      const { status, body } = buildOtpErrorResponse(emailResult);
      // OTP remains stored — frontend can still show expiry info, but user won't receive email
      return res.status(status).json(body);
    }

    console.log(`✅ OTP email sent to ${normalizedEmail}`);
    res.json({
      success: true,
      message: 'OTP sent to your email',
      email: normalizedEmail,
      expiresIn: 300, // 5 minutes in seconds
      messageId: emailResult.messageId,
    });
  } catch (error) {
    console.error('Error in requestOTP:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * POST /api/auth/verify-otp
 * Verify OTP code and return JWT token
 */
export const verifyOTPCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    // Validation
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and OTP code are required' });
    }

    if (code.length !== 6 || isNaN(code)) {
      return res.status(400).json({ error: 'Invalid OTP format. Must be 6 digits.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Rate limiting: max 3 verification attempts per OTP
    const now = Date.now();
    if (!verifyLimits.has(normalizedEmail)) {
      verifyLimits.set(normalizedEmail, []);
    }

    const attempts = verifyLimits.get(normalizedEmail);
    const recentAttempts = attempts.filter((ts) => now - ts < RATE_LIMIT_WINDOW);

    if (recentAttempts.length >= MAX_OTP_VERIFICATION_ATTEMPTS) {
      return res.status(429).json({
        error: 'Too many verification attempts. Request a new OTP.',
      });
    }

    // Verify OTP
    const database = getDatabase(req);
    const verifyResult = await verifyOTP(database, normalizedEmail, code);

    if (!verifyResult.valid) {
        // Increment failed attempts
        try {
        await incrementOTPAttempts(database, normalizedEmail);
        } catch (err) {
          console.error('Error incrementing attempts:', err);
        }

      // Track attempt for rate limiting
      recentAttempts.push(now);
      verifyLimits.set(normalizedEmail, recentAttempts);

      return res.status(401).json({
        error: verifyResult.reason,
        attemptsRemaining: Math.max(0, MAX_OTP_VERIFICATION_ATTEMPTS - recentAttempts.length),
      });
    }

    // OTP verified! Now check if user exists, create if needed
    const userCheckSql = 'SELECT * FROM users WHERE email = ?';

    database.get(userCheckSql, [normalizedEmail], (err, user) => {
      if (err) {
        console.error('Error checking user:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        // Create new user from OTP verification
        const userId = uuidv4();
        const profileId = uuidv4();
        const now = new Date().toISOString();

        // Extract display name and username from email
        const emailBase = normalizedEmail.split('@')[0];
        const displayName = emailBase.replace(/[^a-zA-Z0-9]/g, ' ').trim();
        const username = `user_${emailBase}_${uuidv4().slice(0, 8)}`.toLowerCase();
        
        // For OTP-only accounts, create a random password hash as placeholder
        // Since they logged in via OTP, they don't need to set a password
        const randomPassword = crypto.randomBytes(32).toString('hex');
        const passwordHash = randomPassword; // In production, should hash this

        const createUserSql = `
          INSERT INTO users (
            id, email, email_verified, phone_verified, verification_status,
            phone_number, display_name, username, password_hash, profile_id, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        database.run(
          createUserSql,
          [
            userId,
            normalizedEmail,
            true,
            false,
            'verified',
            null,
            displayName,
            username,
            passwordHash,
            profileId,
            now,
            now,
          ],
          (err) => {
            if (err) {
              console.error('❌ Error creating OTP user:', err.message);
              console.error('   User ID:', userId);
              console.error('   Email:', normalizedEmail);
              console.error('   Username:', username);
              return res.status(500).json({ error: 'Failed to create user account' });
            }
            
            console.log(`✅ New OTP user created: ${normalizedEmail} (${username})`);

            // Create initial user_profiles row to satisfy foreign key constraints
            const insertProfileSql = `INSERT INTO user_profiles (id, user_id, last_active, created_at, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`;
            database.run(insertProfileSql, [profileId, userId], (profileErr) => {
              if (profileErr) {
                console.error('⚠️ Failed to create user_profiles row for new user:', profileErr.message);
                // Not fatal - continue, but log for debugging
              } else {
                console.log('✓ user_profiles row created for user:', userId);
              }

              // Generate token for new user
              const token = generateToken({
                id: userId,
                email: normalizedEmail,
                profile_id: profileId,
              });

              // Clear rate limits on successful verification
              verifyLimits.delete(normalizedEmail);
              requestLimits.delete(normalizedEmail);

              res.json({
                success: true,
                message: 'OTP verified. Welcome to Wantuu!',
                token,
                user: {
                  id: userId,
                  email: normalizedEmail,
                  display_name: displayName,
                  profile_id: profileId,
                  avatar_image: null,
                  profile_photos: [],
                },
                isNewUser: true,
              });
            });
          }
        );
      } else {
        // Mark the existing user email as verified if this OTP matched
        database.run(
          `UPDATE users
           SET email_verified = 1,
               verification_status = 'verified',
               updated_at = ?
           WHERE id = ?`,
          [new Date().toISOString(), user.id],
          (updateErr) => {
            if (updateErr) {
              console.error('⚠️ Failed to update email verification flags for user:', updateErr.message);
            }
          }
        );

        // User exists - generate token
        const token = generateToken({
          id: user.id,
          email: user.email,
          profile_id: user.profile_id,
        });

        // Clear rate limits on successful verification
        verifyLimits.delete(normalizedEmail);
        requestLimits.delete(normalizedEmail);

        res.json({
          success: true,
          message: 'OTP verified. Login successful!',
          token,
          user: buildOtpUserPayload(user),
          isNewUser: false,
        });
      }
    });
  } catch (error) {
    console.error('Error in verifyOTPCode:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET /api/auth/otp/expiry
 * Get OTP expiry information (for frontend countdown)
 */
export const getOTPExpiryInfo = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const database = getDatabase(req);
    const expiryInfo = await getOTPExpiry(database, normalizedEmail);

    if (!expiryInfo) {
      return res.status(404).json({ error: 'No OTP found for this email' });
    }

    res.json({
      email: normalizedEmail,
      ...expiryInfo,
    });
  } catch (error) {
    console.error('Error in getOTPExpiryInfo:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * POST /api/auth/otp/resend
 * Resend OTP to email
 */
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Generate new OTP
    const otp = generateOTP();
    const displayName = getDisplayNameFromEmail(normalizedEmail);

    // Send email
    const emailResult = await sendOTPEmail(normalizedEmail, otp, displayName);
    if (!emailResult.success) {
      const { status, body } = buildOtpErrorResponse(emailResult);
      return res.status(status).json(body);
    }

    // Store OTP in database
    try {
      const database = getDatabase(req);
      await storeOTP(database, normalizedEmail, otp);

      res.json({
        success: true,
        message: 'OTP resent to your email',
        email: normalizedEmail,
        expiresIn: 300,
      });
    } catch (dbError) {
      console.error('❌ Database error during OTP resend:', dbError.message);
      
      // Fallback to in-memory storage
      try {
        storeOTPInMemory(normalizedEmail, otp);

        return res.json({
          success: true,
          message: 'OTP resent to your email',
          email: normalizedEmail,
          expiresIn: 300,
          _debug: 'OTP stored in memory fallback mode',
        });
      } catch (fallbackError) {
        console.error('❌ Both database and memory storage failed during resend:', fallbackError);
        return res.status(500).json({
          error: 'Failed to resend OTP. Please try again.',
        });
      }
    }
  } catch (error) {
    console.error('Error in resendOTP:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * POST /api/auth/test-email
 * Test email connection (admin only)
 */
export const testEmail = async (req, res) => {
  try {
    const result = await testEmailConnection();

    if (result.success) {
      res.json({
        success: true,
        message: 'Email connection verified',
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error in testEmail:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
