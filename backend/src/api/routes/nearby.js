import express from 'express';
import {
  getNearbyUsers,
  swipeUser,
  getMatches,
  getSwipeHistory
} from '../controllers/nearby.js';

const router = express.Router();

router.get('/:userId', getNearbyUsers);
router.post('/swipe', swipeUser);
router.get('/:userId/matches', getMatches);
router.get('/:userId/history', getSwipeHistory);

export default router;
