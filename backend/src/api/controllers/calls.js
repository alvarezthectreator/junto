import { query } from '../../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

function isValidStatus(status) {
  return ['ringing', 'connected', 'ended', 'missed', 'declined', 'cancelled'].includes(status);
}

async function getCallSessionById(callId) {
  const result = await query(
    `SELECT * FROM call_sessions WHERE id = ?`,
    [callId]
  );

  return result.rows[0] || null;
}

export async function createCallSession(req, res) {
  try {
    const authUserId = req.user?.id;
    const {
      caller_id,
      callee_id,
      conversation_id,
      mode = 'audio',
      initial_signal_message_id = null,
    } = req.body;

    if (!caller_id || !callee_id || !conversation_id) {
      return res.status(400).json({ error: 'caller_id, callee_id, and conversation_id are required' });
    }

    if (authUserId && String(authUserId) !== String(caller_id)) {
      return res.status(403).json({ error: 'You can only create a call as your own account' });
    }

    const callId = uuidv4();
    const now = new Date().toISOString();

    await query(
      `INSERT INTO call_sessions (
        id, conversation_id, caller_id, callee_id, mode, status, initial_signal_message_id,
        started_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'ringing', ?, ?, ?, ?)`,
      [callId, conversation_id, caller_id, callee_id, mode, initial_signal_message_id, now, now, now]
    );

    const session = await getCallSessionById(callId);
    res.status(201).json({ call_session: session });
  } catch (error) {
    console.error('Create call session error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function updateCallSession(req, res) {
  try {
    const authUserId = req.user?.id;
    const { callId } = req.params;
    const {
      status,
      answered_at,
      ended_at,
      duration_seconds,
      ended_reason,
      latest_signal_message_id,
    } = req.body;

    if (!callId) {
      return res.status(400).json({ error: 'callId is required' });
    }

    const session = await getCallSessionById(callId);
    if (!session) {
      return res.status(404).json({ error: 'Call session not found' });
    }

    if (authUserId && String(authUserId) !== String(session.caller_id) && String(authUserId) !== String(session.callee_id)) {
      return res.status(403).json({ error: 'You do not have access to this call session' });
    }

    const nextStatus = status && isValidStatus(status) ? status : session.status;
    const now = new Date().toISOString();

    await query(
      `UPDATE call_sessions
       SET status = ?,
           answered_at = COALESCE(?, answered_at),
           ended_at = COALESCE(?, ended_at),
           duration_seconds = COALESCE(?, duration_seconds),
           ended_reason = COALESCE(?, ended_reason),
           latest_signal_message_id = COALESCE(?, latest_signal_message_id),
           updated_at = ?
       WHERE id = ?`,
      [
        nextStatus,
        answered_at || null,
        ended_at || null,
        duration_seconds !== undefined ? duration_seconds : null,
        ended_reason || null,
        latest_signal_message_id || null,
        now,
        callId,
      ]
    );

    const updated = await getCallSessionById(callId);
    res.json({ call_session: updated });
  } catch (error) {
    console.error('Update call session error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function getCallSessions(req, res) {
  try {
    const authUserId = req.user?.id;
    const { userId } = req.params;
    const { limit = 20, conversation_id } = req.query;

    if (authUserId && String(authUserId) !== String(userId)) {
      return res.status(403).json({ error: 'You can only view your own call history' });
    }

    let sql = `
      SELECT cs.*, 
             caller.display_name AS caller_name,
             caller.profile_id AS caller_profile_id,
             caller.avatar_image AS caller_avatar_image,
             callee.display_name AS callee_name,
             callee.profile_id AS callee_profile_id,
             callee.avatar_image AS callee_avatar_image
      FROM call_sessions cs
      LEFT JOIN users caller ON cs.caller_id = caller.id
      LEFT JOIN users callee ON cs.callee_id = callee.id
      WHERE cs.caller_id = ? OR cs.callee_id = ?
    `;
    const params = [userId, userId];

    if (conversation_id) {
      sql += ' AND cs.conversation_id = ?';
      params.push(conversation_id);
    }

    sql += ' ORDER BY cs.started_at DESC LIMIT ?';
    params.push(parseInt(limit, 10));

    const result = await query(sql, params);
    res.json({ call_sessions: result.rows || [] });
  } catch (error) {
    console.error('Get call sessions error:', error);
    res.status(500).json({ error: error.message });
  }
}
