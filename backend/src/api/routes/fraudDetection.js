/**
 * Fraud Detection Routes
 * Admin and moderation endpoints for fraud management
 */

import express from 'express';
import {
  getUserFraudStatus,
  calculateUserRiskScore,
  createFraudFlag,
  getAccountFlags,
  reviewAccountFlag,
  getSuspiciousActivities,
  resolveSuspiciousActivity,
  getFraudLogs,
  getHighRiskUsers,
  getFraudEnforcementSnapshot,
  runFraudEnforcement,
} from '../controllers/fraudDetection.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/fraud/:userId/status
 * Get user's current fraud status
 */
router.get('/:userId/status', (req, res) => {
  getUserFraudStatus(req, res, global.db);
});

/**
 * POST /api/fraud/:userId/calculate-risk
 * Calculate and update user's risk score
 */
router.post('/:userId/calculate-risk', authenticateToken, (req, res) => {
  calculateUserRiskScore(req, res, global.db);
});

/**
 * POST /api/fraud/:userId/flags
 * Create a new account flag
 */
router.post('/:userId/flags', authenticateToken, (req, res) => {
  createFraudFlag(req, res, global.db);
});

/**
 * GET /api/fraud/:userId/flags
 * Get account flags for a user
 */
router.get('/:userId/flags', authenticateToken, (req, res) => {
  getAccountFlags(req, res, global.db);
});

/**
 * PUT /api/fraud/flags/:flagId
 * Review and action an account flag
 */
router.put('/flags/:flagId', authenticateToken, (req, res) => {
  reviewAccountFlag(req, res, global.db);
});

/**
 * GET /api/fraud/:userId/suspicious-activities
 * Get suspicious activities for a user
 */
router.get('/:userId/suspicious-activities', authenticateToken, (req, res) => {
  getSuspiciousActivities(req, res, global.db);
});

/**
 * PUT /api/fraud/activities/:activityId/resolve
 * Mark suspicious activity as resolved
 */
router.put('/activities/:activityId/resolve', authenticateToken, (req, res) => {
  resolveSuspiciousActivity(req, res, global.db);
});

/**
 * GET /api/fraud/:userId/logs
 * Get fraud event logs for a user
 */
router.get('/:userId/logs', authenticateToken, (req, res) => {
  getFraudLogs(req, res, global.db);
});

/**
 * GET /api/fraud/high-risk-users
 * Get list of high-risk users for admin dashboard
 */
router.get('/summary', authenticateToken, (req, res) => {
  getFraudEnforcementSnapshot(req, res, global.db);
});

/**
 * POST /api/fraud/run-enforcement
 * Run the fraud enforcement sweep on demand
 */
router.post('/run-enforcement', authenticateToken, (req, res) => {
  runFraudEnforcement(req, res, global.db);
});

/**
 * GET /api/fraud/high-risk-users
 * Get list of high-risk users for admin dashboard
 */
router.get('/', authenticateToken, (req, res) => {
  getHighRiskUsers(req, res, global.db);
});

export default router;
