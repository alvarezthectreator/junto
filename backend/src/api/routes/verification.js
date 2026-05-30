import express from 'express';
import {
  sendVerificationCode,
  verifyCode,
  resendVerificationCode,
  checkVerificationStatus
} from '../controllers/verification.js';

const router = express.Router();

// Send verification code to email or phone
router.post('/send', sendVerificationCode);

// Verify the verification code
router.post('/verify', verifyCode);

// Resend verification code
router.post('/resend', resendVerificationCode);

// Check verification status
router.get('/status/:user_id/:verification_type', checkVerificationStatus);

export default router;
