import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import db from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function initializeDatabase() {
  try {
    console.log('📦 Creating database tables...');
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
    
    // SQLite converts SERIAL to INTEGER and AUTO_INCREMENT, removes CONSTRAINTS
    let sqliteSchema = schema
      .replace(/SERIAL PRIMARY KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT')
      .replace(/UUID PRIMARY KEY DEFAULT gen_random_uuid\(\)/g, 'TEXT PRIMARY KEY')
      .replace(/UUID/g, 'TEXT')
      .replace(/POINT/g, 'TEXT')  // PostgreSQL POINT type to TEXT
      .replace(/DEFAULT gen_random_uuid\(\)/g, '')  // Remove UUID generation
      .replace(/text\[\]/g, 'TEXT')  // PostgreSQL arrays to TEXT
      .replace(/TEXT\[\]/g, 'TEXT')
      .replace(/\[\]/g, 'TEXT')  // Any array type to TEXT
      .replace(/CONSTRAINT .+? FOREIGN KEY/g, 'FOREIGN KEY')  // Remove CONSTRAINT keyword
      .replace(/ON UPDATE CASCADE/g, 'ON DELETE CASCADE');  // SQLite doesn't support ON UPDATE CASCADE
    
    // Remove SQL comments and INDEX creation statements (not part of table definitions)
    let cleanedSchema = sqliteSchema
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        // Skip comments, standalone CREATE INDEX statements
        return !trimmed.startsWith('--') && 
               !trimmed.startsWith('CREATE INDEX') && 
               !trimmed.startsWith('INDEX');
      })
      .join('\n');
    
    // Remove trailing commas from column lists
    cleanedSchema = cleanedSchema
      .replace(/,\s*,/g, ',')  // Remove double commas
      .replace(/,\s*\)/g, ')');  // Remove trailing commas before closing paren
    
    // Split and execute each statement properly
    const statements = cleanedSchema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('CREATE INDEX'));
    
    return new Promise((resolve, reject) => {
      let completed = 0;
      const total = statements.length;
      
      if (total === 0) {
        console.log('✅ Database tables created successfully');
        // Run additional initialization for production
        ensureProductionTables();
        resolve();
        return;
      }
      
      statements.forEach(statement => {
        if (statement.trim()) {
          db.run(statement, (err) => {
            if (err) {
              // Only log if it's a real error, not a duplicate
              if (!err.message.includes('already exists')) {
                console.error('❌ Error executing statement:', statement.substring(0, 80));
                console.error('Error details:', err.message);
              }
            } else {
              console.log('✅ Table created');
            }
            completed++;
            if (completed === total) {
              console.log('✅ Database tables created successfully');
              // Run additional initialization for production
              ensureProductionTables();
              resolve();
            }
          });
        }
      });
    });
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}

// Ensure notifications table exists (for production databases that were created without it)
function ensureProductionTables() {
  const addReferralColumns = [
    `ALTER TABLE users ADD COLUMN city VARCHAR(100);`,
    `ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;`,
    `ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT false;`,
    `ALTER TABLE users ADD COLUMN verification_status VARCHAR(50) DEFAULT 'unverified';`,
    `ALTER TABLE users ADD COLUMN referred_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL;`,
    `ALTER TABLE users ADD COLUMN session_version INTEGER DEFAULT 0;`,
    `ALTER TABLE users ADD COLUMN password_updated_at TIMESTAMP;`,
    `ALTER TABLE users ADD COLUMN avatar_image TEXT;`,
    `ALTER TABLE users ADD COLUMN reliability_score NUMERIC DEFAULT 100;`,
    `ALTER TABLE user_profiles ADD COLUMN avatar_image TEXT;`,
    `ALTER TABLE user_profiles ADD COLUMN travel_destination_city VARCHAR(100);`,
    `ALTER TABLE events ADD COLUMN is_squad_event BOOLEAN DEFAULT false;`,
    `ALTER TABLE reports ADD COLUMN evidence_urls TEXT;`,
    `ALTER TABLE reports ADD COLUMN escalation_level VARCHAR(20) DEFAULT 'standard';`,
    `ALTER TABLE reports ADD COLUMN escalation_reason TEXT;`,
    `ALTER TABLE reports ADD COLUMN reviewed_by TEXT;`,
    `ALTER TABLE reports ADD COLUMN review_note TEXT;`,
    `ALTER TABLE reports ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`,
  ];

  addReferralColumns.forEach((statement) => {
    db.run(statement, (err) => {
      if (err && !err.message.includes('duplicate column') && !err.message.includes('already exists')) {
        console.warn('⚠️  Could not ensure referral columns:', err.message);
      }
    });
  });

  const createNotificationsTable = `
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      notification_type VARCHAR(50),
      related_user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      related_event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
      title VARCHAR(255),
      body TEXT,
      is_read BOOLEAN DEFAULT false,
      read_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createCheckInsTable = `
    CREATE TABLE IF NOT EXISTS event_check_ins (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      checked_in_at TIMESTAMP NOT NULL,
      user_location_lat REAL,
      user_location_lon REAL,
      event_location_lat REAL,
      event_location_lon REAL,
      distance_from_event REAL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(event_id, user_id)
    );
  `;

  const createSubscriptionsTable = `
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      plan_id VARCHAR(50) NOT NULL,
      billing_cycle VARCHAR(20) NOT NULL,
      status VARCHAR(50) DEFAULT 'active',
      provider VARCHAR(50) DEFAULT 'manual',
      amount INT DEFAULT 0,
      currency VARCHAR(10) DEFAULT 'NGN',
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      current_period_end TIMESTAMP,
      canceled_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createUserSessionsTable = `
    CREATE TABLE IF NOT EXISTS user_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_id TEXT NOT NULL UNIQUE,
      device_label VARCHAR(120),
      user_agent TEXT,
      ip_address VARCHAR(50),
      is_active BOOLEAN DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      revoked_at TIMESTAMP
    );
  `;

  const createRecoveryCodesTable = `
    CREATE TABLE IF NOT EXISTS account_recovery_codes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      code_hash TEXT NOT NULL,
      code_hint VARCHAR(16),
      used_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createReliabilityPenaltyLogTable = `
    CREATE TABLE IF NOT EXISTS reliability_penalty_log (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      penalty_percent NUMERIC NOT NULL,
      previous_score NUMERIC NOT NULL,
      new_score NUMERIC NOT NULL,
      reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  db.run(createNotificationsTable, (err) => {
    if (err && !err.message.includes('already exists')) {
      console.warn('⚠️  Could not create notifications table:', err.message);
    } else {
      console.log('✅ Ensured notifications table exists');
    }
    
    // Create indexes
    const createIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);'
    ];
    
    createIndexes.forEach(indexSql => {
      db.run(indexSql, (err) => {
        if (err && !err.message.includes('already exists')) {
          console.warn('⚠️  Index creation warning:', err.message);
        }
      });
    });
  });

  db.run(createCheckInsTable, (err) => {
    if (err && !err.message.includes('already exists')) {
      console.warn('⚠️  Could not create event_check_ins table:', err.message);
    } else {
      console.log('✅ Ensured event_check_ins table exists');
    }

    // Create indexes for check-ins
    const checkInIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_check_ins_event ON event_check_ins(event_id);',
      'CREATE INDEX IF NOT EXISTS idx_check_ins_user ON event_check_ins(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_check_ins_checked_in ON event_check_ins(checked_in_at);'
    ];

    checkInIndexes.forEach(indexSql => {
      db.run(indexSql, (err) => {
        if (err && !err.message.includes('already exists')) {
          console.warn('⚠️  Check-in index creation warning:', err.message);
        }
      });
    });
  });

  db.run(createSubscriptionsTable, (err) => {
    if (err && !err.message.includes('already exists')) {
      console.warn('⚠️  Could not create subscriptions table:', err.message);
    } else {
      console.log('✅ Ensured subscriptions table exists');
    }

    db.run('CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);', (indexErr) => {
      if (indexErr && !indexErr.message.includes('already exists')) {
        console.warn('⚠️  Subscription index creation warning:', indexErr.message);
      }
    });
  });

  db.run(createUserSessionsTable, (err) => {
    if (err && !err.message.includes('already exists')) {
      console.warn('⚠️  Could not create user_sessions table:', err.message);
    } else {
      console.log('✅ Ensured user_sessions table exists');
      db.run('CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);');
      db.run('CREATE INDEX IF NOT EXISTS idx_user_sessions_token_id ON user_sessions(token_id);');
    }
  });

  db.run(createRecoveryCodesTable, (err) => {
    if (err && !err.message.includes('already exists')) {
      console.warn('⚠️  Could not create account_recovery_codes table:', err.message);
    } else {
      console.log('✅ Ensured account_recovery_codes table exists');
      db.run('CREATE INDEX IF NOT EXISTS idx_recovery_codes_user_id ON account_recovery_codes(user_id);');
      db.run('CREATE INDEX IF NOT EXISTS idx_recovery_codes_used_at ON account_recovery_codes(used_at);');
    }
  });

  const createPushSubscriptionsTable = `
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subscription_data TEXT NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, subscription_data)
    );
  `;

  db.run(createPushSubscriptionsTable, (err) => {
    if (err && !err.message.includes('already exists')) {
      console.warn('⚠️  Could not create push_subscriptions table:', err.message);
    } else {
      console.log('✅ Ensured push_subscriptions table exists');
      db.run('CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);');
    }
  });

  const createNotificationDeliveryQueueTable = `
    CREATE TABLE IF NOT EXISTS notification_delivery_queue (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      notification_id TEXT REFERENCES notifications(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      body TEXT,
      url TEXT,
      notification_type VARCHAR(50),
      payload TEXT,
      status VARCHAR(20) DEFAULT 'pending',
      attempts INTEGER DEFAULT 0,
      max_attempts INTEGER DEFAULT 5,
      next_attempt_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_error TEXT,
      sent_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  db.run(createNotificationDeliveryQueueTable, (err) => {
    if (err && !err.message.includes('already exists')) {
      console.warn('⚠️  Could not create notification_delivery_queue table:', err.message);
    } else {
      console.log('✅ Ensured notification_delivery_queue table exists');
      db.run('CREATE INDEX IF NOT EXISTS idx_notification_delivery_queue_status ON notification_delivery_queue(status);');
      db.run('CREATE INDEX IF NOT EXISTS idx_notification_delivery_queue_next_attempt ON notification_delivery_queue(next_attempt_at);');
      db.run('CREATE INDEX IF NOT EXISTS idx_notification_delivery_queue_user ON notification_delivery_queue(user_id);');
    }
  });

  // Create notification preferences table
  const createNotificationPreferencesTable = `
    CREATE TABLE IF NOT EXISTS notification_preferences (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      interests_enabled BOOLEAN DEFAULT 1,
      messages_enabled BOOLEAN DEFAULT 1,
      reminders_enabled BOOLEAN DEFAULT 1,
      promotions_enabled BOOLEAN DEFAULT 0,
      push_enabled BOOLEAN DEFAULT 1,
      email_enabled BOOLEAN DEFAULT 1,
      sms_enabled BOOLEAN DEFAULT 0,
      reminder_hours_before INTEGER DEFAULT 24,
      quiet_hours_start INTEGER DEFAULT 22,
      quiet_hours_end INTEGER DEFAULT 8,
      quiet_hours_enabled BOOLEAN DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  db.run(createNotificationPreferencesTable, (err) => {
    if (err && !err.message.includes('already exists')) {
      console.warn('⚠️  Could not create notification_preferences table:', err.message);
    } else {
      console.log('✅ Ensured notification_preferences table exists');
    }

    db.run('CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);', (indexErr) => {
      if (indexErr && !indexErr.message.includes('already exists')) {
        console.warn('⚠️  Notification preferences index creation warning:', indexErr.message);
      }
    });
  });

  db.run(createReliabilityPenaltyLogTable, (err) => {
    if (err && !err.message.includes('already exists')) {
      console.warn('⚠️  Could not create reliability_penalty_log table:', err.message);
    } else {
      console.log('✅ Ensured reliability_penalty_log table exists');
    }

    db.run(
      'CREATE INDEX IF NOT EXISTS idx_reliability_penalty_log_user_id ON reliability_penalty_log(user_id);',
      (indexErr) => {
        if (indexErr && !indexErr.message.includes('already exists')) {
          console.warn('⚠️  Reliability penalty index warning:', indexErr.message);
        }
      }
    );
  });

  // Add reminder_sent column to event_applications if it doesn't exist
  db.run('ALTER TABLE event_applications ADD COLUMN reminder_sent BOOLEAN DEFAULT 0;', (err) => {
    if (err && !err.message.includes('duplicate column') && !err.message.includes('already exists')) {
      // Ignore errors if column already exists
    }
  });

  // Add followup_sent column to event_applications if it doesn't exist
  db.run('ALTER TABLE event_applications ADD COLUMN followup_sent BOOLEAN DEFAULT 0;', (err) => {
    if (err && !err.message.includes('duplicate column') && !err.message.includes('already exists')) {
      // Ignore errors if column already exists
    }
  });

  // Create OTP codes table for authentication
  const createOtpCodesTable = `
    CREATE TABLE IF NOT EXISTS otp_codes (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      code VARCHAR(6) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      attempts INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  db.run(createOtpCodesTable, (err) => {
    if (err && !err.message.includes('already exists')) {
      console.warn('⚠️  Could not create otp_codes table:', err.message);
    } else {
      console.log('✅ Ensured otp_codes table exists');
      db.run('CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_codes(email);');
      db.run('CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON otp_codes(expires_at);');
    }
  });

  // Create fraud detection tables
  const createFraudScoresTable = `
    CREATE TABLE IF NOT EXISTS fraud_scores (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      risk_score INTEGER DEFAULT 0,
      behavior_score INTEGER DEFAULT 100,
      identity_score INTEGER DEFAULT 50,
      payment_score INTEGER DEFAULT 100,
      verification_status VARCHAR(50) DEFAULT 'unverified',
      flags_count INTEGER DEFAULT 0,
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  const createAccountFlagsTable = `
    CREATE TABLE IF NOT EXISTS account_flags (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      flag_type VARCHAR(50) NOT NULL,
      severity VARCHAR(20) DEFAULT 'medium',
      description TEXT,
      action_taken VARCHAR(50) DEFAULT 'none',
      reviewed BOOLEAN DEFAULT 0,
      reviewed_by TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(reviewed_by) REFERENCES users(id) ON DELETE SET NULL
    );
  `;

  const createFraudLogsTable = `
    CREATE TABLE IF NOT EXISTS fraud_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      event_type VARCHAR(100) NOT NULL,
      description TEXT,
      metadata TEXT,
      ip_address VARCHAR(50),
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  const createSuspiciousActivitiesTable = `
    CREATE TABLE IF NOT EXISTS suspicious_activities (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      activity_type VARCHAR(100) NOT NULL,
      description TEXT,
      confidence_score INTEGER DEFAULT 0,
      resolved BOOLEAN DEFAULT 0,
      resolution_reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      resolved_at TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  db.run(createFraudScoresTable, (err) => {
    if (err && !err.message.includes('already exists')) {
      console.warn('⚠️  Could not create fraud_scores table:', err.message);
    } else {
      console.log('✅ Ensured fraud_scores table exists');
      db.run('CREATE INDEX IF NOT EXISTS idx_fraud_scores_user_id ON fraud_scores(user_id);');
      db.run('CREATE INDEX IF NOT EXISTS idx_fraud_scores_risk_score ON fraud_scores(risk_score);');
    }
  });

  db.run(createAccountFlagsTable, (err) => {
    if (err && !err.message.includes('already exists')) {
      console.warn('⚠️  Could not create account_flags table:', err.message);
    } else {
      console.log('✅ Ensured account_flags table exists');
      db.run('CREATE INDEX IF NOT EXISTS idx_account_flags_user_id ON account_flags(user_id);');
      db.run('CREATE INDEX IF NOT EXISTS idx_account_flags_reviewed ON account_flags(reviewed);');
      db.run('CREATE INDEX IF NOT EXISTS idx_account_flags_severity ON account_flags(severity);');
    }
  });

  db.run(createFraudLogsTable, (err) => {
    if (err && !err.message.includes('already exists')) {
      console.warn('⚠️  Could not create fraud_logs table:', err.message);
    } else {
      console.log('✅ Ensured fraud_logs table exists');
      db.run('CREATE INDEX IF NOT EXISTS idx_fraud_logs_user_id ON fraud_logs(user_id);');
      db.run('CREATE INDEX IF NOT EXISTS idx_fraud_logs_event_type ON fraud_logs(event_type);');
      db.run('CREATE INDEX IF NOT EXISTS idx_fraud_logs_created_at ON fraud_logs(created_at);');
    }
  });

  db.run(createSuspiciousActivitiesTable, (err) => {
    if (err && !err.message.includes('already exists')) {
      console.warn('⚠️  Could not create suspicious_activities table:', err.message);
    } else {
      console.log('✅ Ensured suspicious_activities table exists');
      db.run('CREATE INDEX IF NOT EXISTS idx_suspicious_activities_user_id ON suspicious_activities(user_id);');
      db.run('CREATE INDEX IF NOT EXISTS idx_suspicious_activities_resolved ON suspicious_activities(resolved);');
    }
  });

  const createAdminDashboardItemsTable = `
    CREATE TABLE IF NOT EXISTS admin_dashboard_items (
      id TEXT PRIMARY KEY,
      item_type VARCHAR(50) NOT NULL,
      title TEXT NOT NULL,
      summary TEXT,
      severity VARCHAR(20) DEFAULT 'standard',
      status VARCHAR(20) DEFAULT 'open',
      payload TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  db.run(createAdminDashboardItemsTable, (err) => {
    if (err && !err.message.includes('already exists')) {
      console.warn('⚠️  Could not create admin_dashboard_items table:', err.message);
    } else {
      console.log('✅ Ensured admin_dashboard_items table exists');
      db.run('CREATE INDEX IF NOT EXISTS idx_admin_dashboard_items_item_type ON admin_dashboard_items(item_type);');
      db.run('CREATE INDEX IF NOT EXISTS idx_admin_dashboard_items_severity ON admin_dashboard_items(severity);');
      db.run('CREATE INDEX IF NOT EXISTS idx_admin_dashboard_items_status ON admin_dashboard_items(status);');
    }
  });

  db.all(
    `SELECT user_id, profile_photos
     FROM user_profiles
     WHERE (avatar_image IS NULL OR avatar_image = '') AND profile_photos IS NOT NULL`,
    [],
    (err, rows = []) => {
      if (err) {
        console.warn('⚠️  Could not backfill avatar images:', err.message);
        return;
      }

      rows.forEach((row) => {
        let profilePhotos = [];

        if (Array.isArray(row.profile_photos)) {
          profilePhotos = row.profile_photos;
        } else if (typeof row.profile_photos === 'string' && row.profile_photos.trim()) {
          try {
            const parsed = JSON.parse(row.profile_photos);
            if (Array.isArray(parsed)) {
              profilePhotos = parsed;
            }
          } catch {
            profilePhotos = row.profile_photos
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean);
          }
        }

        const avatarImage = profilePhotos[0];
        if (!avatarImage) {
          return;
        }

        db.run(
          `UPDATE user_profiles
           SET avatar_image = ?, updated_at = CURRENT_TIMESTAMP
           WHERE user_id = ? AND (avatar_image IS NULL OR avatar_image = '')`,
          [avatarImage, row.user_id],
          (updateErr) => {
            if (updateErr && !updateErr.message.includes('already exists')) {
              console.warn('⚠️  Could not backfill avatar image for user:', row.user_id, updateErr.message);
            }
          }
        );
      });
    }
  );
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase()
    .then(() => {
      console.log('✅ Database initialized');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Database initialization failed:', err);
      process.exit(1);
    });
}
