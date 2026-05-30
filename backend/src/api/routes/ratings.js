import express from 'express';
import { rateHost, getHostRatings, getUserHostRating, deleteHostRating } from '../controllers/ratings.js';

const router = express.Router();

router.post('/', rateHost);
router.get('/:host_id', getHostRatings);
router.get('/user-rating', getUserHostRating);
router.delete('/', deleteHostRating);

export default router;
