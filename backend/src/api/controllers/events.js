import { query } from '../../db/connection.js';
import { v4 as uuidv4 } from 'uuid';
import { broadcastEventUpdate, broadcastEventCreated, broadcastEventDeleted } from '../../websocket.js';

export async function getEvents(req, res) {
  try {
    const { city, tier, date, event_type, category, limit = 20, offset = 0 } = req.query;

    let sql = `SELECT e.*, u.display_name, u.profile_id FROM events e
               LEFT JOIN users u ON e.host_id = u.id
               WHERE e.status = 'active'`;
    const params = [];
    let paramCount = 1;

    if (city) {
      sql += ` AND e.location_city ILIKE $${paramCount}`;
      params.push(`%${city}%`);
      paramCount++;
    }

    if (tier) {
      sql += ` AND e.billing_tier = $${paramCount}`;
      params.push(parseInt(tier));
      paramCount++;
    }

    if (date) {
      sql += ` AND e.event_date = $${paramCount}`;
      params.push(date);
      paramCount++;
    }

    if (event_type) {
      sql += ` AND e.event_type = $${paramCount}`;
      params.push(event_type);
      paramCount++;
    }

    if (category) {
      sql += ` AND e.description ILIKE $${paramCount}`;
      params.push(`%${category}%`);
      paramCount++;
    }

    sql += ` ORDER BY e.event_date ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(sql, params);
    res.json({ events: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getEventById(req, res) {
  try {
    const { eventId } = req.params;

    const result = await query(
      `SELECT e.*, u.display_name, u.profile_id, u.bio FROM events e
       LEFT JOIN users u ON e.host_id = u.id
       WHERE e.id = $1`,
      [eventId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ event: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function createEvent(req, res) {
  try {
    const {
      host_id,
      title,
      description,
      event_type,
      is_squad_event,
      location_city,
      location_address,
      event_date,
      event_time,
      cover_photo_url,
      billing_tier,
      max_guests
    } = req.body;

    if (!host_id || !title || !location_city || !event_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const BILLING_TIERS = {
      1: { hostFee: 50000, guestFee: 25000 },
      2: { hostFee: 150000, guestFee: 75000 },
      3: { hostFee: 300000, guestFee: 150000 },
      4: { hostFee: 500000, guestFee: 250000 }
    };

    const tier = billing_tier || 1;
    const tierData = BILLING_TIERS[tier] || BILLING_TIERS[1];

    const eventId = uuidv4();
    const result = await query(
      `INSERT INTO events (id, host_id, title, description, event_type, location_city, location_address, 
                          event_date, event_time, cover_photo_url, is_squad_event, billing_tier, host_fee, guest_fee, max_guests)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [eventId, host_id, title, description, event_type, location_city, location_address,
       event_date, event_time || '18:00', cover_photo_url, Boolean(is_squad_event), tier, tierData.hostFee, tierData.guestFee, max_guests || 15]
    );

    // Create notification for host
    await query(
      `INSERT INTO notifications (user_id, notification_type, title, body)
       VALUES ($1, $2, $3, $4)`,
      [host_id, 'event_created', 'Event Created', `Your event "${title}" is now live!`]
    );

    // Broadcast to all connected clients
    broadcastEventCreated(eventId);

    res.status(201).json({ event: result.rows[0], message: '✅ Event created successfully' });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function updateEvent(req, res) {
  try {
    const { eventId } = req.params;
    const { title, description, location_city, event_date, event_time, status, cover_photo_url, max_guests, event_type, is_squad_event, billing_tier } = req.body;

    const result = await query(
      `UPDATE events SET title = COALESCE($1, title),
                        description = COALESCE($2, description),
                        location_city = COALESCE($3, location_city),
                        event_date = COALESCE($4, event_date),
                        event_time = COALESCE($5, event_time),
                        status = COALESCE($6, status),
                        cover_photo_url = COALESCE($7, cover_photo_url),
                        max_guests = COALESCE($8, max_guests),
                        event_type = COALESCE($9, event_type),
                        is_squad_event = COALESCE($10, is_squad_event),
                        billing_tier = COALESCE($11, billing_tier),
                        updated_at = CURRENT_TIMESTAMP
       WHERE id = $12 RETURNING *`,
      [title, description, location_city, event_date, event_time, status, cover_photo_url, max_guests, event_type, is_squad_event, billing_tier, eventId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Broadcast to all connected clients
    broadcastEventUpdate(eventId);

    res.json({ event: result.rows[0], message: '✅ Event updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function deleteEvent(req, res) {
  try {
    const { eventId } = req.params;

    // First, check if event exists
    const checkResult = await query('SELECT id FROM events WHERE id = $1', [eventId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Delete related records first
    await query('DELETE FROM event_applications WHERE event_id = $1', [eventId]);
    await query('DELETE FROM event_saves WHERE event_id = $1', [eventId]);

    // Delete the event
    await query('DELETE FROM events WHERE id = $1', [eventId]);

    // Broadcast to all connected clients
    broadcastEventDeleted(eventId);

    res.json({ message: '✅ Event deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getHostEvents(req, res) {
  try {
    const { hostId } = req.params;
    const { status = 'active', limit = 20 } = req.query;

    const result = await query(
      `SELECT * FROM events WHERE host_id = $1 AND status = $2
       ORDER BY event_date DESC LIMIT $3`,
      [hostId, status, limit]
    );

    res.json({ events: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ==================== EVENT SAVES (WISHLIST) ====================

export async function saveEvent(req, res) {
  try {
    const { userId, eventId } = req.body;

    if (!userId || !eventId) {
      return res.status(400).json({ error: 'userId and eventId required' });
    }

    const saveId = uuidv4();
    const result = await query(
      `INSERT INTO event_saves (id, user_id, event_id) 
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, event_id) DO UPDATE SET saved_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [saveId, userId, eventId]
    );

    res.status(201).json({ message: '❤️ Event saved', saved: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function unsaveEvent(req, res) {
  try {
    const { userId, eventId } = req.body;

    if (!userId || !eventId) {
      return res.status(400).json({ error: 'userId and eventId required' });
    }

    await query('DELETE FROM event_saves WHERE user_id = $1 AND event_id = $2', [userId, eventId]);
    res.json({ message: '✓ Removed from saved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getUserSavedEvents(req, res) {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const result = await query(
      `SELECT e.* FROM events e
       INNER JOIN event_saves es ON e.id = es.event_id
       WHERE es.user_id = $1 AND e.status = 'active'
       ORDER BY es.saved_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json({ events: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function checkEventSaved(req, res) {
  try {
    const { userId, eventId } = req.params;

    const result = await query(
      'SELECT id FROM event_saves WHERE user_id = $1 AND event_id = $2',
      [userId, eventId]
    );

    res.json({ saved: result.rows.length > 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ==================== EVENT RATINGS ====================

export async function rateEvent(req, res) {
  try {
    const { userId, eventId, rating, comment } = req.body;

    if (!userId || !eventId || !rating) {
      return res.status(400).json({ error: 'userId, eventId, and rating required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const ratingId = uuidv4();
    const result = await query(
      `INSERT INTO event_ratings (id, user_id, event_id, rating, comment) 
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, event_id) DO UPDATE SET rating = $4, comment = $5
       RETURNING *`,
      [ratingId, userId, eventId, rating, comment || null]
    );

    res.json({ message: '⭐ Rating saved', rating: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getEventRating(req, res) {
  try {
    const { eventId } = req.params;

    const result = await query(
      `SELECT AVG(rating) as average_rating, COUNT(*) as rating_count 
       FROM event_ratings WHERE event_id = $1`,
      [eventId]
    );

    const stats = result.rows[0];
    res.json({ 
      average_rating: stats.average_rating ? parseFloat(stats.average_rating).toFixed(1) : 0,
      rating_count: parseInt(stats.rating_count || 0)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getEventReviews(req, res) {
  try {
    const { eventId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const result = await query(
      `SELECT er.*, u.display_name, u.profile_id
       FROM event_ratings er
       LEFT JOIN users u ON er.user_id = u.id
       WHERE er.event_id = $1
       ORDER BY er.created_at DESC
       LIMIT $2 OFFSET $3`,
      [eventId, parseInt(limit), parseInt(offset)]
    );

    const reviews = (result.rows || []).map((row) => ({
      id: row.id,
      author: row.display_name || row.profile_id || 'Anonymous',
      rating: Number(row.rating || 0),
      text: row.comment || '',
      time: row.created_at ? new Date(row.created_at).toLocaleDateString() : '',
      created_at: row.created_at,
      user_id: row.user_id,
    }));

    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
