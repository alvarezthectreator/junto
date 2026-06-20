import { query } from '../../db/connection.js';
import { v4 as uuidv4 } from 'uuid';
import {
  createAccountFlag,
  flagSuspiciousActivity,
  logFraudEvent,
} from '../../services/fraudDetectionService.js';
import { broadcastSafetyEvent } from '../../websocket.js';

function getEscalationLevel(reportType, description = '') {
  const text = `${reportType || ''} ${description || ''}`.toLowerCase();

  if (/(violence|assault|threat|extortion|kidnap|weapon|scam|fraud|blackmail|urgent|emergency)/.test(text)) {
    return 'critical';
  }

  if (/(harassment|hate|stalking|abuse|spam|impersonat|sexual|suspicious)/.test(text)) {
    return 'high';
  }

  return 'standard';
}

export async function getTrustedContacts(req, res) {
  try {
    const { userId } = req.params;

    const result = await query(
      'SELECT * FROM trusted_contacts WHERE user_id = $1 ORDER BY is_primary DESC, created_at ASC',
      [userId]
    );

    res.json({ contacts: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function addTrustedContact(req, res) {
  try {
    const { userId } = req.params;
    const { contact_name, contact_phone, is_primary } = req.body;

    if (!contact_name || !contact_phone) {
      return res.status(400).json({ error: 'Contact name and phone required' });
    }

    // If marking as primary, unset others
    if (is_primary) {
      await query(
        'UPDATE trusted_contacts SET is_primary = false WHERE user_id = $1',
        [userId]
      );
    }

    const contactId = uuidv4();
    const result = await query(
      `INSERT INTO trusted_contacts (id, user_id, contact_name, contact_phone, is_primary)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [contactId, userId, contact_name, contact_phone, is_primary || false]
    );

    res.status(201).json({ contact: result.rows[0], message: '✅ Contact added' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateTrustedContact(req, res) {
  try {
    const { contactId } = req.params;
    const { contact_name, contact_phone, is_primary } = req.body;

    const result = await query(
      `UPDATE trusted_contacts SET contact_name = COALESCE($1, contact_name),
                                  contact_phone = COALESCE($2, contact_phone),
                                  is_primary = COALESCE($3, is_primary)
       WHERE id = $4
       RETURNING *`,
      [contact_name, contact_phone, is_primary, contactId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({ contact: result.rows[0], message: '✅ Contact updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function deleteTrustedContact(req, res) {
  try {
    const { contactId } = req.params;

    const result = await query(
      'DELETE FROM trusted_contacts WHERE id = $1 RETURNING id',
      [contactId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({ success: true, message: '✅ Contact deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function triggerSOS(req, res) {
  try {
    const { userId } = req.params;
    const { location_latitude, location_longitude } = req.body;

    // Create SOS alert
    const alertId = uuidv4();
    const alert = await query(
      `INSERT INTO safety_alerts (id, user_id, alert_type, location_latitude, location_longitude, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       RETURNING *`,
      [alertId, userId, 'sos', location_latitude || null, location_longitude || null]
    );

    // Get user and trusted contacts
    const userRes = await query('SELECT full_name, profile_id FROM users WHERE id = $1', [userId]);
    const contactsRes = await query(
      'SELECT contact_phone FROM trusted_contacts WHERE user_id = $1',
      [userId]
    );

    const user = userRes.rows[0];
    const contacts = contactsRes.rows;

    // In production, send SMS to all contacts here
    console.log(`🚨 SOS ALERT triggered for ${user.full_name} (${user.profile_id})`);
    console.log(`📍 Location: Lat ${location_latitude}, Long ${location_longitude}`);
    console.log(`📞 Notifying ${contacts.length} trusted contacts:`, contacts.map(c => c.contact_phone).join(', '));

    broadcastSafetyEvent({
      action: 'sos_triggered',
      user_id: userId,
      alert_id: alertId,
      location_latitude: location_latitude || null,
      location_longitude: location_longitude || null,
      contacts_notified: contacts.length,
    });

    res.json({
      alert: alert.rows[0],
      message: '🚨 SOS alert triggered and trusted contacts notified',
      contacts_notified: contacts.length
    });
  } catch (error) {
    console.error('SOS error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function getBlockedUsers(req, res) {
  try {
    const { userId } = req.params;

    const result = await query(
      `SELECT bu.*, u.display_name, u.profile_id FROM blocked_users bu
       LEFT JOIN users u ON bu.blocked_user_id = u.id
       WHERE bu.blocker_id = $1`,
      [userId]
    );

    res.json({ blocked_users: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function blockUser(req, res) {
  try {
    const { userId, blockedUserId } = req.params;
    const { reason } = req.body;

    const blockId = uuidv4();
    const result = await query(
      `INSERT INTO blocked_users (id, blocker_id, blocked_user_id, reason)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING
       RETURNING *`,
      [blockId, userId, blockedUserId, reason || null]
    );

    // Delete any existing conversations
    await query(
      `DELETE FROM conversations 
       WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)`,
      [userId, blockedUserId]
    );

    res.json({ blocked_user: result.rows[0] || { blocker_id: userId, blocked_user_id: blockedUserId }, message: '✅ User blocked' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function unblockUser(req, res) {
  try {
    const { userId, blockedUserId } = req.params;

    const result = await query(
      'DELETE FROM blocked_users WHERE blocker_id = $1 AND blocked_user_id = $2 RETURNING id',
      [userId, blockedUserId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Block not found' });
    }

    res.json({ success: true, message: '✅ User unblocked' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function reportUser(req, res) {
  try {
    const { userId, reportedUserId } = req.params;
    const { report_type, description, evidence_urls } = req.body;

    const reportId = uuidv4();
    const escalationLevel = getEscalationLevel(report_type, description);
    const result = await query(
      `INSERT INTO reports (id, reporter_id, reported_user_id, report_type, description, evidence_urls, escalation_level, escalation_reason, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
       RETURNING *`,
      [
        reportId,
        userId,
        reportedUserId,
        report_type || 'other',
        description || null,
        evidence_urls ? JSON.stringify(evidence_urls) : null,
        escalationLevel,
        description || report_type || 'report submitted',
      ]
    );

    console.log(`📋 Report filed: ${report_type} against user ${reportedUserId} by ${userId}`);

    if (escalationLevel === 'high' || escalationLevel === 'critical') {
      await createAccountFlag(
        req.db,
        reportedUserId,
        `report_${report_type || 'other'}`,
        escalationLevel === 'critical' ? 'high' : 'medium',
        description || 'User reported with elevated escalation'
      );

      await flagSuspiciousActivity(
        req.db,
        reportedUserId,
        `report_${report_type || 'other'}`,
        description || 'User reported with elevated escalation',
        escalationLevel === 'critical' ? 90 : 70
      );

      await logFraudEvent(req.db, reportedUserId, 'report_escalation', 'User report escalated for moderation', {
        report_id: reportId,
        reporter_id: userId,
        report_type: report_type || 'other',
        escalation_level: escalationLevel,
      });
    }

    res.status(201).json({
      report: result.rows[0],
      escalation_level: escalationLevel,
      message: '✅ Report submitted. Our team will review it within 24 hours.',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
