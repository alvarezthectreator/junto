import express from 'express';
import { acceptInvite, declineInvite, getPendingInvites } from '../controllers/invites.js';

const router = express.Router();

router.post('/accept', acceptInvite);
router.post('/decline', declineInvite);
router.get('/:user_id/pending', getPendingInvites);

export default router;
