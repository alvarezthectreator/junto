import { query } from '../../db/connection.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function dummyLogin(req, res) {
  try {
    const { phone_number } = req.body;

    if (!phone_number) {
      return res.status(400).json({ error: 'Phone number required' });
    }

    // Get or create user with phone number
    let user = await query('SELECT * FROM users WHERE phone_number = $1', [phone_number]);

    if (user.rows.length === 0) {
      // Create new user
      const userId = uuidv4();
      const profileId = `JNT-2024-${Date.now().toString().slice(-5)}`;
      
      const result = await query(
        `INSERT INTO users (id, phone_number, full_name, display_name, profile_id)
         VALUES ($1, $2, $3, $4, $5) RETURNING id, phone_number, display_name, profile_id`,
        [userId, phone_number, `User ${phone_number.slice(-4)}`, `User_${Date.now().toString().slice(-4)}`, profileId]
      );

      // Create profile
      await query(
        `INSERT INTO user_profiles (user_id, last_active) VALUES (?, datetime('now'))`,
        [userId]
      );

      user = result;
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

export async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Find user by username (case-insensitive demo)
    let user = await query('SELECT * FROM users WHERE username = ?', [username.toLowerCase()]);

    if (user.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // For demo purposes, just check password matches
    // In production, use bcrypt to compare password hashes
    const userData = user.rows[0];
    const passwordHash = hashPassword(password);
    if (userData.password_hash !== passwordHash) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Return user with session token
    res.json({
      success: true,
      user: {
        id: userData.id,
        username: userData.username,
        display_name: userData.display_name || userData.username,
        profile_id: userData.profile_id
      },
      session_token: `session-${uuidv4()}`,
      message: '✅ Logged in successfully'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function signup(req, res) {
  try {
    const { username, fullName, password, referralCode } = req.body;

    if (!username || !fullName || !password) {
      return res.status(400).json({ error: 'Username, full name, and password required' });
    }

    // Check if username already exists
    let existingUser = await query('SELECT * FROM users WHERE username = ?', [username.toLowerCase()]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Create new user
    const userId = uuidv4();
    const profileId = `JNT-2024-${Date.now().toString().slice(-5)}`;
    const passwordHash = hashPassword(password);
    let referredByUserId = null;

    if (referralCode) {
      const referrer = await query('SELECT id FROM users WHERE profile_id = ?', [referralCode]);
      if (referrer.rows.length === 0) {
        return res.status(400).json({ error: 'Referral code not found' });
      }
      referredByUserId = referrer.rows[0].id;
    }

    await query(
      `INSERT INTO users (id, username, full_name, display_name, profile_id, password_hash, referred_by_user_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [userId, username.toLowerCase(), fullName, fullName.split(' ')[0], profileId, passwordHash, referredByUserId]
    );

    // Create profile
    await query(
      `INSERT INTO user_profiles (id, user_id, last_active, created_at, updated_at)
       VALUES (?, ?, datetime('now'), datetime('now'), datetime('now'))`,
      [uuidv4(), userId]
    );

    res.json({
      success: true,
      user: {
        id: userId,
        username: username,
        display_name: fullName,
        profile_id: profileId,
        referred_by_user_id: referredByUserId
      },
      session_token: `session-${uuidv4()}`,
      message: '✅ Account created successfully'
    });
  } catch (error) {
    console.error('Signup error:', error);
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
