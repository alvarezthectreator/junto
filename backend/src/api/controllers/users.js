import { query } from '../../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

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

function enrichProfileRow(row) {
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

async function getReferralStats(userId) {
  const [userResult, countResult, referredUsersResult] = await Promise.all([
    query('SELECT id, profile_id FROM users WHERE id = $1', [userId]),
    query('SELECT COUNT(*) AS referral_count FROM users WHERE referred_by_user_id = $1', [userId]),
    query(
      `SELECT id, username, display_name, profile_id, created_at
       FROM users
       WHERE referred_by_user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    ),
  ]);

  if (userResult.rows.length === 0) {
    return null;
  }

  return {
    user: userResult.rows[0],
    referralCount: Number(countResult.rows[0]?.referral_count || 0),
    referredUsers: referredUsersResult.rows,
  };
}

export async function getUserById(req, res) {
  try {
    const { userId } = req.params;

    const result = await query(
      `SELECT u.*, u.avatar_image AS user_avatar_image, up.interests, up.avatar_image, up.profile_photos, up.travel_mode_enabled, up.travel_destination_city
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: enrichProfileRow(result.rows[0]) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getUserProfile(req, res) {
  try {
    const { userId } = req.params;

    const result = await query(
      `SELECT u.*, u.avatar_image AS user_avatar_image, up.interests, up.avatar_image, up.profile_photos, up.travel_mode_enabled, up.travel_destination_city, up.last_active
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ profile: enrichProfileRow(result.rows[0]) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateUserProfile(req, res) {
  try {
    const { userId } = req.params;
    const {
      display_name,
      bio,
      gender,
      city,
      occupation,
      interests,
      avatar_image,
      travel_mode_enabled,
      travel_destination_city,
      profile_photos,
      intro_video_url,
      date_of_birth,
    } = req.body;

    // Update user table
    if (display_name || bio || gender || city || occupation || avatar_image !== undefined || intro_video_url || date_of_birth) {
      const updates = [];
      const params = [];
      let paramCount = 1;

      if (display_name) {
        updates.push(`display_name = $${paramCount}`);
        params.push(display_name);
        paramCount++;
      }
      if (bio) {
        updates.push(`bio = $${paramCount}`);
        params.push(bio);
        paramCount++;
      }
      if (gender) {
        updates.push(`gender = $${paramCount}`);
        params.push(gender);
        paramCount++;
      }
      if (city) {
        updates.push(`city = $${paramCount}`);
        params.push(city);
        paramCount++;
      }
      if (occupation) {
        updates.push(`occupation = $${paramCount}`);
        params.push(occupation);
        paramCount++;
      }
      if (avatar_image !== undefined) {
        updates.push(`avatar_image = $${paramCount}`);
        params.push(avatar_image || null);
        paramCount++;
      }
      if (intro_video_url !== undefined) {
        updates.push(`intro_video_url = $${paramCount}`);
        params.push(intro_video_url || null);
        paramCount++;
      }
      if (date_of_birth) {
        updates.push(`date_of_birth = $${paramCount}`);
        params.push(date_of_birth);
        paramCount++;
      }

      if (updates.length > 0) {
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        params.push(userId);
        
        await query(
          `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}`,
          params
        );
      }
    }

    // Update user_profiles table
    if (
      interests !== undefined ||
      avatar_image !== undefined ||
      travel_mode_enabled !== undefined ||
      travel_destination_city !== undefined ||
      profile_photos !== undefined
    ) {
      await query(
        `INSERT INTO user_profiles (id, user_id, last_active, created_at, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT(user_id) DO NOTHING`,
        [uuidv4(), userId]
      );

      const updates = [];
      const params = [];
      let paramCount = 1;

      if (interests !== undefined) {
        updates.push(`interests = $${paramCount}`);
        params.push(JSON.stringify(interests));
        paramCount++;
      }
      if (avatar_image !== undefined) {
        updates.push(`avatar_image = $${paramCount}`);
        params.push(avatar_image || null);
        paramCount++;
      }
      if (travel_mode_enabled !== undefined) {
        updates.push(`travel_mode_enabled = $${paramCount}`);
        params.push(travel_mode_enabled);
        paramCount++;
      }
      if (travel_destination_city) {
        updates.push(`travel_destination_city = $${paramCount}`);
        params.push(travel_destination_city);
        paramCount++;
      }
      if (profile_photos !== undefined) {
        updates.push(`profile_photos = $${paramCount}`);
        params.push(JSON.stringify(profile_photos));
        paramCount++;
      }

      if (updates.length > 0) {
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        params.push(userId);
        
        await query(
          `UPDATE user_profiles SET ${updates.join(', ')} WHERE user_id = $${paramCount}`,
          params
        );
      }
    }

    const refreshed = await query(
      `SELECT u.*, u.avatar_image AS user_avatar_image, up.interests, up.avatar_image, up.profile_photos, up.travel_mode_enabled, up.travel_destination_city, up.last_active
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE u.id = $1`,
      [userId]
    );

    res.json({
      success: true,
      message: 'Profile updated',
      profile: enrichProfileRow(refreshed.rows[0] || null),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function searchUsers(req, res) {
  try {
    const { city, interests, limit = 20, offset = 0 } = req.query;

    let sql = `SELECT u.*, up.interests FROM users u
               LEFT JOIN user_profiles up ON u.id = up.user_id WHERE u.is_active = true`;
    const params = [];
    let paramCount = 1;

    if (city) {
      sql += ` AND u.city = $${paramCount}`;
      params.push(city);
      paramCount++;
    }

    sql += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    res.json({ users: result.rows, total: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getTravelModeUsers(req, res) {
  try {
    const { city } = req.params;

    const result = await query(
      `SELECT u.*, up.interests FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE up.travel_mode_enabled = true AND up.travel_destination_city = $1
       AND u.is_active = true`,
      [city]
    );

    res.json({ users: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getReferralInfo(req, res) {
  try {
    const { userId } = req.params;
    const stats = await getReferralStats(userId);

    if (!stats) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      referral: {
        code: stats.user.profile_id,
        link: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/?ref=${encodeURIComponent(stats.user.profile_id)}`,
        referral_count: stats.referralCount,
        referred_users: stats.referredUsers,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function applyCancellationPenalty(req, res) {
  try {
    const authUserId = req.user?.id;
    const { user_id, event_id, penalty_percent, reason } = req.body || {};

    const targetUserId = user_id || authUserId;

    if (!authUserId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!targetUserId || !event_id) {
      return res.status(400).json({ error: 'user_id and event_id are required' });
    }

    if (targetUserId !== authUserId) {
      return res.status(403).json({ error: 'You can only update your own reliability score' });
    }

    const penalty = Number(penalty_percent);
    if (!Number.isFinite(penalty) || penalty <= 0) {
      return res.status(400).json({ error: 'penalty_percent must be a positive number' });
    }

    const userResult = await query(
      'SELECT id, reliability_score FROM users WHERE id = $1',
      [targetUserId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const previousScore = Number(userResult.rows[0].reliability_score ?? 100);
    const newScore = Math.max(0, Number((previousScore * (1 - penalty / 100)).toFixed(2)));

    await query(
      'UPDATE users SET reliability_score = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newScore, targetUserId]
    );

    await query(
      `INSERT INTO reliability_penalty_log (
        id, user_id, event_id, penalty_percent, previous_score, new_score, reason, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
      [uuidv4(), targetUserId, event_id, penalty, previousScore, newScore, reason || 'Cancellation penalty']
    );

    res.json({
      success: true,
      new_reliability_score: newScore,
      previous_reliability_score: previousScore,
      message: 'Cancellation penalty applied',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function exportUserData(req, res) {
  try {
    const { userId } = req.params;
    const userResult = await query(
      `SELECT u.*, up.interests, up.profile_photos, up.travel_mode_enabled, up.travel_destination_city, up.last_active
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE u.id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [
      eventsResult,
      applicationsResult,
      messagesResult,
      conversationsResult,
      notificationsResult,
      trustedContactsResult,
      blockedUsersResult,
      reportsResult,
      subscriptionsResult,
      penaltyLogResult,
      referralStats,
    ] = await Promise.all([
      query('SELECT * FROM events WHERE host_id = $1 ORDER BY created_at DESC', [userId]),
      query('SELECT * FROM event_applications WHERE user_id = $1 ORDER BY created_at DESC', [userId]),
      query(
        `SELECT * FROM messages
         WHERE sender_id = $1 OR receiver_id = $1
         ORDER BY created_at DESC`,
        [userId]
      ),
      query(
        `SELECT * FROM conversations
         WHERE user1_id = $1 OR user2_id = $1
         ORDER BY created_at DESC`,
        [userId]
      ),
      query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC', [userId]),
      query('SELECT * FROM trusted_contacts WHERE user_id = $1 ORDER BY created_at DESC', [userId]),
      query(
        `SELECT * FROM blocked_users WHERE blocker_id = $1 OR blocked_user_id = $1 ORDER BY created_at DESC`,
        [userId]
      ),
      query(
        `SELECT * FROM reports WHERE reporter_id = $1 OR reported_user_id = $1 ORDER BY created_at DESC`,
        [userId]
      ),
      query('SELECT * FROM subscriptions WHERE user_id = $1', [userId]),
      query('SELECT * FROM reliability_penalty_log WHERE user_id = $1 ORDER BY created_at DESC', [userId]),
      getReferralStats(userId),
    ]);

    res.json({
      exported_at: new Date().toISOString(),
      account: userResult.rows[0],
      profile: enrichProfileRow(userResult.rows[0]),
      events: eventsResult.rows,
      applications: applicationsResult.rows,
      messages: messagesResult.rows,
      conversations: conversationsResult.rows,
      notifications: notificationsResult.rows,
      trusted_contacts: trustedContactsResult.rows,
      blocked_users: blockedUsersResult.rows,
      reports: reportsResult.rows,
      subscriptions: subscriptionsResult.rows,
      reliability_penalties: penaltyLogResult.rows,
      referral: referralStats
        ? {
            code: referralStats.user.profile_id,
            referral_count: referralStats.referralCount,
            referred_users: referralStats.referredUsers,
          }
        : null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function deleteAccount(req, res) {
  try {
    const { userId } = req.params;

    const existingUser = await query('SELECT id FROM users WHERE id = ?', [userId]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await query('DELETE FROM notifications WHERE user_id = ? OR related_user_id = ?', [userId, userId]);
    await query('DELETE FROM subscriptions WHERE user_id = ?', [userId]);
    await query('DELETE FROM account_recovery_codes WHERE user_id = ?', [userId]);
    await query('DELETE FROM user_sessions WHERE user_id = ?', [userId]);
    await query('DELETE FROM event_applications WHERE user_id = ?', [userId]);
    await query('DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?', [userId, userId]);
    await query('DELETE FROM conversations WHERE user1_id = ? OR user2_id = ?', [userId, userId]);
    await query('DELETE FROM trusted_contacts WHERE user_id = ?', [userId]);
    await query('DELETE FROM safety_alerts WHERE user_id = ?', [userId]);
    await query('DELETE FROM blocked_users WHERE blocker_id = ? OR blocked_user_id = ?', [userId, userId]);
    await query('DELETE FROM reports WHERE reporter_id = ? OR reported_user_id = ?', [userId, userId]);
    await query('UPDATE users SET referred_by_user_id = NULL WHERE referred_by_user_id = ?', [userId]);
    await query('DELETE FROM user_profiles WHERE user_id = ?', [userId]);
    await query('DELETE FROM users WHERE id = ?', [userId]);

    res.json({
      success: true,
      message: '✅ Account deleted',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
