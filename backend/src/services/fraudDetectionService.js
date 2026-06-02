/**
 * Anti-Fraud Detection Service
 * Analyzes user behavior and assigns risk scores
 */

const RISK_THRESHOLDS = {
  LOW: 30,
  MEDIUM: 60,
  HIGH: 80,
  CRITICAL: 90,
};

const BEHAVIORAL_WEIGHTS = {
  rapid_event_creation: 15,
  rapid_cancellations: 20,
  multiple_no_shows: 25,
  negative_ratings: 15,
  report_count: 30,
  blocked_by_multiple: 20,
  rapid_profile_changes: 10,
  suspicious_location_jumps: 15,
  payment_failures: 20,
  declined_applications: 5,
};

/**
 * Calculate overall fraud risk score for a user
 */
export const calculateFraudRiskScore = (db, userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Fetch all relevant user data
      const eventCountResult = await new Promise((res) => {
        db.get(
          `SELECT COUNT(*) as count FROM events WHERE host_id = ? AND created_at > datetime('now', '-30 days')`,
          [userId],
          (err, row) => res(row?.count || 0)
        );
      });

      const cancellationResult = await new Promise((res) => {
        db.get(
          `SELECT COUNT(*) as count FROM events WHERE host_id = ? AND status = 'cancelled' AND updated_at > datetime('now', '-30 days')`,
          [userId],
          (err, row) => res(row?.count || 0)
        );
      });

      const noShowResult = await new Promise((res) => {
        db.get(
          `SELECT COUNT(*) as count FROM event_applications WHERE user_id = ? AND status = 'no_show'`,
          [userId],
          (err, row) => res(row?.count || 0)
        );
      });

      const negativeRatingsResult = await new Promise((res) => {
        db.get(
          `SELECT COUNT(*) as count FROM ratings WHERE target_user_id = ? AND rating <= 2`,
          [userId],
          (err, row) => res(row?.count || 0)
        );
      });

      const reportsResult = await new Promise((res) => {
        db.get(
          `SELECT COUNT(*) as count FROM reports WHERE target_user_id = ? OR reported_user_id = ?`,
          [userId, userId],
          (err, row) => res(row?.count || 0)
        );
      });

      const blockedByResult = await new Promise((res) => {
        db.get(
          `SELECT COUNT(*) as count FROM blocked_users WHERE blocked_user_id = ?`,
          [userId],
          (err, row) => res(row?.count || 0)
        );
      });

      // Calculate risk factors
      let riskScore = 0;

      // Rapid event creation (more than 10 events in 7 days)
      if (eventCountResult > 10) {
        riskScore += BEHAVIORAL_WEIGHTS.rapid_event_creation;
      }

      // Rapid cancellations (more than 3 in 30 days)
      if (cancellationResult > 3) {
        riskScore += BEHAVIORAL_WEIGHTS.rapid_cancellations;
      }

      // Multiple no-shows
      if (noShowResult > 2) {
        riskScore += BEHAVIORAL_WEIGHTS.multiple_no_shows;
      }

      // Negative ratings
      if (negativeRatingsResult > 1) {
        riskScore += BEHAVIORAL_WEIGHTS.negative_ratings * Math.min(negativeRatingsResult / 2, 1);
      }

      // Report count
      if (reportsResult > 0) {
        riskScore += BEHAVIORAL_WEIGHTS.report_count * Math.min(reportsResult / 3, 1);
      }

      // Blocked by multiple users
      if (blockedByResult > 1) {
        riskScore += BEHAVIORAL_WEIGHTS.blocked_by_multiple * Math.min(blockedByResult / 3, 1);
      }

      // Cap at 100
      riskScore = Math.min(riskScore, 100);

      resolve(Math.round(riskScore));
    } catch (error) {
      console.error('Error calculating fraud risk score:', error);
      resolve(0);
    }
  });
};

/**
 * Calculate behavioral score based on user actions
 */
export const calculateBehaviorScore = (db, userId) => {
  return new Promise((resolve) => {
    // Start with good score
    let score = 100;

    // Query suspicious activities
    db.get(
      `SELECT COUNT(*) as count FROM suspicious_activities WHERE user_id = ? AND resolved = 0`,
      [userId],
      (err, row) => {
        if (row && row.count > 0) {
          score -= row.count * 15;
        }

        // Query account flags
        db.get(
          `SELECT COUNT(*) as count FROM account_flags WHERE user_id = ? AND action_taken IN ('warning', 'restriction', 'suspension')`,
          [userId],
          (err, flagRow) => {
            if (flagRow && flagRow.count > 0) {
              score -= flagRow.count * 10;
            }

            resolve(Math.max(score, 0));
          }
        );
      }
    );
  });
};

/**
 * Calculate identity verification score
 */
export const calculateIdentityScore = (db, userId) => {
  return new Promise((resolve) => {
    db.get(
      `SELECT 
        phone_verified, 
        email_verified,
        verification_status
      FROM users 
      WHERE id = ?`,
      [userId],
      (err, row) => {
        if (err || !row) {
          resolve(50); // Default low score if user not found
          return;
        }

        let score = 50; // Base score

        if (row.phone_verified) score += 25;
        if (row.email_verified) score += 25;

        if (row.verification_status === 'verified') {
          score += 25;
        } else if (row.verification_status === 'pending') {
          score += 0;
        }

        resolve(Math.min(score, 100));
      }
    );
  });
};

/**
 * Flag suspicious account activity
 */
export const flagSuspiciousActivity = (db, userId, activityType, description, confidenceScore = 50) => {
  return new Promise((resolve, reject) => {
    const { v4: uuidv4 } = require('uuid');
    const id = uuidv4();
    const now = new Date().toISOString();

    const sql = `
      INSERT INTO suspicious_activities (id, user_id, activity_type, description, confidence_score, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.run(sql, [id, userId, activityType, description, confidenceScore, now], (err) => {
      if (err) {
        console.error('Error flagging suspicious activity:', err);
        reject(err);
      } else {
        resolve({ id, flagged: true });
      }
    });
  });
};

/**
 * Create account flag for manual review
 */
export const createAccountFlag = (db, userId, flagType, severity, description) => {
  return new Promise((resolve, reject) => {
    const { v4: uuidv4 } = require('uuid');
    const id = uuidv4();
    const now = new Date().toISOString();

    const sql = `
      INSERT INTO account_flags (id, user_id, flag_type, severity, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(sql, [id, userId, flagType, severity, description, now, now], (err) => {
      if (err) {
        console.error('Error creating account flag:', err);
        reject(err);
      } else {
        // Update fraud scores table
        updateAccountFlagCount(db, userId);
        resolve({ id, flagCreated: true });
      }
    });
  });
};

/**
 * Log fraud event for audit trail
 */
export const logFraudEvent = (db, userId, eventType, description, metadata = {}) => {
  return new Promise((resolve, reject) => {
    const { v4: uuidv4 } = require('uuid');
    const id = uuidv4();
    const now = new Date().toISOString();

    const sql = `
      INSERT INTO fraud_logs (id, user_id, event_type, description, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.run(sql, [id, userId, eventType, description, JSON.stringify(metadata), now], (err) => {
      if (err) {
        console.error('Error logging fraud event:', err);
        reject(err);
      } else {
        resolve({ id, logged: true });
      }
    });
  });
};

/**
 * Update fraud score in database
 */
export const updateFraudScore = (db, userId, behaviorScore, identityScore, riskScore) => {
  return new Promise((resolve, reject) => {
    const now = new Date().toISOString();
    const verification_status = identityScore > 75 ? 'verified' : identityScore > 50 ? 'partial' : 'unverified';

    // First, try to update
    const updateSql = `
      UPDATE fraud_scores 
      SET behavior_score = ?, identity_score = ?, risk_score = ?, verification_status = ?, last_updated = ?
      WHERE user_id = ?
    `;

    db.run(updateSql, [behaviorScore, identityScore, riskScore, verification_status, now, userId], function (err) {
      if (err) {
        console.error('Error updating fraud score:', err);
        reject(err);
        return;
      }

      // If no rows updated, insert instead
      if (this.changes === 0) {
        const { v4: uuidv4 } = require('uuid');
        const id = uuidv4();

        const insertSql = `
          INSERT INTO fraud_scores (id, user_id, behavior_score, identity_score, risk_score, verification_status, last_updated, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(insertSql, [id, userId, behaviorScore, identityScore, riskScore, verification_status, now, now], (insertErr) => {
          if (insertErr) {
            console.error('Error inserting fraud score:', insertErr);
            reject(insertErr);
          } else {
            resolve({ updated: true, riskLevel: getRiskLevel(riskScore) });
          }
        });
      } else {
        resolve({ updated: true, riskLevel: getRiskLevel(riskScore) });
      }
    });
  });
};

/**
 * Get user's fraud score
 */
export const getUserFraudScore = (db, userId) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM fraud_scores WHERE user_id = ?`;

    db.get(sql, [userId], (err, row) => {
      if (err) {
        console.error('Error fetching fraud score:', err);
        reject(err);
      } else {
        resolve(row || { risk_score: 0, behavior_score: 100, identity_score: 50 });
      }
    });
  });
};

/**
 * Get risk level label
 */
export const getRiskLevel = (score) => {
  if (score >= RISK_THRESHOLDS.CRITICAL) return 'CRITICAL';
  if (score >= RISK_THRESHOLDS.HIGH) return 'HIGH';
  if (score >= RISK_THRESHOLDS.MEDIUM) return 'MEDIUM';
  return 'LOW';
};

/**
 * Update flag count in fraud_scores
 */
const updateAccountFlagCount = (db, userId) => {
  db.run(
    `UPDATE fraud_scores SET flags_count = (SELECT COUNT(*) FROM account_flags WHERE user_id = ?) WHERE user_id = ?`,
    [userId, userId],
    (err) => {
      if (err) {
        console.error('Error updating flag count:', err);
      }
    }
  );
};

/**
 * Detect rapid event creation
 */
export const detectRapidEventCreation = (db, userId, timeWindowMinutes = 60) => {
  return new Promise((resolve) => {
    db.get(
      `SELECT COUNT(*) as count FROM events 
       WHERE host_id = ? AND created_at > datetime('now', ? || ' minutes')`,
      [userId, -timeWindowMinutes],
      (err, row) => {
        const count = row?.count || 0;
        resolve(count > 5); // Flag if more than 5 events in timeframe
      }
    );
  });
};

/**
 * Detect unusual geographic jumps
 */
export const detectGeographicAnomaly = (db, userId, previousLocation, newLocation) => {
  // Simple distance calculation (can be enhanced with Haversine)
  const lat1 = previousLocation.lat;
  const lon1 = previousLocation.lon;
  const lat2 = newLocation.lat;
  const lon2 = newLocation.lon;

  // Calculate distance in degrees (rough approximation)
  const distance = Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lon2 - lon1, 2));

  // Flag if jump is more than 10 degrees (roughly 1000km) in 1 hour
  return distance > 10;
};

/**
 * Detect high velocity transactions
 */
export const detectHighVelocityTransactions = (db, userId, timeWindowMinutes = 5) => {
  return new Promise((resolve) => {
    db.get(
      `SELECT COUNT(*) as count FROM event_applications 
       WHERE user_id = ? AND created_at > datetime('now', ? || ' minutes') AND status IN ('accepted', 'applied')`,
      [userId, -timeWindowMinutes],
      (err, row) => {
        const count = row?.count || 0;
        resolve(count > 10); // Flag if more than 10 applications in 5 minutes
      }
    );
  });
};
