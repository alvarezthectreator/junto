import express from 'express';
import {
  applyToEvent,
  getUserApplications,
  getEventApplications,
  updateApplicationStatus,
  withdrawApplication
} from '../controllers/applications.js';

const router = express.Router();

router.post('/', applyToEvent);
router.get('/user/:userId', getUserApplications);
router.get('/event/:eventId', getEventApplications);
router.put('/:applicationId/status', updateApplicationStatus);
router.delete('/:applicationId', withdrawApplication);

export default router;
