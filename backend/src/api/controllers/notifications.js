import { query } from '../../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

export async function getNotifications(req, res) {
  try {
    const { userId } = req.params;
    const { limit = 50, unread_only = false } = req.query;

    let sql = `SELECT * FROM notifications WHERE user_id = ?`;
    const params = [userId];

    if (unread_only === 'true') {
      sql += ` AND is_read = false`;
    }

    sql += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(parseInt(limit));

    const result = await query(sql, params);
    res.json({ notifications: result.rows || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function markAsRead(req, res) {
  try {
    const { notificationId } = req.params;

    await query(
      `UPDATE notifications SET is_read = true, read_at = datetime('now') WHERE id = ?`,
      [notificationId]
    );

    const result = await query(`SELECT * FROM notifications WHERE id = ?`, [notificationId]);

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ notification: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function deleteNotification(req, res) {
  try {
    const { notificationId } = req.params;

    await query('DELETE FROM notifications WHERE id = ?', [notificationId]);

    res.json({ success: true, message: '✅ Notification deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// PUSH NOTIFICATION FUNCTIONS

// Subscribe to push notifications
export async function subscribeToPush(req, res) {
  try {
    const { user_id, subscription } = req.body;

    if (!user_id || !subscription) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const subId = uuidv4();
    const subscriptionData = JSON.stringify(subscription);

    await query(
      `INSERT INTO push_subscriptions (id, user_id, subscription_data, is_active, created_at, updated_at)
       VALUES (?, ?, ?, true, datetime('now'), datetime('now'))`,
      [subId, user_id, subscriptionData]
    );

    res.json({ message: 'Push notifications enabled', subscription_id: subId });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: error.message });
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPush(req, res) {
  try {
    const { user_id, subscription } = req.body;

    if (!user_id || !subscription) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const subscriptionData = JSON.stringify(subscription);

    await query(
      `UPDATE push_subscriptions SET is_active = false, updated_at = datetime('now')
       WHERE user_id = ? AND subscription_data = ?`,
      [user_id, subscriptionData]
    );

    res.json({ message: 'Push notifications disabled' });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ error: error.message });
  }
}

// Get user's push subscriptions
export async function getPushSubscriptions(req, res) {
  try {
    const { user_id } = req.params;

    const result = await query(
      `SELECT id, subscription_data, is_active, created_at FROM push_subscriptions
       WHERE user_id = ? AND is_active = true`,
      [user_id]
    );

    const subscriptions = (result.rows || []).map(row => ({
      id: row.id,
      subscription: JSON.parse(row.subscription_data),
      created_at: row.created_at
    }));

    res.json({ subscriptions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Send push notification to user (internal endpoint)
export async function sendPushNotification(user_id, title, body) {
  try {
    // Get user's active subscriptions
    const subsResult = await query(
      `SELECT subscription_data FROM push_subscriptions WHERE user_id = ? AND is_active = true`,
      [user_id]
    );

    if (!subsResult.rows || subsResult.rows.length === 0) {
      // Create in-app notification as fallback
      const notifId = uuidv4();
      await query(
        `INSERT INTO notifications (id, user_id, title, body, is_read, created_at)
         VALUES (?, ?, ?, ?, false, datetime('now'))`,
        [notifId, user_id, title, body]
      );
      return notifId;
    }

    // Create in-app notification
    const notifId = uuidv4();
    await query(
      `INSERT INTO notifications (id, user_id, title, body, is_read, created_at)
       VALUES (?, ?, ?, ?, false, datetime('now'))`,
      [notifId, user_id, title, body]
    );

    // In production, use web-push library to send to each subscription
    // For now, we just track the notification
    return notifId;
  } catch (error) {
    console.error('Push notification error:', error);
    throw error;
  }
}
