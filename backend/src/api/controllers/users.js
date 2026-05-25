import { query } from '../../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

export async function getUserById(req, res) {
  try {
    const { userId } = req.params;

    const result = await query(
      `SELECT u.*, up.interests, up.profile_photos, up.travel_mode_enabled, up.travel_destination_city
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE u.id = ?`,
      [userId]
    );

    if (!result.rows || result.rows.length === 0) {
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
       WHERE u.id = ?`,
      [userId]
    );

    if (!result.rows || result.rows.length === 0) {
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
                         updated_at = CURRENT_TIMESTAMP
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
                                  updated_at = CURRENT_TIMESTAMP
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

    if (city) {
      sql += ` AND u.city = ?`;
      params.push(city);
    }

    sql += ` LIMIT ? OFFSET ?`;
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
