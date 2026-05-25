import express from 'express';
import {
  sendMessage,
  getConversation,
  getConversations,
  markAsRead,
  deleteMessage
} from '../controllers/messages.js';

const router = express.Router();

router.post('/', sendMessage);
router.get('/conversations/:userId', getConversations);
router.get('/:conversationId', getConversation);
router.put('/:messageId/read', markAsRead);
router.delete('/:messageId', deleteMessage);

export default router;
