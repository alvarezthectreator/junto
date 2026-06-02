import express from 'express';
import {
  createSquad,
  getUserSquads,
  getSquadDetails,
  inviteUsersToSquad,
  acceptSquadInvite,
  declineSquadInvite,
  removeSquadMember,
  deleteSquad,
} from '../controllers/squads.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// POST /squads - Create a new squad
router.post('/', authenticateToken, createSquad);

// GET /squads/user/:userId - Get user's squads
router.get('/user/:userId', getUserSquads);

// GET /squads/:squadId - Get squad details with members
router.get('/:squadId', getSquadDetails);

// POST /squads/:squadId/invite - Invite users to squad
router.post('/:squadId/invite', authenticateToken, inviteUsersToSquad);

// PUT /squads/invite/:inviteId/accept - Accept invite
router.put('/invite/:inviteId/accept', authenticateToken, acceptSquadInvite);

// PUT /squads/invite/:inviteId/decline - Decline invite
router.put('/invite/:inviteId/decline', authenticateToken, declineSquadInvite);

// DELETE /squads/:squadId/members/:memberId - Remove squad member
router.delete('/:squadId/members/:memberId', authenticateToken, removeSquadMember);

// DELETE /squads/:squadId - Delete squad
router.delete('/:squadId', authenticateToken, deleteSquad);

export default router;
