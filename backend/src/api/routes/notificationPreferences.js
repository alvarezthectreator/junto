/**
 * Notification Preferences Routes
 */

import express from 'express';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  resetNotificationPreferences,
} from '../controllers/notificationPreferences.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/notification-preferences/:userId
 * Get notification preferences for a user
 */
router.get('/:userId', (req, res) => {
  getNotificationPreferences(req, res, global.db);
});

/**
 * PUT /api/notification-preferences/:userId
 * Update notification preferences for a user
 */
router.put('/:userId', authenticateToken, (req, res) => {
  updateNotificationPreferences(req, res, global.db);
});

/**
 * POST /api/notification-preferences/:userId/reset
 * Reset notification preferences to defaults
 */
router.post('/:userId/reset', authenticateToken, (req, res) => {
  resetNotificationPreferences(req, res, global.db);
});

export default router;
