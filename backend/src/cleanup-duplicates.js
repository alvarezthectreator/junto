import { query } from './db/connection.js';

/**
 * Script to find and remove duplicate events
 * Usage: node src/cleanup-duplicates.js
 */

async function findDuplicateEvents() {
  try {
    console.log('🔍 Scanning for duplicate events...\n');

    // Find events with same host, title, date, and time (potential duplicates)
    const result = await query(
      `SELECT 
        host_id, 
        title, 
        event_date, 
        event_time,
        location_city,
        COUNT(*) as count,
        GROUP_CONCAT(id, ', ') as ids,
        GROUP_CONCAT(created_at, ', ') as created_times
      FROM events
      WHERE status = 'active'
      GROUP BY host_id, title, event_date, event_time, location_city
      HAVING COUNT(*) > 1
      ORDER BY host_id, title, event_date`
    );

    if (result.rows.length === 0) {
      console.log('✅ No duplicate events found!');
      return;
    }

    console.log(`Found ${result.rows.length} duplicate event group(s):\n`);

    for (const dup of result.rows) {
      const ids = dup.ids.split(', ');
      console.log(`📌 Event: "${dup.title}"`);
      console.log(`   Host ID: ${dup.host_id}`);
      console.log(`   Date: ${dup.event_date} at ${dup.event_time}`);
      console.log(`   Location: ${dup.location_city}`);
      console.log(`   Count: ${dup.count} duplicates`);
      console.log(`   IDs: ${dup.ids}`);
      console.log(`   Created: ${dup.created_times}`);
      console.log();

      // Keep the first (oldest) one, delete the others
      const idsToDelete = ids.slice(1);
      console.log(`   Deleting ${idsToDelete.length} duplicate(s)...\n`);

      for (const idToDelete of idsToDelete) {
        await query('DELETE FROM event_applications WHERE event_id = ?', [idToDelete]);
        await query('DELETE FROM event_saves WHERE event_id = ?', [idToDelete]);
        await query('DELETE FROM events WHERE id = ?', [idToDelete]);
        console.log(`   ✓ Deleted: ${idToDelete}`);
      }
    }

    console.log('\n✅ Cleanup complete!');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

findDuplicateEvents().then(() => process.exit(0));
