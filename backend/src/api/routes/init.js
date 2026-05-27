import express from 'express';
import db from '../../db/connection.js';

const router = express.Router();

// Initialize missing tables for production database
router.post('/ensure-tables', (req, res) => {
  try {
    console.log('🔧 Ensuring production tables exist...');
    
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
    
    db.run(createNotificationsTable, (err) => {
      if (err && !err.message.includes('already exists')) {
        console.error('❌ Error creating notifications table:', err.message);
        return res.status(500).json({ error: 'Failed to create notifications table', details: err.message });
      }
      
      console.log('✅ Notifications table ensured');
      
      // Create indexes
      const createIndexes = [
        'CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);',
        'CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);'
      ];
      
      let indexCount = 0;
      createIndexes.forEach(indexSql => {
        db.run(indexSql, (err) => {
          indexCount++;
          if (err && !err.message.includes('already exists')) {
            console.warn('⚠️  Index creation warning:', err.message);
          } else {
            console.log('✅ Index created');
          }
          
          // Send response after all operations complete
          if (indexCount === createIndexes.length) {
            res.json({ success: true, message: '✅ Tables and indexes ensured' });
          }
        });
      });
    });
  } catch (error) {
    console.error('❌ Error in ensure-tables:', error);
    res.status(500).json({ error: 'Failed to ensure tables', details: error.message });
  }
});

export default router;
