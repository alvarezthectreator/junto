export async function requireAdmin(req, res, next) {
  const setupKey = req.headers['x-admin-setup-key'];
  const env = globalThis.process?.env || {};
  if (env.NODE_ENV !== 'production' && !env.ADMIN_SETUP_KEY) {
    return next();
  }
  if (setupKey && setupKey === env.ADMIN_SETUP_KEY) {
    return next();
  }
  return res.status(403).json({ error: 'Admin access required' });
}
