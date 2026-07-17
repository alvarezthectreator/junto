import express from 'express';
import {
  login,
  signup,
  verifySession,
  changePassword,
  getUserSessions,
  revokeUserSession,
  revokeOtherSessions,
  generateRecoveryCodes,
  recoverAccount,
  resetPassword,
  getSecurityActivity,
} from '../controllers/auth.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Login with username/password
router.post('/login', login);

// Signup with username/password
router.post('/signup', signup);

// Verify session
router.get('/verify', authenticateToken, verifySession);

// Security and account recovery
router.post('/:userId/change-password', authenticateToken, changePassword);
router.get('/:userId/sessions', authenticateToken, getUserSessions);
router.delete('/:userId/sessions/:sessionId', authenticateToken, revokeUserSession);
router.post('/:userId/sessions/revoke-others', authenticateToken, revokeOtherSessions);
router.post('/recovery-codes', authenticateToken, generateRecoveryCodes);
router.get('/:userId/activity', authenticateToken, getSecurityActivity);
router.post('/recover', recoverAccount);
router.post('/reset-password', resetPassword);

export default router;
