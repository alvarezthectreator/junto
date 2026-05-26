import { query } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

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
        `UPDATE users SET display_name = COALESCE($1, display_name),
                         bio = COALESCE($2, bio),
                         gender = COALESCE($3, gender),
                         city = COALESCE($4, city),
                         occupation = COALESCE($5, occupation),
                         updated_at = NOW()
         WHERE id = $6`,
        [display_name, bio, gender, city, occupation, userId]
      );
    }

    // Update profile
    if (interests || travel_mode_enabled !== undefined) {
      await query(
        `UPDATE user_profiles SET interests = COALESCE($1, interests),
                                  travel_mode_enabled = COALESCE($2, travel_mode_enabled),
                                  travel_destination_city = COALESCE($3, travel_destination_city),
                                  updated_at = NOW()
         WHERE user_id = $4`,
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
