/**
 * Fraud Enforcement Scheduler
 * Automates no-show handling, report escalation, and verification review.
 */

import cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/connection.js';
import { createNotification } from './notificationService.js';
import {
  calculateBehaviorScore,
  calculateFraudRiskScore,
  calculateIdentityScore,
  createAccountFlag,
  flagSuspiciousActivity,
  getRiskLevel,
  logFraudEvent,
  updateFraudScore,
} from './fraudDetectionService.js';

const NO_SHOW_PENALTY_PERCENT = 25;
const NO_SHOW_GRACE_MINUTES = 60;
const REPORT_CLUSTER_WINDOW_DAYS = 7;
const VERIFICATION_REVIEW_WINDOW_DAYS = 14;

let schedulerInstance = null;

async function recalculateFraudProfile(db, userId, reason, metadata = {}) {
  const [riskScore, behaviorScore, identityScore] = await Promise.all([
    calculateFraudRiskScore(db, userId),
    calculateBehaviorScore(db, userId),
    calculateIdentityScore(db, userId),
  ]);

  await updateFraudScore(db, userId, behaviorScore, identityScore, riskScore);

  await logFraudEvent(db, userId, 'fraud_enforcement_recalc', reason, {
    ...metadata,
    risk_score: riskScore,
    behavior_score: behaviorScore,
    identity_score: identityScore,
    risk_level: getRiskLevel(riskScore),
  });

  return { riskScore, behaviorScore, identityScore };
}

async function hasRecentFlag(db, userId, flagType, hours = 24) {
  const result = await query(
    `SELECT id
     FROM account_flags
     WHERE user_id = ? AND flag_type = ? AND created_at >= datetime('now', ? || ' hours')
     LIMIT 1`,
    [userId, flagType, -hours]
  );

  return Boolean(result.rows?.length);
}

async function hasRecentSuspiciousActivity(db, userId, activityType, hours = 24) {
  const result = await query(
    `SELECT id
     FROM suspicious_activities
     WHERE user_id = ? AND activity_type = ? AND created_at >= datetime('now', ? || ' hours')
     LIMIT 1`,
    [userId, activityType, -hours]
  );

  return Boolean(result.rows?.length);
}

async function applyReliabilityPenalty(db, userId, eventId, penaltyPercent, reason) {
  const userResult = await query('SELECT id, reliability_score, display_name FROM users WHERE id = ?', [userId]);
  if (!userResult.rows?.length) {
    return null;
  }

  const previousScore = Number(userResult.rows[0].reliability_score ?? 100);
  const newScore = Math.max(0, Number((previousScore * (1 - penaltyPercent / 100)).toFixed(2)));

  await query(
    'UPDATE users SET reliability_score = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [newScore, userId]
  );

  await query(
    `INSERT INTO reliability_penalty_log (
      id, user_id, event_id, penalty_percent, previous_score, new_score, reason, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [uuidv4(), userId, eventId, penaltyPercent, previousScore, newScore, reason]
  );

  return {
    userId,
    displayName: userResult.rows[0].display_name,
    previousScore,
    newScore,
  };
}

async function enforceNoShows(db) {
  const result = await query(
    `SELECT
       ea.id AS application_id,
       ea.event_id,
       ea.user_id,
       e.title,
       e.event_date,
       e.event_time
     FROM event_applications ea
     INNER JOIN events e ON e.id = ea.event_id
     LEFT JOIN event_check_ins eci
       ON eci.event_id = ea.event_id AND eci.user_id = ea.user_id
     WHERE ea.status IN ('accepted', 'pending')
       AND e.status NOT IN ('cancelled', 'expired')
       AND datetime(e.event_date || ' ' || e.event_time, '+' || ? || ' minutes') <= datetime('now')
       AND eci.id IS NULL
     LIMIT 100`,
    [NO_SHOW_GRACE_MINUTES]
  );

  const handled = [];

  for (const row of result.rows || []) {
    const updateResult = await query(
      `UPDATE event_applications
       SET status = 'no_show', updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status IN ('accepted', 'pending')`,
      [row.application_id]
    );

    if (!updateResult.changes) {
      continue;
    }

    handled.push(row.user_id);

    await applyReliabilityPenalty(
      db,
      row.user_id,
      row.event_id,
      NO_SHOW_PENALTY_PERCENT,
      `Automatic no-show penalty for "${row.title}"`
    );

    await createNotification({
      userId: row.user_id,
      notificationType: 'safety',
      title: 'No-show recorded',
      body: `You were marked as a no-show for "${row.title}". Your reliability score was updated.`,
      relatedEventId: row.event_id,
      payload: {
        eventId: row.event_id,
        applicationId: row.application_id,
        reason: 'automatic_no_show',
        url: '/safety',
      },
      url: '/safety',
    });

    if (!(await hasRecentSuspiciousActivity(db, row.user_id, 'no_show_enforcement'))) {
      await flagSuspiciousActivity(
        db,
        row.user_id,
        'no_show_enforcement',
        `Automatically marked as no-show for "${row.title}"`,
        80
      ).catch(() => {});
    }

    await logFraudEvent(db, row.user_id, 'no_show_enforced', 'Automatic no-show enforcement applied', {
      event_id: row.event_id,
      application_id: row.application_id,
      penalty_percent: NO_SHOW_PENALTY_PERCENT,
    });
  }

  const repeatNoShowUsers = await query(
    `SELECT user_id, COUNT(*) as no_show_count
     FROM event_applications
     WHERE status = 'no_show' AND updated_at >= datetime('now', '-90 days')
     GROUP BY user_id
     HAVING COUNT(*) >= 2
     LIMIT 100`
  );

  for (const row of repeatNoShowUsers.rows || []) {
    if (await hasRecentFlag(db, row.user_id, 'repeat_no_show', 24)) {
      continue;
    }

    await createAccountFlag(
      db,
      row.user_id,
      'repeat_no_show',
      Number(row.no_show_count) >= 4 ? 'high' : 'medium',
      `User has ${row.no_show_count} no-shows in the last 90 days`
    );

    await logFraudEvent(db, row.user_id, 'repeat_no_show_flag', 'Repeated no-show pattern detected', {
      no_show_count: row.no_show_count,
    });
  }

  return [...new Set(handled)];
}

async function escalateReportClusters(db) {
  const result = await query(
    `SELECT
       reported_user_id,
       COUNT(*) as report_count,
       SUM(CASE WHEN escalation_level IN ('high', 'critical') THEN 1 ELSE 0 END) as severe_reports,
       SUM(CASE WHEN escalation_level = 'critical' THEN 1 ELSE 0 END) as critical_reports
     FROM reports
     WHERE created_at >= datetime('now', '-${REPORT_CLUSTER_WINDOW_DAYS} days')
       AND status IN ('pending', 'reviewed')
     GROUP BY reported_user_id
     HAVING COUNT(*) >= 3 OR SUM(CASE WHEN escalation_level IN ('high', 'critical') THEN 1 ELSE 0 END) > 0
     LIMIT 100`
  );

  const handled = [];

  for (const row of result.rows || []) {
    const severity = Number(row.critical_reports || 0) > 0
      ? 'critical'
      : Number(row.severe_reports || 0) >= 2 || Number(row.report_count || 0) >= 5
        ? 'high'
        : 'medium';

    if (await hasRecentFlag(db, row.reported_user_id, 'report_cluster', 24)) {
      continue;
    }

    await createAccountFlag(
      db,
      row.reported_user_id,
      'report_cluster',
      severity,
      `Automated review trigger: ${row.report_count} reports in the last ${REPORT_CLUSTER_WINDOW_DAYS} days`
    );

    await flagSuspiciousActivity(
      db,
      row.reported_user_id,
      'report_cluster',
      `Report cluster detected (${row.report_count} reports, ${row.severe_reports} severe)`,
      severity === 'critical' ? 90 : severity === 'high' ? 80 : 70
    ).catch(() => {});

    await logFraudEvent(db, row.reported_user_id, 'report_cluster', 'Report cluster auto-escalated', {
      report_count: row.report_count,
      severe_reports: row.severe_reports,
      critical_reports: row.critical_reports,
      severity,
    });

    handled.push(row.reported_user_id);
  }

  return handled;
}

async function flagVerificationIssues(db) {
  const result = await query(
    `SELECT
       ev.user_id,
       COUNT(*) as total_requests,
       SUM(CASE WHEN ev.is_verified = 0 AND ev.attempts >= ev.max_attempts THEN 1 ELSE 0 END) as exhausted_requests,
       SUM(CASE WHEN ev.is_verified = 0 AND ev.expires_at < CURRENT_TIMESTAMP THEN 1 ELSE 0 END) as expired_requests,
       MAX(ev.created_at) as last_request_at
     FROM email_phone_verifications ev
     WHERE ev.created_at >= datetime('now', '-${VERIFICATION_REVIEW_WINDOW_DAYS} days')
     GROUP BY ev.user_id
     HAVING exhausted_requests > 0 OR expired_requests >= 2 OR total_requests >= 3
     LIMIT 100`
  );

  const handled = [];

  for (const row of result.rows || []) {
    if (await hasRecentFlag(db, row.user_id, 'verification_review', 24)) {
      continue;
    }

    const severity = Number(row.exhausted_requests || 0) > 0 || Number(row.expired_requests || 0) >= 3
      ? 'high'
      : 'medium';

    await createAccountFlag(
      db,
      row.user_id,
      'verification_review',
      severity,
      `Verification requests need attention: ${row.exhausted_requests} exhausted, ${row.expired_requests} expired`
    );

    await flagSuspiciousActivity(
      db,
      row.user_id,
      'verification_review',
      `Repeated verification failures or expired requests detected`,
      severity === 'high' ? 85 : 65
    ).catch(() => {});

    await logFraudEvent(db, row.user_id, 'verification_review', 'Verification issues auto-flagged', {
      total_requests: row.total_requests,
      exhausted_requests: row.exhausted_requests,
      expired_requests: row.expired_requests,
      last_request_at: row.last_request_at,
    });

    handled.push(row.user_id);
  }

  return handled;
}

export async function runFraudEnforcementSweep(db) {
  const summary = {
    no_shows_marked: 0,
    report_clusters_flagged: 0,
    verification_issues_flagged: 0,
    affected_users: 0,
    recalculated_users: 0,
    risk_levels: {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    },
  };

  const affectedUsers = new Set();

  const [noShowUsers, reportUsers, verificationUsers] = await Promise.all([
    enforceNoShows(db),
    escalateReportClusters(db),
    flagVerificationIssues(db),
  ]);

  summary.no_shows_marked = noShowUsers.length;
  summary.report_clusters_flagged = reportUsers.length;
  summary.verification_issues_flagged = verificationUsers.length;

  [...noShowUsers, ...reportUsers, ...verificationUsers].forEach((userId) => affectedUsers.add(userId));
  summary.affected_users = affectedUsers.size;

  for (const userId of affectedUsers) {
    const { riskScore } = await recalculateFraudProfile(db, userId, 'Automated fraud enforcement sweep', {
      source: 'fraud_enforcement_scheduler',
    });

    summary.recalculated_users += 1;
    const riskLevel = getRiskLevel(riskScore).toLowerCase();
    if (summary.risk_levels[riskLevel] !== undefined) {
      summary.risk_levels[riskLevel] += 1;
    }
  }

  return summary;
}

export const initializeFraudEnforcementScheduler = (db) => {
  if (schedulerInstance) {
    console.log('Fraud enforcement scheduler already initialized');
    return;
  }

  schedulerInstance = cron.schedule('*/15 * * * *', async () => {
    try {
      const summary = await runFraudEnforcementSweep(db);
      console.log('✓ Fraud enforcement sweep complete', summary);
    } catch (error) {
      console.error('Error in fraud enforcement scheduler:', error);
    }
  });

  console.log('✓ Fraud enforcement scheduler initialized (runs every 15 minutes)');
};

export const stopFraudEnforcementScheduler = () => {
  if (schedulerInstance) {
    schedulerInstance.stop();
    schedulerInstance.destroy();
    schedulerInstance = null;
    console.log('Fraud enforcement scheduler stopped');
  }
};

export async function getFraudEnforcementSummary(db) {
  const [
    noShowResult,
    reportClusterResult,
    verificationResult,
    penaltyResult,
    recentFlagResult,
    highRiskResult,
  ] = await Promise.all([
    query(
      `SELECT COUNT(*) as count
       FROM event_applications
       WHERE status = 'no_show' AND updated_at >= datetime('now', '-30 days')`
    ),
    query(
      `SELECT COUNT(DISTINCT reported_user_id) as count
       FROM reports
       WHERE created_at >= datetime('now', '-${REPORT_CLUSTER_WINDOW_DAYS} days')
         AND status IN ('pending', 'reviewed')`
    ),
    query(
      `SELECT COUNT(DISTINCT user_id) as count
       FROM email_phone_verifications
       WHERE created_at >= datetime('now', '-${VERIFICATION_REVIEW_WINDOW_DAYS} days')
         AND is_verified = 0`
    ),
    query(
      `SELECT COUNT(*) as count
       FROM reliability_penalty_log
       WHERE created_at >= datetime('now', '-30 days')`
    ),
    query(
      `SELECT COUNT(*) as count
       FROM account_flags
       WHERE created_at >= datetime('now', '-30 days')`
    ),
    query(
      `SELECT COUNT(*) as count
       FROM fraud_scores
       WHERE risk_score >= 80`
    ),
  ]);

  return {
    no_shows_last_30_days: Number(noShowResult.rows?.[0]?.count || 0),
    report_clusters_last_7_days: Number(reportClusterResult.rows?.[0]?.count || 0),
    verification_reviews_last_14_days: Number(verificationResult.rows?.[0]?.count || 0),
    reliability_penalties_last_30_days: Number(penaltyResult.rows?.[0]?.count || 0),
    account_flags_last_30_days: Number(recentFlagResult.rows?.[0]?.count || 0),
    high_risk_users: Number(highRiskResult.rows?.[0]?.count || 0),
  };
}
