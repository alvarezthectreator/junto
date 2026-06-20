/**
 * Follow-Up Scheduler
 * Handles automatic follow-up messages 1-2 hours after event ends
 * Requests: feedback, photos, ratings
 * Requires: npm install node-cron
 */

import cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid';
import { createNotification } from './notificationService.js';

let schedulerInstance = null;

export const initializeFollowupScheduler = (db) => {
  if (schedulerInstance) {
    console.log('Follow-up scheduler already initialized');
    return;
  }

  // Run every 10 minutes to check for events that ended and need follow-ups
  schedulerInstance = cron.schedule('*/10 * * * *', async () => {
    try {
      await checkAndSendFollowups(db);
    } catch (error) {
      console.error('Error in follow-up scheduler:', error);
    }
  });

  console.log('✓ Follow-up scheduler initialized (runs every 10 minutes)');
};

/**
 * Check for events that have ended and send follow-up messages
 * Triggers 1-2 hours after event ends
 */
const checkAndSendFollowups = async (db) => {
  return new Promise((resolve, reject) => {
    const now = new Date();

    // Get all completed events that need follow-ups
    const sql = `
      SELECT DISTINCT
        e.id as event_id,
        e.title,
        e.date,
        e.time,
        e.host_id,
        ea.user_id,
        ea.status,
        u.email,
        u.display_name,
        u.profile_id,
        host.display_name as host_name,
        host.profile_id as host_profile_id
      FROM events e
      INNER JOIN event_applications ea ON e.id = ea.event_id
      INNER JOIN users u ON ea.user_id = u.id
      INNER JOIN users host ON e.host_id = host.id
      WHERE 
        e.status != 'cancelled'
        AND ea.status IN ('accepted', 'checked_in')
        AND ea.followup_sent = 0
        AND datetime(e.date || ' ' || e.time, '+2 hours') <= datetime('now')
        AND datetime(e.date || ' ' || e.time, '+3 hours') > datetime('now')
      LIMIT 100
    `;

    db.all(sql, [], (err, rows) => {
      if (err) {
        console.error('Error fetching events for follow-ups:', err);
        resolve();
        return;
      }

      if (!rows || rows.length === 0) {
        resolve();
        return;
      }

      // Send follow-ups for each attendee
      const followupPromises = rows.map(row => {
        return new Promise((resolveFollowup) => {
          // Create follow-up notification with options
          const title = `Follow-up: Share your experience at ${row.title}`;
          const body = `${row.host_name} would love to hear from you! Rate the event, share photos, or send feedback.`;
          const followupType = 'event_followup'; // options: 'feedback_request', 'rating_request', 'photo_request'

          createNotification({
            userId: row.user_id,
            notificationType: followupType,
            title,
            body,
            relatedUserId: row.host_id,
            relatedEventId: row.event_id,
            payload: {
              eventId: row.event_id,
              hostId: row.host_id,
              title,
              body,
              url: `/events/${row.event_id}`,
            },
            url: `/events/${row.event_id}`,
          }).then((followupId) => {
            // Create follow-up record in new table
            const createFollowupRecordSql = `
              INSERT INTO event_followups (
                id, event_id, user_id, host_id,
                status, notification_id,
                created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            const notificationTime = new Date().toISOString();

            db.run(
              createFollowupRecordSql,
              [
                uuidv4(),
                row.event_id,
                row.user_id,
                row.host_id,
                'pending',
                followupId,
                notificationTime,
              ],
              (err) => {
                if (err) {
                  // Table might not exist yet, just update the flag
                  console.log(`Follow-up record creation skipped (table may not exist)`);
                }

                // Mark follow-up as sent
                const updateSql = `
                  UPDATE event_applications
                  SET followup_sent = 1
                  WHERE event_id = ? AND user_id = ?
                `;

                db.run(updateSql, [row.event_id, row.user_id], (err) => {
                  if (err) {
                    console.error('Error marking follow-up as sent:', err);
                  }
                  console.log(`✓ Follow-up sent to ${row.display_name} for event "${row.title}"`);
                  resolveFollowup();
                });
              }
            );
          }).catch((err) => {
            console.error('Error creating follow-up notification:', err);
            resolveFollowup();
          });
        });
      });

      Promise.all(followupPromises)
        .then(() => {
          resolve();
        })
        .catch((error) => {
          console.error('Error sending follow-ups:', error);
          resolve();
        });
    });
  });
};

/**
 * Get follow-up status for a specific event
 */
export const getFollowupStatus = (db, eventId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        u.id,
        u.display_name,
        u.profile_id,
        ea.status as application_status,
        ea.followup_sent,
        COUNT(CASE WHEN n.notification_type = 'event_followup' AND n.is_read = 1 THEN 1 END) as opened
      FROM event_applications ea
      INNER JOIN users u ON ea.user_id = u.id
      LEFT JOIN notifications n ON ea.user_id = n.user_id AND n.event_id = ea.event_id AND n.notification_type = 'event_followup'
      WHERE ea.event_id = ?
      GROUP BY u.id, ea.status, ea.followup_sent
      ORDER BY u.display_name
    `;

    db.all(sql, [eventId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
};

/**
 * Mark follow-up as responded (user gave feedback, rating, or uploaded photo)
 */
export const markFollowupResponded = (db, eventId, userId, responseType = 'feedback') => {
  return new Promise((resolve, reject) => {
    const updateSql = `
      UPDATE event_applications 
      SET followup_response_type = ?, followup_responded_at = ?
      WHERE event_id = ? AND user_id = ?
    `;

    db.run(updateSql, [responseType, new Date().toISOString(), eventId, userId], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

/**
 * Get follow-up engagement analytics for a host
 */
export const getFollowupAnalytics = (db, hostId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        e.id as event_id,
        e.title,
        e.date,
        COUNT(CASE WHEN ea.followup_sent = 1 THEN 1 END) as followups_sent,
        COUNT(CASE WHEN n.is_read = 1 THEN 1 END) as followups_opened,
        COUNT(CASE WHEN ea.followup_response_type IS NOT NULL THEN 1 END) as responses_received,
        COUNT(DISTINCT ea.user_id) as total_attendees
      FROM events e
      LEFT JOIN event_applications ea ON e.id = ea.event_id
      LEFT JOIN notifications n ON ea.user_id = n.user_id AND n.event_id = e.id AND n.notification_type = 'event_followup'
      WHERE e.host_id = ? AND e.status != 'cancelled'
      GROUP BY e.id, e.title, e.date
      ORDER BY e.date DESC
      LIMIT 20
    `;

    db.all(sql, [hostId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
};

/**
 * Stop the follow-up scheduler
 */
export const stopFollowupScheduler = () => {
  if (schedulerInstance) {
    schedulerInstance.stop();
    schedulerInstance.destroy();
    console.log('✓ Follow-up scheduler stopped');
  }
};
