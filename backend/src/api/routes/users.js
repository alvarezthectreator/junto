import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  searchUsers,
  getUserById,
  getTravelModeUsers
} from '../controllers/users.js';

const router = express.Router();

// Place specific routes BEFORE dynamic :userId routes
router.get('/search', searchUsers);
router.get('/travel-mode/:city', getTravelModeUsers);
router.get('/:userId/profile', getUserProfile);
router.put('/:userId/profile', updateUserProfile);
router.get('/:userId', getUserById);

export default router;
