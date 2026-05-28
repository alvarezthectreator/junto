import { query } from '../../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

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
      `SELECT u.*, up.interests, up.profile_photos, up.travel_mode_enabled, up.travel_destination_city
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getUserProfile(req, res) {
  try {
    const { userId } = req.params;

    const result = await query(
      `SELECT u.*, up.interests, up.profile_photos, up.travel_mode_enabled, up.travel_destination_city, up.last_active
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ profile: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateUserProfile(req, res) {
  try {
    const { userId } = req.params;
    const { display_name, bio, gender, city, occupation, interests, travel_mode_enabled, travel_destination_city } = req.body;

    // Update user
    if (display_name || bio || gender || city || occupation) {
      await query(
        `UPDATE users SET display_name = COALESCE(?, display_name),
                         bio = COALESCE(?, bio),
                         gender = COALESCE(?, gender),
                         city = COALESCE(?, city),
                         occupation = COALESCE(?, occupation),
                         updated_at = datetime('now')
         WHERE id = ?`,
        [display_name, bio, gender, city, occupation, userId]
      );
    }

    // Update profile
    if (interests || travel_mode_enabled !== undefined) {
      await query(
        `UPDATE user_profiles SET interests = COALESCE(?, interests),
                                  travel_mode_enabled = COALESCE(?, travel_mode_enabled),
                                  travel_destination_city = COALESCE(?, travel_destination_city),
                                  updated_at = datetime('now')
         WHERE user_id = ?`,
        [interests ? JSON.stringify(interests) : null, travel_mode_enabled, travel_destination_city, userId]
      );
    }

    res.json({ success: true, message: 'Profile updated' });
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
      getReferralStats(userId),
    ]);

    res.json({
      exported_at: new Date().toISOString(),
      account: userResult.rows[0],
      profile: userResult.rows[0],
      events: eventsResult.rows,
      applications: applicationsResult.rows,
      messages: messagesResult.rows,
      conversations: conversationsResult.rows,
      notifications: notificationsResult.rows,
      trusted_contacts: trustedContactsResult.rows,
      blocked_users: blockedUsersResult.rows,
      reports: reportsResult.rows,
      subscriptions: subscriptionsResult.rows,
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
