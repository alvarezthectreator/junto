import express from 'express';
import {
  getNotifications,
  markAsRead,
  deleteNotification
} from '../controllers/notifications.js';

const router = express.Router();

router.get('/:userId', getNotifications);
router.put('/:notificationId/read', markAsRead);
router.delete('/:notificationId', deleteNotification);

export default router;
