import { query } from '../../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

// Generate a random 6-digit verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Calculate expiration time (15 minutes from now)
function getExpirationTime() {
  const now = new Date();
  return new Date(now.getTime() + 15 * 60 * 1000);
}

/**
 * Send verification code to email or phone
 * POST /api/verification/send
 * Body: { user_id, email?, phone_number?, verification_type }
 */
export async function sendVerificationCode(req, res) {
  try {
    const { user_id, email, phone_number, verification_type } = req.body;

    if (!user_id || !verification_type) {
      return res.status(400).json({ 
        error: 'user_id and verification_type are required' 
      });
    }

    if (verification_type === 'email' && !email) {
      return res.status(400).json({ 
        error: 'email is required for email verification' 
      });
    }

    if (verification_type === 'phone' && !phone_number) {
      return res.status(400).json({ 
        error: 'phone_number is required for phone verification' 
      });
    }

    // Check if user exists
    const userResult = await query('SELECT id FROM users WHERE id = $1', [user_id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const expiresAt = getExpirationTime();
    const verificationId = uuidv4();

    // Delete any previous unverified codes for this user and type
    await query(
      `DELETE FROM email_phone_verifications 
       WHERE user_id = $1 AND verification_type = $2 AND is_verified = false`,
      [user_id, verification_type]
    );

    // Insert new verification record
    await query(
      `INSERT INTO email_phone_verifications 
       (id, user_id, email, phone_number, verification_code, verification_type, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        verificationId,
        user_id,
        verification_type === 'email' ? email : null,
        verification_type === 'phone' ? phone_number : null,
        verificationCode,
        verification_type,
        expiresAt
      ]
    );

    // In production, send email or SMS here
    // For demo, just log the code
    console.log(`✉️ Verification Code for ${verification_type}: ${verificationCode}`);

    res.json({
      success: true,
      message: `Verification code sent to ${verification_type}`,
      verification_id: verificationId,
      // Note: In production, remove this from response
      code_for_testing: verificationCode,
      expires_in_seconds: 900
    });
  } catch (error) {
    console.error('Send verification code error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Verify the verification code
 * POST /api/verification/verify
 * Body: { user_id, verification_code, verification_type }
 */
export async function verifyCode(req, res) {
  try {
    const { user_id, verification_code, verification_type } = req.body;

    if (!user_id || !verification_code || !verification_type) {
      return res.status(400).json({ 
        error: 'user_id, verification_code, and verification_type are required' 
      });
    }

    // Find the verification record
    const verificationResult = await query(
      `SELECT * FROM email_phone_verifications 
       WHERE user_id = $1 AND verification_type = $2 AND is_verified = false
       ORDER BY created_at DESC LIMIT 1`,
      [user_id, verification_type]
    );

    if (verificationResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'No active verification request found' 
      });
    }

    const verification = verificationResult.rows[0];

    // Check if verification has expired
    if (new Date() > new Date(verification.expires_at)) {
      return res.status(400).json({ 
        error: 'Verification code has expired' 
      });
    }

    // Check if max attempts exceeded
    if (verification.attempts >= verification.max_attempts) {
      return res.status(400).json({ 
        error: 'Maximum verification attempts exceeded. Please request a new code.' 
      });
    }

    // Verify the code
    if (verification.verification_code !== verification_code) {
      // Increment attempts
      await query(
        `UPDATE email_phone_verifications 
         SET attempts = attempts + 1 
         WHERE id = $1`,
        [verification.id]
      );

      return res.status(400).json({ 
        error: 'Invalid verification code',
        attempts_remaining: verification.max_attempts - verification.attempts - 1
      });
    }

    // Mark as verified
    const now = new Date();
    await query(
      `UPDATE email_phone_verifications 
       SET is_verified = true, verified_at = $1 
       WHERE id = $2`,
      [now, verification.id]
    );

    // Update user's email or phone based on verification type
    if (verification_type === 'email' && verification.email) {
      await query(
        `UPDATE users SET email = $1, updated_at = $2 WHERE id = $3`,
        [verification.email, now, user_id]
      );
    } else if (verification_type === 'phone' && verification.phone_number) {
      await query(
        `UPDATE users SET phone_number = $1, updated_at = $2 WHERE id = $3`,
        [verification.phone_number, now, user_id]
      );
    }

    res.json({
      success: true,
      message: `${verification_type} verified successfully`,
      verified_at: now
    });
  } catch (error) {
    console.error('Verify code error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Resend verification code
 * POST /api/verification/resend
 * Body: { user_id, verification_type }
 */
export async function resendVerificationCode(req, res) {
  try {
    const { user_id, verification_type } = req.body;

    if (!user_id || !verification_type) {
      return res.status(400).json({ 
        error: 'user_id and verification_type are required' 
      });
    }

    // Find the last verification record
    const verificationResult = await query(
      `SELECT * FROM email_phone_verifications 
       WHERE user_id = $1 AND verification_type = $2 AND is_verified = false
       ORDER BY created_at DESC LIMIT 1`,
      [user_id, verification_type]
    );

    if (verificationResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'No verification request found. Please send a new code.' 
      });
    }

    const verification = verificationResult.rows[0];

    // Check if we can resend (not too soon)
    const lastSentTime = new Date(verification.created_at);
    const now = new Date();
    const secondsSinceLastSend = (now - lastSentTime) / 1000;

    if (secondsSinceLastSend < 30) {
      return res.status(400).json({ 
        error: 'Please wait before requesting a new code',
        wait_seconds: Math.ceil(30 - secondsSinceLastSend)
      });
    }

    // Generate new code
    const newCode = generateVerificationCode();
    const expiresAt = getExpirationTime();

    // Update verification record
    await query(
      `UPDATE email_phone_verifications 
       SET verification_code = $1, expires_at = $2, attempts = 0 
       WHERE id = $3`,
      [newCode, expiresAt, verification.id]
    );

    // In production, send email or SMS here
    console.log(`✉️ Resent Verification Code for ${verification_type}: ${newCode}`);

    res.json({
      success: true,
      message: `New verification code sent to ${verification_type}`,
      code_for_testing: newCode,
      expires_in_seconds: 900
    });
  } catch (error) {
    console.error('Resend verification code error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Check verification status
 * GET /api/verification/status/:user_id/:verification_type
 */
export async function checkVerificationStatus(req, res) {
  try {
    const { user_id, verification_type } = req.params;

    if (!user_id || !verification_type) {
      return res.status(400).json({ 
        error: 'user_id and verification_type are required' 
      });
    }

    // Find the latest verified record
    const verificationResult = await query(
      `SELECT is_verified, verified_at FROM email_phone_verifications 
       WHERE user_id = $1 AND verification_type = $2 AND is_verified = true
       ORDER BY verified_at DESC LIMIT 1`,
      [user_id, verification_type]
    );

    const isVerified = verificationResult.rows.length > 0;
    const verifiedAt = isVerified ? verificationResult.rows[0].verified_at : null;

    res.json({
      success: true,
      is_verified: isVerified,
      verification_type: verification_type,
      verified_at: verifiedAt
    });
  } catch (error) {
    console.error('Check verification status error:', error);
    res.status(500).json({ error: error.message });
  }
}
