import { query } from '../../db/connection.js';
import { v4 as uuidv4 } from 'uuid';
import { createNotification } from '../../services/notificationService.js';

function normalizeProfilePhotos(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).map(String);
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean).map(String);
      }
    } catch {
      return value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function enrichNearbyUser(row) {
  if (!row || typeof row !== 'object') {
    return row;
  }

  const profilePhotos = normalizeProfilePhotos(row.profile_photos);
  const avatarImage = row.avatar_image || row.user_avatar_image || profilePhotos[0] || null;

  return {
    ...row,
    profile_photos: profilePhotos,
    avatar_image: avatarImage,
    avatar_url: avatarImage,
  };
}

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

function buildNearbyLocationPatterns(city) {
  const scope = buildNearbyLocationScope(city);
  if (scope.length === 0) {
    return ['%lagos%'];
  }

  return scope.map((location) => `%${String(location).trim().toLowerCase()}%`);
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
    const locationPatterns = buildNearbyLocationPatterns(userCity);

    // Get users in same city, excluding self and already swiped
    if (locationPatterns.length === 0) {
      return res.json({ nearby_users: [] });
    }

    const locationClauses = locationPatterns.map(() => `LOWER(COALESCE(u.city, '')) LIKE ?`).join(' OR ');
    const result = await query(
      `SELECT DISTINCT
         u.*,
         u.avatar_image AS user_avatar_image,
         up.avatar_image,
         up.profile_photos,
         up.interests,
         up.last_active,
         COALESCE(fs.risk_score, 0) AS risk_score,
         COALESCE(fs.behavior_score, 0) AS behavior_score,
         COALESCE(fs.identity_score, 0) AS identity_score,
         COALESCE(fs.verification_status, 'unverified') AS fraud_verification_status,
         COALESCE(fs.flags_count, 0) AS flags_count
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       LEFT JOIN fraud_scores fs ON u.id = fs.user_id
       WHERE (${locationClauses})
       AND u.id != ?
       ORDER BY COALESCE(fs.risk_score, 0) ASC, u.created_at DESC
       LIMIT ?`,
      [userId, ...locationPatterns, userId, limit]
    );

    res.json({ nearby_users: (result.rows || []).map(enrichNearbyUser) });
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

          await createNotification({
            userId: swiped_user_id,
            notificationType: 'match',
            title: '❤️ It\'s a Match!',
            body: `You matched with ${swiperRes.rows && swiperRes.rows[0] ? swiperRes.rows[0].display_name : 'someone'}!`,
            relatedUserId: user_id,
            payload: {
              matchUserId: user_id,
              title: '❤️ It\'s a Match!',
              body: `You matched with ${swiperRes.rows && swiperRes.rows[0] ? swiperRes.rows[0].display_name : 'someone'}!`,
              url: '/matches',
            },
            url: '/matches',
          });

          await createNotification({
            userId: user_id,
            notificationType: 'match',
            title: '❤️ It\'s a Match!',
            body: `You matched with ${swipedRes.rows && swipedRes.rows[0] ? swipedRes.rows[0].display_name : 'someone'}!`,
            relatedUserId: swiped_user_id,
            payload: {
              matchUserId: swiped_user_id,
              title: '❤️ It\'s a Match!',
              body: `You matched with ${swipedRes.rows && swipedRes.rows[0] ? swipedRes.rows[0].display_name : 'someone'}!`,
              url: '/matches',
            },
            url: '/matches',
          });

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
