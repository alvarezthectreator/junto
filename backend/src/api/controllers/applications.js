import { query } from '../../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

export async function applyToEvent(req, res) {
  try {
    const { event_id, user_id, message } = req.body;

    if (!event_id || !user_id) {
      return res.status(400).json({ error: 'Event ID and User ID required' });
    }

    // Check if already applied
    const existingApp = await query(
      'SELECT id FROM event_applications WHERE event_id = ? AND user_id = ?',
      [event_id, user_id]
    );

    if (existingApp.rows && existingApp.rows.length > 0) {
      return res.status(400).json({ error: 'Already applied to this event' });
    }

    // Check event capacity
    const eventRes = await query(
      'SELECT max_guests FROM events WHERE id = ?',
      [event_id]
    );

    if (!eventRes.rows || eventRes.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const event = eventRes.rows[0];
    const maxGuests = event.max_guests || 999;

    // Count accepted applications (excluding declined/waitlisted)
    const countRes = await query(
      `SELECT COUNT(*) as count FROM event_applications 
       WHERE event_id = ? AND status IN ('pending', 'accepted')`,
      [event_id]
    );

    const currentApplications = countRes.rows && countRes.rows[0]?.count || 0;
    const isAtCapacity = currentApplications >= maxGuests;
    const applicationStatus = isAtCapacity ? 'waitlisted' : 'pending';

    const applicationId = uuidv4();
    const result = await query(
      `INSERT INTO event_applications (id, event_id, user_id, personal_note, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [applicationId, event_id, user_id, message || null, applicationStatus]
    );

    // Get the inserted record
    const appRes = await query(
      'SELECT * FROM event_applications WHERE id = ?',
      [applicationId]
    );

    // Get event and user info for notification
    const userRes = await query('SELECT display_name FROM users WHERE id = ?', [user_id]);

    if (userRes.rows && userRes.rows.length > 0) {
      const user = userRes.rows[0];
      const eventInfo = await query('SELECT title, host_id FROM events WHERE id = ?', [event_id]);

      if (eventInfo.rows && eventInfo.rows.length > 0) {
        const eventData = eventInfo.rows[0];

        // Notify host
        const notificationText = isAtCapacity 
          ? `${user.display_name} joined the waitlist for "${eventData.title}"`
          : `${user.display_name} applied to "${eventData.title}"`;

        await query(
          `INSERT INTO notifications (id, user_id, notification_type, related_user_id, title, body, created_at)
           VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
          [uuidv4(), eventData.host_id, 'new_application', user_id, 'New Event Application', notificationText]
        );
      }
    }

    const responseMessage = isAtCapacity 
      ? '✅ Added to waitlist (event is full)' 
      : '✅ Application submitted';

    res.status(201).json({ 
      application: appRes.rows && appRes.rows[0], 
      message: responseMessage,
      isWaitlisted: isAtCapacity,
      remainingCapacity: Math.max(0, maxGuests - currentApplications)
    });
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
               WHERE ea.user_id = ?`;
    const params = [userId];

    if (status) {
      sql += ` AND ea.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY ea.created_at DESC LIMIT ?`;
    params.push(limit);

    const result = await query(sql, params);
    res.json({ applications: result.rows || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getEventApplications(req, res) {
  try {
    const { eventId } = req.params;
    const { status } = req.query;

    let sql = `SELECT ea.*, u.display_name, u.profile_id, u.bio, up.profile_photos
               FROM event_applications ea
               LEFT JOIN users u ON ea.user_id = u.id
               LEFT JOIN user_profiles up ON u.id = up.user_id
               WHERE ea.event_id = ?`;
    const params = [eventId];

    if (status) {
      sql += ` AND ea.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY ea.created_at DESC`;

    const result = await query(sql, params);
    res.json({ applications: result.rows || [] });
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

    await query(
      `UPDATE event_applications SET status = ?, updated_at = datetime('now') WHERE id = ?`,
      [status, applicationId]
    );

    // Get the updated application
    const appRes = await query('SELECT * FROM event_applications WHERE id = ?', [applicationId]);
    
    if (!appRes.rows || appRes.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const app = appRes.rows[0];

    // Get user and event info for notification
    const userRes = await query('SELECT display_name FROM users WHERE id = ?', [app.user_id]);
    const eventRes = await query('SELECT title, host_id FROM events WHERE id = ?', [app.event_id]);

    if (status === 'accepted' && userRes.rows && eventRes.rows && userRes.rows.length > 0 && eventRes.rows.length > 0) {
      const event = eventRes.rows[0];
      
      // Notify applicant
      await query(
        `INSERT INTO notifications (id, user_id, notification_type, related_event_id, title, body, created_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
        [uuidv4(), app.user_id, 'event_accepted', app.event_id, 'Application Accepted', `You've been accepted to "${event.title}"!`]
      );
    }

    res.json({ application: app, message: `✅ Application ${status}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function withdrawApplication(req, res) {
  try {
    const { applicationId } = req.params;

    // Check if application exists first
    const checkRes = await query(
      'SELECT id FROM event_applications WHERE id = ?',
      [applicationId]
    );

    if (!checkRes.rows || checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    await query(
      'DELETE FROM event_applications WHERE id = ?',
      [applicationId]
    );

    res.json({ success: true, message: '✅ Application withdrawn' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getEventCapacityInfo(req, res) {
  try {
    const { eventId } = req.params;

    // Get event capacity
    const eventRes = await query(
      'SELECT max_guests FROM events WHERE id = ?',
      [eventId]
    );

    if (!eventRes.rows || eventRes.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const event = eventRes.rows[0];
    const maxGuests = event.max_guests || 999;

    // Count applications by status
    const countRes = await query(
      `SELECT 
        COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted,
        COUNT(CASE WHEN status IN ('pending', 'accepted') THEN 1 END) as total,
        COUNT(CASE WHEN status = 'waitlisted' THEN 1 END) as waitlisted
       FROM event_applications 
       WHERE event_id = ?`,
      [eventId]
    );

    const counts = countRes.rows && countRes.rows[0] || { accepted: 0, total: 0, waitlisted: 0 };
    const atCapacity = counts.total >= maxGuests;
    const remainingSpots = Math.max(0, maxGuests - counts.total);

    res.json({
      maxCapacity: maxGuests,
      acceptedApplications: counts.accepted,
      totalApplications: counts.total,
      waitlistedApplications: counts.waitlisted,
      atCapacity,
      remainingSpots,
      capacityPercentage: (counts.total / maxGuests) * 100
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
