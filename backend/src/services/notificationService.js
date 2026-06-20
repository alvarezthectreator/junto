import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/connection.js';
import { queuePushNotification } from './notificationDeliveryScheduler.js';

function shouldQueuePushDelivery() {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

export async function createNotification({
  userId,
  notificationType = 'system',
  title,
  body = null,
  relatedUserId = null,
  relatedEventId = null,
  isRead = false,
  url = '/notifications',
  payload = null,
}) {
  if (!userId) {
    throw new Error('userId is required to create a notification');
  }

  if (!title) {
    throw new Error('title is required to create a notification');
  }

  const notificationId = uuidv4();
  const createdAt = new Date().toISOString();

  await query(
    `INSERT INTO notifications (
      id, user_id, notification_type, related_user_id, related_event_id,
      title, body, is_read, read_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      notificationId,
      userId,
      notificationType,
      relatedUserId,
      relatedEventId,
      title,
      body,
      isRead ? 1 : 0,
      isRead ? createdAt : null,
      createdAt,
    ]
  );

  if (!isRead && shouldQueuePushDelivery()) {
    const pushPayload = payload || {
      notificationId,
      title,
      body,
      url,
      notificationType,
      relatedUserId,
      relatedEventId,
    };

    queuePushNotification({
      userId,
      notificationId,
      title,
      body,
      url,
      notificationType,
      payload: pushPayload,
    }).catch((error) => {
      console.error('Error queueing push notification:', error);
    });
  }

  return notificationId;
}
