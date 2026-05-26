import { query } from '../../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

export async function getNotifications(req, res) {
  try {
    const { userId } = req.params;
    const { limit = 50, unread_only = false } = req.query;

    let sql = `SELECT * FROM notifications WHERE user_id = $1`;
    const params = [userId];

    if (unread_only === 'true') {
      sql += ` AND is_read = false`;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await query(sql, params);
    res.json({ notifications: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function markAsRead(req, res) {
  try {
    const { notificationId } = req.params;

    const result = await query(
      `UPDATE notifications SET is_read = true WHERE id = $1 RETURNING *`,
      [notificationId]
    );

    if (result.rows.length === 0) {
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

    const result = await query(
      'DELETE FROM notifications WHERE id = $1 RETURNING id',
      [notificationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ success: true, message: '✅ Notification deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
