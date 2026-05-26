import { query } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

export async function getEvents(req, res) {
  try {
    const { city, tier, date, limit = 20, offset = 0 } = req.query;

    let sql = `SELECT e.*, u.display_name, u.profile_id FROM events e
               LEFT JOIN users u ON e.host_id = u.id
               WHERE e.status = 'active'`;
    const params = [];
    let paramCount = 1;

    if (city) {
      sql += ` AND e.location_city = $${paramCount}`;
      params.push(city);
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

    sql += ` ORDER BY e.event_date ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

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
                          event_date, event_time, cover_photo_url, billing_tier, host_fee, guest_fee, max_guests)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [eventId, host_id, title, description, event_type, location_city, location_address,
       event_date, event_time || '18:00', cover_photo_url, tier, tierData.hostFee, tierData.guestFee, max_guests || 15]
    );

    // Create notification for host
    await query(
      `INSERT INTO notifications (user_id, notification_type, title, body)
       VALUES ($1, $2, $3, $4)`,
      [host_id, 'event_created', 'Event Created', `Your event "${title}" is now live!`]
    );

    res.status(201).json({ event: result.rows[0], message: '✅ Event created successfully' });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function updateEvent(req, res) {
  try {
    const { eventId } = req.params;
    const { title, description, location_city, event_date, event_time, status } = req.body;

    const result = await query(
      `UPDATE events SET title = COALESCE($1, title),
                        description = COALESCE($2, description),
                        location_city = COALESCE($3, location_city),
                        event_date = COALESCE($4, event_date),
                        event_time = COALESCE($5, event_time),
                        status = COALESCE($6, status),
                        updated_at = NOW()
       WHERE id = $7 RETURNING *`,
      [title, description, location_city, event_date, event_time, status, eventId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ event: result.rows[0], message: '✅ Event updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function deleteEvent(req, res) {
  try {
    const { eventId } = req.params;

    const result = await query('DELETE FROM events WHERE id = $1 RETURNING id', [eventId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ success: true, message: '✅ Event deleted' });
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
