import { query } from '../../db/connection.js';
import { v4 as uuidv4 } from 'uuid';
import {
  createAccountFlag,
  flagSuspiciousActivity,
  logFraudEvent,
} from '../../services/fraudDetectionService.js';

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

// Report a user
export async function reportUser(req, res) {
  try {
    const { reporter_id, reported_user_id, report_type, description, evidence_urls } = req.body;

    if (!reporter_id || !reported_user_id || !report_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (reporter_id === reported_user_id) {
      return res.status(400).json({ error: 'Cannot report yourself' });
    }

    const reportId = uuidv4();
    const escalationLevel = getEscalationLevel(report_type, description);
    const result = await query(
      `INSERT INTO reports (id, reporter_id, reported_user_id, report_type, description, evidence_urls, escalation_level, escalation_reason, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))`,
      [
        reportId,
        reporter_id,
        reported_user_id,
        report_type,
        description || null,
        evidence_urls ? JSON.stringify(evidence_urls) : null,
        escalationLevel,
        description || report_type,
      ]
    );

    if (escalationLevel === 'high' || escalationLevel === 'critical') {
      await createAccountFlag(
        req.db,
        reported_user_id,
        `report_${report_type}`,
        escalationLevel === 'critical' ? 'high' : 'medium',
        description || 'User reported with elevated escalation'
      );

      await flagSuspiciousActivity(
        req.db,
        reported_user_id,
        `report_${report_type}`,
        description || 'User reported with elevated escalation',
        escalationLevel === 'critical' ? 90 : 70
      );

      await logFraudEvent(req.db, reported_user_id, 'report_escalation', 'User report escalated for moderation', {
        report_id: reportId,
        reporter_id,
        report_type,
        escalation_level: escalationLevel,
      });
    }

    res.json({
      report_id: reportId,
      status: 'pending',
      escalation_level: escalationLevel,
      message: 'Report submitted successfully',
    });
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ error: error.message });
  }
}

// Block a user
export async function blockUser(req, res) {
  try {
    const { blocker_id, blocked_user_id, reason } = req.body;

    if (!blocker_id || !blocked_user_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (blocker_id === blocked_user_id) {
      return res.status(400).json({ error: 'Cannot block yourself' });
    }

    const blockId = uuidv4();
    
    // Check if already blocked
    const existing = await query(
      `SELECT id FROM blocked_users WHERE blocker_id = ? AND blocked_user_id = ?`,
      [blocker_id, blocked_user_id]
    );

    if (existing.rows && existing.rows.length > 0) {
      return res.status(400).json({ error: 'User already blocked' });
    }

    await query(
      `INSERT INTO blocked_users (id, blocker_id, blocked_user_id, reason, created_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
      [blockId, blocker_id, blocked_user_id, reason || null]
    );

    res.json({ block_id: blockId, message: 'User blocked successfully' });
  } catch (error) {
    console.error('Block error:', error);
    res.status(500).json({ error: error.message });
  }
}

// Unblock a user
export async function unblockUser(req, res) {
  try {
    const { blocker_id, blocked_user_id } = req.body;

    if (!blocker_id || !blocked_user_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await query(
      `DELETE FROM blocked_users WHERE blocker_id = ? AND blocked_user_id = ?`,
      [blocker_id, blocked_user_id]
    );

    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Unblock error:', error);
    res.status(500).json({ error: error.message });
  }
}

// Get blocked users list
export async function getBlockedUsers(req, res) {
  try {
    const { user_id } = req.params;

    const result = await query(
      `SELECT u.*, b.reason, b.created_at as blocked_at
       FROM blocked_users b
       LEFT JOIN users u ON b.blocked_user_id = u.id
       WHERE b.blocker_id = ?
       ORDER BY b.created_at DESC`,
      [user_id]
    );

    res.json({ blocked_users: result.rows || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Check if user is blocked
export async function isUserBlocked(req, res) {
  try {
    const { blocker_id, blocked_user_id } = req.query;

    const result = await query(
      `SELECT id FROM blocked_users WHERE blocker_id = ? AND blocked_user_id = ?`,
      [blocker_id, blocked_user_id]
    );

    res.json({ is_blocked: result.rows && result.rows.length > 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
