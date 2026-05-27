/**
 * Migration: Add notifications table to PostgreSQL database
 * This migration adds the missing notifications table that was causing deleteEvent failures
 */

import { query } from '../connection.js';

export async function up() {
  try {
    console.log('🔄 Running migration: Add notifications table...');
    
    // Check if table already exists
    const checkTable = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'notifications'
      );
    `;
    
    const result = await query(checkTable);
    
    if (result.rows[0].exists) {
      console.log('✅ Notifications table already exists, skipping...');
      return;
    }
    
    // Create notifications table
    const createTable = `
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
    
    await query(createTable);
    console.log('✅ Created notifications table');
    
    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);'
    ];
    
    for (const indexSql of indexes) {
      await query(indexSql);
    }
    
    console.log('✅ Created notifications indexes');
    console.log('✅ Migration completed successfully');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

export async function down() {
  try {
    console.log('🔄 Rolling back: Drop notifications table...');
    await query('DROP TABLE IF EXISTS notifications CASCADE;');
    console.log('✅ Rollback completed successfully');
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  }
}
