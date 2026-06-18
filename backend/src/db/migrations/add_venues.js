import { query } from '../connection.js';

export async function addVenuesTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS venues (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      address TEXT,
      city TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      photo_urls TEXT,
      opening_hours TEXT,
      price_range TEXT,
      phone TEXT,
      website TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT,
      updated_at TEXT
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS venue_reviews (
      id TEXT PRIMARY KEY,
      venue_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      review TEXT,
      created_at TEXT,
      FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  console.log('Venue tables created');
}
