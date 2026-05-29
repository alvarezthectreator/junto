import express from 'express';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getHostEvents,
  saveEvent,
  unsaveEvent,
  getUserSavedEvents,
  checkEventSaved,
  rateEvent,
  getEventRating
} from '../controllers/events.js';

const router = express.Router();

// Events
router.get('/', getEvents);
router.get('/:eventId', getEventById);
router.post('/', createEvent);
router.put('/:eventId', updateEvent);
router.delete('/:eventId', deleteEvent);
router.get('/host/:hostId', getHostEvents);

// Event Saves (Wishlist)
router.post('/save', saveEvent);
router.delete('/save', unsaveEvent);
router.get('/user/:userId/saved', getUserSavedEvents);
router.get('/:eventId/saved/:userId', checkEventSaved);

// Event Ratings
router.post('/rate', rateEvent);
router.get('/:eventId/rating', getEventRating);

export default router;
