import jwt from 'jsonwebtoken';
import { query } from '../../db/connection.js';

/**
 * Middleware to authenticate JWT tokens
 * Extracts token from Authorization header
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
    const validateSession = async () => {
      if (!decoded?.id) {
        return res.status(401).json({ error: 'Invalid token payload' });
      }

      const userResult = await query('SELECT id, session_version FROM users WHERE id = ?', [decoded.id]);
      if (userResult.rows.length === 0) {
        return res.status(401).json({ error: 'Session user not found' });
      }

      const userRow = userResult.rows[0];
      const currentVersion = Number(userRow.session_version || 0);
      const tokenVersion = Number(decoded.session_version || 0);

      if (tokenVersion !== currentVersion) {
        return res.status(403).json({ error: 'Session expired. Please sign in again.' });
      }

      if (decoded.jti) {
        const sessionResult = await query(
          `SELECT id, revoked_at, is_active
           FROM user_sessions
           WHERE token_id = ? AND user_id = ?`,
          [decoded.jti, decoded.id]
        );

        if (sessionResult.rows.length === 0) {
          return res.status(403).json({ error: 'Session is no longer active' });
        }

        const sessionRow = sessionResult.rows[0];
        if (sessionRow.revoked_at || Number(sessionRow.is_active || 0) === 0) {
          return res.status(403).json({ error: 'Session is no longer active' });
        }

        await query(
          'UPDATE user_sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE token_id = ? AND user_id = ?',
          [decoded.jti, decoded.id]
        );
      }

      req.user = decoded;
      next();
    };

    validateSession().catch((err) => {
      console.error('Token verification error:', err.message);
      return res.status(500).json({ error: 'Failed to validate session' });
    });
  } catch (err) {
    console.error('Token verification error:', err.message);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
      req.user = decoded;
    } catch (err) {
      console.warn('Optional auth token invalid:', err.message);
    }
  }

  next();
};

/**
 * Generate JWT token for user
 */
export const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    username: user.username,
    display_name: user.display_name,
    session_version: Number(user.session_version || 0),
  };

  if (user.token_id || user.jti) {
    payload.jti = user.token_id || user.jti;
  }

  return jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret_key_here', {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};
