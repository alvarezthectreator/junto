/**
 * Notification Preferences Controller
 * Handles all notification preference operations
 */

import { v4 as uuidv4 } from 'uuid';

export const getNotificationPreferences = async (req, res, db) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const sql = 'SELECT * FROM notification_preferences WHERE user_id = ?';
    
    db.get(sql, [userId], (err, row) => {
      if (err) {
        console.error('Error fetching notification preferences:', err);
        return res.status(500).json({ error: 'Failed to fetch preferences' });
      }

      if (!row) {
        return res.status(404).json({ error: 'Preferences not found' });
      }

      res.json({
        preferences: {
          interests_enabled: Boolean(row.interests_enabled),
          messages_enabled: Boolean(row.messages_enabled),
          reminders_enabled: Boolean(row.reminders_enabled),
          promotions_enabled: Boolean(row.promotions_enabled),
          push_enabled: Boolean(row.push_enabled),
          email_enabled: Boolean(row.email_enabled),
          sms_enabled: Boolean(row.sms_enabled),
          reminder_hours_before: row.reminder_hours_before,
          quiet_hours_start: row.quiet_hours_start,
          quiet_hours_end: row.quiet_hours_end,
          quiet_hours_enabled: Boolean(row.quiet_hours_enabled),
          created_at: row.created_at,
          updated_at: row.updated_at,
        },
      });
    });
  } catch (error) {
    console.error('Error in getNotificationPreferences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateNotificationPreferences = async (req, res, db) => {
  try {
    const { userId } = req.params;
    const {
      interests_enabled,
      messages_enabled,
      reminders_enabled,
      promotions_enabled,
      push_enabled,
      email_enabled,
      sms_enabled,
      reminder_hours_before,
      quiet_hours_start,
      quiet_hours_end,
      quiet_hours_enabled,
    } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Validate numeric values
    if (reminder_hours_before && (reminder_hours_before < 1 || reminder_hours_before > 168)) {
      return res.status(400).json({ error: 'reminder_hours_before must be between 1 and 168' });
    }

    if (quiet_hours_start !== undefined && (quiet_hours_start < 0 || quiet_hours_start > 23)) {
      return res.status(400).json({ error: 'quiet_hours_start must be between 0 and 23' });
    }

    if (quiet_hours_end !== undefined && (quiet_hours_end < 0 || quiet_hours_end > 23)) {
      return res.status(400).json({ error: 'quiet_hours_end must be between 0 and 23' });
    }

    const now = new Date().toISOString();
    const updates = [];
    const values = [];

    if (interests_enabled !== undefined) {
      updates.push('interests_enabled = ?');
      values.push(interests_enabled ? 1 : 0);
    }
    if (messages_enabled !== undefined) {
      updates.push('messages_enabled = ?');
      values.push(messages_enabled ? 1 : 0);
    }
    if (reminders_enabled !== undefined) {
      updates.push('reminders_enabled = ?');
      values.push(reminders_enabled ? 1 : 0);
    }
    if (promotions_enabled !== undefined) {
      updates.push('promotions_enabled = ?');
      values.push(promotions_enabled ? 1 : 0);
    }
    if (push_enabled !== undefined) {
      updates.push('push_enabled = ?');
      values.push(push_enabled ? 1 : 0);
    }
    if (email_enabled !== undefined) {
      updates.push('email_enabled = ?');
      values.push(email_enabled ? 1 : 0);
    }
    if (sms_enabled !== undefined) {
      updates.push('sms_enabled = ?');
      values.push(sms_enabled ? 1 : 0);
    }
    if (reminder_hours_before !== undefined) {
      updates.push('reminder_hours_before = ?');
      values.push(reminder_hours_before);
    }
    if (quiet_hours_start !== undefined) {
      updates.push('quiet_hours_start = ?');
      values.push(quiet_hours_start);
    }
    if (quiet_hours_end !== undefined) {
      updates.push('quiet_hours_end = ?');
      values.push(quiet_hours_end);
    }
    if (quiet_hours_enabled !== undefined) {
      updates.push('quiet_hours_enabled = ?');
      values.push(quiet_hours_enabled ? 1 : 0);
    }

    updates.push('updated_at = ?');
    values.push(now);
    values.push(userId);

    const sql = `UPDATE notification_preferences SET ${updates.join(', ')} WHERE user_id = ?`;

    db.run(sql, values, function (err) {
      if (err) {
        console.error('Error updating notification preferences:', err);
        return res.status(500).json({ error: 'Failed to update preferences' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Preferences not found' });
      }

      res.json({ message: 'Preferences updated successfully', updated_at: now });
    });
  } catch (error) {
    console.error('Error in updateNotificationPreferences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const resetNotificationPreferences = async (req, res, db) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const now = new Date().toISOString();
    const sql = `
      UPDATE notification_preferences 
      SET 
        interests_enabled = 1,
        messages_enabled = 1,
        reminders_enabled = 1,
        promotions_enabled = 0,
        push_enabled = 1,
        email_enabled = 1,
        sms_enabled = 0,
        reminder_hours_before = 24,
        quiet_hours_enabled = 0,
        updated_at = ?
      WHERE user_id = ?
    `;

    db.run(sql, [now, userId], function (err) {
      if (err) {
        console.error('Error resetting notification preferences:', err);
        return res.status(500).json({ error: 'Failed to reset preferences' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Preferences not found' });
      }

      res.json({ message: 'Preferences reset to defaults', updated_at: now });
    });
  } catch (error) {
    console.error('Error in resetNotificationPreferences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
