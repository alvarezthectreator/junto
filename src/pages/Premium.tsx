import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Crown,
  Loader,
  Sparkles,
  ShieldCheck,
  CalendarDays,
  CreditCard,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import * as API from '../services/api';

type BillingCycle = 'monthly' | 'annual';
type PlanId = 'starter' | 'social' | 'premium' | 'elite';

type Plan = {
  id: PlanId;
  name: string;
  description: string;
  accent: string;
  badge: string;
  monthly: number;
  annual: number;
  features: string[];
};

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'For casual browsing and light discovery.',
    accent: 'from-white/10 to-white/5',
    badge: 'Best for exploring',
    monthly: 0,
    annual: 0,
    features: ['Basic discovery', 'Profile editing', 'Standard trust tools'],
  },
  {
    id: 'social',
    name: 'Social',
    description: 'For regular attendees who want a little more reach.',
    accent: 'from-sky-500/15 to-cyan-500/5',
    badge: 'Popular',
    monthly: 1999,
    annual: 19990,
    features: ['Improved visibility', 'Priority event recommendations', 'Premium profile polish'],
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'For power users, hosts, and frequent organizers.',
    accent: 'from-amber-500/20 to-orange-500/5',
    badge: 'Most balanced',
    monthly: 2999,
    annual: 29990,
    features: ['Enhanced discovery', 'Host analytics preview', 'Richer trust signals'],
  },
  {
    id: 'elite',
    name: 'Elite',
    description: 'For the full experience with the strongest visibility.',
    accent: 'from-violet-500/20 to-fuchsia-500/5',
    badge: 'Top tier',
    monthly: 7999,
    annual: 79990,
    features: ['Maximum visibility', 'Priority support', 'Elite host positioning'],
  },
];

function formatCurrency(value: number): string {
  if (value <= 0) {
    return 'Free';
  }

  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPeriod(cycle: BillingCycle): string {
  return cycle === 'annual' ? 'year' : 'month';
}

export function Premium() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('premium');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [subscription, setSubscription] = useState<API.Subscription | null>(null);

  const userId = API.getUserId();

  useEffect(() => {
    let active = true;

    const loadSubscription = async () => {
      if (!userId) {
        if (active) {
          setLoading(false);
        }
        return;
      }

      try {
        const response = await API.getSubscription(userId);
        if (!active) {
          return;
        }

        const current = response?.subscription || null;
        setSubscription(current);
        if (current?.plan_id) {
          setSelectedPlan(current.plan_id);
        }
        if (current?.billing_cycle) {
          setBillingCycle(current.billing_cycle);
        }
      } catch (loadError) {
        if (active) {
          console.warn('Failed to load subscription:', loadError);
          setSubscription(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadSubscription();

    return () => {
      active = false;
    };
  }, [userId]);

  const hasActiveSubscription = Boolean(subscription && subscription.status !== 'cancelled');
  const activePlan = PLANS.find((plan) => plan.id === (hasActiveSubscription ? subscription?.plan_id : selectedPlan)) || PLANS[2];
  const activeAmount = hasActiveSubscription ? (subscription?.amount || 0) : activePlan[billingCycle];

  const handleSubscribe = async (planId: PlanId) => {
    if (!userId) {
      setError('Please sign in to manage your subscription.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await API.activateSubscription(userId, planId, billingCycle);
      setSubscription(response.subscription);
      setSelectedPlan(response.subscription.plan_id);
      setBillingCycle(response.subscription.billing_cycle);
      setMessage(response.message || 'Subscription updated successfully.');
    } catch (subscribeError: any) {
      setError(subscribeError?.message || 'Could not activate that plan.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!userId) {
      setError('Please sign in to manage your subscription.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await API.cancelSubscription(userId);
      setSubscription(response.subscription);
      setMessage(response.message || 'Subscription cancelled.');
    } catch (cancelError: any) {
      setError(cancelError?.message || 'Could not cancel the subscription.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B10] text-white">
      <main className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col overflow-hidden px-4 py-6 pb-24 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.18),transparent_28%),radial-gradient(circle_at_80%_8%,rgba(56,189,248,0.16),transparent_24%),linear-gradient(180deg,#0B0B10_0%,#09090D_100%)]" />
        <div className="absolute left-1/2 top-0 -z-10 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-amber-500/10 blur-[120px]" />

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur-sm sm:p-8"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-200">
                <Crown className="h-3.5 w-3.5" />
                Premium subscriptions
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">A clearer premium billing flow</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Choose a plan, review the billing cycle, and manage the active subscription right here. This keeps the product usable today while the live payment provider work stays on the roadmap.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Current plan</p>
                <p className="mt-2 text-lg font-semibold">{hasActiveSubscription ? activePlan.name : 'No active plan'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Billing</p>
                <p className="mt-2 text-lg font-semibold capitalize">{hasActiveSubscription ? subscription?.billing_cycle : billingCycle}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Amount</p>
                <p className="mt-2 text-lg font-semibold">{formatCurrency(activeAmount)}</p>
              </div>
            </div>
          </div>

          {(message || error) && (
            <div
              className={`mt-6 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
                error
                  ? 'border-rose-500/20 bg-rose-500/10 text-rose-200'
                  : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
              }`}
            >
              {error ? <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /> : <BadgeCheck className="mt-0.5 h-4 w-4 flex-shrink-0" />}
              <span>{error || message}</span>
            </div>
          )}
        </motion.section>

        <section className="mt-8 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/20">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Billing cycle</p>
                <h2 className="mt-1 text-xl font-semibold">Pick the cadence that fits</h2>
              </div>
              <div className="inline-flex rounded-full border border-white/10 bg-black/20 p-1">
                {(['monthly', 'annual'] as BillingCycle[]).map((cycle) => (
                  <button
                    key={cycle}
                    type="button"
                    onClick={() => setBillingCycle(cycle)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      billingCycle === cycle ? 'bg-amber-400 text-black' : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    {cycle === 'monthly' ? 'Monthly' : 'Annual'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {PLANS.map((plan, index) => {
                const isActive = hasActiveSubscription && subscription?.plan_id === plan.id;
                const price = plan[billingCycle];
                return (
                  <motion.article
                    key={plan.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b ${plan.accent} p-5 ${
                      isActive ? 'ring-1 ring-amber-400/40' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                          {plan.badge}
                        </div>
                        <h3 className="mt-4 text-2xl font-bold">{plan.name}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-300">{plan.description}</p>
                      </div>
                      {isActive && (
                        <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-300">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </div>

                    <div className="mt-5 flex items-end gap-2">
                      <p className="text-3xl font-bold">{formatCurrency(price)}</p>
                      <p className="pb-1 text-sm text-slate-400">/{formatPeriod(billingCycle)}</p>
                    </div>

                    <ul className="mt-4 space-y-2">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm text-slate-200">
                          <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-300" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSubscribe(plan.id)}
                        disabled={saving}
                        className="flex-1 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-black transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saving && selectedPlan === plan.id ? (
                          <span className="inline-flex items-center gap-2">
                            <Loader className="h-4 w-4 animate-spin" />
                            Processing
                          </span>
                        ) : isActive ? (
                          'Keep this plan'
                        ) : (
                          'Choose plan'
                        )}
                      </motion.button>
                      <button
                        type="button"
                        onClick={() => setSelectedPlan(plan.id)}
                        className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/5"
                      >
                        Preview
                      </button>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/20">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-300">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Subscription status</p>
                  <h2 className="mt-1 text-lg font-semibold">{hasActiveSubscription ? 'Active subscription' : 'No active plan'}</h2>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm text-slate-300">
                {loading ? (
                  <div className="inline-flex items-center gap-2 text-slate-400">
                    <Loader className="h-4 w-4 animate-spin" />
                    Loading subscription...
                  </div>
                ) : hasActiveSubscription ? (
                  <>
                    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                      <span>Plan</span>
                      <span className="font-semibold text-white">{subscription.plan_id}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                      <span>Status</span>
                      <span className="font-semibold text-emerald-300">{subscription.status}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                      <span>Renewal</span>
                      <span className="font-semibold text-white">
                        {subscription?.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : 'Not set'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                      <span>Amount paid</span>
                      <span className="font-semibold text-white">{formatCurrency(subscription?.amount || 0)}</span>
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                    Select a plan above to start a subscription.
                  </div>
                )}
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => void handleCancel()}
                  disabled={!hasActiveSubscription || saving}
                  className="flex-1 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && hasActiveSubscription ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader className="h-4 w-4 animate-spin" />
                      Updating
                    </span>
                  ) : (
                    'Cancel plan'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-4 py-3 text-sm font-bold text-black transition hover:bg-amber-300"
                >
                  Back to plans
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/20">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-300">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">What is working now</p>
                  <h2 className="mt-1 text-lg font-semibold">A usable billing surface today</h2>
                </div>
              </div>

              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                <p className="flex gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300" />
                  Plan selection and subscription state are now fully visible in-app.
                </p>
                <p className="flex gap-2">
                  <RefreshCw className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-300" />
                  Users can switch or cancel plans without leaving the app shell.
                </p>
                <p className="flex gap-2">
                  <CalendarDays className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-300" />
                  Annual and monthly cycles are both supported by the current backend.
                </p>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

export default Premium;
