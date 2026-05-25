import express from 'express';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getHostEvents
} from '../controllers/events.js';

const router = express.Router();

router.get('/', getEvents);
router.get('/:eventId', getEventById);
router.post('/', createEvent);
router.put('/:eventId', updateEvent);
router.delete('/:eventId', deleteEvent);
router.get('/host/:hostId', getHostEvents);

export default router;
