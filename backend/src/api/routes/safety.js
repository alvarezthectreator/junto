import express from 'express';
import {
  getTrustedContacts,
  addTrustedContact,
  updateTrustedContact,
  deleteTrustedContact,
  triggerSOS,
  getBlockedUsers,
  blockUser,
  unblockUser,
  reportUser
} from '../controllers/safety.js';

const router = express.Router();

// Trusted Contacts
router.get('/:userId/contacts', getTrustedContacts);
router.post('/:userId/contacts', addTrustedContact);
router.put('/:contactId', updateTrustedContact);
router.delete('/:contactId', deleteTrustedContact);

// SOS Alert
router.post('/:userId/sos', triggerSOS);

// Block/Report
router.get('/:userId/blocked', getBlockedUsers);
router.post('/:userId/block/:blockedUserId', blockUser);
router.delete('/:userId/block/:blockedUserId', unblockUser);
router.post('/:userId/report/:reportedUserId', reportUser);

export default router;
