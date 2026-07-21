import crypto from 'crypto';
import { query } from '../db/connection.js';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function usage() {
  console.log('\nUsage: node src/scripts/update-user-password.js --username <username> --password <newPassword>');
  console.log('       node src/scripts/update-user-password.js --userId <userId> --password <newPassword>\n');
  process.exit(1);
}

function parseArgs(argv) {
  const params = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i];
    const value = argv[i + 1];
    if (!key || !key.startsWith('--') || !value) {
      usage();
    }
    params[key.slice(2)] = value;
  }
  return params;
}

async function main() {
  const params = parseArgs(process.argv.slice(2));
  const { username, userId, password } = params;

  if (!password || (!username && !userId) || (username && userId)) {
    usage();
  }

  const lookupSql = username ? 'SELECT id, username FROM users WHERE username = ?' : 'SELECT id, username FROM users WHERE id = ?';
  const lookupValue = username ?? userId;
  const userResult = await query(lookupSql, [lookupValue]);

  if (!userResult.rows || userResult.rows.length === 0) {
    console.error('User not found');
    process.exit(1);
  }

  const user = userResult.rows[0];
  const passwordHash = hashPassword(password);

  const updateResult = await query(
    'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [passwordHash, user.id]
  );

  console.log(`Successfully updated password for user ${user.username || user.id}`);
  console.log(`Database changes: ${updateResult.changes}`);
}

main().catch((error) => {
  console.error('Error updating password:', error.message || error);
  process.exit(1);
});
