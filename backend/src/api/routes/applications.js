import express from 'express';
import {
  applyToEvent,
  getUserApplications,
  getEventApplications,
  updateApplicationStatus,
  withdrawApplication,
  getEventCapacityInfo
} from '../controllers/applications.js';

const router = express.Router();

router.post('/', applyToEvent);
router.get('/user/:userId', getUserApplications);
router.get('/event/:eventId', getEventApplications);
router.get('/event/:eventId/capacity', getEventCapacityInfo);
router.put('/:applicationId/status', updateApplicationStatus);
router.delete('/:applicationId', withdrawApplication);

export default router;
