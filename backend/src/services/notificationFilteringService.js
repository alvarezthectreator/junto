/**
 * Notification Filtering Service
 * Handles filtering and filtering notifications based on user preferences
 */

export const shouldSendNotification = (db, userId, notificationType) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM notification_preferences WHERE user_id = ?';
    
    db.get(sql, [userId], (err, row) => {
      if (err) {
        console.error('Error fetching notification preferences:', err);
        resolve(true); // Default to sending if error
        return;
      }

      if (!row) {
        resolve(true); // Default to sending if no preferences found
        return;
      }

      // Check if notification type is enabled
      let shouldSend = true;

      switch (notificationType.toLowerCase()) {
        case 'interest':
        case 'interest_received':
          shouldSend = Boolean(row.interests_enabled);
          break;
        case 'message':
        case 'new_message':
          shouldSend = Boolean(row.messages_enabled);
          break;
        case 'reminder':
        case 'event_reminder':
          shouldSend = Boolean(row.reminders_enabled);
          break;
        case 'promotion':
        case 'promotional':
        case 'news':
          shouldSend = Boolean(row.promotions_enabled);
          break;
        case 'application':
        case 'new_application':
          shouldSend = Boolean(row.interests_enabled); // Treat as interest
          break;
        default:
          shouldSend = true;
          break;
      }

      // Check quiet hours if enabled
      if (shouldSend && row.quiet_hours_enabled) {
        const now = new Date();
        const currentHour = now.getHours();
        const quietStart = row.quiet_hours_start || 22;
        const quietEnd = row.quiet_hours_end || 8;

        // Handle quiet hours that span midnight
        if (quietStart > quietEnd) {
          if (currentHour >= quietStart || currentHour < quietEnd) {
            shouldSend = false;
          }
        } else {
          if (currentHour >= quietStart && currentHour < quietEnd) {
            shouldSend = false;
          }
        }
      }

      resolve(shouldSend);
    });
  });
};

/**
 * Filter notifications by user preferences
 */
export const filterNotificationsByPreferences = async (db, userId, notifications) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM notification_preferences WHERE user_id = ?';
    
    db.get(sql, [userId], async (err, prefs) => {
      if (err) {
        console.error('Error fetching notification preferences:', err);
        resolve(notifications); // Return all if error
        return;
      }

      if (!prefs) {
        resolve(notifications); // Return all if no preferences
        return;
      }

      const filtered = notifications.filter(notification => {
        const notifType = (notification.notification_type || notification.type || 'system').toLowerCase();
        let include = true;

        // Check notification type preferences
        if (notifType.includes('interest') && !prefs.interests_enabled) include = false;
        if (notifType.includes('message') && !prefs.messages_enabled) include = false;
        if (notifType.includes('reminder') && !prefs.reminders_enabled) include = false;
        if ((notifType.includes('promo') || notifType.includes('news')) && !prefs.promotions_enabled) include = false;
        if (notifType === 'application' && !prefs.interests_enabled) include = false;

        // Check quiet hours
        if (include && prefs.quiet_hours_enabled) {
          const createdAt = new Date(notification.created_at || Date.now());
          const createdHour = createdAt.getHours();
          const quietStart = prefs.quiet_hours_start || 22;
          const quietEnd = prefs.quiet_hours_end || 8;

          if (quietStart > quietEnd) {
            if (createdHour >= quietStart || createdHour < quietEnd) {
              include = false;
            }
          } else {
            if (createdHour >= quietStart && createdHour < quietEnd) {
              include = false;
            }
          }
        }

        return include;
      });

      resolve(filtered);
    });
  });
};

/**
 * Check if a notification should be delivered via push
 */
export const shouldDeliverPush = (db, userId) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT push_enabled FROM notification_preferences WHERE user_id = ?';
    
    db.get(sql, [userId], (err, row) => {
      if (err) {
        console.error('Error checking push delivery:', err);
        resolve(true);
        return;
      }

      resolve(row ? Boolean(row.push_enabled) : true);
    });
  });
};

/**
 * Check if a notification should be delivered via email
 */
export const shouldDeliverEmail = (db, userId) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT email_enabled FROM notification_preferences WHERE user_id = ?';
    
    db.get(sql, [userId], (err, row) => {
      if (err) {
        console.error('Error checking email delivery:', err);
        resolve(true);
        return;
      }

      resolve(row ? Boolean(row.email_enabled) : true);
    });
  });
};

/**
 * Check if a notification should be delivered via SMS
 */
export const shouldDeliverSMS = (db, userId) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT sms_enabled FROM notification_preferences WHERE user_id = ?';
    
    db.get(sql, [userId], (err, row) => {
      if (err) {
        console.error('Error checking SMS delivery:', err);
        resolve(false);
        return;
      }

      resolve(row ? Boolean(row.sms_enabled) : false);
    });
  });
};

/**
 * Get reminder hours preference for a user
 */
export const getReminderHoursBefore = (db, userId) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT reminder_hours_before FROM notification_preferences WHERE user_id = ?';
    
    db.get(sql, [userId], (err, row) => {
      if (err) {
        console.error('Error fetching reminder hours:', err);
        resolve(24); // Default to 24 hours
        return;
      }

      resolve(row ? row.reminder_hours_before : 24);
    });
  });
};
