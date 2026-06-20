import express from 'express';
import {
  applyCancellationPenalty,
  getUserProfile,
  updateUserProfile,
  searchUsers,
  getUserById,
  getTravelModeUsers,
  getReferralInfo,
  exportUserData,
  deleteAccount,
} from '../controllers/users.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/cancellation-penalty', authenticateToken, applyCancellationPenalty);
router.get('/:userId/export', exportUserData);
router.get('/:userId/referral', getReferralInfo);
router.delete('/:userId', deleteAccount);
router.put('/:userId/profile', updateUserProfile);
router.get('/search', searchUsers);
router.get('/travel-mode/:city', getTravelModeUsers);
router.get('/:userId/profile', getUserProfile);
router.get('/:userId', getUserById);

export default router;
