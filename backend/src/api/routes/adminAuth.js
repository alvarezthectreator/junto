import express from 'express';
import { loginAdmin, verifyAdmin } from '../controllers/adminAuth.js';
import { authenticateAdminToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', loginAdmin);
router.get('/verify', authenticateAdminToken, verifyAdmin);

export default router;
