import { query } from '../../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

// Rate a host (after attending their event)
export async function rateHost(req, res) {
  try {
    const { rated_by_user_id, host_id, event_id, rating, review } = req.body;

    if (!rated_by_user_id || !host_id || !event_id || !rating) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const ratingId = uuidv4();
    await query(
      `INSERT INTO host_ratings (id, rated_by_user_id, host_id, event_id, rating, review, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
       ON CONFLICT(rated_by_user_id, host_id, event_id) DO UPDATE SET
       rating = ?, review = ?, updated_at = datetime('now')`,
      [ratingId, rated_by_user_id, host_id, event_id, rating, review || null, rating, review || null]
    );

    // Calculate average host rating
    const avgResult = await query(
      `SELECT AVG(rating) as avg_rating, COUNT(*) as total_ratings FROM host_ratings WHERE host_id = ?`,
      [host_id]
    );

    const avgRating = avgResult.rows?.[0]?.avg_rating || 0;
    const totalRatings = avgResult.rows?.[0]?.total_ratings || 0;

    res.json({
      rating_id: ratingId,
      message: 'Host rated successfully',
      host_rating: {
        average: Math.round(avgRating * 10) / 10,
        total_ratings: totalRatings
      }
    });
  } catch (error) {
    console.error('Rating error:', error);
    res.status(500).json({ error: error.message });
  }
}

// Get host ratings
export async function getHostRatings(req, res) {
  try {
    const { host_id, limit = 20, offset = 0 } = req.query;

    const result = await query(
      `SELECT hr.*, u.display_name as reviewer_name, u.profile_id, e.title as event_title
       FROM host_ratings hr
       LEFT JOIN users u ON hr.rated_by_user_id = u.id
       LEFT JOIN events e ON hr.event_id = e.id
       WHERE hr.host_id = ?
       ORDER BY hr.created_at DESC
       LIMIT ? OFFSET ?`,
      [host_id, parseInt(limit), parseInt(offset)]
    );

    // Get average rating
    const avgResult = await query(
      `SELECT AVG(rating) as avg_rating, COUNT(*) as total_ratings FROM host_ratings WHERE host_id = ?`,
      [host_id]
    );

    const avgRating = avgResult.rows?.[0]?.avg_rating || 0;
    const totalRatings = avgResult.rows?.[0]?.total_ratings || 0;

    res.json({
      ratings: result.rows || [],
      summary: {
        average_rating: Math.round(avgRating * 10) / 10,
        total_ratings: totalRatings
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Get a specific user's rating for a host
export async function getUserHostRating(req, res) {
  try {
    const { user_id, host_id } = req.query;

    const result = await query(
      `SELECT * FROM host_ratings WHERE rated_by_user_id = ? AND host_id = ?`,
      [user_id, host_id]
    );

    res.json({ rating: result.rows?.[0] || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Delete a rating
export async function deleteHostRating(req, res) {
  try {
    const { rating_id, user_id } = req.body;

    // Verify ownership
    const ratingCheck = await query(
      `SELECT rated_by_user_id FROM host_ratings WHERE id = ?`,
      [rating_id]
    );

    if (!ratingCheck.rows || ratingCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Rating not found' });
    }

    if (ratingCheck.rows[0].rated_by_user_id !== user_id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await query(`DELETE FROM host_ratings WHERE id = ?`, [rating_id]);

    res.json({ message: 'Rating deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
