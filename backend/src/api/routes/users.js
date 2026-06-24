import express from 'express';
import {
  listUsers,
  applyCancellationPenalty,
  getUserProfile,
  updateUserProfile,
  searchUsers,
  getUserById,
  getTravelModeUsers,
  getReferralInfo,
  exportUserData,
  deleteAccount,
  updateUserAdminStatus,
} from '../controllers/users.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = express.Router();

router.get('/', requireAdmin, listUsers);
router.post('/cancellation-penalty', authenticateToken, applyCancellationPenalty);
router.get('/:userId/export', exportUserData);
router.get('/:userId/referral', getReferralInfo);
router.delete('/:userId', deleteAccount);
router.patch('/:userId/admin-status', requireAdmin, updateUserAdminStatus);
router.put('/:userId/profile', updateUserProfile);
router.get('/search', searchUsers);
router.get('/travel-mode/:city', getTravelModeUsers);
router.get('/:userId/profile', getUserProfile);
router.get('/:userId', getUserById);

export default router;
