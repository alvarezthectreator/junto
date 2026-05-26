import { query } from '../../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

export async function getNearbyUsers(req, res) {
  try {
    const { userId } = req.params;
    const { limit = 50, radius = 5 } = req.query;

    // Get user's city
    const userRes = await query('SELECT city FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userCity = userRes.rows[0].city;

    // Get users in same city, excluding self and already swiped
    const result = await query(
      `SELECT DISTINCT u.* FROM users u
       LEFT JOIN swipes s ON u.id = s.swiped_user_id AND s.swiper_id = $1
       LEFT JOIN blocked_users b ON (u.id = b.blocked_user_id AND b.blocker_id = $1)
              OR (u.id = b.blocker_id AND b.blocked_user_id = $1)
       WHERE u.city = $2 AND u.id != $1 AND s.id IS NULL AND b.id IS NULL
       LIMIT $3`,
      [userId, userCity, limit]
    );

    res.json({ nearby_users: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function swipeUser(req, res) {
  try {
    const { swiper_id, swiped_user_id, direction } = req.body;

    if (!swiper_id || !swiped_user_id || !['right', 'left'].includes(direction)) {
      return res.status(400).json({ error: 'Invalid swipe data' });
    }

    // Record swipe
    const swipeId = uuidv4();
    await query(
      `INSERT INTO swipes (id, swiper_id, swiped_user_id, direction)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (swiper_id, swiped_user_id) DO UPDATE SET direction = $4`,
      [swipeId, swiper_id, swiped_user_id, direction]
    );

    // Check for mutual match
    if (direction === 'right') {
      const mutualSwipe = await query(
        `SELECT * FROM swipes WHERE swiper_id = $1 AND swiped_user_id = $2 AND direction = 'right'`,
        [swiped_user_id, swiper_id]
      );

      if (mutualSwipe.rows.length > 0) {
        // Create match
        await query(
          `INSERT INTO matches (user1_id, user2_id) VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [swiper_id, swiped_user_id]
        );

        // Create conversation
        const convId = uuidv4();
        await query(
          `INSERT INTO conversations (id, user1_id, user2_id) VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`,
          [convId, swiper_id, swiped_user_id]
        );

        // Notify both users
        const swiperRes = await query('SELECT display_name FROM users WHERE id = $1', [swiper_id]);
        const swiped_res = await query('SELECT display_name FROM users WHERE id = $1', [swiped_user_id]);

        await query(
          `INSERT INTO notifications (user_id, notification_type, related_user_id, title, body)
           VALUES ($1, $2, $3, $4, $5), ($6, $7, $8, $9, $10)`,
          [
            swiped_user_id, 'match', swiper_id, '❤️ It\'s a Match!', `You matched with ${swiperRes.rows[0]?.display_name || 'someone'}!`,
            swiper_id, 'match', swiped_user_id, '❤️ It\'s a Match!', `You matched with ${swiped_res.rows[0]?.display_name || 'someone'}!`
          ]
        );

        return res.json({ match: true, message: '✅ It\'s a match!' });
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

    const result = await query(
      `SELECT CASE WHEN m.user1_id = $1 THEN m.user2_id ELSE m.user1_id END as matched_user_id,
              u.display_name, u.profile_id, u.bio, u.city,
              m.matched_at
       FROM matches m
       LEFT JOIN users u ON (CASE WHEN m.user1_id = $1 THEN m.user2_id ELSE m.user1_id END) = u.id
       WHERE m.user1_id = $1 OR m.user2_id = $1
       ORDER BY m.matched_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    res.json({ matches: result.rows });
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
       WHERE s.swiper_id = $1
       ORDER BY s.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    res.json({ swipes: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
