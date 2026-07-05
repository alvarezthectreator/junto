import { generateAdminToken } from '../middleware/auth.js';

function readAdminCredentials() {
  return {
    username: (process.env.ADMIN_USERNAME || '').trim(),
    password: process.env.ADMIN_PASSWORD || '',
  };
}

export function loginAdmin(req, res) {
  try {
    const { username, password } = req.body || {};
    const credentials = readAdminCredentials();

    if (!credentials.username || !credentials.password) {
      return res.status(503).json({
        error: 'Admin credentials are not configured on the server',
      });
    }

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (username.trim() !== credentials.username || password !== credentials.password) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const token = generateAdminToken({ username: credentials.username });
    res.json({
      success: true,
      admin_token: token,
      admin: {
        username: credentials.username,
        role: 'admin',
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Unable to sign in as admin' });
  }
}

export function verifyAdmin(req, res) {
  return res.json({
    valid: true,
    admin: req.admin || null,
  });
}
