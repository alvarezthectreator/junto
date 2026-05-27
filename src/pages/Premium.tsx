import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BadgeCheck, Check, Crown, Sparkles, Star, Menu, Plus, X, Bell } from 'lucide-react';

interface PremiumProps {
}

type BillingCycle = 'monthly' | 'annual';
type PlanId = 'starter' | 'social' | 'premium' | 'elite';

const plans = [
  {
    id: 'starter' as PlanId,
    name: 'Starter',
    badge: 'Free',
    color: 'from-white/10 to-white/5',
    accent: 'text-gray-300',
    price: { monthly: '₦0', annual: '₦0' },
    description: 'A simple way to browse, save, and try a few outings.',
    features: ['Browse events', 'Save favorites', 'Basic messages', 'Safety centre'],
  },
  {
    id: 'social' as PlanId,
    name: 'Social',
    badge: 'Best for casual users',
    color: 'from-amber-600/30 to-orange-500/15',
    accent: 'text-[#FBBF24]',
    price: { monthly: '₦1,999', annual: '₦19,990' },
    description: 'More joins, more swipes, and better discovery in the feed.',
    features: ['10 joins/day', 'More saved searches', 'More nearby swipes', 'Travel mode preview'],
  },
  {
    id: 'premium' as PlanId,
    name: 'Premium',
    badge: 'Most popular',
    color: 'from-[#F59E0B]/35 to-[#FB923C]/18',
    accent: 'text-[#FBBF24]',
    price: { monthly: '₦2,999', annual: '₦29,990' },
    description: 'The full everyday experience with Travel Mode and more flexibility.',
    features: ['Unlimited event joins', 'Travel Mode', 'Host Me access', 'Unlimited saved searches'],
  },
  {
    id: 'elite' as PlanId,
    name: 'Elite',
    badge: 'Power user',
    color: 'from-rose-500/30 to-fuchsia-500/15',
    accent: 'text-rose-300',
    price: { monthly: '₦7,999', annual: '₦79,990' },
    description: 'Built for frequent hosts who want the strongest visibility and control.',
    features: ['Priority placement', 'Unlimited Host Me', 'Advanced trust tools', 'Elite support'],
  },
] as const;

const featureRows = [
  ['Event joins', '3/day', '10/day', 'Unlimited', 'Unlimited'],
  ['Saved searches', '1', '5', 'Unlimited', 'Unlimited'],
  ['Nearby swipes', '5/day', '10/day', 'Unlimited', 'Unlimited'],
  ['Travel Mode', 'Locked', 'Preview', 'Full access', 'Full access'],
  ['Host Me tier', 'Locked', 'Locked', 'Up to 3/month', 'Unlimited'],
  ['Support priority', 'Basic', 'Standard', 'Fast', 'Priority'],
];

export const Premium: React.FC<PremiumProps> = () => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('premium');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const currentPlan = useMemo(() => plans.find((plan) => plan.id === selectedPlan) ?? plans[2], [selectedPlan]);

  const handleSubscribe = () => {
    setIsPurchasing(true);
    window.setTimeout(() => {
      setIsPurchasing(false);
      setIsSubscribed(true);
    }, 900);
  };

  return (
    <div className="flex min-h-screen bg-[#0F0F13] text-white">
      <main className="mobile-page-main ml-0 flex-1 overflow-x-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.18),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(251,146,60,0.12),transparent_24%),#0F0F13]" />

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="relative pb-24">
          <section className="border-b border-yellow-500/20 px-6 py-10 md:px-10">
            <div className="mx-auto max-w-6xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-yellow-500/75">
                Premium
              </p>
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <h1 className="text-4xl font-serif font-bold tracking-tight text-yellow-400 md:text-5xl">
                    Pick the plan that matches how you use Junto.
                  </h1>
                  <p className="mt-4 max-w-2xl text-base text-gray-300 md:text-lg">
                    Front-end only for now, but the pricing experience, plan comparison, and premium cues are all here so the demo feels complete.
                  </p>
                </div>

                <div className="rounded-[1.75rem] border border-yellow-500/20 bg-white/5 p-4 shadow-2xl shadow-black/20">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Sparkles size={16} className="text-[#FBBF24]" />
                    Demo upgrade flow
                  </div>
                  <p className="mt-2 text-sm text-gray-400">Choose a plan, preview benefits, and simulate a subscription state.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[1.2fr_0.8fr] md:px-10">
            <div className="space-y-6">
              <div className="rounded-[2rem] border border-yellow-500/15 bg-gradient-to-br from-white/[0.03] via-black/40 to-black/70 p-5 shadow-[0_18px_40px_rgba(0,0,0,0.2)]">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-yellow-400/80">
                      Billing cycle
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">Monthly or annual</h2>
                  </div>
                  <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
                    {(['monthly', 'annual'] as BillingCycle[]).map((cycle) => (
                      <button
                        key={cycle}
                        onClick={() => setBillingCycle(cycle)}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                          billingCycle === cycle ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-500/20' : 'text-gray-300 hover:bg-white/5'
                        }`}
                      >
                        {cycle === 'monthly' ? 'Monthly' : 'Annual'}
                        {cycle === 'annual' && (
                          <span className="ml-2 rounded-full bg-black/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em]">
                            save 2 months
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                {plans.map((plan) => {
                  const active = selectedPlan === plan.id;
                  return (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`group rounded-[2rem] border p-5 text-left transition ${
                        active
                          ? 'border-[#F59E0B]/35 bg-white/[0.06] shadow-[0_18px_40px_rgba(245,158,11,0.08)]'
                          : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className={`rounded-2xl bg-gradient-to-br ${plan.color} p-4`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${plan.accent}`}>
                              {plan.badge}
                            </p>
                            <h3 className="mt-2 text-2xl font-semibold text-white">{plan.name}</h3>
                          </div>
                          {active && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-[#F59E0B]/20 bg-[#F59E0B]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#FBBF24]">
                              Selected
                            </span>
                          )}
                        </div>

                        <div className="mt-4 flex items-end gap-3">
                          <p className="text-4xl font-bold text-white">{plan.price[billingCycle]}</p>
                          <p className="pb-1 text-sm text-gray-300">{billingCycle === 'monthly' ? '/ month' : '/ year'}</p>
                        </div>
                        <p className="mt-3 max-w-md text-sm leading-6 text-gray-200">{plan.description}</p>
                      </div>

                      <div className="mt-4 space-y-2">
                        {plan.features.map((feature) => (
                          <div key={feature} className="flex items-center gap-3 text-sm text-gray-300">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/10 text-green-400">
                              <Check size={12} />
                            </span>
                            {feature}
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-yellow-400/80">
                      Plan comparison
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">What each tier unlocks</h3>
                  </div>
                  <BadgeCheck className="text-[#FBBF24]" />
                </div>

                <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-white/10">
                  <div className="grid grid-cols-5 bg-white/5 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                    <div>Feature</div>
                    <div className="text-center">Starter</div>
                    <div className="text-center">Social</div>
                    <div className="text-center">Premium</div>
                    <div className="text-center">Elite</div>
                  </div>
                  {featureRows.map((row, idx) => (
                    <div key={row[0]} className={`grid grid-cols-5 px-4 py-3 text-sm ${idx % 2 === 0 ? 'bg-white/[0.015]' : 'bg-transparent'}`}>
                      <div className="text-gray-200">{row[0]}</div>
                      {row.slice(1).map((cell, cellIdx) => (
                        <div key={cellIdx} className={`text-center ${cellIdx === 2 ? 'text-[#FBBF24]' : 'text-gray-400'}`}>
                          {cell}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-[2rem] border border-[#F59E0B]/20 bg-gradient-to-br from-[#F59E0B]/10 via-black/50 to-black/70 p-5 shadow-[0_18px_40px_rgba(0,0,0,0.15)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-yellow-400/80">
                      Demo checkout
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">{currentPlan.name}</h3>
                  </div>
                  <Crown className="text-[#FBBF24]" />
                </div>

                <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4">
                  <div className="flex items-end justify-between">
                    <span className="text-sm text-gray-300">Selected price</span>
                    <span className="text-4xl font-bold text-white">{currentPlan.price[billingCycle]}</span>
                  </div>
                  <p className="mt-2 text-xs text-gray-400">
                    {billingCycle === 'monthly' ? 'Billed every month' : 'Billed once per year'}
                  </p>
                </div>

                {isSubscribed ? (
                  <div className="mt-5 rounded-[1.5rem] border border-green-500/20 bg-green-500/10 p-4">
                    <div className="flex items-center gap-2 text-green-300">
                      <Check size={16} />
                      <span className="font-semibold">Subscription active</span>
                    </div>
                    <p className="mt-2 text-sm text-green-100/80">You are now viewing the premium front-end state for demo purposes.</p>
                  </div>
                ) : (
                  <button
                    onClick={handleSubscribe}
                    disabled={isPurchasing}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#FB923C] py-4 font-bold text-white transition hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
                  >
                    {isPurchasing ? 'Processing...' : 'Subscribe in demo'}
                    {!isPurchasing && <ArrowRight size={16} />}
                  </button>
                )}

                <p className="mt-3 text-xs leading-6 text-gray-400">
                  No real payment is taken. This is the demo checkout front end only, designed to match the guide while auth and payments stay out of scope.
                </p>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center gap-2">
                  <Star size={18} className="text-[#FBBF24]" />
                  <h3 className="text-lg font-semibold text-white">Why users upgrade</h3>
                </div>
                <div className="mt-4 space-y-3 text-sm text-gray-300">
                  {[
                    'Unlock Travel Mode across supported cities.',
                    'Browse and join more outings without friction.',
                    'Access the Host Me tier for premium experiences.',
                    'Keep your saved searches, bookmarks, and discovery tools unlimited.',
                  ].map((item) => (
                    <div key={item} className="flex gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-400">
                        <Check size={12} />
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5">
                <p className="text-sm font-semibold text-white">Payment methods</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {['Card', 'Bank Transfer', 'USSD', 'PayPal'].map((method) => (
                    <button
                      key={method}
                      className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-gray-200 transition hover:bg-white/10"
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          </section>
        </motion.div>
      </main>
    </div>
  );
};

export default Premium;
