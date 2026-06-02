/**
 * Notification Preferences Schema
 * Stores user preferences for different notification types
 */

export const notificationPreferencesSchema = {
  tableName: 'notification_preferences',
  columns: {
    id: 'TEXT PRIMARY KEY',
    user_id: 'TEXT NOT NULL UNIQUE',
    interests_enabled: 'BOOLEAN DEFAULT 1',
    messages_enabled: 'BOOLEAN DEFAULT 1',
    reminders_enabled: 'BOOLEAN DEFAULT 1',
    promotions_enabled: 'BOOLEAN DEFAULT 0',
    push_enabled: 'BOOLEAN DEFAULT 1',
    email_enabled: 'BOOLEAN DEFAULT 1',
    sms_enabled: 'BOOLEAN DEFAULT 0',
    reminder_hours_before: 'INTEGER DEFAULT 24',
    quiet_hours_start: 'INTEGER DEFAULT 22',
    quiet_hours_end: 'INTEGER DEFAULT 8',
    quiet_hours_enabled: 'BOOLEAN DEFAULT 0',
    created_at: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
    updated_at: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
  },
  indexes: [
    'idx_notification_preferences_user_id ON notification_preferences(user_id)',
  ],
  foreignKeys: [
    'FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE',
  ],
};

export const createNotificationPreferencesTable = (db) => {
  return new Promise((resolve, reject) => {
    const schema = notificationPreferencesSchema;
    
    // Build CREATE TABLE statement
    const columns = Object.entries(schema.columns)
      .map(([name, definition]) => `${name} ${definition}`)
      .join(', ');
    
    const foreignKeys = schema.foreignKeys
      .map(fk => `, ${fk}`)
      .join('');
    
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS ${schema.tableName} (
        ${columns}${foreignKeys}
      )
    `;

    db.run(createTableSql, (err) => {
      if (err) {
        console.error(`Error creating ${schema.tableName} table:`, err);
        reject(err);
        return;
      }

      // Create indexes
      const createIndexPromises = schema.indexes.map(indexDef => {
        return new Promise((resolveIndex, rejectIndex) => {
          const createIndexSql = `CREATE INDEX IF NOT EXISTS ${indexDef}`;
          db.run(createIndexSql, (err) => {
            if (err) {
              console.error(`Error creating index:`, err);
              rejectIndex(err);
            } else {
              resolveIndex();
            }
          });
        });
      });

      Promise.all(createIndexPromises)
        .then(() => {
          console.log(`✓ Notification preferences table created successfully`);
          resolve();
        })
        .catch(reject);
    });
  });
};

/**
 * Initialize default preferences for a new user
 */
export const initializeUserPreferences = (db, userId) => {
  return new Promise((resolve, reject) => {
    const uuid = require('uuid').v4();
    const now = new Date().toISOString();

    const sql = `
      INSERT OR IGNORE INTO notification_preferences (
        id, user_id, interests_enabled, messages_enabled, 
        reminders_enabled, promotions_enabled, push_enabled, 
        email_enabled, sms_enabled, reminder_hours_before,
        quiet_hours_enabled, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(sql, [
      uuid,
      userId,
      1, // interests_enabled
      1, // messages_enabled
      1, // reminders_enabled
      0, // promotions_enabled
      1, // push_enabled
      1, // email_enabled
      0, // sms_enabled
      24, // reminder_hours_before
      0, // quiet_hours_enabled
      now,
      now,
    ], (err) => {
      if (err) {
        console.error('Error initializing user preferences:', err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
};
