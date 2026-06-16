import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  sendMessage,
  getConversation,
  getConversations,
  markAsRead,
  deleteMessage
} from '../controllers/messages.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', sendMessage);
router.get('/conversations/:userId', getConversations);
router.get('/:conversationId', getConversation);
router.put('/:conversationId/read', markAsRead);
router.delete('/:messageId', deleteMessage);

export default router;
