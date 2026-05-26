import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  searchUsers,
  getUserById,
  getTravelModeUsers
} from '../controllers/users.js';

const router = express.Router();

router.get('/:userId', getUserById);
router.get('/:userId/profile', getUserProfile);
router.put('/:userId/profile', updateUserProfile);
router.get('/search', searchUsers);
router.get('/travel-mode/:city', getTravelModeUsers);

export default router;
