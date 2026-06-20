import { query } from '../../db/connection.js';
import { v4 as uuidv4 } from 'uuid';
import { createNotification } from '../../services/notificationService.js';

// Accept a private event invite
export async function acceptInvite(req, res) {
  try {
    const { application_id, user_id } = req.body;

    if (!application_id || !user_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify application belongs to user
    const appCheck = await query(
      `SELECT e.*, ea.* FROM event_applications ea
       LEFT JOIN events e ON ea.event_id = e.id
       WHERE ea.id = ? AND ea.user_id = ?`,
      [application_id, user_id]
    );

    if (!appCheck.rows || appCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    const application = appCheck.rows[0];

    // Update status to accepted
    await query(
      `UPDATE event_applications SET status = 'accepted', updated_at = datetime('now')
       WHERE id = ?`,
      [application_id]
    );

    // Get event details
    const eventRes = await query(
      `SELECT e.*, u.display_name as host_name FROM events e
       LEFT JOIN users u ON e.host_id = u.id
       WHERE e.id = ?`,
      [application.event_id]
    );

    const event = eventRes.rows?.[0];

    // Send notification to host
    if (event) {
      const userRes = await query(`SELECT display_name FROM users WHERE id = ?`, [user_id]);
      const userName = userRes.rows?.[0]?.display_name || 'Someone';

      await createNotification({
        userId: event.host_id,
        notificationType: 'invite_accepted',
        title: '✅ Invite Accepted',
        body: `${userName} accepted your invite!`,
        relatedUserId: user_id,
        relatedEventId: application.event_id,
        payload: {
          eventId: application.event_id,
          title: '✅ Invite Accepted',
          body: `${userName} accepted your invite!`,
          url: `/events/${application.event_id}`,
        },
        url: `/events/${application.event_id}`,
      });
    }

    res.json({ message: 'Invite accepted successfully', status: 'accepted' });
  } catch (error) {
    console.error('Accept invite error:', error);
    res.status(500).json({ error: error.message });
  }
}

// Decline a private event invite
export async function declineInvite(req, res) {
  try {
    const { application_id, user_id } = req.body;

    if (!application_id || !user_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify application belongs to user
    const appCheck = await query(
      `SELECT * FROM event_applications WHERE id = ? AND user_id = ?`,
      [application_id, user_id]
    );

    if (!appCheck.rows || appCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    const application = appCheck.rows[0];

    // Update status to declined
    await query(
      `UPDATE event_applications SET status = 'declined', updated_at = datetime('now')
       WHERE id = ?`,
      [application_id]
    );

    // Get event details
    const eventRes = await query(
      `SELECT e.*, u.display_name as host_name FROM events e
       LEFT JOIN users u ON e.host_id = u.id
       WHERE e.id = ?`,
      [application.event_id]
    );

    const event = eventRes.rows?.[0];

    // Send notification to host
    if (event) {
      const userRes = await query(`SELECT display_name FROM users WHERE id = ?`, [user_id]);
      const userName = userRes.rows?.[0]?.display_name || 'Someone';

      await createNotification({
        userId: event.host_id,
        notificationType: 'invite_declined',
        title: '❌ Invite Declined',
        body: `${userName} declined your invite.`,
        relatedUserId: user_id,
        relatedEventId: application.event_id,
        payload: {
          eventId: application.event_id,
          title: '❌ Invite Declined',
          body: `${userName} declined your invite.`,
          url: `/events/${application.event_id}`,
        },
        url: `/events/${application.event_id}`,
      });
    }

    res.json({ message: 'Invite declined successfully', status: 'declined' });
  } catch (error) {
    console.error('Decline invite error:', error);
    res.status(500).json({ error: error.message });
  }
}

// Get pending invites for a user
export async function getPendingInvites(req, res) {
  try {
    const { user_id } = req.params;

    const result = await query(
      `SELECT ea.*, e.title as event_title, e.event_date, e.event_time, e.billing_tier,
              u.display_name as host_name, u.profile_id
       FROM event_applications ea
       LEFT JOIN events e ON ea.event_id = e.id
       LEFT JOIN users u ON e.host_id = u.id
       WHERE ea.user_id = ? AND ea.status = 'pending' AND e.status = 'active'
       ORDER BY ea.created_at DESC`,
      [user_id]
    );

    res.json({ invites: result.rows || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
