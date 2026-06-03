/**
 * Follow-up Routes
 * Endpoints for managing event follow-ups and attendee engagement
 */

import express from 'express';
import {
  getEventFollowups,
  respondToFollowup,
  getHostFollowupAnalytics,
  getUserFollowups,
  resendFollowup,
} from '../controllers/followup.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/followups/event/:eventId
 * Get follow-up status for all attendees of an event (host only)
 */
router.get('/event/:eventId', authenticateToken, (req, res) => {
  getEventFollowups(req, res);
});

/**
 * POST /api/followups/event/:eventId/user/:userId/respond
 * Mark a user as having responded to a follow-up
 */
router.post('/event/:eventId/user/:userId/respond', authenticateToken, (req, res) => {
  respondToFollowup(req, res);
});

/**
 * GET /api/followups/host/:hostId/analytics
 * Get follow-up engagement analytics for a host
 */
router.get('/host/:hostId/analytics', authenticateToken, (req, res) => {
  getHostFollowupAnalytics(req, res);
});

/**
 * GET /api/followups/user/:userId
 * Get follow-ups this user has received (as an attendee)
 */
router.get('/user/:userId', authenticateToken, (req, res) => {
  getUserFollowups(req, res);
});

/**
 * POST /api/followups/:eventId/resend
 * Manually resend follow-up to specific users (host only)
 */
router.post('/:eventId/resend', authenticateToken, (req, res) => {
  resendFollowup(req, res);
});

export default router;
