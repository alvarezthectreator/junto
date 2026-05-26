import express from 'express';
import { login, signup, verifySession } from '../controllers/auth.js';

const router = express.Router();

// Login with username/password
router.post('/login', login);

// Signup with username/password
router.post('/signup', signup);

// Verify session
router.get('/verify', verifySession);

export default router;
