import sqlite3 from 'sqlite3';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '../../junto.db');
const DB_TYPE = process.env.DATABASE_URL ? 'postgres' : 'sqlite';

let db;

// PostgreSQL Connection
if (DB_TYPE === 'postgres') {
  const { Pool } = pg;
  db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  db.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err);
  });

  console.log('🐘 Connected to PostgreSQL database');
} else {
  // SQLite Connection (Development)
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('SQLite connection error:', err);
    else console.log('✅ Connected to SQLite database');
  });

  // Enable foreign keys for SQLite
  db.run('PRAGMA foreign_keys = ON');
}

// Unified query interface
export const query = (text, params = []) => {
  return new Promise((resolve, reject) => {
    if (DB_TYPE === 'postgres') {
      // PostgreSQL query
      db.query(text, params, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            rows: result.rows,
            rowCount: result.rowCount,
          });
        }
      });
    } else {
      // SQLite query
      const isSelect = text.trim().toUpperCase().startsWith('SELECT');

      if (isSelect) {
        db.all(text, params, (err, rows) => {
          if (err) reject(err);
          else resolve({ rows });
        });
      } else {
        db.run(text, params, function (err) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID, changes: this.changes });
        });
      }
    }
  });
};

// Get single row
export const queryOne = (text, params = []) => {
  return new Promise((resolve, reject) => {
    if (DB_TYPE === 'postgres') {
      db.query(text, params, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result.rows[0] || null);
        }
      });
    } else {
      db.get(text, params, (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      });
    }
  });
};

// Run multiple statements in transaction
export const transaction = async (queries) => {
  try {
    if (DB_TYPE === 'postgres') {
      const client = await db.connect();
      try {
        await client.query('BEGIN');
        const results = [];
        for (const [text, params] of queries) {
          const result = await client.query(text, params);
          results.push(result);
        }
        await client.query('COMMIT');
        return results;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } else {
      // SQLite transaction
      return new Promise((resolve, reject) => {
        db.serialize(() => {
          db.run('BEGIN TRANSACTION', (err) => {
            if (err) return reject(err);

            const results = [];
            let completed = 0;

            queries.forEach(([text, params], index) => {
              db.run(text, params, function (err) {
                if (err) {
                  db.run('ROLLBACK', () => reject(err));
                  return;
                }
                results[index] = { lastID: this.lastID, changes: this.changes };
                completed++;

                if (completed === queries.length) {
                  db.run('COMMIT', (err) => {
                    if (err) reject(err);
                    else resolve(results);
                  });
                }
              });
            });
          });
        });
      });
    }
  } catch (err) {
    throw err;
  }
};

// Export database instance and type
export { db, DB_TYPE };
export default db;
