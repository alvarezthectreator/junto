import { query } from '../../db/connection.js';

// Search and filter events
export async function searchEvents(req, res) {
  try {
    const { keyword, category, billingTier, city, minDate, maxDate, limit = 50, offset = 0 } = req.query;

    let queryStr = `
      SELECT e.*, u.display_name as host_name, u.profile_id, 
             COUNT(DISTINCT ea.id) as interest_count,
             AVG(COALESCE(hr.rating, 0)) as host_rating
      FROM events e
      LEFT JOIN users u ON e.host_id = u.id
      LEFT JOIN event_applications ea ON e.id = ea.event_id AND ea.status IN ('pending', 'accepted')
      LEFT JOIN host_ratings hr ON e.host_id = hr.host_id
      WHERE e.status = 'active'
    `;

    const params = [];

    if (keyword) {
      queryStr += ` AND (LOWER(e.title) LIKE LOWER(?) OR LOWER(e.description) LIKE LOWER(?))`;
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (category) {
      queryStr += ` AND e.category = ?`;
      params.push(category);
    }

    if (billingTier) {
      queryStr += ` AND e.billing_tier = ?`;
      params.push(parseInt(billingTier));
    }

    if (city) {
      queryStr += ` AND e.location_city = ?`;
      params.push(city);
    }

    if (minDate) {
      queryStr += ` AND e.event_date >= ?`;
      params.push(minDate);
    }

    if (maxDate) {
      queryStr += ` AND e.event_date <= ?`;
      params.push(maxDate);
    }

    queryStr += ` GROUP BY e.id, u.id
                 ORDER BY e.created_at DESC
                 LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(queryStr, params);

    res.json({
      events: result.rows || [],
      total: (result.rows || []).length
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
}

// Get available categories
export async function getCategories(req, res) {
  try {
    const categories = [
      { value: 'Movies', label: 'Movies', icon: '🎬' },
      { value: 'Food', label: 'Food', icon: '🍽️' },
      { value: 'Beach', label: 'Beach', icon: '🏖️' },
      { value: 'Music', label: 'Music', icon: '🎵' },
      { value: 'Sports', label: 'Sports', icon: '⚽' },
      { value: 'Travel', label: 'Travel', icon: '✈️' },
      { value: 'Wellness', label: 'Wellness', icon: '🧘' },
      { value: 'Art', label: 'Art', icon: '🎨' },
      { value: 'Gaming', label: 'Gaming', icon: '🎮' },
      { value: 'Business', label: 'Business', icon: '💼' }
    ];

    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
