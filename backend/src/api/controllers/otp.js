/**
 * OTP API Controller
 * Handles OTP authentication endpoints
 */

import {
  generateOTP,
  sendOTPEmail,
  storeOTP,
  verifyOTP,
  incrementOTPAttempts,
  getOTPExpiry,
  initializeEmailTransporter,
  testEmailConnection,
} from '../services/otpService.js';
import { generateToken } from '../middleware/auth.js';

// Rate limiting in-memory store (use Redis in production)
const requestLimits = new Map();
const verifyLimits = new Map();

const MAX_OTP_REQUESTS_PER_HOUR = 5;
const MAX_OTP_VERIFICATION_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

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

    // Send email
    const emailResult = await sendOTPEmail(normalizedEmail);
    if (!emailResult.success) {
      console.error('Email send failed:', emailResult.error);
      return res.status(500).json({
        error: 'Failed to send OTP email. Please check the email address and try again.',
      });
    }

    // Store OTP in database
    try {
      const storeResult = await storeOTP(req.db, normalizedEmail, otp);

      // Track request for rate limiting
      recentRequests.push(now);
      requestLimits.set(normalizedEmail, recentRequests);

      res.json({
        success: true,
        message: 'OTP sent to your email',
        email: normalizedEmail,
        expiresIn: 300, // 5 minutes in seconds
        messageId: emailResult.messageId,
      });
    } catch (dbError) {
      console.error('Database error storing OTP:', dbError);
      return res.status(500).json({ error: 'Failed to store OTP. Please try again.' });
    }
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
    const verifyResult = await verifyOTP(req.db, normalizedEmail, code);

    if (!verifyResult.valid) {
      // Increment failed attempts
      try {
        await incrementOTPAttempts(req.db, normalizedEmail);
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

    req.db.get(userCheckSql, [normalizedEmail], (err, user) => {
      if (err) {
        console.error('Error checking user:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        // Create new user from OTP verification
        const { v4: uuidv4 } = require('uuid');
        const userId = uuidv4();
        const profileId = uuidv4();
        const now = new Date().toISOString();

        const createUserSql = `
          INSERT INTO users (
            id, email, phone_number, display_name, 
            username, profile_id, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        // Extract display name from email if possible
        const displayName = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ');

        req.db.run(
          createUserSql,
          [userId, normalizedEmail, null, displayName, null, profileId, now],
          (err) => {
            if (err) {
              console.error('Error creating user:', err);
              return res.status(500).json({ error: 'Failed to create user account' });
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
              message: 'OTP verified. Welcome to Junto!',
              token,
              user: {
                id: userId,
                email: normalizedEmail,
                display_name: displayName,
                profile_id: profileId,
              },
              isNewUser: true,
            });
          }
        );
      } else {
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
          user: {
            id: user.id,
            email: user.email,
            display_name: user.display_name,
            profile_id: user.profile_id,
          },
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

    const expiryInfo = await getOTPExpiry(req.db, normalizedEmail);

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

    // Send email
    const emailResult = await sendOTPEmail(normalizedEmail);
    if (!emailResult.success) {
      return res.status(500).json({
        error: 'Failed to send OTP email',
      });
    }

    // Store OTP in database
    try {
      await storeOTP(req.db, normalizedEmail, otp);

      res.json({
        success: true,
        message: 'OTP resent to your email',
        email: normalizedEmail,
        expiresIn: 300,
      });
    } catch (dbError) {
      console.error('Database error storing OTP:', dbError);
      return res.status(500).json({ error: 'Failed to store OTP' });
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
