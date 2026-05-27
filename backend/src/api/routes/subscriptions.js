import express from 'express';
import {
  activateSubscription,
  cancelSubscription,
  getSubscription,
} from '../controllers/subscriptions.js';

const router = express.Router();

router.get('/:userId', getSubscription);
router.post('/activate', activateSubscription);
router.put('/:userId/cancel', cancelSubscription);

export default router;
