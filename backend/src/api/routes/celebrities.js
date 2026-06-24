import express from 'express';
import { getCelebrities, getCelebrityById, createCelebrity, createCelebrityBooking, updateBookingStatus, getCelebrityReviews, updateCelebrity, deleteCelebrity, createCelebrityReview, deleteCelebrityReview } from '../controllers/celebrities.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = express.Router();

router.get('/', getCelebrities);
router.get('/:id', getCelebrityById);
router.post('/', requireAdmin, createCelebrity);
router.put('/:id', requireAdmin, updateCelebrity);
router.delete('/:id', requireAdmin, deleteCelebrity);
router.post('/:celebrity_id/bookings', createCelebrityBooking);
router.post('/:celebrity_id/reviews', requireAdmin, createCelebrityReview);
router.patch('/bookings/:id', requireAdmin, updateBookingStatus);
router.get('/:celebrity_id/reviews', getCelebrityReviews);
router.delete('/reviews/:id', requireAdmin, deleteCelebrityReview);

export default router;
