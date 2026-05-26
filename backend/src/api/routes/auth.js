import express from 'express';
import { dummyLogin, verifySession } from '../controllers/auth.js';

const router = express.Router();

// Dummy login (no real auth yet)
router.post('/login', dummyLogin);

// Verify session
router.get('/verify', verifySession);

export default router;
