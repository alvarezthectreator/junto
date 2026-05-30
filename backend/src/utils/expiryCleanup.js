import { query } from '../db/connection.js';

// Run event expiry cleanup
export async function cleanupExpiredEvents() {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Mark events as expired if their date has passed
    await query(
      `UPDATE events SET status = 'expired' WHERE event_date < ? AND status = 'active'`,
      [today]
    );

    console.log('✅ Event expiry cleanup completed');
  } catch (error) {
    console.error('❌ Event expiry cleanup failed:', error);
  }
}

// Schedule cleanup every hour
export function startExpiryCleanupScheduler() {
  // Run immediately on startup
  cleanupExpiredEvents();

  // Run every hour
  setInterval(cleanupExpiredEvents, 60 * 60 * 1000);

  console.log('🔄 Event expiry scheduler started (checks every hour)');
}
