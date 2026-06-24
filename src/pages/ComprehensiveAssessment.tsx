import React from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Layers3,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Users,
  Zap,
} from 'lucide-react';

type AssessmentStatus = 'done' | 'partial' | 'missing';

type AssessmentCard = {
  title: string;
  status: AssessmentStatus;
  completion: string;
  summary: string;
  done: string[];
  missing: string[];
};

interface ComprehensiveAssessmentProps {
  onNavigate?: (page: string) => void;
}

const STATUS_STYLES: Record<AssessmentStatus, { label: string; chip: string; ring: string; icon: React.ReactNode }> = {
  done: {
    label: 'Done',
    chip: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
    ring: 'from-emerald-500/20 to-emerald-500/5',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  partial: {
    label: 'Partial',
    chip: 'bg-amber-500/15 text-amber-200 border-amber-500/20',
    ring: 'from-amber-500/20 to-amber-500/5',
    icon: <Zap className="h-4 w-4" />,
  },
  missing: {
    label: 'Missing',
    chip: 'bg-rose-500/15 text-rose-200 border-rose-500/20',
    ring: 'from-rose-500/20 to-rose-500/5',
    icon: <AlertTriangle className="h-4 w-4" />,
  },
};

const FEATURE_CARDS: AssessmentCard[] = [
  {
    title: 'Authentication',
    status: 'partial',
    completion: '30%',
    summary: 'Email/password login exists, OTP onboarding is present, and the session flow is wired, but SMS-first auth is still not complete.',
    done: ['Email/password login', 'OTP signup flow', 'Session restore logic'],
    missing: ['True SMS provider integration', 'Password reset flow', 'Social login'],
  },
  {
    title: 'Profile',
    status: 'partial',
    completion: '75%',
    summary: 'Profile editing, uploads, code-based verification, completion scoring, and media handling are in good shape.',
    done: ['Editable profile form', 'Photo upload/compression', 'Code-based email and phone verification', 'Completion and trust scoring'],
    missing: ['Provider-backed identity verification', 'Stricter server-side moderation'],
  },
  {
    title: 'Discover / Feed',
    status: 'done',
    completion: '85%',
    summary: 'Discovery, filters, search, maps, travel mode, and event cards are broadly functional.',
    done: ['Responsive feed grid', 'Search and filters', 'Map integration', 'Travel mode toggle'],
    missing: ['Smarter ranking', 'Creator tooling polish', 'Deeper location-aware matching'],
  },
  {
    title: 'Event Creation',
    status: 'partial',
    completion: '85%',
    summary: 'The host creation flow exists and is usable, but the billing story and copy still need refinement.',
    done: ['Create-event modal', 'Billing tier selection', 'Image upload preview', 'Host dashboard entry point'],
    missing: ['Tighter agreement UX', 'Clearer tier naming', 'End-to-end publish polish'],
  },
  {
    title: 'Applications',
    status: 'done',
    completion: '90%',
    summary: 'Applicants and hosts can review, accept, decline, withdraw, and follow up across the flow.',
    done: ['Host review panel', 'Applicant history', 'Withdraw flow', 'Cross-page persistence'],
    missing: ['WebSocket sync for every state change', 'Fallback resilience when backend is offline'],
  },
  {
    title: 'Nearby',
    status: 'partial',
    completion: '80%',
    summary: 'Nearby cards, transitions, location awareness, retry flows, and media previews are now much stronger.',
    done: ['Card stack polish', 'Retry and empty states', 'Media-rich cards', 'No-more-matches fallback'],
    missing: ['Better geo ranking', 'More advanced discovery heuristics'],
  },
  {
    title: 'Messaging',
    status: 'partial',
    completion: '75%',
    summary: 'Messaging now persists locally, supports group threads, queues delayed sends, and auto-expires after the event window.',
    done: ['Conversation list', 'Message composer', 'Attachment handling', 'Voice-note flow', 'Demo call modal', 'Local persistence', 'Group chat', 'Scheduled delivery', 'Event-based expiry'],
    missing: ['Backend persistence and multi-device sync', 'Realtime chat transport', 'Enterprise delivery tracking/encryption', 'RTC provider integration'],
  },
  {
    title: 'Audio / Video Calls',
    status: 'missing',
    completion: '0%',
    summary: 'The messaging header exposes call buttons, but there is no real RTC stack or provider integration yet.',
    done: ['Call UI placeholders'],
    missing: ['WebRTC or provider integration', 'Call answer/decline flow', 'Camera and mic controls', 'Call state management'],
  },
  {
    title: 'Notifications',
    status: 'done',
    completion: '90%',
    summary: 'Notifications now have backend sync, grouped inbox cards, bulk actions, browser alerts, and live connection indicators.',
    done: ['WebSocket sync', 'Bulk actions', 'Grouped sections', 'Browser notifications', 'Notification preferences', 'Native OS notification center integration', 'Swipe-to-delete polish'],
    missing: ['Richer notification sound control'],
  },
  {
    title: 'Settings / Account',
    status: 'partial',
    completion: '90%',
    summary: 'Account exports, referral data, blocked users, notification preferences, password changes, session management, and recovery codes are in place, but deeper auth hardening still needs work.',
    done: ['Export data', 'Referral info', 'Blocked users', 'Notification preferences', 'Theme and privacy toggles', 'Password change', 'Session management', 'Recovery codes'],
    missing: ['Two-factor auth'],
  },
  {
    title: 'Safety / Anti-Fraud',
    status: 'partial',
    completion: '86%',
    summary: 'Safety now has local persistence, SOS automation, check-ins, report/block handling, automated fraud enforcement, and a computed reliability score.',
    done: ['Trusted contacts UI', 'Report and block UI', 'SOS / check-in surfaces', 'Profile risk signals', 'Local audit persistence', 'Location sharing', 'Emergency dialing', 'No-show detection', 'Wellbeing follow-up', 'Reliability score', 'Fraud enforcement automation'],
    missing: ['Provider-backed verification', 'Backend sync for safety events'],
  },
];

export function ComprehensiveAssessment({ onNavigate = () => {} }: ComprehensiveAssessmentProps) {
  const doneCount = FEATURE_CARDS.filter((card) => card.status === 'done').length;
  const partialCount = FEATURE_CARDS.filter((card) => card.status === 'partial').length;
  const missingCount = FEATURE_CARDS.filter((card) => card.status === 'missing').length;

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 pb-20 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.25),_transparent_40%),linear-gradient(180deg,rgba(16,16,20,0.96),rgba(9,9,11,0.96))] p-6 shadow-2xl shadow-black/30 sm:p-8"
        >
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <button
                onClick={() => onNavigate('Settings')}
                className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Settings
              </button>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
                <ClipboardList className="h-3.5 w-3.5" />
                wantuu feature status report
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">wantuu feature status report</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                This report reflects the current local wantuu codebase, not the old static checklist. It summarizes what is implemented today and what still needs backend or product work.
              </p>
              <p className="mt-3 text-xs uppercase tracking-[0.22em] text-slate-500">Last updated: June 24, 2026</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/10 p-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-200/70">Done</p>
                <p className="mt-2 text-3xl font-bold">{doneCount}</p>
              </div>
              <div className="rounded-2xl border border-amber-500/15 bg-amber-500/10 p-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-amber-200/70">Partial</p>
                <p className="mt-2 text-3xl font-bold">{partialCount}</p>
              </div>
              <div className="rounded-2xl border border-rose-500/15 bg-rose-500/10 p-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-rose-200/70">Missing</p>
                <p className="mt-2 text-3xl font-bold">{missingCount}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <section className="mb-8 grid gap-4 md:grid-cols-4">
          {[
            { label: 'UI complete', value: 'Most of the core screens', icon: <Layers3 className="h-5 w-5 text-amber-300" /> },
            { label: 'Realtime', value: 'Notifications and discovery are live-capable', icon: <Activity className="h-5 w-5 text-emerald-300" /> },
            { label: 'Mobile polish', value: 'Nearby and notifications are now much stronger', icon: <Smartphone className="h-5 w-5 text-sky-300" /> },
            { label: 'Biggest gap', value: 'Messaging/backend durability', icon: <MessageCircle className="h-5 w-5 text-rose-300" /> },
          ].map((item) => (
            <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5">
                {item.icon}
              </div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{item.label}</p>
              <p className="mt-2 text-sm text-slate-200">{item.value}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-4">
          {FEATURE_CARDS.map((card, index) => {
            const styles = STATUS_STYLES[card.status];
            return (
              <motion.article
                key={card.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.035 }}
                className={`overflow-hidden rounded-[1.8rem] border border-white/10 bg-gradient-to-b ${styles.ring} p-5 shadow-xl shadow-black/20 sm:p-6`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-3xl">
                    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${styles.chip}`}>
                      {styles.icon}
                      {styles.label}
                    </div>
                    <div className="mt-4 flex flex-wrap items-baseline gap-3">
                      <h2 className="text-2xl font-bold">{card.title}</h2>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                        {card.completion}
                      </span>
                    </div>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">{card.summary}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-right">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Status</p>
                    <p className="mt-1 text-lg font-semibold">{styles.label}</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-4">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-200/70">Implemented</p>
                    <ul className="mt-3 space-y-2 text-sm text-slate-100">
                      {card.done.map((item) => (
                        <li key={item} className="flex gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-300" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-rose-500/10 bg-rose-500/5 p-4">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-rose-200/70">Still missing</p>
                    <ul className="mt-3 space-y-2 text-sm text-slate-100">
                      {card.missing.map((item) => (
                        <li key={item} className="flex gap-2">
                          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-300" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-300" />
              <h3 className="text-lg font-semibold">What improved most recently</h3>
            </div>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex gap-3">
                <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300" />
                Nearby now has better card polish, retry flows, richer media, and a no-more-matches fallback.
              </li>
              <li className="flex gap-3">
                <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300" />
                Notifications now sync, group, support bulk actions, and trigger browser alerts plus a local tone.
              </li>
              <li className="flex gap-3">
                <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300" />
                Settings now persist notification preferences and expose export, referral, and blocked-user management.
              </li>
            </ul>
          </div>

          <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex items-center gap-3">
              <Users className="h-5 w-5 text-sky-300" />
              <h3 className="text-lg font-semibold">Remaining priorities</h3>
            </div>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-300" />
                Messaging still needs backend sync, realtime transport, and RTC provider integration.
              </li>
              <li className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-300" />
                Account security still needs password change, 2FA, device management, and recovery codes.
              </li>
              <li className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-300" />
                Safety is now much stronger locally, but provider-backed verification and server sync still need work.
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

export default ComprehensiveAssessment;
