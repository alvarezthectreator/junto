import { query } from './db/connection.js';

/**
 * Script to delete ALL events from the database
 * Keeps users and other data intact
 * Usage: node src/delete-all-events.js
 */

async function deleteAllEvents() {
  try {
    console.log('⚠️  WARNING: This will delete ALL events from the database!');
    console.log('Users and other data will be preserved.\n');

    // Get count before deletion
    const countBefore = await query('SELECT COUNT(*) as count FROM events');
    const eventCount = countBefore.rows[0].count;

    if (eventCount === 0) {
      console.log('✅ No events to delete - database already clean!');
      return;
    }

    console.log(`🗑️  Found ${eventCount} events to delete...\n`);

    // Delete all related data first (cascade)
    console.log('Deleting event applications...');
    const appResult = await query('DELETE FROM event_applications');
    console.log(`✓ Deleted ${appResult.changes || 0} applications\n`);

    console.log('Deleting event saves (wishlist)...');
    const savesResult = await query('DELETE FROM event_saves');
    console.log(`✓ Deleted ${savesResult.changes || 0} saved events\n`);

    console.log('Deleting event ratings...');
    const ratingResult = await query('DELETE FROM event_ratings');
    console.log(`✓ Deleted ${ratingResult.changes || 0} ratings\n`);

    console.log('Deleting all events...');
    const eventResult = await query('DELETE FROM events');
    console.log(`✓ Deleted ${eventResult.changes || 0} events\n`);

    // Verify deletion
    const countAfter = await query('SELECT COUNT(*) as count FROM events');
    const usersCount = await query('SELECT COUNT(*) as count FROM users');
    
    console.log('✅ Cleanup complete!');
    console.log(`   Events remaining: ${countAfter.rows[0].count}`);
    console.log(`   Users preserved: ${usersCount.rows[0].count}`);
    console.log('\n🎉 Ready to create new events!');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

deleteAllEvents().then(() => process.exit(0));
