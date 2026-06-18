import express from 'express';
import { getVenues, getVenueById, createVenue, addVenueReview, seedVenues } from '../controllers/venues.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = express.Router();

router.get('/', getVenues);
router.post('/seed', requireAdmin, seedVenues);
router.get('/:id', getVenueById);
router.post('/', requireAdmin, createVenue);
router.post('/:venue_id/reviews', addVenueReview);

export default router;
