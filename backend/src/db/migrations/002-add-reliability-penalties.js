/**
 * Migration: Add reliability score and cancellation penalty log
 * Safe to run against PostgreSQL production databases.
 */

import { query } from '../connection.js';

export async function up() {
  try {
    console.log('🔄 Running migration: Add reliability penalties...');

    await query(
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS reliability_score NUMERIC DEFAULT 100;'
    );

    await query(`
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
    `);

    await query(
      'CREATE INDEX IF NOT EXISTS idx_reliability_penalty_log_user_id ON reliability_penalty_log(user_id);'
    );

    console.log('✅ Reliability penalties migration completed successfully');
  } catch (error) {
    console.error('❌ Reliability penalties migration failed:', error);
    throw error;
  }
}

export async function down() {
  try {
    console.log('🔄 Rolling back reliability penalties migration...');
    await query('DROP TABLE IF EXISTS reliability_penalty_log CASCADE;');
    console.log('✅ Rollback completed successfully');
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  }
}
