import express from 'express';
import { reportUser, blockUser, unblockUser, getBlockedUsers, isUserBlocked } from '../controllers/reports.js';

const router = express.Router();

// Reports
router.post('/report', reportUser);

// Blocking
router.post('/block', blockUser);
router.post('/unblock', unblockUser);
router.get('/:userId/blocked', getBlockedUsers);
router.get('/check-blocked', isUserBlocked);

export default router;
