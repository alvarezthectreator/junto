import { query } from '../../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

export async function applyToEvent(req, res) {
  try {
    const { event_id, user_id, personal_note } = req.body;

    if (!event_id || !user_id) {
      return res.status(400).json({ error: 'Event ID and User ID required' });
    }

    // Check if already applied
    const existingApp = await query(
      'SELECT id FROM event_applications WHERE event_id = $1 AND user_id = $2',
      [event_id, user_id]
    );

    if (existingApp.rows.length > 0) {
      return res.status(400).json({ error: 'Already applied to this event' });
    }

    const applicationId = uuidv4();
    const result = await query(
      `INSERT INTO event_applications (id, event_id, user_id, personal_note, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
      [applicationId, event_id, user_id, personal_note || null]
    );

    // Get event and user info for notification
    const eventRes = await query('SELECT title, host_id FROM events WHERE id = $1', [event_id]);
    const userRes = await query('SELECT display_name FROM users WHERE id = $1', [user_id]);

    if (eventRes.rows.length > 0) {
      const event = eventRes.rows[0];
      const user = userRes.rows[0];

      // Notify host
      await query(
        `INSERT INTO notifications (user_id, notification_type, related_user_id, title, body)
         VALUES ($1, $2, $3, $4, $5)`,
        [event.host_id, 'new_application', user_id, 'New Event Application', `${user.display_name} applied to "${event.title}"`]
      );
    }

    res.status(201).json({ application: result.rows[0], message: '✅ Application submitted' });
  } catch (error) {
    console.error('Apply error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function getUserApplications(req, res) {
  try {
    const { userId } = req.params;
    const { status, limit = 20 } = req.query;

    let sql = `SELECT ea.*, e.title, e.event_date, e.location_city, e.billing_tier, e.host_id
               FROM event_applications ea
               LEFT JOIN events e ON ea.event_id = e.id
               WHERE ea.user_id = $1`;
    const params = [userId];

    if (status) {
      sql += ` AND ea.status = $${params.length + 1}`;
      params.push(status);
    }

    sql += ` ORDER BY ea.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await query(sql, params);
    res.json({ applications: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getEventApplications(req, res) {
  try {
    const { eventId } = req.params;
    const { status } = req.query;

    let sql = `SELECT ea.*, u.display_name, u.profile_id, u.bio
               FROM event_applications ea
               LEFT JOIN users u ON ea.user_id = u.id
               WHERE ea.event_id = $1`;
    const params = [eventId];

    if (status) {
      sql += ` AND ea.status = $${params.length + 1}`;
      params.push(status);
    }

    sql += ` ORDER BY ea.created_at DESC`;

    const result = await query(sql, params);
    res.json({ applications: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateApplicationStatus(req, res) {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await query(
      `UPDATE event_applications SET status = ?, updated_at = datetime('now') WHERE id = ? RETURNING *`,
      [status, applicationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const app = result.rows[0];

    // Get user and event info for notification
    const userRes = await query('SELECT display_name FROM users WHERE id = $1', [app.user_id]);
    const eventRes = await query('SELECT title FROM events WHERE id = $1', [app.event_id]);

    if (status === 'accepted' && userRes.rows.length > 0 && eventRes.rows.length > 0) {
      // Create conversation between host and user
      const convResult = await query(
        `INSERT INTO conversations (user1_id, user2_id) 
         VALUES ($1, $2) ON CONFLICT DO NOTHING
         RETURNING id`,
        [app.user_id, (await query('SELECT host_id FROM events WHERE id = $1', [app.event_id])).rows[0].host_id]
      );

      // Notify applicant
      await query(
        `INSERT INTO notifications (user_id, notification_type, related_event_id, title, body)
         VALUES ($1, $2, $3, $4, $5)`,
        [app.user_id, 'event_accepted', app.event_id, 'Application Accepted', `You've been accepted to "${eventRes.rows[0].title}"!`]
      );
    }

    res.json({ application: result.rows[0], message: `✅ Application ${status}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function withdrawApplication(req, res) {
  try {
    const { applicationId } = req.params;

    const result = await query(
      'DELETE FROM event_applications WHERE id = $1 RETURNING id',
      [applicationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({ success: true, message: '✅ Application withdrawn' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
