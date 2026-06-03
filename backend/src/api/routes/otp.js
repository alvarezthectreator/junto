/**
 * OTP Authentication Routes
 * Email-based OTP login endpoints
 */

import express from 'express';
import {
  requestOTP,
  verifyOTPCode,
  getOTPExpiryInfo,
  resendOTP,
  testEmail,
} from '../controllers/otp.js';

const router = express.Router();

/**
 * POST /api/auth/request-otp
 * Request OTP code to be sent to email
 * Body: { email: string }
 */
router.post('/request-otp', (req, res) => {
  requestOTP(req, res);
});

/**
 * POST /api/auth/verify-otp
 * Verify OTP code and get JWT token
 * Body: { email: string, code: string }
 */
router.post('/verify-otp', (req, res) => {
  verifyOTPCode(req, res);
});

/**
 * GET /api/auth/otp/expiry
 * Get OTP expiry information for countdown timer
 * Query: ?email=user@example.com
 */
router.get('/otp/expiry', (req, res) => {
  getOTPExpiryInfo(req, res);
});

/**
 * POST /api/auth/otp/resend
 * Resend OTP code to email
 * Body: { email: string }
 */
router.post('/otp/resend', (req, res) => {
  resendOTP(req, res);
});

/**
 * POST /api/auth/test-email
 * Test email connection (admin only)
 */
router.post('/test-email', (req, res) => {
  testEmail(req, res);
});

export default router;
