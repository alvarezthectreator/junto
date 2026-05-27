import { query } from '../../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

const PLAN_PRICING = {
  starter: { monthly: 0, annual: 0 },
  social: { monthly: 1999, annual: 19990 },
  premium: { monthly: 2999, annual: 29990 },
  elite: { monthly: 7999, annual: 79990 },
};

function getPeriodEnd(billingCycle) {
  const end = new Date();
  if (billingCycle === 'annual') {
    end.setFullYear(end.getFullYear() + 1);
  } else {
    end.setMonth(end.getMonth() + 1);
  }
  return end.toISOString();
}

function getAmount(planId, billingCycle) {
  const plan = PLAN_PRICING[planId] || PLAN_PRICING.starter;
  return plan[billingCycle] ?? 0;
}

export async function getSubscription(req, res) {
  try {
    const { userId } = req.params;
    const result = await query(
      'SELECT * FROM subscriptions WHERE user_id = $1 LIMIT 1',
      [userId]
    );

    res.json({ subscription: result.rows[0] || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function activateSubscription(req, res) {
  try {
    const { user_id, plan_id, billing_cycle } = req.body;

    if (!user_id || !plan_id || !billing_cycle) {
      return res.status(400).json({ error: 'User ID, plan ID, and billing cycle are required' });
    }

    if (!PLAN_PRICING[plan_id]) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }

    if (!['monthly', 'annual'].includes(billing_cycle)) {
      return res.status(400).json({ error: 'Invalid billing cycle' });
    }

    const now = new Date().toISOString();
    const currentPeriodEnd = getPeriodEnd(billing_cycle);
    const amount = getAmount(plan_id, billing_cycle);

    const existing = await query('SELECT id FROM subscriptions WHERE user_id = $1', [user_id]);
    const subscriptionId = existing.rows[0]?.id || uuidv4();

    await query(
      `INSERT INTO subscriptions (
        id, user_id, plan_id, billing_cycle, status, provider, amount, currency,
        started_at, current_period_end, canceled_at, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, 'active', 'manual', $5, 'NGN',
        $6, $7, NULL, $6, $6
      )
      ON CONFLICT(user_id) DO UPDATE SET
        plan_id = excluded.plan_id,
        billing_cycle = excluded.billing_cycle,
        status = excluded.status,
        provider = excluded.provider,
        amount = excluded.amount,
        currency = excluded.currency,
        started_at = excluded.started_at,
        current_period_end = excluded.current_period_end,
        canceled_at = NULL,
        updated_at = excluded.updated_at`,
      [subscriptionId, user_id, plan_id, billing_cycle, amount, now, currentPeriodEnd]
    );

    const result = await query('SELECT * FROM subscriptions WHERE user_id = $1 LIMIT 1', [user_id]);
    res.status(201).json({
      subscription: result.rows[0],
      message: '✅ Subscription activated',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function cancelSubscription(req, res) {
  try {
    const { userId } = req.params;
    const canceledAt = new Date().toISOString();

    const result = await query(
      `UPDATE subscriptions
       SET status = 'cancelled', canceled_at = $1, updated_at = $1
       WHERE user_id = $2
       RETURNING *`,
      [canceledAt, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json({
      subscription: result.rows[0],
      message: '✅ Subscription cancelled',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
