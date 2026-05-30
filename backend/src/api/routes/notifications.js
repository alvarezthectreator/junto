import express from 'express';
import {
  getNotifications,
  markAsRead,
  deleteNotification,
  subscribeToPush,
  unsubscribeFromPush,
  getPushSubscriptions
} from '../controllers/notifications.js';

const router = express.Router();

router.get('/:userId', getNotifications);
router.put('/:notificationId/read', markAsRead);
router.delete('/:notificationId', deleteNotification);

// Push Notifications
router.post('/push/subscribe', subscribeToPush);
router.post('/push/unsubscribe', unsubscribeFromPush);
router.get('/push/:user_id/subscriptions', getPushSubscriptions);

export default router;
