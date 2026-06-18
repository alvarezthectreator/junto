import { query } from '../connection.js';

export async function addCelebritiesTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS celebrities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      bio TEXT,
      photo_url TEXT,
      outing_types TEXT,
      base_price REAL NOT NULL,
      currency TEXT DEFAULT 'NGN',
      is_active INTEGER DEFAULT 1,
      created_at TEXT,
      updated_at TEXT
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS celebrity_bookings (
      id TEXT PRIMARY KEY,
      celebrity_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      outing_type TEXT NOT NULL,
      duration_minutes INTEGER DEFAULT 60,
      booking_date TEXT NOT NULL,
      price REAL NOT NULL,
      currency TEXT DEFAULT 'NGN',
      notes TEXT,
      status TEXT DEFAULT 'pending_payment',
      created_at TEXT,
      updated_at TEXT,
      FOREIGN KEY (celebrity_id) REFERENCES celebrities(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS celebrity_reviews (
      id TEXT PRIMARY KEY,
      celebrity_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      booking_id TEXT,
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      review TEXT,
      created_at TEXT,
      updated_at TEXT,
      FOREIGN KEY (celebrity_id) REFERENCES celebrities(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  console.log('Celebrity tables created');
}
