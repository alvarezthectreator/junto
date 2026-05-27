import express from 'express';
import { query } from '../db/connection.js';

const router = express.Router();

// Admin migration endpoint - adds missing tables to production database
router.post('/run-migrations', async (req, res) => {
  try {
    console.log('🔄 Running migrations...');
    
    // Create notifications table - works with both SQLite and PostgreSQL
    const createNotifications = `
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
    
    await query(createNotifications);
    console.log('✅ Created notifications table');
    
    // Create indexes
    try {
      await query('CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);');
      await query('CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);');
      console.log('✅ Created notifications indexes');
    } catch (indexError) {
      console.log('ℹ️  Indexes may already exist:', indexError.message);
    }
    
    res.json({ 
      success: true, 
      message: 'Migrations completed successfully' 
    });
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    // If table already exists, still return success
    if (error.message && error.message.includes('already exists')) {
      return res.json({ 
        success: true, 
        message: 'Notifications table already exists' 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;
