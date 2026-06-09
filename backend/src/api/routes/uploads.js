import express from 'express';
import { uploadMedia } from '../controllers/uploads.js';

const router = express.Router();

router.post('/media', uploadMedia);

export default router;
