import { query } from '../../db/connection.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { generateToken } from '../middleware/auth.js';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function hashRecoveryCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function generateRecoveryCode() {
  const raw = crypto.randomBytes(8).toString('hex').toUpperCase();
  return raw.match(/.{1,4}/g)?.join('-') || raw;
}

function normalizeUserAgent(userAgent = '') {
  const agent = String(userAgent).toLowerCase();
  if (!agent) return 'Unknown device';
  if (agent.includes('iphone')) return 'iPhone';
  if (agent.includes('ipad')) return 'iPad';
  if (agent.includes('android')) return 'Android device';
  if (agent.includes('mac')) return 'Mac';
  if (agent.includes('windows')) return 'Windows PC';
  if (agent.includes('linux')) return 'Linux device';
  return 'Browser';
}

function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  return req.ip || req.connection?.remoteAddress || null;
}

async function recordSecurityEvent(userId, eventType, description, metadata = {}, req = null) {
  try {
    await query(
      `INSERT INTO fraud_logs (id, user_id, event_type, description, metadata, ip_address, user_agent, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        uuidv4(),
        userId,
        eventType,
        description,
        JSON.stringify(metadata || {}),
        req ? getClientIp(req) : null,
        req?.headers?.['user-agent'] || null,
      ]
    );
  } catch (error) {
    console.warn('Unable to record security event:', error.message);
  }
}

async function createAuthSession(userData, req, eventType = 'login') {
  const tokenId = uuidv4();
  const sessionVersion = Number(userData.session_version || 0);
  const token = generateToken({
    id: userData.id,
    email: userData.email || userData.username,
    username: userData.username,
    display_name: userData.display_name,
    session_version: sessionVersion,
    token_id: tokenId,
  });

  try {
    await query(
      `INSERT INTO user_sessions (
         id, user_id, token_id, device_label, user_agent, ip_address, is_active, created_at, last_seen_at
       ) VALUES (?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        uuidv4(),
        userData.id,
        tokenId,
        normalizeUserAgent(req?.headers?.['user-agent']),
        req?.headers?.['user-agent'] || null,
        getClientIp(req),
      ]
    );
  } catch (error) {
    console.warn('Unable to create session record:', error.message);
  }

  await recordSecurityEvent(
    userData.id,
    eventType,
    eventType === 'signup' ? 'Account created and session issued' : 'Session issued',
    { token_id: tokenId, session_version: sessionVersion },
    req
  );

  return { token, tokenId, sessionVersion };
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
    const session = await createAuthSession(userData, req, 'login');

    res.json({
      success: true,
      user: {
        id: userData.id,
        username: userData.username,
        display_name: userData.display_name || userData.username,
        profile_id: userData.profile_id,
        gender: userData.gender || null,
        date_of_birth: userData.date_of_birth || null,
        occupation: userData.occupation || null
      },
      session_token: session.token,
      message: '✅ Logged in successfully'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function signup(req, res) {
  try {
    const { username, fullName, password, dateOfBirth, referralCode, gender } = req.body;

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
      `INSERT INTO users (id, username, full_name, display_name, profile_id, password_hash, referred_by_user_id, gender, occupation, session_version, password_updated_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP, datetime('now'), datetime('now'))`,
      [userId, username.toLowerCase(), fullName, fullName.split(' ')[0], profileId, passwordHash, referredByUserId, gender || null, null]
    );

    // Create profile
    await query(
      `INSERT INTO user_profiles (id, user_id, date_of_birth, last_active, created_at, updated_at)
       VALUES (?, ?, ?, datetime('now'), datetime('now'), datetime('now'))`,
      [uuidv4(), userId, dateOfBirth || null]
    );

    const session = await createAuthSession({
      id: userId,
      username: username.toLowerCase(),
      display_name: fullName.split(' ')[0],
      email: username.toLowerCase(),
      session_version: 0,
    }, req, 'signup');

    res.json({
      success: true,
      user: {
        id: userId,
        username: username,
        display_name: fullName,
        profile_id: profileId,
        referred_by_user_id: referredByUserId,
        date_of_birth: dateOfBirth || null,
        gender: gender || null,
        occupation: null
      },
      session_token: session.token,
      message: '✅ Account created successfully'
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function verifySession(req, res) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ valid: false, error: 'Session missing or invalid' });
    }

    const user = await query('SELECT * FROM users WHERE id = ?', [userId]);
    if (user.rows.length === 0) {
      return res.status(401).json({ valid: false, error: 'Session user not found' });
    }

    const userData = user.rows[0];
    res.json({
      valid: true,
      user: {
        id: userData.id,
        username: userData.username,
        display_name: userData.display_name || userData.username,
        profile_id: userData.profile_id,
        gender: userData.gender || null,
        date_of_birth: userData.date_of_birth || null,
        occupation: userData.occupation || null,
      },
      message: 'Session valid'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function changePassword(req, res) {
  try {
    const { userId } = req.params;
    const { currentPassword, newPassword } = req.body;
    const requestingUserId = req.user?.id;

    if (!requestingUserId || requestingUserId !== userId) {
      return res.status(403).json({ error: 'You can only change your own password' });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (String(newPassword).length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }

    const userResult = await query(
      'SELECT id, username, display_name, password_hash, session_version FROM users WHERE id = ?',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userResult.rows[0];
    if (userData.password_hash !== hashPassword(currentPassword)) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const nextSessionVersion = Number(userData.session_version || 0) + 1;
    const passwordHash = hashPassword(newPassword);

    await query(
      `UPDATE users
       SET password_hash = ?, session_version = ?, password_updated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [passwordHash, nextSessionVersion, userId]
    );

    await query('UPDATE user_sessions SET is_active = 0, revoked_at = CURRENT_TIMESTAMP WHERE user_id = ?', [userId]);

    const session = await createAuthSession(
      {
        id: userData.id,
        username: userData.username,
        display_name: userData.display_name,
        email: userData.username,
        session_version: nextSessionVersion,
      },
      req,
      'session_created'
    );

    await recordSecurityEvent(
      userId,
      'password_change',
      'Password changed and sessions refreshed',
      { session_version: nextSessionVersion },
      req
    );

    res.json({
      success: true,
      message: 'Password updated successfully',
      session_token: session.token,
      session_version: nextSessionVersion,
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function getUserSessions(req, res) {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user?.id;

    if (requestingUserId !== userId) {
      return res.status(403).json({ error: 'You can only view your own sessions' });
    }

    const result = await query(
      `SELECT id, token_id, device_label, user_agent, ip_address, created_at, last_seen_at, revoked_at, is_active
       FROM user_sessions
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      sessions: result.rows.map((session) => ({
        ...session,
        active: Number(session.is_active || 0) === 1 && !session.revoked_at,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function revokeUserSession(req, res) {
  try {
    const { userId, sessionId } = req.params;
    const requestingUserId = req.user?.id;

    if (requestingUserId !== userId) {
      return res.status(403).json({ error: 'You can only manage your own sessions' });
    }

    const sessionResult = await query(
      `SELECT id, token_id FROM user_sessions WHERE id = ? AND user_id = ?`,
      [sessionId, userId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await query(
      `UPDATE user_sessions SET is_active = 0, revoked_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`,
      [sessionId, userId]
    );

    await recordSecurityEvent(
      userId,
      'session_revoked',
      'A single device session was revoked',
      { session_id: sessionId },
      req
    );

    res.json({ success: true, message: 'Session revoked' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function revokeOtherSessions(req, res) {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user?.id;
    const currentTokenId = req.user?.jti;

    if (requestingUserId !== userId) {
      return res.status(403).json({ error: 'You can only manage your own sessions' });
    }

    if (!currentTokenId) {
      return res.status(400).json({ error: 'Current session token missing' });
    }

    await query(
      `UPDATE user_sessions
       SET is_active = 0, revoked_at = CURRENT_TIMESTAMP
       WHERE user_id = ? AND token_id != ? AND revoked_at IS NULL`,
      [userId, currentTokenId]
    );

    await recordSecurityEvent(
      userId,
      'session_revoke_others',
      'All other sessions were revoked',
      { current_token_id: currentTokenId },
      req
    );

    res.json({ success: true, message: 'Other sessions revoked' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function generateRecoveryCodes(req, res) {
  try {
    const requestingUserId = req.user?.id;

    if (!requestingUserId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const rawCodes = Array.from({ length: 8 }, () => generateRecoveryCode());

    await query('DELETE FROM account_recovery_codes WHERE user_id = ?', [requestingUserId]);

    for (const code of rawCodes) {
      await query(
        `INSERT INTO account_recovery_codes (id, user_id, code_hash, code_hint, created_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [uuidv4(), requestingUserId, hashRecoveryCode(code), code.slice(0, 4)]
      );
    }

    await recordSecurityEvent(
      requestingUserId,
      'recovery_codes_generated',
      'Backup codes regenerated',
      { count: rawCodes.length },
      req
    );

    res.json({
      success: true,
      recovery_codes: rawCodes,
      message: 'Recovery codes generated',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function recoverAccount(req, res) {
  try {
    const { username, backupCode, newPassword } = req.body;

    if (!username || !backupCode || !newPassword) {
      return res.status(400).json({ error: 'Username, backup code, and new password are required' });
    }

    if (String(newPassword).length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }

    const userResult = await query(
      'SELECT id, username, display_name, session_version FROM users WHERE username = ?',
      [username.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userResult.rows[0];
    const recoveryResult = await query(
      `SELECT id, code_hash, used_at
       FROM account_recovery_codes
       WHERE user_id = ? AND used_at IS NULL`,
      [userData.id]
    );

    const matchedCode = recoveryResult.rows.find((row) => row.code_hash === hashRecoveryCode(backupCode));
    if (!matchedCode) {
      return res.status(401).json({ error: 'Invalid recovery code' });
    }

    const nextSessionVersion = Number(userData.session_version || 0) + 1;
    const passwordHash = hashPassword(newPassword);

    await query(
      `UPDATE users
       SET password_hash = ?, session_version = ?, password_updated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [passwordHash, nextSessionVersion, userData.id]
    );

    await query(
      `UPDATE account_recovery_codes SET used_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [matchedCode.id]
    );

    await query('UPDATE user_sessions SET is_active = 0, revoked_at = CURRENT_TIMESTAMP WHERE user_id = ?', [userData.id]);

    const session = await createAuthSession(
      {
        id: userData.id,
        username: userData.username,
        display_name: userData.display_name,
        email: userData.username,
        session_version: nextSessionVersion,
      },
      req,
      'session_created'
    );

    await recordSecurityEvent(
      userData.id,
      'account_recovery',
      'Account recovered with backup code',
      { recovery_code_id: matchedCode.id },
      req
    );

    res.json({
      success: true,
      message: 'Account recovered successfully',
      session_token: session.token,
      user: {
        id: userData.id,
        username: userData.username,
        display_name: userData.display_name,
      },
    });
  } catch (error) {
    console.error('Account recovery error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function getSecurityActivity(req, res) {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user?.id;

    if (requestingUserId !== userId) {
      return res.status(403).json({ error: 'You can only view your own activity' });
    }

    const [logsResult, sessionsResult] = await Promise.all([
      query(
        `SELECT id, event_type, description, metadata, ip_address, user_agent, created_at
         FROM fraud_logs
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT 100`,
        [userId]
      ),
      query(
        `SELECT id, token_id, device_label, user_agent, ip_address, created_at, last_seen_at, revoked_at, is_active
         FROM user_sessions
         WHERE user_id = ?
         ORDER BY created_at DESC`,
        [userId]
      ),
    ]);

    res.json({
      activity: logsResult.rows.map((entry) => ({
        id: entry.id,
        type: entry.event_type,
        title: entry.event_type.replace(/_/g, ' '),
        description: entry.description,
        metadata: entry.metadata ? JSON.parse(entry.metadata) : {},
        ip_address: entry.ip_address,
        user_agent: entry.user_agent,
        created_at: entry.created_at,
      })),
      sessions: sessionsResult.rows.map((session) => ({
        ...session,
        active: Number(session.is_active || 0) === 1 && !session.revoked_at,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
