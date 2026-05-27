import express from 'express';
import { query } from '../db/connection.js';

const router = express.Router();

// Admin migration endpoint - adds missing tables to production database
router.post('/run-migrations', async (req, res) => {
  try {
    console.log('🔄 Running migrations...');
    
    // Migration 1: Add notifications table if it doesn't exist
    const checkTable = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications'
      );
    `;
    
    const result = await query(checkTable);
    
    if (result.rows[0].exists) {
      return res.json({ 
        success: true, 
        message: 'Notifications table already exists' 
      });
    }
    
    // Create notifications table
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
    await query('CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);');
    await query('CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);');
    console.log('✅ Created notifications indexes');
    
    res.json({ 
      success: true, 
      message: 'Migrations completed successfully' 
    });
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;
