/**
 * Fraud Detection Controller
 * Handles all fraud detection endpoints
 */

import {
  calculateFraudRiskScore,
  calculateBehaviorScore,
  calculateIdentityScore,
  flagSuspiciousActivity,
  createAccountFlag,
  logFraudEvent,
  updateFraudScore,
  getUserFraudScore,
  getRiskLevel,
} from '../services/fraudDetectionService.js';

export const getUserFraudStatus = async (req, res, db) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const fraudScore = await getUserFraudScore(db, userId);

    res.json({
      fraud_status: {
        user_id: userId,
        risk_score: fraudScore.risk_score || 0,
        risk_level: getRiskLevel(fraudScore.risk_score || 0),
        behavior_score: fraudScore.behavior_score || 100,
        identity_score: fraudScore.identity_score || 50,
        verification_status: fraudScore.verification_status || 'unverified',
        flags_count: fraudScore.flags_count || 0,
        last_updated: fraudScore.last_updated,
      },
    });
  } catch (error) {
    console.error('Error in getUserFraudStatus:', error);
    res.status(500).json({ error: 'Failed to fetch fraud status' });
  }
};

export const calculateUserRiskScore = async (req, res, db) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const riskScore = await calculateFraudRiskScore(db, userId);
    const behaviorScore = await calculateBehaviorScore(db, userId);
    const identityScore = await calculateIdentityScore(db, userId);

    // Update scores in database
    await updateFraudScore(db, userId, behaviorScore, identityScore, riskScore);

    // Log the assessment
    await logFraudEvent(db, userId, 'fraud_assessment', 'Risk assessment calculated', {
      risk_score: riskScore,
      behavior_score: behaviorScore,
      identity_score: identityScore,
    });

    res.json({
      assessment: {
        user_id: userId,
        risk_score: riskScore,
        risk_level: getRiskLevel(riskScore),
        behavior_score: behaviorScore,
        identity_score: identityScore,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error calculating risk score:', error);
    res.status(500).json({ error: 'Failed to calculate risk score' });
  }
};

export const createFraudFlag = async (req, res, db) => {
  try {
    const { userId } = req.params;
    const { flagType, severity, description } = req.body;

    if (!userId || !flagType) {
      return res.status(400).json({ error: 'User ID and flag type are required' });
    }

    const result = await createAccountFlag(db, userId, flagType, severity || 'medium', description || '');

    res.json({
      flag_created: true,
      flag_id: result.id,
      message: `Account flagged for ${flagType}`,
    });
  } catch (error) {
    console.error('Error creating fraud flag:', error);
    res.status(500).json({ error: 'Failed to create flag' });
  }
};

export const getAccountFlags = async (req, res, db) => {
  try {
    const { userId } = req.params;
    const { reviewed } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    let sql = 'SELECT * FROM account_flags WHERE user_id = ?';
    const params = [userId];

    if (reviewed !== undefined) {
      sql += ' AND reviewed = ?';
      params.push(reviewed === 'true' ? 1 : 0);
    }

    sql += ' ORDER BY created_at DESC';

    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('Error fetching account flags:', err);
        return res.status(500).json({ error: 'Failed to fetch flags' });
      }

      res.json({
        flags: (rows || []).map(row => ({
          id: row.id,
          flag_type: row.flag_type,
          severity: row.severity,
          description: row.description,
          action_taken: row.action_taken,
          reviewed: Boolean(row.reviewed),
          reviewed_by: row.reviewed_by,
          notes: row.notes,
          created_at: row.created_at,
          updated_at: row.updated_at,
        })),
        total: (rows || []).length,
      });
    });
  } catch (error) {
    console.error('Error in getAccountFlags:', error);
    res.status(500).json({ error: 'Failed to fetch flags' });
  }
};

export const reviewAccountFlag = async (req, res, db) => {
  try {
    const { flagId } = req.params;
    const { reviewedBy, actionTaken, notes } = req.body;

    if (!flagId) {
      return res.status(400).json({ error: 'Flag ID is required' });
    }

    const now = new Date().toISOString();
    const sql = `
      UPDATE account_flags 
      SET reviewed = 1, reviewed_by = ?, action_taken = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `;

    db.run(sql, [reviewedBy, actionTaken || 'none', notes || '', now, flagId], function (err) {
      if (err) {
        console.error('Error reviewing flag:', err);
        return res.status(500).json({ error: 'Failed to review flag' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Flag not found' });
      }

      res.json({ message: 'Flag reviewed', updated_at: now });
    });
  } catch (error) {
    console.error('Error in reviewAccountFlag:', error);
    res.status(500).json({ error: 'Failed to review flag' });
  }
};

export const getSuspiciousActivities = async (req, res, db) => {
  try {
    const { userId } = req.params;
    const { resolved } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    let sql = 'SELECT * FROM suspicious_activities WHERE user_id = ?';
    const params = [userId];

    if (resolved !== undefined) {
      sql += ' AND resolved = ?';
      params.push(resolved === 'true' ? 1 : 0);
    }

    sql += ' ORDER BY created_at DESC LIMIT 50';

    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('Error fetching suspicious activities:', err);
        return res.status(500).json({ error: 'Failed to fetch activities' });
      }

      res.json({
        activities: (rows || []).map(row => ({
          id: row.id,
          activity_type: row.activity_type,
          description: row.description,
          confidence_score: row.confidence_score,
          resolved: Boolean(row.resolved),
          resolution_reason: row.resolution_reason,
          created_at: row.created_at,
          resolved_at: row.resolved_at,
        })),
        total: (rows || []).length,
      });
    });
  } catch (error) {
    console.error('Error in getSuspiciousActivities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
};

export const resolveSuspiciousActivity = async (req, res, db) => {
  try {
    const { activityId } = req.params;
    const { resolution_reason } = req.body;

    if (!activityId) {
      return res.status(400).json({ error: 'Activity ID is required' });
    }

    const now = new Date().toISOString();
    const sql = `
      UPDATE suspicious_activities 
      SET resolved = 1, resolution_reason = ?, resolved_at = ?
      WHERE id = ?
    `;

    db.run(sql, [resolution_reason || '', now, activityId], function (err) {
      if (err) {
        console.error('Error resolving activity:', err);
        return res.status(500).json({ error: 'Failed to resolve activity' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Activity not found' });
      }

      res.json({ message: 'Activity resolved', resolved_at: now });
    });
  } catch (error) {
    console.error('Error in resolveSuspiciousActivity:', error);
    res.status(500).json({ error: 'Failed to resolve activity' });
  }
};

export const getFraudLogs = async (req, res, db) => {
  try {
    const { userId } = req.params;
    const { eventType, limit = 50 } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    let sql = 'SELECT * FROM fraud_logs WHERE user_id = ?';
    const params = [userId];

    if (eventType) {
      sql += ' AND event_type = ?';
      params.push(eventType);
    }

    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit) || 50);

    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('Error fetching fraud logs:', err);
        return res.status(500).json({ error: 'Failed to fetch logs' });
      }

      res.json({
        logs: (rows || []).map(row => ({
          id: row.id,
          event_type: row.event_type,
          description: row.description,
          metadata: row.metadata ? JSON.parse(row.metadata) : {},
          ip_address: row.ip_address,
          created_at: row.created_at,
        })),
        total: (rows || []).length,
      });
    });
  } catch (error) {
    console.error('Error in getFraudLogs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
};

export const getHighRiskUsers = async (req, res, db) => {
  try {
    const { threshold = 80, limit = 20 } = req.query;

    let sql = `
      SELECT 
        fs.user_id,
        fs.risk_score,
        fs.risk_level,
        fs.behavior_score,
        fs.identity_score,
        fs.flags_count,
        u.display_name,
        u.profile_id,
        fs.last_updated
      FROM fraud_scores fs
      JOIN users u ON fs.user_id = u.id
      WHERE fs.risk_score >= ?
      ORDER BY fs.risk_score DESC
      LIMIT ?
    `;

    db.all(sql, [parseInt(threshold), parseInt(limit)], (err, rows) => {
      if (err) {
        console.error('Error fetching high risk users:', err);
        return res.status(500).json({ error: 'Failed to fetch users' });
      }

      res.json({
        high_risk_users: (rows || []).map(row => ({
          user_id: row.user_id,
          display_name: row.display_name,
          profile_id: row.profile_id,
          risk_score: row.risk_score,
          risk_level: row.risk_level,
          behavior_score: row.behavior_score,
          identity_score: row.identity_score,
          flags_count: row.flags_count,
          last_updated: row.last_updated,
        })),
        total: (rows || []).length,
        threshold,
      });
    });
  } catch (error) {
    console.error('Error in getHighRiskUsers:', error);
    res.status(500).json({ error: 'Failed to fetch high risk users' });
  }
};
