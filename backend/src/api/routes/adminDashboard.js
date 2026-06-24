import express from 'express';
import { requireAdmin } from '../middleware/requireAdmin.js';
import {
  createAdminDashboardItem,
  deleteAdminDashboardItem,
  getAdminDashboardItems,
  updateAdminDashboardItem,
} from '../controllers/adminDashboard.js';

const router = express.Router();

router.get('/dashboard/items', requireAdmin, getAdminDashboardItems);
router.post('/dashboard/items', requireAdmin, createAdminDashboardItem);
router.put('/dashboard/items/:itemId', requireAdmin, updateAdminDashboardItem);
router.delete('/dashboard/items/:itemId', requireAdmin, deleteAdminDashboardItem);

export default router;
