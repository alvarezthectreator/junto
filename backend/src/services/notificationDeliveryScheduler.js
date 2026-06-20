import cron from 'node-cron';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/connection.js';
import { shouldDeliverPush } from './notificationFilteringService.js';

let schedulerInstance = null;

function base64UrlEncode(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function createVapidJwt(audience) {
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@junto.app';
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const publicKey = process.env.VAPID_PUBLIC_KEY;

  if (!privateKey || !publicKey) {
    return null;
  }

  const header = { alg: 'ES256', typ: 'JWT' };
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: subject,
  };

  const data = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}`;
  const signature = crypto.sign('sha256', Buffer.from(data), {
    key: privateKey,
    dsaEncoding: 'ieee-p1363',
  });

  return `${data}.${base64UrlEncode(signature)}`;
}

async function sendBrowserPush(subscriptionData, payload) {
  const endpoint = subscriptionData?.endpoint;
  if (!endpoint) {
    return { success: false, status: 'missing_endpoint' };
  }

  const vapidJwt = createVapidJwt(new URL(endpoint).origin);
  if (!vapidJwt) {
    return { success: false, status: 'missing_vapid_config' };
  }

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `vapid t=${vapidJwt}, k=${publicKey}`,
      TTL: '60',
      Urgency: 'normal',
      Topic: payload?.title ? base64UrlEncode(payload.title).slice(0, 32) : 'junto',
    },
  });

  if (response.ok || response.status === 201 || response.status === 202) {
    return { success: true, status: response.status };
  }

  return { success: false, status: response.status, error: await response.text().catch(() => '') };
}

export async function queuePushNotification({
  userId,
  notificationId,
  title,
  body,
  url,
  notificationType,
  payload,
}) {
  const id = uuidv4();
  await query(
    `INSERT INTO notification_delivery_queue (
      id, user_id, notification_id, title, body, url, notification_type, payload, status, attempts, max_attempts, next_attempt_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, 5, datetime('now'), datetime('now'), datetime('now'))`,
    [
      id,
      userId,
      notificationId || null,
      title,
      body || null,
      url || '/notifications',
      notificationType || 'system',
      payload ? JSON.stringify(payload) : null,
    ]
  );

  return id;
}

async function processQueueItem(row) {
  const prefsEnabled = await shouldDeliverPush(query, row.user_id).catch(() => true);
  if (!prefsEnabled) {
    await query(
      `UPDATE notification_delivery_queue
       SET status = 'sent', sent_at = datetime('now'), updated_at = datetime('now')
       WHERE id = ?`,
      [row.id]
    );
    return;
  }

  const subscriptionsResult = await query(
    `SELECT id, subscription_data FROM push_subscriptions WHERE user_id = ? AND is_active = true`,
    [row.user_id]
  );

  if (!subscriptionsResult.rows.length) {
    await query(
      `UPDATE notification_delivery_queue
       SET status = 'sent', sent_at = datetime('now'), updated_at = datetime('now')
       WHERE id = ?`,
      [row.id]
    );
    return;
  }

  const payload = {
    title: row.title,
    body: row.body || 'You have a new Junto update.',
    url: row.url || '/notifications',
  };

  const dispatchResults = await Promise.all(
    subscriptionsResult.rows.map(async (subscriptionRow) => {
      try {
        const subscription = JSON.parse(subscriptionRow.subscription_data);
        const result = await sendBrowserPush(subscription, payload);
        if (!result.success && [404, 410].includes(Number(result.status))) {
          await query(
            `UPDATE push_subscriptions SET is_active = false, updated_at = datetime('now') WHERE id = ?`,
            [subscriptionRow.id]
          );
        }
        return result.success;
      } catch (error) {
        console.error('Push dispatch error:', error);
        return false;
      }
    })
  );

  const allDelivered = dispatchResults.some(Boolean);
  if (allDelivered) {
    await query(
      `UPDATE notification_delivery_queue
       SET status = 'sent', sent_at = datetime('now'), updated_at = datetime('now')
       WHERE id = ?`,
      [row.id]
    );
    return;
  }

  const nextAttempts = Number(row.attempts || 0) + 1;
  const status = nextAttempts >= Number(row.max_attempts || 5) ? 'failed' : 'pending';
  const nextAttemptSql = status === 'failed'
    ? 'datetime(\'now\')'
    : `datetime('now', '+${Math.min(nextAttempts * 5, 60)} minutes')`;

  await query(
    `UPDATE notification_delivery_queue
     SET attempts = ?, status = ?, next_attempt_at = ${nextAttemptSql}, last_error = ?, updated_at = datetime('now')
     WHERE id = ?`,
    [nextAttempts, status, 'Push dispatch failed', row.id]
  );
}

export async function processNotificationDeliveryQueue() {
  const dueJobs = await query(
    `SELECT * FROM notification_delivery_queue
     WHERE status IN ('pending', 'failed')
       AND attempts < max_attempts
       AND datetime(next_attempt_at) <= datetime('now')
     ORDER BY created_at ASC
     LIMIT 25`
  );

  for (const row of dueJobs.rows || []) {
    try {
      await query(
        `UPDATE notification_delivery_queue
         SET status = 'sending', updated_at = datetime('now')
         WHERE id = ?`,
        [row.id]
      );
      await processQueueItem(row);
    } catch (error) {
      console.error('Error processing notification queue item:', error);
      const nextAttempts = Number(row.attempts || 0) + 1;
      await query(
        `UPDATE notification_delivery_queue
         SET attempts = ?, status = ?, last_error = ?, next_attempt_at = datetime('now', '+15 minutes'), updated_at = datetime('now')
         WHERE id = ?`,
        [nextAttempts, nextAttempts >= Number(row.max_attempts || 5) ? 'failed' : 'pending', error.message, row.id]
      );
    }
  }
}

export function initializeNotificationDeliveryScheduler() {
  if (schedulerInstance) {
    return;
  }

  schedulerInstance = cron.schedule('*/1 * * * *', async () => {
    try {
      await processNotificationDeliveryQueue();
    } catch (error) {
      console.error('Notification delivery scheduler error:', error);
    }
  });

  console.log('✓ Notification delivery scheduler initialized');
}

export function stopNotificationDeliveryScheduler() {
  if (schedulerInstance) {
    schedulerInstance.stop();
    schedulerInstance.destroy();
    schedulerInstance = null;
  }
}
