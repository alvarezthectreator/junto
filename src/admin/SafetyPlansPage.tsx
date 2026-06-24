import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Banknote,
  BellRing,
  BookCheck,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Eye,
  Flag,
  HandCoins,
  MinusCircle,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldBan,
  ShieldCheck,
  Smartphone,
  Trash2,
  UserCheck,
  Users2,
  Wallet,
} from "lucide-react";
import { AdminSidebar } from "./AdminSidebar";
import { appendAdminActivity } from "../services/adminActivityLog";
import {
  createAdminDashboardItem,
  deleteAdminDashboardItem,
  getAdminDashboardItems,
  updateAdminDashboardItem,
  type AdminDashboardItem,
} from "../services/api";
import { useAdminViewport } from "./useAdminViewport";

const COLORS = {
  bg: "#0f1117",
  card: "#181a23",
  cardBorder: "rgba(255,255,255,0.07)",
  sidebar: "#13141d",
  accent: "#7c5cfc",
  accentGrad: "linear-gradient(135deg,#7c5cfc,#5b8af5)",
  text: "#e8eaf6",
  muted: "rgba(232,234,246,0.45)",
  green: "#4ade80",
  rose: "#f87171",
  amber: "#fbbf24",
  cyan: "#22d3ee",
};

type SafetyStatus = "open" | "reviewing" | "escalated" | "resolved";
type PaymentStatus = "active" | "past_due" | "cancelled" | "pending";
type BillingCycle = "monthly" | "annual";
type BillingTier = "starter" | "social" | "premium" | "elite";

type SafetyCase = {
  id: string;
  reportType: string;
  subjectName: string;
  subjectId: string;
  reportReason: string;
  location: string;
  status: SafetyStatus;
  escalation: "standard" | "high" | "critical";
  sosEvent: boolean;
  checkInIssue: boolean;
  blockedAccount: boolean;
  trustedContacts: number;
  createdAt: string;
};

type PaymentRecord = {
  id: string;
  userName: string;
  userId: string;
  planId: BillingTier;
  billingCycle: BillingCycle;
  paymentStatus: PaymentStatus;
  premiumUsage: number;
  failedPayments: number;
  receipts: number;
  billingTierShare: number;
  amount: number;
  currency: string;
  lastUpdated: string;
};

type SafetyDraft = {
  reportType: string;
  subjectName: string;
  subjectId: string;
  reportReason: string;
  location: string;
  escalation: SafetyCase["escalation"];
  sosEvent: boolean;
  checkInIssue: boolean;
  blockedAccount: boolean;
  trustedContacts: string;
};

type PaymentDraft = {
  userName: string;
  userId: string;
  planId: BillingTier;
  billingCycle: BillingCycle;
  paymentStatus: PaymentStatus;
  premiumUsage: string;
  failedPayments: string;
  receipts: string;
  billingTierShare: string;
  amount: string;
  currency: string;
};

const SAFETY_STORAGE_KEY = "junto-admin-safety-queue";
const PAYMENTS_STORAGE_KEY = "junto-admin-payments-plan";

const DEFAULT_SAFETY_CASES: SafetyCase[] = [
  {
    id: "safety-1",
    reportType: "Harassment",
    subjectName: "Amina O.",
    subjectId: "USR-1042",
    reportReason: "Repeated unwanted messages and venue follow-ups.",
    location: "Lagos, Nigeria",
    status: "open",
    escalation: "high",
    sosEvent: false,
    checkInIssue: false,
    blockedAccount: true,
    trustedContacts: 2,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: "safety-2",
    reportType: "SOS",
    subjectName: "Tunde K.",
    subjectId: "USR-2219",
    reportReason: "Emergency SOS sent during live meetup.",
    location: "Ikeja, Lagos",
    status: "reviewing",
    escalation: "critical",
    sosEvent: true,
    checkInIssue: true,
    blockedAccount: false,
    trustedContacts: 4,
    createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
  },
  {
    id: "safety-3",
    reportType: "Check-in",
    subjectName: "Zainab M.",
    subjectId: "USR-3110",
    reportReason: "No check-in after event start time.",
    location: "Victoria Island, Lagos",
    status: "escalated",
    escalation: "standard",
    sosEvent: false,
    checkInIssue: true,
    blockedAccount: false,
    trustedContacts: 1,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "safety-4",
    reportType: "Trusted contacts",
    subjectName: "Ibrahim S.",
    subjectId: "USR-4401",
    reportReason: "Trusted contacts not responding to safety ping.",
    location: "Surulere, Lagos",
    status: "resolved",
    escalation: "standard",
    sosEvent: false,
    checkInIssue: false,
    blockedAccount: false,
    trustedContacts: 3,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
];

const DEFAULT_PAYMENT_RECORDS: PaymentRecord[] = [
  {
    id: "pay-1",
    userName: "Ada M.",
    userId: "USR-1042",
    planId: "premium",
    billingCycle: "monthly",
    paymentStatus: "active",
    premiumUsage: 84,
    failedPayments: 0,
    receipts: 4,
    billingTierShare: 34,
    amount: 2999,
    currency: "NGN",
    lastUpdated: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: "pay-2",
    userName: "Tunde K.",
    userId: "USR-2219",
    planId: "elite",
    billingCycle: "annual",
    paymentStatus: "past_due",
    premiumUsage: 56,
    failedPayments: 2,
    receipts: 2,
    billingTierShare: 18,
    amount: 79990,
    currency: "NGN",
    lastUpdated: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
  },
  {
    id: "pay-3",
    userName: "Zainab M.",
    userId: "USR-3110",
    planId: "social",
    billingCycle: "monthly",
    paymentStatus: "cancelled",
    premiumUsage: 23,
    failedPayments: 1,
    receipts: 1,
    billingTierShare: 31,
    amount: 1999,
    currency: "NGN",
    lastUpdated: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "pay-4",
    userName: "Ibrahim S.",
    userId: "USR-4401",
    planId: "starter",
    billingCycle: "monthly",
    paymentStatus: "pending",
    premiumUsage: 11,
    failedPayments: 1,
    receipts: 0,
    billingTierShare: 17,
    amount: 0,
    currency: "NGN",
    lastUpdated: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
  },
];

function formatDate(value?: string) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function mapSafetyRecord(item: AdminDashboardItem): SafetyCase {
  const payload = item.payload || {};
  return {
    id: item.id,
    reportType: String(payload.reportType || "Report"),
    subjectName: String(payload.subjectName || item.title || "Unnamed user"),
    subjectId: String(payload.subjectId || `USR-${item.id.slice(0, 4).toUpperCase()}`),
    reportReason: String(payload.reportReason || item.summary || "Manual safety note"),
    location: String(payload.location || "Lagos, Nigeria"),
    status: (payload.status || item.status || "open") as SafetyStatus,
    escalation: (payload.escalation || item.severity || "standard") as SafetyCase["escalation"],
    sosEvent: Boolean(payload.sosEvent),
    checkInIssue: Boolean(payload.checkInIssue),
    blockedAccount: Boolean(payload.blockedAccount),
    trustedContacts: Number(payload.trustedContacts) || 0,
    createdAt: String(payload.createdAt || item.created_at || new Date().toISOString()),
  };
}

function mapPaymentRecord(item: AdminDashboardItem): PaymentRecord {
  const payload = item.payload || {};
  return {
    id: item.id,
    userName: String(payload.userName || item.title || "Unnamed user"),
    userId: String(payload.userId || `USR-${item.id.slice(0, 4).toUpperCase()}`),
    planId: (payload.planId || "starter") as BillingTier,
    billingCycle: (payload.billingCycle || "monthly") as BillingCycle,
    paymentStatus: (payload.paymentStatus || item.status || "active") as PaymentStatus,
    premiumUsage: Number(payload.premiumUsage) || 0,
    failedPayments: Number(payload.failedPayments) || 0,
    receipts: Number(payload.receipts) || 0,
    billingTierShare: Number(payload.billingTierShare) || 0,
    amount: Number(payload.amount) || 0,
    currency: String(payload.currency || "NGN"),
    lastUpdated: String(payload.lastUpdated || item.updated_at || new Date().toISOString()),
  };
}

function toSafetyPayload(item: SafetyCase) {
  return {
    reportType: item.reportType,
    subjectName: item.subjectName,
    subjectId: item.subjectId,
    reportReason: item.reportReason,
    location: item.location,
    status: item.status,
    escalation: item.escalation,
    sosEvent: item.sosEvent,
    checkInIssue: item.checkInIssue,
    blockedAccount: item.blockedAccount,
    trustedContacts: item.trustedContacts,
    createdAt: item.createdAt,
  };
}

function toPaymentPayload(item: PaymentRecord) {
  return {
    userName: item.userName,
    userId: item.userId,
    planId: item.planId,
    billingCycle: item.billingCycle,
    paymentStatus: item.paymentStatus,
    premiumUsage: item.premiumUsage,
    failedPayments: item.failedPayments,
    receipts: item.receipts,
    billingTierShare: item.billingTierShare,
    amount: item.amount,
    currency: item.currency,
    lastUpdated: item.lastUpdated,
  };
}

function toneColor(status: SafetyStatus | PaymentStatus | "high" | "critical" | "standard" | BillingTier) {
  const map: Record<string, { bg: string; color: string }> = {
    open: { bg: "rgba(251,191,36,0.12)", color: COLORS.amber },
    reviewing: { bg: "rgba(34,211,238,0.12)", color: COLORS.cyan },
    escalated: { bg: "rgba(248,113,113,0.12)", color: COLORS.rose },
    resolved: { bg: "rgba(74,222,128,0.12)", color: COLORS.green },
    active: { bg: "rgba(74,222,128,0.12)", color: COLORS.green },
    past_due: { bg: "rgba(251,191,36,0.12)", color: COLORS.amber },
    cancelled: { bg: "rgba(248,113,113,0.12)", color: COLORS.rose },
    pending: { bg: "rgba(255,255,255,0.05)", color: COLORS.muted },
    high: { bg: "rgba(251,191,36,0.12)", color: COLORS.amber },
    critical: { bg: "rgba(248,113,113,0.12)", color: COLORS.rose },
    standard: { bg: "rgba(255,255,255,0.05)", color: COLORS.muted },
    starter: { bg: "rgba(255,255,255,0.05)", color: COLORS.muted },
    social: { bg: "rgba(34,211,238,0.12)", color: COLORS.cyan },
    premium: { bg: "rgba(124,92,252,0.12)", color: COLORS.accent },
    elite: { bg: "rgba(251,191,36,0.12)", color: COLORS.amber },
  };

  return map[status] || map.pending;
}

function Badge({ label, status }: { label: string; status: SafetyStatus | PaymentStatus | "high" | "critical" | "standard" | BillingTier }) {
  const styles = toneColor(status);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        padding: "4px 10px",
        fontSize: 11,
        fontWeight: 700,
        background: styles.bg,
        color: styles.color,
        textTransform: "capitalize",
      }}
    >
      {label}
    </span>
  );
}

export function SafetyPlansPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const isMobile = useAdminViewport();
  const [safetyCases, setSafetyCases] = useState<SafetyCase[]>(() => readJson(SAFETY_STORAGE_KEY, DEFAULT_SAFETY_CASES));
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>(() => readJson(PAYMENTS_STORAGE_KEY, DEFAULT_PAYMENT_RECORDS));
  const [selectedSafetyId, setSelectedSafetyId] = useState<string | null>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [safetyDraft, setSafetyDraft] = useState<SafetyDraft>({
    reportType: "Report",
    subjectName: "",
    subjectId: "",
    reportReason: "",
    location: "Lagos, Nigeria",
    escalation: "standard",
    sosEvent: false,
    checkInIssue: false,
    blockedAccount: false,
    trustedContacts: "0",
  });
  const [paymentDraft, setPaymentDraft] = useState<PaymentDraft>({
    userName: "",
    userId: "",
    planId: "starter",
    billingCycle: "monthly",
    paymentStatus: "active",
    premiumUsage: "0",
    failedPayments: "0",
    receipts: "0",
    billingTierShare: "0",
    amount: "0",
    currency: "NGN",
  });

  useEffect(() => {
    writeJson(SAFETY_STORAGE_KEY, safetyCases);
  }, [safetyCases]);

  useEffect(() => {
    writeJson(PAYMENTS_STORAGE_KEY, paymentRecords);
  }, [paymentRecords]);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboardData() {
      try {
        setIsHydrating(true);
        setLoadError(null);

        const [safetyResponse, paymentResponse] = await Promise.all([
          getAdminDashboardItems({ type: "safety_case", limit: 200 }),
          getAdminDashboardItems({ type: "payment_record", limit: 200 }),
        ]);

        let nextSafety = Array.isArray(safetyResponse?.items) ? safetyResponse.items.map(mapSafetyRecord) : [];
        let nextPayments = Array.isArray(paymentResponse?.items) ? paymentResponse.items.map(mapPaymentRecord) : [];

        if (nextSafety.length === 0) {
          const seededSafety = await Promise.all(
            DEFAULT_SAFETY_CASES.map((item) =>
              createAdminDashboardItem({
                item_type: "safety_case",
                title: item.subjectName,
                summary: item.reportReason,
                severity: item.escalation,
                status: item.status,
                payload: toSafetyPayload(item),
              })
            )
          );
          nextSafety = seededSafety.map((entry) => mapSafetyRecord(entry.item));
        }

        if (nextPayments.length === 0) {
          const seededPayments = await Promise.all(
            DEFAULT_PAYMENT_RECORDS.map((item) =>
              createAdminDashboardItem({
                item_type: "payment_record",
                title: item.userName,
                summary: `${item.planId} · ${item.paymentStatus}`,
                severity: item.paymentStatus,
                status: item.paymentStatus,
                payload: toPaymentPayload(item),
              })
            )
          );
          nextPayments = seededPayments.map((entry) => mapPaymentRecord(entry.item));
        }

        if (cancelled) return;

        setSafetyCases(nextSafety);
        setPaymentRecords(nextPayments);
        setSelectedSafetyId((current) => current || nextSafety[0]?.id || null);
        setSelectedPaymentId((current) => current || nextPayments[0]?.id || null);
      } catch (error) {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : "Failed to load admin dashboard data");
        setSafetyCases(readJson(SAFETY_STORAGE_KEY, DEFAULT_SAFETY_CASES));
        setPaymentRecords(readJson(PAYMENTS_STORAGE_KEY, DEFAULT_PAYMENT_RECORDS));
      } finally {
        if (!cancelled) {
          setIsHydrating(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const filteredSafetyCases = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return safetyCases;
    return safetyCases.filter((item) =>
      [item.reportType, item.subjectName, item.subjectId, item.reportReason, item.location, item.status, item.escalation]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [query, safetyCases]);

  const filteredPayments = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return paymentRecords;
    return paymentRecords.filter((item) =>
      [item.userName, item.userId, item.planId, item.paymentStatus, item.billingCycle]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [query, paymentRecords]);

  const summary = useMemo(() => {
    const open = safetyCases.filter((item) => item.status === "open").length;
    const escalated = safetyCases.filter((item) => item.status === "escalated").length;
    const sosEvents = safetyCases.filter((item) => item.sosEvent).length;
    const blocked = safetyCases.filter((item) => item.blockedAccount).length;
    const paymentsPastDue = paymentRecords.filter((item) => item.paymentStatus === "past_due").length;
    const activeSubs = paymentRecords.filter((item) => item.paymentStatus === "active").length;
    const premiumUsage = Math.round(paymentRecords.reduce((sum, item) => sum + item.premiumUsage, 0) / Math.max(paymentRecords.length, 1));

    return { open, escalated, sosEvents, blocked, paymentsPastDue, activeSubs, premiumUsage };
  }, [paymentRecords, safetyCases]);

  const workflowNotes = useMemo(() => [
    { label: "Safety reports", value: safetyCases.length, icon: Flag },
    { label: "Blocked accounts", value: summary.blocked, icon: ShieldBan },
    { label: "SOS events", value: summary.sosEvents, icon: BellRing },
    { label: "Check-in issues", value: safetyCases.filter((item) => item.checkInIssue).length, icon: Smartphone },
    { label: "Trusted contacts", value: safetyCases.reduce((sum, item) => sum + item.trustedContacts, 0), icon: Users2 },
    { label: "Escalations", value: summary.escalated, icon: ShieldAlert },
  ], [safetyCases, summary.blocked, summary.escalated, summary.sosEvents]);

  const billingDistribution = useMemo(() => {
    const totals: Record<BillingTier, number> = {
      starter: 0,
      social: 0,
      premium: 0,
      elite: 0,
    };

    paymentRecords.forEach((item) => {
      totals[item.planId] += 1;
    });

    return totals;
  }, [paymentRecords]);

  const safetyDetails = safetyCases.find((item) => item.id === selectedSafetyId) || null;
  const paymentDetails = paymentRecords.find((item) => item.id === selectedPaymentId) || null;

  const addSafetyCase = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next: SafetyCase = {
      id: `safety-${Date.now()}`,
      reportType: safetyDraft.reportType.trim() || "Report",
      subjectName: safetyDraft.subjectName.trim() || "Unnamed user",
      subjectId: safetyDraft.subjectId.trim() || `USR-${Math.floor(Math.random() * 9000 + 1000)}`,
      reportReason: safetyDraft.reportReason.trim() || "Manual safety note",
      location: safetyDraft.location.trim() || "Lagos, Nigeria",
      status: "open",
      escalation: safetyDraft.escalation,
      sosEvent: safetyDraft.sosEvent,
      checkInIssue: safetyDraft.checkInIssue,
      blockedAccount: safetyDraft.blockedAccount,
      trustedContacts: Number(safetyDraft.trustedContacts) || 0,
      createdAt: new Date().toISOString(),
    };

    (async () => {
      try {
        setSavingKey("safety-create");
        const response = await createAdminDashboardItem({
          item_type: "safety_case",
          title: next.subjectName,
          summary: next.reportReason,
          severity: next.escalation,
          status: next.status,
          payload: toSafetyPayload(next),
        });
        const created = mapSafetyRecord(response.item);
        setSafetyCases((current) => [created, ...current]);
        setSelectedSafetyId(created.id);
        appendAdminActivity({
          category: "moderation",
          title: "Safety queue entry added",
          detail: `${created.subjectName} was added to the safety queue.`,
        });
        setSafetyDraft({
          reportType: "Report",
          subjectName: "",
          subjectId: "",
          reportReason: "",
          location: "Lagos, Nigeria",
          escalation: "standard",
          sosEvent: false,
          checkInIssue: false,
          blockedAccount: false,
          trustedContacts: "0",
        });
      } catch (error) {
        alert(error instanceof Error ? error.message : "Failed to add safety case");
      } finally {
        setSavingKey(null);
      }
    })();
  };

  const addPaymentRecord = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next: PaymentRecord = {
      id: `payment-${Date.now()}`,
      userName: paymentDraft.userName.trim() || "Unnamed user",
      userId: paymentDraft.userId.trim() || `USR-${Math.floor(Math.random() * 9000 + 1000)}`,
      planId: paymentDraft.planId,
      billingCycle: paymentDraft.billingCycle,
      paymentStatus: paymentDraft.paymentStatus,
      premiumUsage: Number(paymentDraft.premiumUsage) || 0,
      failedPayments: Number(paymentDraft.failedPayments) || 0,
      receipts: Number(paymentDraft.receipts) || 0,
      billingTierShare: Number(paymentDraft.billingTierShare) || 0,
      amount: Number(paymentDraft.amount) || 0,
      currency: paymentDraft.currency.trim() || "NGN",
      lastUpdated: new Date().toISOString(),
    };

    (async () => {
      try {
        setSavingKey("payment-create");
        const response = await createAdminDashboardItem({
          item_type: "payment_record",
          title: next.userName,
          summary: `${next.planId} · ${next.paymentStatus}`,
          severity: next.paymentStatus,
          status: next.paymentStatus,
          payload: toPaymentPayload(next),
        });
        const created = mapPaymentRecord(response.item);
        setPaymentRecords((current) => [created, ...current]);
        setSelectedPaymentId(created.id);
        appendAdminActivity({
          category: "admin",
          title: "Payment record added",
          detail: `${created.userName} was added to the plans view.`,
        });
        setPaymentDraft({
          userName: "",
          userId: "",
          planId: "starter",
          billingCycle: "monthly",
          paymentStatus: "active",
          premiumUsage: "0",
          failedPayments: "0",
          receipts: "0",
          billingTierShare: "0",
          amount: "0",
          currency: "NGN",
        });
      } catch (error) {
        alert(error instanceof Error ? error.message : "Failed to add payment record");
      } finally {
        setSavingKey(null);
      }
    })();
  };

  const updateSafety = (id: string, patch: Partial<SafetyCase>) => {
    const current = safetyCases.find((item) => item.id === id);
    if (!current) return;

    (async () => {
      try {
        setSavingKey(`safety-${id}`);
        const next = { ...current, ...patch };
        const response = await updateAdminDashboardItem(id, {
          item_type: "safety_case",
          title: next.subjectName,
          summary: next.reportReason,
          severity: next.escalation,
          status: next.status,
          payload: toSafetyPayload(next),
        });
        setSafetyCases((entries) => entries.map((item) => (item.id === id ? mapSafetyRecord(response.item) : item)));
      } catch (error) {
        alert(error instanceof Error ? error.message : "Failed to update safety case");
      } finally {
        setSavingKey(null);
      }
    })();
  };

  const updatePayment = (id: string, patch: Partial<PaymentRecord>) => {
    const current = paymentRecords.find((item) => item.id === id);
    if (!current) return;

    (async () => {
      try {
        setSavingKey(`payment-${id}`);
        const next = { ...current, ...patch, lastUpdated: new Date().toISOString() };
        const response = await updateAdminDashboardItem(id, {
          item_type: "payment_record",
          title: next.userName,
          summary: `${next.planId} · ${next.paymentStatus}`,
          severity: next.paymentStatus,
          status: next.paymentStatus,
          payload: toPaymentPayload(next),
        });
        setPaymentRecords((entries) => entries.map((item) => (item.id === id ? mapPaymentRecord(response.item) : item)));
      } catch (error) {
        alert(error instanceof Error ? error.message : "Failed to update payment record");
      } finally {
        setSavingKey(null);
      }
    })();
  };

  const deleteSafety = (id: string) => {
    const item = safetyCases.find((entry) => entry.id === id);
    if (!item || !window.confirm(`Delete safety case for ${item.subjectName}?`)) return;

    (async () => {
      try {
        setSavingKey(`safety-delete-${id}`);
        await deleteAdminDashboardItem(id);
        setSafetyCases((current) => current.filter((entry) => entry.id !== id));
        setSelectedSafetyId((current) => (current === id ? null : current));
        appendAdminActivity({
          category: "moderation",
          title: "Safety queue entry deleted",
          detail: `${item.subjectName} was removed from the safety queue.`,
        });
      } catch (error) {
        alert(error instanceof Error ? error.message : "Failed to delete safety case");
      } finally {
        setSavingKey(null);
      }
    })();
  };

  const deletePayment = (id: string) => {
    const item = paymentRecords.find((entry) => entry.id === id);
    if (!item || !window.confirm(`Delete payment record for ${item.userName}?`)) return;

    (async () => {
      try {
        setSavingKey(`payment-delete-${id}`);
        await deleteAdminDashboardItem(id);
        setPaymentRecords((current) => current.filter((entry) => entry.id !== id));
        setSelectedPaymentId((current) => (current === id ? null : current));
        appendAdminActivity({
          category: "admin",
          title: "Payment record deleted",
          detail: `${item.userName} was removed from the plans view.`,
        });
      } catch (error) {
        alert(error instanceof Error ? error.message : "Failed to delete payment record");
      } finally {
        setSavingKey(null);
      }
    })();
  };

  const currentSafety = safetyDetails || null;
  const currentPayment = paymentDetails || null;

  const quickAction = (title: string, detail: string, kind: "moderation" | "admin" | "event" | "profile" | "login" = "admin") => {
    appendAdminActivity({ category: kind, title, detail });
  };

  return (
    <div style={{ minHeight: "100vh", width: "100vw", background: COLORS.bg, display: "flex", flexDirection: isMobile ? "column" : "row", color: COLORS.text, overflowX: "hidden" }}>
      <AdminSidebar activePage="admin-safety-plans" onNavigate={onNavigate} />

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", gap: 12, padding: isMobile ? "12px 14px" : "14px 20px", borderBottom: `1px solid ${COLORS.cardBorder}`, background: COLORS.bg }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.02 }}>Safety Queue and Payments</div>
            <div style={{ fontSize: 12, color: COLORS.muted }}>Review safety cases, track billing patterns, and manage monetization signals.</div>
            <div style={{ fontSize: 11, color: loadError ? COLORS.amber : COLORS.green, marginTop: 4 }}>
              {isHydrating ? "Syncing dashboard data..." : loadError ? `Using fallback data: ${loadError}` : "Backed by persisted admin records."}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => setReloadToken((value) => value + 1)}
              disabled={isHydrating}
              style={{
                border: `1px solid ${COLORS.cardBorder}`,
                background: COLORS.accentGrad,
                color: "#fff",
                borderRadius: 12,
                padding: "10px 14px",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                opacity: isHydrating ? 0.8 : 1,
              }}
            >
              <RefreshCw size={16} />
              {isHydrating ? "Loading" : "Reload"}
            </button>
          </div>
        </div>

        <main style={{ padding: isMobile ? 12 : 20, display: "grid", gap: 18 }}>
          <section style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(190px, 1fr))", gap: 14 }}>
            {[
              { label: "Open safety cases", value: summary.open, note: "Waiting for admin review", icon: ShieldAlert, tone: "warning" as const },
              { label: "Escalated cases", value: summary.escalated, note: "Critical or high-priority items", icon: ShieldCheck, tone: "danger" as const },
              { label: "Active subscriptions", value: summary.activeSubs, note: "Users currently on an active plan", icon: Wallet, tone: "success" as const },
              { label: "Past due payments", value: summary.paymentsPastDue, note: "Payments that need attention", icon: CreditCard, tone: "warning" as const },
              { label: "Premium usage", value: `${summary.premiumUsage}%`, note: "Average plan engagement", icon: HandCoins, tone: "info" as const },
            ].map((card) => {
              const styles = toneColor(card.tone);
              const Icon = card.icon;
              return (
                <article key={card.label} style={{ background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 18, padding: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ display: "grid", gap: 8 }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: COLORS.muted, fontSize: 12 }}>
                        <Icon size={14} />
                        {card.label}
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 800 }}>{String(card.value)}</div>
                    </div>
                    <span style={{ ...styles, borderRadius: 999, padding: "6px 10px", fontSize: 11, fontWeight: 700 }}>
                      {card.tone}
                    </span>
                  </div>
                  <div style={{ marginTop: 10, color: COLORS.muted, fontSize: 12 }}>{card.note}</div>
                </article>
              );
            })}
          </section>

          <section style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.2fr) minmax(0, 0.8fr)", gap: 18 }}>
            <article style={{ background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 20, padding: 18, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>Safety workflow</div>
                  <div style={{ fontSize: 12, color: COLORS.muted }}>Reports, blocked accounts, SOS events, check-in issues, trusted contacts, and escalation status.</div>
                </div>
                <div style={{ color: COLORS.muted, fontSize: 12 }}>{filteredSafetyCases.length} items</div>
              </div>

              <form onSubmit={addSafetyCase} style={{ display: "grid", gap: 10, marginBottom: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 10 }}>
                  <input value={safetyDraft.reportType} onChange={(e) => setSafetyDraft((cur) => ({ ...cur, reportType: e.target.value }))} placeholder="Report type" style={inputStyle} />
                  <input value={safetyDraft.subjectName} onChange={(e) => setSafetyDraft((cur) => ({ ...cur, subjectName: e.target.value }))} placeholder="Subject name" style={inputStyle} />
                  <input value={safetyDraft.subjectId} onChange={(e) => setSafetyDraft((cur) => ({ ...cur, subjectId: e.target.value }))} placeholder="Subject ID" style={inputStyle} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.2fr 0.8fr", gap: 10 }}>
                  <input value={safetyDraft.reportReason} onChange={(e) => setSafetyDraft((cur) => ({ ...cur, reportReason: e.target.value }))} placeholder="Report reason" style={inputStyle} />
                  <input value={safetyDraft.location} onChange={(e) => setSafetyDraft((cur) => ({ ...cur, location: e.target.value }))} placeholder="Location" style={inputStyle} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(5, minmax(0, 1fr))", gap: 10 }}>
                  <select value={safetyDraft.escalation} onChange={(e) => setSafetyDraft((cur) => ({ ...cur, escalation: e.target.value as SafetyCase["escalation"] }))} style={inputStyle}>
                    <option value="standard">Standard</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                  <label style={checkStyle}><input type="checkbox" checked={safetyDraft.sosEvent} onChange={(e) => setSafetyDraft((cur) => ({ ...cur, sosEvent: e.target.checked }))} /> SOS event</label>
                  <label style={checkStyle}><input type="checkbox" checked={safetyDraft.checkInIssue} onChange={(e) => setSafetyDraft((cur) => ({ ...cur, checkInIssue: e.target.checked }))} /> Check-in issue</label>
                  <label style={checkStyle}><input type="checkbox" checked={safetyDraft.blockedAccount} onChange={(e) => setSafetyDraft((cur) => ({ ...cur, blockedAccount: e.target.checked }))} /> Blocked account</label>
                  <input value={safetyDraft.trustedContacts} onChange={(e) => setSafetyDraft((cur) => ({ ...cur, trustedContacts: e.target.value }))} placeholder="Trusted contacts" style={inputStyle} />
                </div>
                <button type="submit" style={primaryButton}>
                  <Plus size={16} />
                  Add safety case
                </button>
              </form>

              <div style={{ display: "grid", gap: 10 }}>
                {filteredSafetyCases.map((item) => {
                  const isSelected = currentSafety?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedSafetyId(item.id)}
                      style={{
                        textAlign: "left",
                        border: `1px solid ${isSelected ? COLORS.accent : COLORS.cardBorder}`,
                        background: isSelected ? "rgba(124,92,252,0.08)" : "rgba(255,255,255,0.03)",
                        color: COLORS.text,
                        borderRadius: 16,
                        padding: 14,
                        cursor: "pointer",
                        display: "grid",
                        gap: 8,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ display: "grid", gap: 4 }}>
                          <div style={{ fontSize: 14, fontWeight: 700 }}>{item.subjectName}</div>
                          <div style={{ color: COLORS.muted, fontSize: 11 }}>{item.reportType} · {item.subjectId}</div>
                        </div>
                        <Badge label={item.status} status={item.status} />
                      </div>
                      <div style={{ color: COLORS.muted, fontSize: 12, lineHeight: 1.5 }}>{item.reportReason}</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Badge label={item.escalation} status={item.escalation} />
                        {item.sosEvent ? <Badge label="SOS" status="critical" /> : null}
                        {item.checkInIssue ? <Badge label="Check-in issue" status="high" /> : null}
                        {item.blockedAccount ? <Badge label="Blocked" status="cancelled" /> : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </article>

            <article style={{ background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 20, padding: 18, minWidth: 0, display: "grid", gap: 14 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>Payment and plan controls</div>
                <div style={{ fontSize: 12, color: COLORS.muted }}>Subscription status, premium usage, failed payments, receipts, and billing tier distribution.</div>
              </div>

              <form onSubmit={addPaymentRecord} style={{ display: "grid", gap: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
                  <input value={paymentDraft.userName} onChange={(e) => setPaymentDraft((cur) => ({ ...cur, userName: e.target.value }))} placeholder="User name" style={inputStyle} />
                  <input value={paymentDraft.userId} onChange={(e) => setPaymentDraft((cur) => ({ ...cur, userId: e.target.value }))} placeholder="User ID" style={inputStyle} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 10 }}>
                  <select value={paymentDraft.planId} onChange={(e) => setPaymentDraft((cur) => ({ ...cur, planId: e.target.value as BillingTier }))} style={inputStyle}>
                    <option value="starter">Starter</option>
                    <option value="social">Social</option>
                    <option value="premium">Premium</option>
                    <option value="elite">Elite</option>
                  </select>
                  <select value={paymentDraft.billingCycle} onChange={(e) => setPaymentDraft((cur) => ({ ...cur, billingCycle: e.target.value as BillingCycle }))} style={inputStyle}>
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                  <select value={paymentDraft.paymentStatus} onChange={(e) => setPaymentDraft((cur) => ({ ...cur, paymentStatus: e.target.value as PaymentStatus }))} style={inputStyle}>
                    <option value="active">Active</option>
                    <option value="past_due">Past due</option>
                    <option value="pending">Pending</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <input value={paymentDraft.currency} onChange={(e) => setPaymentDraft((cur) => ({ ...cur, currency: e.target.value }))} placeholder="Currency" style={inputStyle} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 10 }}>
                  <input value={paymentDraft.premiumUsage} onChange={(e) => setPaymentDraft((cur) => ({ ...cur, premiumUsage: e.target.value }))} placeholder="Premium usage %" style={inputStyle} />
                  <input value={paymentDraft.failedPayments} onChange={(e) => setPaymentDraft((cur) => ({ ...cur, failedPayments: e.target.value }))} placeholder="Failed payments" style={inputStyle} />
                  <input value={paymentDraft.receipts} onChange={(e) => setPaymentDraft((cur) => ({ ...cur, receipts: e.target.value }))} placeholder="Receipts" style={inputStyle} />
                  <input value={paymentDraft.billingTierShare} onChange={(e) => setPaymentDraft((cur) => ({ ...cur, billingTierShare: e.target.value }))} placeholder="Tier share %" style={inputStyle} />
                </div>
                <input value={paymentDraft.amount} onChange={(e) => setPaymentDraft((cur) => ({ ...cur, amount: e.target.value }))} placeholder="Amount" style={inputStyle} />
                <button type="submit" style={primaryButton}>
                  <Plus size={16} />
                  Add payment record
                </button>
              </form>

              <div style={{ display: "grid", gap: 10 }}>
                {filteredPayments.map((item) => {
                  const isSelected = currentPayment?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedPaymentId(item.id)}
                      style={{
                        textAlign: "left",
                        border: `1px solid ${isSelected ? COLORS.accent : COLORS.cardBorder}`,
                        background: isSelected ? "rgba(124,92,252,0.08)" : "rgba(255,255,255,0.03)",
                        color: COLORS.text,
                        borderRadius: 16,
                        padding: 14,
                        cursor: "pointer",
                        display: "grid",
                        gap: 8,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ display: "grid", gap: 4 }}>
                          <div style={{ fontSize: 14, fontWeight: 700 }}>{item.userName}</div>
                          <div style={{ color: COLORS.muted, fontSize: 11 }}>{item.userId} · {item.currency} {item.amount.toLocaleString()}</div>
                        </div>
                        <Badge label={item.paymentStatus} status={item.paymentStatus} />
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Badge label={item.planId} status={item.planId} />
                        <Badge label={item.billingCycle} status={item.billingCycle === "annual" ? "social" : "starter"} />
                        <Badge label={`${item.failedPayments} failed`} status={item.failedPayments > 0 ? "past_due" : "active"} />
                        <Badge label={`${item.receipts} receipts`} status={item.receipts > 0 ? "active" : "pending"} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </article>
          </section>

          <section style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(250px, 1fr))", gap: 18 }}>
            <article style={panelStyle}>
              <div style={panelHeaderStyle}>
                <div>
                  <div style={panelTitleStyle}>Workflow summary</div>
                  <div style={panelSubtitleStyle}>Snapshot of the queue by category</div>
                </div>
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {workflowNotes.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} style={miniRowStyle}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <Icon size={14} />
                        <span>{item.label}</span>
                      </div>
                      <strong>{item.value}</strong>
                    </div>
                  );
                })}
              </div>
            </article>

            <article style={panelStyle}>
              <div style={panelHeaderStyle}>
                <div>
                  <div style={panelTitleStyle}>Billing tier distribution</div>
                  <div style={panelSubtitleStyle}>How subscriptions are spread across plans</div>
                </div>
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {(["starter", "social", "premium", "elite"] as BillingTier[]).map((tier) => (
                  <div key={tier} style={miniRowStyle}>
                    <Badge label={tier} status={tier} />
                    <strong>{billingDistribution[tier]}</strong>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) minmax(320px, 0.75fr)", gap: 18 }}>
            <article style={panelStyle}>
              <div style={panelHeaderStyle}>
                <div>
                  <div style={panelTitleStyle}>Selected safety case</div>
                  <div style={panelSubtitleStyle}>Review and update the current safety workflow item</div>
                </div>
                <Badge label={currentSafety?.status || "none"} status={currentSafety?.status || "pending"} />
              </div>
              {currentSafety ? (
                <div style={{ display: "grid", gap: 12 }}>
                  <div style={detailGridStyle}>
                    <Detail label="Subject" value={currentSafety.subjectName} />
                    <Detail label="User ID" value={currentSafety.subjectId} />
                    <Detail label="Type" value={currentSafety.reportType} />
                    <Detail label="Created" value={formatDate(currentSafety.createdAt)} />
                    <Detail label="Location" value={currentSafety.location} />
                    <Detail label="Trusted contacts" value={String(currentSafety.trustedContacts)} />
                  </div>
                  <div style={{ color: COLORS.muted, fontSize: 13, lineHeight: 1.6 }}>{currentSafety.reportReason}</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Badge label={currentSafety.escalation} status={currentSafety.escalation} />
                    {currentSafety.sosEvent ? <Badge label="SOS event" status="critical" /> : null}
                    {currentSafety.checkInIssue ? <Badge label="Check-in issue" status="high" /> : null}
                    {currentSafety.blockedAccount ? <Badge label="Blocked account" status="cancelled" /> : null}
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button type="button" onClick={() => { updateSafety(currentSafety.id, { status: "reviewing" }); quickAction("Safety case opened", `${currentSafety.subjectName} moved to reviewing.`, "moderation"); }} style={actionButton}>
                      <Eye size={14} /> Review
                    </button>
                    <button type="button" onClick={() => { updateSafety(currentSafety.id, { status: "escalated" }); quickAction("Safety case escalated", `${currentSafety.subjectName} was escalated.`, "moderation"); }} style={actionButton}>
                      <ShieldAlert size={14} /> Escalate
                    </button>
                    <button type="button" onClick={() => { updateSafety(currentSafety.id, { status: "resolved" }); quickAction("Safety case resolved", `${currentSafety.subjectName} was marked resolved.`, "moderation"); }} style={actionButton}>
                      <CheckCircle2 size={14} /> Resolve
                    </button>
                    <button type="button" onClick={() => { updateSafety(currentSafety.id, { blockedAccount: true }); quickAction("Account blocked", `${currentSafety.subjectName} was blocked.`, "moderation"); }} style={actionButton}>
                      <ShieldBan size={14} /> Block
                    </button>
                    <button type="button" onClick={() => { updateSafety(currentSafety.id, { blockedAccount: false }); quickAction("Account unblocked", `${currentSafety.subjectName} was unblocked.`, "moderation"); }} style={actionButton}>
                      <UserCheck size={14} /> Unblock
                    </button>
                    <button type="button" onClick={() => { updateSafety(currentSafety.id, { trustedContacts: currentSafety.trustedContacts + 1 }); quickAction("Trusted contact added", `A trusted contact was added for ${currentSafety.subjectName}.`, "admin"); }} style={actionButton}>
                      <Users2 size={14} /> Add contact
                    </button>
                    <button type="button" onClick={() => deleteSafety(currentSafety.id)} style={actionButton}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              ) : (
                <div style={emptyStateStyle}>Select a safety case to review it.</div>
              )}
            </article>

            <article style={panelStyle}>
              <div style={panelHeaderStyle}>
                <div>
                  <div style={panelTitleStyle}>Selected payment record</div>
                  <div style={panelSubtitleStyle}>Monitor plans, receipts, and billing health</div>
                </div>
                <Badge label={currentPayment?.paymentStatus || "none"} status={currentPayment?.paymentStatus || "pending"} />
              </div>
              {currentPayment ? (
                <div style={{ display: "grid", gap: 12 }}>
                  <div style={detailGridStyle}>
                    <Detail label="User" value={currentPayment.userName} />
                    <Detail label="User ID" value={currentPayment.userId} />
                    <Detail label="Plan" value={currentPayment.planId} />
                    <Detail label="Billing" value={currentPayment.billingCycle} />
                    <Detail label="Amount" value={`${currentPayment.currency} ${currentPayment.amount.toLocaleString()}`} />
                    <Detail label="Updated" value={formatDate(currentPayment.lastUpdated)} />
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Badge label={`${currentPayment.premiumUsage}% usage`} status={currentPayment.premiumUsage > 75 ? "high" : "standard"} />
                    <Badge label={`${currentPayment.failedPayments} failed`} status={currentPayment.failedPayments > 0 ? "past_due" : "active"} />
                    <Badge label={`${currentPayment.receipts} receipts`} status={currentPayment.receipts > 0 ? "active" : "pending"} />
                    <Badge label={`${currentPayment.billingTierShare}% tier share`} status={currentPayment.planId} />
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button type="button" onClick={() => { updatePayment(currentPayment.id, { paymentStatus: "active", failedPayments: 0 }); quickAction("Subscription reactivated", `${currentPayment.userName}'s plan was reactivated.`, "admin"); }} style={actionButton}>
                      <BadgeCheck size={14} /> Reactivate
                    </button>
                    <button type="button" onClick={() => { updatePayment(currentPayment.id, { paymentStatus: "past_due", failedPayments: currentPayment.failedPayments + 1 }); quickAction("Payment flagged", `${currentPayment.userName} has a past due payment.`, "admin"); }} style={actionButton}>
                      <CreditCard size={14} /> Flag past due
                    </button>
                    <button type="button" onClick={() => { updatePayment(currentPayment.id, { paymentStatus: "cancelled" }); quickAction("Subscription cancelled", `${currentPayment.userName}'s subscription was cancelled.`, "admin"); }} style={actionButton}>
                      <MinusCircle size={14} /> Cancel
                    </button>
                    <button type="button" onClick={() => { updatePayment(currentPayment.id, { receipts: currentPayment.receipts + 1 }); quickAction("Receipt recorded", `A receipt was recorded for ${currentPayment.userName}.`, "admin"); }} style={actionButton}>
                      <BookCheck size={14} /> Add receipt
                    </button>
                    <button type="button" onClick={() => { updatePayment(currentPayment.id, { billingCycle: currentPayment.billingCycle === "monthly" ? "annual" : "monthly" }); quickAction("Billing cycle changed", `${currentPayment.userName} billing cycle updated.`, "admin"); }} style={actionButton}>
                      <ArrowRight size={14} /> Flip cycle
                    </button>
                    <button type="button" onClick={() => deletePayment(currentPayment.id)} style={actionButton}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              ) : (
                <div style={emptyStateStyle}>Select a payment record to review it.</div>
              )}
            </article>
          </section>
        </main>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <div style={{ fontSize: 11, color: COLORS.muted }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: `1px solid ${COLORS.cardBorder}`,
  background: "rgba(255,255,255,0.04)",
  color: COLORS.text,
  padding: "10px 12px",
  outline: "none",
  fontSize: 13,
};

const checkStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  borderRadius: 12,
  border: `1px solid ${COLORS.cardBorder}`,
  background: "rgba(255,255,255,0.04)",
  padding: "10px 12px",
  fontSize: 12,
  color: COLORS.text,
};

const primaryButton: React.CSSProperties = {
  border: "none",
  borderRadius: 12,
  padding: "12px 14px",
  background: COLORS.accentGrad,
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

const panelStyle: React.CSSProperties = {
  background: COLORS.card,
  border: `1px solid ${COLORS.cardBorder}`,
  borderRadius: 20,
  padding: 18,
  minWidth: 0,
  display: "grid",
  gap: 14,
};

const panelHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};

const panelTitleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
};

const panelSubtitleStyle: React.CSSProperties = {
  fontSize: 12,
  color: COLORS.muted,
};

const miniRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  border: `1px solid ${COLORS.cardBorder}`,
  background: "rgba(255,255,255,0.03)",
  borderRadius: 14,
  padding: "10px 12px",
};

const detailGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
};

const actionButton: React.CSSProperties = {
  border: `1px solid ${COLORS.cardBorder}`,
  background: "rgba(255,255,255,0.04)",
  color: COLORS.text,
  borderRadius: 12,
  padding: "10px 12px",
  fontWeight: 700,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

const emptyStateStyle: React.CSSProperties = {
  color: COLORS.muted,
  fontSize: 13,
  padding: "16px 0",
};

export default SafetyPlansPage;
