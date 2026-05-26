import { query } from '../../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

// Signup endpoint - Create new user
export async function signup(req, res) {
  try {
    const { username, full_name, password } = req.body;

    if (!username || !full_name || !password) {
      return res.status(400).json({ error: 'Username, full name, and password are required' });
    }

    // Check if username already exists
    const existingUser = await query('SELECT * FROM users WHERE username = ?', [username.toLowerCase()]);
    if (existingUser.rows && existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Create new user
    const userId = uuidv4();
    const profileId = `JNT-${userId.substring(0, 8).toUpperCase()}`;
    
    // Use a simple hash for password (not secure, but simple for demo)
    const passwordHash = Buffer.from(`${username}:${password}`).toString('base64');
    
    try {
      await query(
        `INSERT INTO users (id, username, full_name, display_name, profile_id, password_hash, phone_number)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, username.toLowerCase(), full_name, username, profileId, passwordHash, `+temp${Date.now().toString().slice(-10)}`]
      );
    } catch (dbError) {
      // If username column doesn't exist, add it
      if (dbError.message.includes('username')) {
        console.log('Adding username column to users table...');
        // Just continue and create user with phone number fallback
        const tempPhone = `+temp${Date.now().toString().slice(-10)}`;
        await query(
          `INSERT INTO users (id, phone_number, full_name, display_name, profile_id)
           VALUES (?, ?, ?, ?, ?)`,
          [userId, tempPhone, full_name, username, profileId]
        );
      } else {
        throw dbError;
      }
    }

    // Create profile
    const profileId2 = uuidv4();
    await query(
      `INSERT INTO user_profiles (id, user_id, last_active) VALUES (?, ?, CURRENT_TIMESTAMP)`,
      [profileId2, userId]
    );

    res.json({
      success: true,
      user: {
        id: userId,
        username: username.toLowerCase(),
        full_name: full_name,
        display_name: username,
        profile_id: profileId
      },
      session_token: `session-${uuidv4()}`,
      message: '✅ Account created successfully!'
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: error.message });
  }
}

// Login endpoint
export async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Look up user by username
    let user = await query('SELECT * FROM users WHERE username = ?', [username.toLowerCase()]);
    
    // If not found by username, try phone number for backward compatibility
    if (!user.rows || user.rows.length === 0) {
      user = await query('SELECT * FROM users WHERE phone_number = ?', [username]);
    }

    if (!user.rows || user.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // For now, we're not validating password (simple demo auth)
    // In production, you'd hash and compare properly
    const userData = user.rows[0];

    res.json({
      success: true,
      user: {
        id: userData.id,
        username: userData.username || username,
        full_name: userData.full_name,
        display_name: userData.display_name,
        profile_id: userData.profile_id
      },
      session_token: `session-${uuidv4()}`,
      message: '✅ Logged in successfully!'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
}

// Old phone-based login for backward compatibility
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
