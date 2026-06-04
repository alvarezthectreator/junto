import express from 'express';
import { login, signup, verifySession } from '../controllers/auth.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Login with username/password
router.post('/login', login);

// Signup with username/password
router.post('/signup', signup);

// Verify session
router.get('/verify', authenticateToken, verifySession);

export default router;
