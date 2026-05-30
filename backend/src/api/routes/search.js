import express from 'express';
import { searchEvents, getCategories } from '../controllers/search.js';

const router = express.Router();

router.get('/search', searchEvents);
router.get('/categories', getCategories);

export default router;
