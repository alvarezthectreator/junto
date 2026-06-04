import { query } from '../../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

function buildNearbyLocationScope(city) {
  const normalized = String(city || '').trim().toLowerCase();

  if (!normalized) {
    return [];
  }

  // Lagos is the only onboarding location in the app that commonly needs
  // broader "same state" matching instead of a strict city match.
  if (normalized === 'lagos' || normalized === 'lagos state') {
    return [
      'lagos',
      'lagos state',
      'ikeja',
      'lekki',
      'ikoyi',
      'victoria island',
      'victoria island (vi)',
      'vi',
      'yaba',
      'surulere',
      'ajah',
      'festac',
      'ikorodu',
      'badagry',
      'epe',
      'mushin',
      'agege',
      'ojo',
      'ilupeju',
      'ibeju-lekki',
      'ibeju lekki',
    ];
  }

  return [normalized];
}

export async function getNearbyUsers(req, res) {
  try {
    const { userId } = req.params;
    const { limit = 50, radius = 5 } = req.query;

    // Get user's city
    const userRes = await query('SELECT city FROM users WHERE id = ?', [userId]);
    if (!userRes.rows || userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userCity = userRes.rows[0].city;
    const locationScope = buildNearbyLocationScope(userCity);

    // Get users in same city, excluding self and already swiped
    const placeholders = locationScope.map(() => '?').join(', ');
    const result = await query(
      `SELECT DISTINCT u.* FROM users u
       LEFT JOIN swipes s ON u.id = s.swiped_user_id AND s.swiper_id = ?
       LEFT JOIN blocked_users b ON (u.id = b.blocked_user_id AND b.blocker_id = ?)
              OR (u.id = b.blocker_id AND b.blocked_user_id = ?)
       WHERE LOWER(COALESCE(u.city, '')) IN (${placeholders})
       AND u.id != ? AND s.id IS NULL AND b.id IS NULL
       LIMIT ?`,
      [userId, userId, userId, ...locationScope, userId, limit]
    );

    res.json({ nearby_users: result.rows || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function swipeUser(req, res) {
  try {
    const { user_id, swiped_user_id, direction } = req.body;

    if (!user_id || !swiped_user_id || !['right', 'left'].includes(direction)) {
      return res.status(400).json({ error: 'Invalid swipe data' });
    }

    // Check if swipe already exists
    const existingSwipe = await query(
      `SELECT id FROM swipes WHERE swiper_id = ? AND swiped_user_id = ?`,
      [user_id, swiped_user_id]
    );

    const swipeId = uuidv4();
    
    if (existingSwipe.rows && existingSwipe.rows.length > 0) {
      // Update existing swipe
      await query(
        `UPDATE swipes SET direction = ? WHERE swiper_id = ? AND swiped_user_id = ?`,
        [direction, user_id, swiped_user_id]
      );
    } else {
      // Insert new swipe
      await query(
        `INSERT INTO swipes (id, swiper_id, swiped_user_id, direction, created_at)
         VALUES (?, ?, ?, ?, datetime('now'))`,
        [swipeId, user_id, swiped_user_id, direction]
      );
    }

    // Check for mutual match
    if (direction === 'right') {
      const mutualSwipe = await query(
        `SELECT id FROM swipes WHERE swiper_id = ? AND swiped_user_id = ? AND direction = 'right'`,
        [swiped_user_id, user_id]
      );

      if (mutualSwipe.rows && mutualSwipe.rows.length > 0) {
        // Check if match already exists
        const existingMatch = await query(
          `SELECT id FROM matches WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)`,
          [user_id, swiped_user_id, swiped_user_id, user_id]
        );

        if (!existingMatch.rows || existingMatch.rows.length === 0) {
          // Create match
          const matchId = uuidv4();
          await query(
            `INSERT INTO matches (id, user1_id, user2_id, matched_at) VALUES (?, ?, ?, datetime('now'))`,
            [matchId, user_id, swiped_user_id]
          );

          // Create conversation
          const convId = uuidv4();
          const existingConv = await query(
            `SELECT id FROM conversations WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)`,
            [user_id, swiped_user_id, swiped_user_id, user_id]
          );
          
          if (!existingConv.rows || existingConv.rows.length === 0) {
            await query(
              `INSERT INTO conversations (id, user1_id, user2_id, created_at) VALUES (?, ?, ?, datetime('now'))`,
              [convId, user_id, swiped_user_id]
            );
          }

          // Notify both users
          const swiperRes = await query('SELECT display_name FROM users WHERE id = ?', [user_id]);
          const swipedRes = await query('SELECT display_name FROM users WHERE id = ?', [swiped_user_id]);

          const notif1Id = uuidv4();
          const notif2Id = uuidv4();
          
          await query(
            `INSERT INTO notifications (id, user_id, notification_type, related_user_id, title, body, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
            [notif1Id, swiped_user_id, 'match', user_id, '❤️ It\'s a Match!', `You matched with ${swiperRes.rows && swiperRes.rows[0] ? swiperRes.rows[0].display_name : 'someone'}!`]
          );

          await query(
            `INSERT INTO notifications (id, user_id, notification_type, related_user_id, title, body, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
            [notif2Id, user_id, 'match', swiped_user_id, '❤️ It\'s a Match!', `You matched with ${swipedRes.rows && swipedRes.rows[0] ? swipedRes.rows[0].display_name : 'someone'}!`]
          );

          return res.json({ match: true, message: '✅ It\'s a match!' });
        }
      }
    }

    res.json({ match: false, message: '✅ Swipe recorded' });
  } catch (error) {
    console.error('Swipe error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function getMatches(req, res) {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;

    // SQLite doesn't support CASE in SELECT for this, so we'll query differently
    const result = await query(
      `SELECT m.user1_id, m.user2_id, u.display_name, u.profile_id, u.bio, u.city, m.matched_at
       FROM matches m
       LEFT JOIN users u ON CASE WHEN m.user1_id = ? THEN m.user2_id ELSE m.user1_id END = u.id
       WHERE m.user1_id = ? OR m.user2_id = ?
       ORDER BY m.matched_at DESC
       LIMIT ?`,
      [userId, userId, userId, limit]
    );

    // Process results to get matched_user_id
    const matches = (result.rows || []).map(row => ({
      matched_user_id: row.user1_id === userId ? row.user2_id : row.user1_id,
      display_name: row.display_name,
      profile_id: row.profile_id,
      bio: row.bio,
      city: row.city,
      matched_at: row.matched_at
    }));

    res.json({ matches });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getSwipeHistory(req, res) {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;

    const result = await query(
      `SELECT s.*, u.display_name, u.profile_id FROM swipes s
       LEFT JOIN users u ON s.swiped_user_id = u.id
       WHERE s.swiper_id = ?
       ORDER BY s.created_at DESC
       LIMIT ?`,
      [userId, limit]
    );

    res.json({ swipes: result.rows || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
