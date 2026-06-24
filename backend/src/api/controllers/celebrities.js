import { query } from '../../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

export async function getCelebrities(req, res) {
  try {
    const { category, all } = req.query;
    const sql = category
      ? `SELECT c.*,
          (SELECT COUNT(*) FROM celebrity_bookings cb WHERE cb.celebrity_id = c.id) AS booking_count,
          (SELECT COUNT(*) FROM celebrity_reviews cr WHERE cr.celebrity_id = c.id) AS review_count,
          (SELECT AVG(rating) FROM celebrity_reviews cr WHERE cr.celebrity_id = c.id) AS avg_rating
        FROM celebrities c WHERE c.category = ? ${all === 'true' ? '' : 'AND c.is_active = 1'} ORDER BY c.name ASC`
      : `SELECT c.*,
          (SELECT COUNT(*) FROM celebrity_bookings cb WHERE cb.celebrity_id = c.id) AS booking_count,
          (SELECT COUNT(*) FROM celebrity_reviews cr WHERE cr.celebrity_id = c.id) AS review_count,
          (SELECT AVG(rating) FROM celebrity_reviews cr WHERE cr.celebrity_id = c.id) AS avg_rating
        FROM celebrities c ${all === 'true' ? '' : 'WHERE c.is_active = 1'} ORDER BY c.name ASC`;
    const params = category ? [category] : [];
    const result = await query(sql, params);
    res.json({ celebrities: result.rows || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getCelebrityById(req, res) {
  try {
    const { id } = req.params;
    const result = await query(`SELECT * FROM celebrities WHERE id = ?`, [id]);
    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ error: 'Celebrity not found' });
    }
    res.json({ celebrity: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function createCelebrity(req, res) {
  try {
    const { name, category, bio, photo_url, outing_types, base_price, currency } = req.body;
    if (!name || !category || !base_price) {
      return res.status(400).json({ error: 'name, category, and base_price are required' });
    }
    const id = uuidv4();
    await query(
      `INSERT INTO celebrities (id, name, category, bio, photo_url, outing_types, base_price, currency, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
      [id, name, category, bio || null, photo_url || null, JSON.stringify(outing_types || []), base_price, currency || 'NGN']
    );
    res.status(201).json({ id, message: 'Celebrity created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateCelebrity(req, res) {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      bio,
      photo_url,
      outing_types,
      base_price,
      currency,
      is_active,
    } = req.body;

    await query(
      `UPDATE celebrities SET
        name = COALESCE(?, name),
        category = COALESCE(?, category),
        bio = COALESCE(?, bio),
        photo_url = COALESCE(?, photo_url),
        outing_types = COALESCE(?, outing_types),
        base_price = COALESCE(?, base_price),
        currency = COALESCE(?, currency),
        is_active = COALESCE(?, is_active),
        updated_at = datetime('now')
       WHERE id = ?`,
      [
        name || null,
        category || null,
        bio || null,
        photo_url || null,
        outing_types ? JSON.stringify(outing_types) : null,
        base_price ?? null,
        currency || null,
        typeof is_active === 'boolean' ? (is_active ? 1 : 0) : null,
        id,
      ]
    );

    const result = await query(`SELECT * FROM celebrities WHERE id = ?`, [id]);
    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ error: 'Celebrity not found' });
    }

    res.json({ celebrity: result.rows[0], message: 'Celebrity updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteCelebrity(req, res) {
  try {
    const { id } = req.params;
    await query(`DELETE FROM celebrities WHERE id = ?`, [id]);
    res.json({ success: true, message: 'Celebrity deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function createCelebrityBooking(req, res) {
  try {
    const { celebrity_id } = req.params;
    const { user_id, outing_type, duration_minutes, booking_date, price, currency, notes } = req.body;
    if (!user_id || !outing_type || !booking_date || !price) {
      return res.status(400).json({ error: 'user_id, outing_type, booking_date, and price are required' });
    }
    const id = uuidv4();
    await query(
      `INSERT INTO celebrity_bookings (id, celebrity_id, user_id, outing_type, duration_minutes, booking_date, price, currency, notes, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_payment', datetime('now'), datetime('now'))`,
      [id, celebrity_id, user_id, outing_type, duration_minutes || 60, booking_date, price, currency || 'NGN', notes || null]
    );
    res.status(201).json({ booking_id: id, status: 'pending_payment', message: 'Booking created — awaiting payment' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateBookingStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['pending_payment', 'confirmed', 'completed', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    await query(
      `UPDATE celebrity_bookings SET status = ?, updated_at = datetime('now') WHERE id = ?`,
      [status, id]
    );
    res.json({ message: 'Booking status updated', status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getCelebrityReviews(req, res) {
  try {
    const { celebrity_id } = req.params;
    const result = await query(
      `SELECT cr.*, u.display_name as reviewer_name
       FROM celebrity_reviews cr
       LEFT JOIN users u ON cr.user_id = u.id
       WHERE cr.celebrity_id = ?
       ORDER BY cr.created_at DESC`,
      [celebrity_id]
    );
    const avgResult = await query(
      `SELECT AVG(rating) as avg_rating, COUNT(*) as total FROM celebrity_reviews WHERE celebrity_id = ?`,
      [celebrity_id]
    );
    res.json({
      reviews: result.rows || [],
      summary: {
        average_rating: Math.round((avgResult.rows[0]?.avg_rating || 0) * 10) / 10,
        total_reviews: avgResult.rows[0]?.total || 0
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function createCelebrityReview(req, res) {
  try {
    const { celebrity_id } = req.params;
    const { user_id, rating, review, booking_id } = req.body;
    if (!user_id || !rating) {
      return res.status(400).json({ error: 'user_id and rating are required' });
    }
    const id = uuidv4();
    await query(
      `INSERT INTO celebrity_reviews (id, celebrity_id, user_id, booking_id, rating, review, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [id, celebrity_id, user_id, booking_id || null, rating, review || null]
    );
    res.status(201).json({ id, message: 'Celebrity review added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteCelebrityReview(req, res) {
  try {
    const { id } = req.params;
    await query(`DELETE FROM celebrity_reviews WHERE id = ?`, [id]);
    res.json({ success: true, message: 'Celebrity review deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
