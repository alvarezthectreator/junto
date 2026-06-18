import express from 'express';
import { getCelebrities, getCelebrityById, createCelebrity, createCelebrityBooking, updateBookingStatus, getCelebrityReviews } from '../controllers/celebrities.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = express.Router();

router.get('/', getCelebrities);
router.get('/:id', getCelebrityById);
router.post('/', requireAdmin, createCelebrity);
router.post('/:celebrity_id/bookings', createCelebrityBooking);
router.patch('/bookings/:id', requireAdmin, updateBookingStatus);
router.get('/:celebrity_id/reviews', getCelebrityReviews);

export default router;
