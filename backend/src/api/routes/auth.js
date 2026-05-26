import express from 'express';
import { signup, login, dummyLogin, verifySession } from '../controllers/auth.js';

const router = express.Router();

// Signup endpoint
router.post('/signup', signup);

// Login endpoint (username/password)
router.post('/login', login);

// Verify session
router.get('/verify', verifySession);

export default router;
