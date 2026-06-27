import sqlite3 from 'sqlite3';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultDbPath = join(__dirname, '../../junto.db');
const dbPath = process.env.DB_PATH || defaultDbPath;

const dbDirectory = dirname(dbPath);
if (!existsSync(dbDirectory)) {
  mkdirSync(dbDirectory, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('SQLite connection error:', err);
  else console.log(`✅ Connected to SQLite database: ${dbPath}`);
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Wrap db.all and db.run in promises for consistent API
export const query = (text, params = []) => {
  return new Promise((resolve, reject) => {
    // Handle both SELECT and non-SELECT queries
    if (text.trim().toUpperCase().startsWith('SELECT')) {
      db.all(text, params, (err, rows) => {
        if (err) reject(err);
        else resolve({ rows });
      });
    } else {
      db.run(text, params, function(err) {
        if (err) reject(err);
        else resolve({ 
          rows: [],
          lastID: this.lastID,
          changes: this.changes 
        });
      });
    }
  });
};

export const getClient = () => {
  return {
    query,
    release: () => {}
  };
};

export default db;
