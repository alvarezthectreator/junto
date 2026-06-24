import express from 'express';
import { getVenues, getVenueById, createVenue, addVenueReview, seedVenues, updateVenue, deleteVenue, deleteVenueReview } from '../controllers/venues.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = express.Router();

router.get('/', getVenues);
router.post('/seed', requireAdmin, seedVenues);
router.get('/:id', getVenueById);
router.post('/', requireAdmin, createVenue);
router.put('/:id', requireAdmin, updateVenue);
router.delete('/:id', requireAdmin, deleteVenue);
router.post('/:venue_id/reviews', addVenueReview);
router.delete('/reviews/:id', requireAdmin, deleteVenueReview);

export default router;
