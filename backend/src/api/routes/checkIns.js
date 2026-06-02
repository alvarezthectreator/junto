import express from 'express';
import {
  checkIntoEvent,
  getUserCheckIns,
  getEventCheckIns,
  hasCheckedIn,
} from '../controllers/checkIns.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// POST /check-ins - Create a new check-in
router.post('/', authenticateToken, checkIntoEvent);

// GET /check-ins/user/:userId - Get user's check-in history
router.get('/user/:userId', getUserCheckIns);

// GET /check-ins/event/:eventId - Get event's check-ins
router.get('/event/:eventId', getEventCheckIns);

// GET /check-ins/event/:eventId/user/:userId - Check if user has checked in
router.get('/event/:eventId/user/:userId', hasCheckedIn);

export default router;
