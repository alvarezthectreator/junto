/**
 * Event Reminder Scheduler
 * Handles automatic event reminders 24h, 2h before event
 * Requires: npm install node-cron
 */

import cron from 'node-cron';
import { createNotification } from './notificationService.js';

let schedulerInstance = null;

export const initializeReminderScheduler = (db) => {
  if (schedulerInstance) {
    console.log('Reminder scheduler already initialized');
    return;
  }

  // Run every 5 minutes to check for events needing reminders
  schedulerInstance = cron.schedule('*/5 * * * *', async () => {
    try {
      await checkAndSendEventReminders(db);
    } catch (error) {
      console.error('Error in reminder scheduler:', error);
    }
  });

  console.log('✓ Event reminder scheduler initialized');
};

/**
 * Check for events that need reminders and send them
 */
const checkAndSendEventReminders = async (db) => {
  return new Promise((resolve, reject) => {
    const now = new Date();

    // Get all upcoming events in next 24 hours that haven't sent reminders
    const sql = `
      SELECT DISTINCT
        e.id as event_id,
        e.title,
        e.event_date,
        e.event_time,
        e.location_city,
        e.location_address,
        ea.user_id,
        np.reminder_hours_before,
        np.reminders_enabled,
        np.push_enabled,
        np.email_enabled,
        u.email,
        u.display_name,
        u.profile_id
      FROM events e
      INNER JOIN event_applications ea ON e.id = ea.event_id
      INNER JOIN users u ON ea.user_id = u.id
      LEFT JOIN notification_preferences np ON u.id = np.user_id
      WHERE 
        e.status != 'expired'
        AND e.status != 'cancelled'
        AND ea.status IN ('accepted', 'waitlisted')
        AND ea.reminder_sent = 0
        AND datetime(e.event_date || ' ' || e.event_time) <= datetime('now', '+'||COALESCE(np.reminder_hours_before, 24)||' hours')
        AND datetime(e.event_date || ' ' || e.event_time) > datetime('now')
      LIMIT 100
    `;

    db.all(sql, [], (err, rows) => {
      if (err) {
        console.error('Error fetching events for reminders:', err);
        resolve();
        return;
      }

      if (!rows || rows.length === 0) {
        resolve();
        return;
      }

      // Send reminders for each event
      const reminderPromises = rows.map(row => {
        return new Promise((resolveReminder) => {
          // Check if reminders are enabled (default true if no preferences)
          const remindersEnabled = row.reminders_enabled !== 0;
          if (!remindersEnabled) {
            resolveReminder();
            return;
          }

          // Format event date/time for display
          const eventDateTime = `${row.date} at ${row.time}`;

          const title = `Reminder: ${row.title}`;
          const body = `Event starts ${eventDateTime} at ${row.location}`;

          createNotification({
            userId: row.user_id,
            notificationType: 'event_reminder',
            title,
            body,
            relatedEventId: row.event_id,
            payload: {
              eventId: row.event_id,
              title,
              body,
              url: `/events/${row.event_id}`,
            },
            url: `/events/${row.event_id}`,
          }).catch((err) => {
            console.error('Error creating reminder notification:', err);
          }).finally(() => {
            // Mark reminder as sent
            const updateSql = `
              UPDATE event_applications
              SET reminder_sent = 1
              WHERE event_id = ? AND user_id = ?
            `;

            db.run(updateSql, [row.event_id, row.user_id], (err) => {
              if (err) {
                console.error('Error marking reminder as sent:', err);
              }
              console.log(`✓ Event reminder sent to ${row.display_name} for ${row.title}`);
              resolveReminder();
            });
          });
        });
      });

      Promise.all(reminderPromises)
        .then(() => {
          resolve();
        })
        .catch((error) => {
          console.error('Error sending reminders:', error);
          resolve();
        });
    });
  });
};

/**
 * Stop the reminder scheduler
 */
export const stopReminderScheduler = () => {
  if (schedulerInstance) {
    schedulerInstance.stop();
    schedulerInstance.destroy();
    schedulerInstance = null;
    console.log('Reminder scheduler stopped');
  }
};

/**
 * Manually send a reminder for a specific event
 */
export const sendEventReminder = (db, eventId, userId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        e.title, e.event_date, e.event_time, e.location_city, e.location_address,
        u.display_name, u.email, u.profile_id
      FROM events e
      INNER JOIN event_applications ea ON e.id = ea.event_id
      INNER JOIN users u ON ea.user_id = u.id
      WHERE e.id = ? AND u.id = ?
    `;

    db.get(sql, [eventId, userId], (err, row) => {
      if (err) {
        console.error('Error fetching event for reminder:', err);
        reject(err);
        return;
      }

      if (!row) {
        reject(new Error('Event or application not found'));
        return;
      }

      const title = `Reminder: ${row.title}`;
      const body = `Event starts ${row.date} at ${row.time} at ${row.location}`;

      createNotification({
        userId,
        notificationType: 'event_reminder',
        title,
        body,
        relatedEventId: eventId,
        payload: {
          eventId,
          title,
          body,
          url: `/events/${eventId}`,
        },
        url: `/events/${eventId}`,
      }).then((notificationId) => {
        resolve({
          notificationId,
          message: `Reminder sent to ${row.display_name}`,
        });
      }).catch((err) => {
        console.error('Error creating reminder notification:', err);
        reject(err);
      });
    });
  });
};
