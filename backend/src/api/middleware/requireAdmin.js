import { query } from '../../db/connection.js';

export async function requireAdmin(req, res, next) {
  const setupKey = req.headers['x-admin-setup-key'];
  if (setupKey && setupKey === process.env.ADMIN_SETUP_KEY) {
    return next();
  }
  return res.status(403).json({ error: 'Admin access required' });
}
