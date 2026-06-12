import { query } from '../../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

export async function sendMessage(req, res) {
  try {
    const {
      sender_id,
      receiver_id,
      recipient_id,
      content,
      message_type = 'text',
      media_url,
    } = req.body;
    const resolvedReceiverId = receiver_id || recipient_id;

    if (!sender_id || !resolvedReceiverId || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get or create conversation
    let convResult = await query(
      `SELECT id FROM conversations 
       WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)`,
      [sender_id, resolvedReceiverId]
    );

    let conversation_id;
    if (convResult.rows.length === 0) {
      const convId = uuidv4();
      await query(
        `INSERT INTO conversations (id, user1_id, user2_id) VALUES ($1, $2, $3)`,
        [convId, sender_id, resolvedReceiverId]
      );
      conversation_id = convId;
    } else {
      conversation_id = convResult.rows[0].id;
    }

    // Insert message
    const messageId = uuidv4();
    const result = await query(
      `INSERT INTO messages (id, conversation_id, sender_id, receiver_id, content, message_type, media_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [messageId, conversation_id, sender_id, resolvedReceiverId, content, message_type, media_url || null]
    );

    // Update conversation timestamp
    await query(
      `UPDATE conversations SET last_message_id = ?, last_message_at = datetime('now') WHERE id = ?`,
      [messageId, conversation_id]
    );

    // Create notification
    const senderRes = await query('SELECT display_name FROM users WHERE id = $1', [sender_id]);
    if (senderRes.rows.length > 0) {
      const notificationId = uuidv4();
      await query(
        `INSERT INTO notifications (id, user_id, notification_type, related_user_id, title, body, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, datetime('now'))`,
        [notificationId, resolvedReceiverId, 'new_message', sender_id, `Message from ${senderRes.rows[0].display_name}`, content.substring(0, 50)]
      );
    }

    res.status(201).json({ message: result.rows[0] });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function getConversations(req, res) {
  try {
    const { userId } = req.params;
    const { limit = 20 } = req.query;

    const result = await query(
      `SELECT c.*, 
              CASE WHEN c.user1_id = $1 THEN c.user2_id ELSE c.user1_id END as other_user_id,
              u.display_name, u.profile_id
       FROM conversations c
       LEFT JOIN users u ON (CASE WHEN c.user1_id = $1 THEN c.user2_id ELSE c.user1_id END) = u.id
       WHERE c.user1_id = $1 OR c.user2_id = $1
       ORDER BY c.last_message_at DESC NULLS LAST
       LIMIT $2`,
      [userId, limit]
    );

    res.json({ conversations: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getConversation(req, res) {
  try {
    const { conversationId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const result = await query(
      `SELECT * FROM messages WHERE conversation_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [conversationId, limit, offset]
    );

    res.json({ messages: result.rows.reverse() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function markAsRead(req, res) {
  try {
    const { messageId } = req.params;

    const result = await query(
      `UPDATE messages SET is_read = true, read_at = datetime('now') WHERE id = ? RETURNING *`,
      [messageId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({ message: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function deleteMessage(req, res) {
  try {
    const { messageId } = req.params;

    const result = await query(
      'DELETE FROM messages WHERE id = $1 RETURNING id',
      [messageId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({ success: true, message: '✅ Message deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
