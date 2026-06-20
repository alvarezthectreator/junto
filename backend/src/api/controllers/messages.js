import { query } from '../../db/connection.js';
import { v4 as uuidv4 } from 'uuid';
import { broadcastConversationUpdated, broadcastMessageCreated } from '../../websocket.js';
import { createNotification } from '../../services/notificationService.js';

async function getConversationById(conversationId) {
  const result = await query(
    'SELECT id, user1_id, user2_id, last_message_id, last_message_at FROM conversations WHERE id = ?',
    [conversationId]
  );

  return result.rows[0] || null;
}

function isParticipant(conversation, userId) {
  return Boolean(
    conversation &&
    userId &&
    (String(conversation.user1_id) === String(userId) || String(conversation.user2_id) === String(userId))
  );
}

export async function sendMessage(req, res) {
  try {
    const actorId = req.user?.id;
    const {
      sender_id,
      receiver_id,
      recipient_id,
      content,
      message_type = 'text',
      media_url,
    } = req.body;
    const resolvedReceiverId = receiver_id || recipient_id;
    const senderId = actorId || sender_id;

    if (!senderId || !resolvedReceiverId || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (actorId && String(senderId) !== String(actorId)) {
      return res.status(403).json({ error: 'You can only send messages as your own account' });
    }

    if (String(senderId) === String(resolvedReceiverId)) {
      return res.status(400).json({ error: 'Cannot send a message to yourself' });
    }

    // Get or create conversation
    let convResult = await query(
      `SELECT id FROM conversations 
       WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)`,
      [senderId, resolvedReceiverId]
    );

    let conversation_id;
    if (convResult.rows.length === 0) {
      const convId = uuidv4();
      await query(
        `INSERT INTO conversations (id, user1_id, user2_id) VALUES ($1, $2, $3)`,
        [convId, senderId, resolvedReceiverId]
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
      [messageId, conversation_id, senderId, resolvedReceiverId, content, message_type, media_url || null]
    );

    // Update conversation timestamp
    await query(
      `UPDATE conversations SET last_message_id = ?, last_message_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
      [messageId, conversation_id]
    );

    // Create notification
    const senderRes = await query('SELECT display_name, username FROM users WHERE id = $1', [senderId]);
    if (senderRes.rows.length > 0 && message_type !== 'system') {
      const senderDisplayName = senderRes.rows[0].display_name || senderRes.rows[0].username || 'Someone';
      await createNotification({
        userId: resolvedReceiverId,
        notificationType: 'new_message',
        title: `Message from ${senderDisplayName}`,
        body: content.substring(0, 50),
        relatedUserId: senderId,
        payload: {
          conversationId: conversation_id,
          senderId,
          title: `Message from ${senderDisplayName}`,
          body: content.substring(0, 50),
          url: `/messages/${conversation_id}`,
        },
        url: `/messages/${conversation_id}`,
      });

      const payload = {
        conversation_id,
        message: {
          ...result.rows[0],
          sender_display_name: senderDisplayName,
        },
      };

      broadcastMessageCreated(payload);
      broadcastConversationUpdated({
        conversation_id,
        last_message_id: messageId,
        updated_at: new Date().toISOString(),
      });

      res.status(201).json({
        message: {
          ...result.rows[0],
          sender_display_name: senderDisplayName,
        }
      });
      return;
    }

    res.status(201).json({
      message: {
        ...result.rows[0],
        sender_display_name: 'You',
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function getConversations(req, res) {
  try {
    const viewerId = req.user?.id;
    const { userId } = req.params;
    const { limit = 20 } = req.query;

    if (!viewerId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (String(userId) !== String(viewerId)) {
      return res.status(403).json({ error: 'You can only access your own conversations' });
    }

    const result = await query(
      `SELECT c.*, 
              CASE WHEN c.user1_id = $1 THEN c.user2_id ELSE c.user1_id END as other_user_id,
              u.display_name, u.profile_id, u.avatar_image
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
    const viewerId = req.user?.id;
    const { conversationId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    if (!viewerId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const conversation = await getConversationById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (!isParticipant(conversation, viewerId)) {
      return res.status(403).json({ error: 'You do not have access to this conversation' });
    }

    const result = await query(
      `SELECT m.*, u.display_name AS sender_display_name, u.profile_id AS sender_profile_id, u.avatar_image AS sender_avatar_image
       FROM messages m
       LEFT JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = $1
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
    const viewerId = req.user?.id;
    const { conversationId } = req.params;

    if (!viewerId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const conversation = await getConversationById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (!isParticipant(conversation, viewerId)) {
      return res.status(403).json({ error: 'You do not have access to this conversation' });
    }

    const result = await query(
      `UPDATE messages
       SET is_read = true, read_at = datetime('now')
       WHERE conversation_id = ? AND receiver_id = ? AND is_read = false
       RETURNING *`,
      [conversationId, viewerId]
    );

    broadcastConversationUpdated({
      conversation_id: conversationId,
      read_by: viewerId,
      read_count: result.rows.length,
      updated_at: new Date().toISOString(),
    });

    res.json({ updated_messages: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function deleteMessage(req, res) {
  try {
    const viewerId = req.user?.id;
    const { messageId } = req.params;

    if (!viewerId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const messageResult = await query(
      `SELECT id, conversation_id, sender_id, receiver_id FROM messages WHERE id = ?`,
      [messageId]
    );

    if (messageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const messageRow = messageResult.rows[0];
    if (String(messageRow.sender_id) !== String(viewerId)) {
      return res.status(403).json({ error: 'You can only delete messages you sent' });
    }

    const result = await query(
      'DELETE FROM messages WHERE id = $1 RETURNING id',
      [messageId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const latestMessage = await query(
      `SELECT id, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 1`,
      [messageRow.conversation_id]
    );

    await query(
      `UPDATE conversations
       SET last_message_id = ?, last_message_at = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [
        latestMessage.rows[0]?.id || null,
        latestMessage.rows[0]?.created_at || null,
        messageRow.conversation_id,
      ]
    );

    broadcastConversationUpdated({
      conversation_id: messageRow.conversation_id,
      last_message_id: latestMessage.rows[0]?.id || null,
      updated_at: new Date().toISOString(),
    });

    res.json({ success: true, message: '✅ Message deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
