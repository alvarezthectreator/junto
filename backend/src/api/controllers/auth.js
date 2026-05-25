import { query } from '../../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

export async function dummyLogin(req, res) {
  try {
    const { phone_number } = req.body;

    if (!phone_number) {
      return res.status(400).json({ error: 'Phone number required' });
    }

    // Get or create user with phone number
    let user = await query('SELECT * FROM users WHERE phone_number = ?', [phone_number]);

    if (!user.rows || user.rows.length === 0) {
      // Create new user
      const userId = uuidv4();
      const profileId = `JNT-2024-${Date.now().toString().slice(-5)}`;
      
      await query(
        `INSERT INTO users (id, phone_number, full_name, display_name, profile_id)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, phone_number, `User ${phone_number.slice(-4)}`, `User_${Date.now().toString().slice(-4)}`, profileId]
      );

      // Create profile
      const profileId2 = uuidv4();
      await query(
        `INSERT INTO user_profiles (id, user_id, last_active) VALUES (?, ?, CURRENT_TIMESTAMP)`,
        [profileId2, userId]
      );

      user = { rows: [{ id: userId, phone_number, display_name: `User_${Date.now().toString().slice(-4)}`, profile_id: profileId }] };
    }

    // Return user with dummy session token
    res.json({
      success: true,
      user: {
        id: user.rows[0].id,
        phone_number: user.rows[0].phone_number,
        display_name: user.rows[0].display_name,
        profile_id: user.rows[0].profile_id
      },
      session_token: `dummy-session-${uuidv4()}`,
      message: '✅ Logged in successfully (dummy auth)'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function verifySession(req, res) {
  try {
    // For now, just return success - real auth comes later
    res.json({ valid: true, message: 'Session valid' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
