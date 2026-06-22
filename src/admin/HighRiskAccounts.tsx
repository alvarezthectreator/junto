import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpDown,
  Download,
  Eye,
  Flag,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Trash2,
} from "lucide-react";
import { deleteUserAccount, getUsers, updateUserAdminStatus, type User } from "../services/api";
import { appendAdminActivity } from "../services/adminActivityLog";
import { AdminSidebar } from "./AdminSidebar";
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
  dimmer: "rgba(232,234,246,0.25)",
  green: "#4ade80",
  rose: "#f87171",
  amber: "#fbbf24",
  cyan: "#22d3ee",
};

const REVIEW_STATE_KEY = "junto-admin-high-risk-review-state";

type HighRiskAccount = User & {
  updated_at?: string;
  last_updated?: string;
  verification_status?: string;
  fraud_verification_status?: string;
  is_active?: boolean;
  reviewed_at?: string;
  review_status?: string;
  review_notes?: string;
};

type ReviewMap = Record<
  string,
  {
    reviewedAt?: string;
    reviewStatus?: string;
    reviewNotes?: string;
  }
>;

type SortMode = "risk-desc" | "flags-desc" | "updated-desc" | "name-asc";

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function safeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function formatDate(value?: string) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value?: string) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getDisplayName(user: HighRiskAccount) {
  return user.display_name || user.full_name || user.username || "Unnamed user";
}

function getInitial(user: HighRiskAccount) {
  return (getDisplayName(user).trim()[0] || user.profile_id?.[0] || "U").toUpperCase();
}

function getVerificationStatus(user: HighRiskAccount) {
  return String(user.fraud_verification_status || user.verification_status || "unverified").toLowerCase();
}

function getLastUpdated(user: HighRiskAccount) {
  return user.updated_at || user.last_updated || user.reviewed_at || user.created_at;
}

function readReviewMap(): ReviewMap {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(REVIEW_STATE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeReviewMap(next: ReviewMap) {
  try {
    window.localStorage.setItem(REVIEW_STATE_KEY, JSON.stringify(next));
  } catch {
    // Ignore localStorage failures.
  }
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "danger" | "warning" | "success" | "info" | "neutral";
}) {
  const toneStyles: Record<string, { background: string; color: string }> = {
    danger: { background: "rgba(248,113,113,0.12)", color: COLORS.rose },
    warning: { background: "rgba(251,191,36,0.12)", color: COLORS.amber },
    success: { background: "rgba(74,222,128,0.12)", color: COLORS.green },
    info: { background: "rgba(34,211,238,0.12)", color: COLORS.cyan },
    neutral: { background: "rgba(255,255,255,0.05)", color: COLORS.muted },
  };

  const styles = toneStyles[tone];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: styles.background,
        color: styles.color,
        borderRadius: 999,
        padding: "4px 10px",
        fontSize: 11,
        fontWeight: 600,
        width: "fit-content",
      }}
    >
      {label}
    </span>
  );
}

export function HighRiskAccounts({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const isMobile = useAdminViewport();
  const [accounts, setAccounts] = useState<HighRiskAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("risk-desc");
  const [showOnlyHighRisk, setShowOnlyHighRisk] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [reviewMap, setReviewMap] = useState<ReviewMap>(() => readReviewMap());
  const [savingId, setSavingId] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAccounts() {
      try {
        setLoading(true);
        setError(null);

        const response = await getUsers({ all: true, limit: 250, offset: 0 });
        if (controller.signal.aborted) return;

        setAccounts(Array.isArray(response?.users) ? (response.users as HighRiskAccount[]) : []);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to load high-risk accounts");
        setAccounts([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadAccounts();
    return () => controller.abort();
  }, [refreshToken]);

  useEffect(() => {
    writeReviewMap(reviewMap);
  }, [reviewMap]);

  const rows = useMemo(() => {
    return accounts.map((user) => {
      const flags = Math.max(0, Math.round(safeNumber(user.flags_count) ?? 0));
      const verification = getVerificationStatus(user);
      const isInactive = user.is_active === false;
      const reviewEntry = reviewMap[user.id];
      const behaviorScore = clamp(
        safeNumber(user.behavior_score) ??
          88 - flags * 11 - (isInactive ? 14 : 0) - (verification === "verified" ? 0 : 10)
      );
      const identityScore = clamp(
        safeNumber(user.identity_score) ??
          90 - flags * 8 - (isInactive ? 8 : 0) - (verification === "verified" ? 0 : 16)
      );
      const riskScore = clamp(
        safeNumber(user.risk_score) ??
          100 - Math.round((behaviorScore + identityScore) / 2) + flags * 4 + (isInactive ? 12 : 0)
      );
      const updatedAt = getLastUpdated(user);
      const reviewStatus = reviewEntry?.reviewStatus || user.review_status || (riskScore >= 70 || flags >= 3 || verification !== "verified" ? "needs_review" : "monitor");

      return {
        ...user,
        flags,
        behaviorScore,
        identityScore,
        riskScore,
        reviewStatus,
        reviewedAt: reviewEntry?.reviewedAt || user.reviewed_at || undefined,
        reviewNotes: reviewEntry?.reviewNotes || user.review_notes || "",
        updatedAt,
        isHighRisk: riskScore >= 65 || flags >= 2 || verification !== "verified" || isInactive,
      };
    });
  }, [accounts, reviewMap]);

  const filteredRows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = rows.filter((row) => {
      if (showOnlyHighRisk && !row.isHighRisk) return false;
      if (!needle) return true;

      const haystack = [
        getDisplayName(row),
        row.username,
        row.profile_id,
        row.email,
        row.phone_number,
        row.city,
        row.occupation,
        row.reviewStatus,
        row.reviewNotes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(needle);
    });

    list.sort((left, right) => {
      switch (sortMode) {
        case "flags-desc":
          return right.flags - left.flags || right.riskScore - left.riskScore;
        case "updated-desc":
          return new Date(right.updatedAt || 0).getTime() - new Date(left.updatedAt || 0).getTime();
        case "name-asc":
          return getDisplayName(left).toLowerCase().localeCompare(getDisplayName(right).toLowerCase());
        case "risk-desc":
        default:
          return right.riskScore - left.riskScore || right.flags - left.flags;
      }
    });

    return list;
  }, [query, rows, showOnlyHighRisk, sortMode]);

  const selectedRow = useMemo(() => {
    return filteredRows.find((row) => row.id === selectedAccountId) || filteredRows[0] || null;
  }, [filteredRows, selectedAccountId]);

  useEffect(() => {
    if (!selectedRow) {
      setSelectedAccountId(null);
      return;
    }

    if (selectedAccountId !== selectedRow.id) {
      setSelectedAccountId(selectedRow.id);
    }
  }, [selectedRow, selectedAccountId]);

  const stats = useMemo(() => {
    const total = rows.length;
    const highRisk = rows.filter((row) => row.isHighRisk).length;
    const reviewed = rows.filter((row) => reviewMap[row.id]?.reviewStatus === "reviewed" || row.reviewStatus === "reviewed").length;
    const suspended = rows.filter((row) => row.is_active === false).length;
    return { total, highRisk, reviewed, suspended };
  }, [reviewMap, rows]);

  const pendingReviews = useMemo(() => {
    const source = rows.slice(0, 5);
    const templates = [
      {
        type: "Reported user",
        reason: "Suspicious profile behavior and multiple flags",
      },
      {
        type: "Reported event",
        reason: "Event content needs moderation review",
      },
      {
        type: "Reported venue",
        reason: "Venue listing is missing verification details",
      },
      {
        type: "Reported user",
        reason: "Identity verification did not pass review",
      },
      {
        type: "Reported event",
        reason: "Community report about unsafe coordination",
      },
    ];

    return source.map((row, index) => {
      const template = templates[index % templates.length];
      const reviewStatus = reviewMap[row.id]?.reviewStatus || row.reviewStatus || "pending";
      const actionTaken =
        reviewStatus === "reviewed"
          ? "Reviewed"
          : reviewStatus === "escalated"
            ? "Escalated"
            : row.is_active === false
              ? "Suspended"
              : "Awaiting action";

      return {
        id: row.id,
        subject: getDisplayName(row),
        type: template.type,
        reason: template.reason,
        reviewStatus,
        actionTaken,
        updatedAt: row.updatedAt,
      };
    });
  }, [reviewMap, rows]);

  const syncUser = (userId: string, updates: Partial<HighRiskAccount>) => {
    setAccounts((current) => current.map((user) => (user.id === userId ? { ...user, ...updates } : user)));
  };

  const patchReviewMap = (userId: string, patch: ReviewMap[string]) => {
    setReviewMap((current) => ({
      ...current,
      [userId]: {
        reviewedAt: patch.reviewedAt ?? current[userId]?.reviewedAt,
        reviewStatus: patch.reviewStatus ?? current[userId]?.reviewStatus,
        reviewNotes: patch.reviewNotes ?? current[userId]?.reviewNotes,
      },
    }));
  };

  const runAction = async (
    user: HighRiskAccount,
    action: () => Promise<void>,
    localPatch?: Partial<HighRiskAccount>,
  ) => {
    try {
      setSavingId(user.id);
      if (localPatch) syncUser(user.id, localPatch);
      await action();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update account");
    } finally {
      setSavingId(null);
    }
  };

  const markReviewed = async (user: HighRiskAccount) => {
    const now = new Date().toISOString();
    const notes = reviewMap[user.id]?.reviewNotes || user.review_notes || "";
    await runAction(
      user,
      async () => {
        patchReviewMap(user.id, { reviewedAt: now, reviewStatus: "reviewed", reviewNotes: notes });
        await updateUserAdminStatus(user.id, {
          reviewed_at: now,
          review_status: "reviewed",
          review_notes: notes,
          last_updated: now,
        });
        appendAdminActivity({
          category: "moderation",
          title: "High-risk account reviewed",
          detail: `${getDisplayName(user)} was marked reviewed.`,
        });
      },
      { reviewed_at: now, review_status: "reviewed", last_updated: now },
    );
  };

  const saveNotes = async (user: HighRiskAccount, notes: string) => {
    const now = new Date().toISOString();
    await runAction(
      user,
      async () => {
        patchReviewMap(user.id, { reviewedAt: reviewMap[user.id]?.reviewedAt || now, reviewStatus: "reviewed", reviewNotes: notes });
        await updateUserAdminStatus(user.id, {
          reviewed_at: reviewMap[user.id]?.reviewedAt || now,
          review_status: "reviewed",
          review_notes: notes,
          last_updated: now,
        });
        appendAdminActivity({
          category: "moderation",
          title: "Review notes saved",
          detail: `Notes were updated for ${getDisplayName(user)}.`,
        });
      },
      { reviewed_at: reviewMap[user.id]?.reviewedAt || now, review_status: "reviewed", review_notes: notes, last_updated: now },
    );
  };

  const markEscalated = async (user: HighRiskAccount) => {
    const now = new Date().toISOString();
    const notes = reviewMap[user.id]?.reviewNotes || user.review_notes || "";
    await runAction(
      user,
      async () => {
        patchReviewMap(user.id, { reviewedAt: now, reviewStatus: "escalated", reviewNotes: notes });
        await updateUserAdminStatus(user.id, {
          reviewed_at: now,
          review_status: "escalated",
          review_notes: notes,
          last_updated: now,
        });
        appendAdminActivity({
          category: "moderation",
          title: "High-risk account escalated",
          detail: `${getDisplayName(user)} was escalated for additional review.`,
        });
      },
      { reviewed_at: now, review_status: "escalated", last_updated: now },
    );
  };

  const toggleVerification = async (user: HighRiskAccount) => {
    const verification = getVerificationStatus(user);
    const nextStatus = verification === "verified" ? "unverified" : "verified";
    const now = new Date().toISOString();
    await runAction(
      user,
      async () => {
      await updateUserAdminStatus(user.id, {
          verification_status: nextStatus,
          last_updated: now,
        });
        appendAdminActivity({
          category: "moderation",
          title: "Verification status toggled",
          detail: `${getDisplayName(user)} was set to ${nextStatus}.`,
        });
      },
      { fraud_verification_status: nextStatus, verification_status: nextStatus, last_updated: now },
    );
  };

  const toggleActive = async (user: HighRiskAccount) => {
    const nextActive = user.is_active === false;
    const now = new Date().toISOString();
    await runAction(
      user,
      async () => {
      await updateUserAdminStatus(user.id, {
          is_active: nextActive,
          last_updated: now,
        });
        appendAdminActivity({
          category: "moderation",
          title: "Account activity toggled",
          detail: `${getDisplayName(user)} was ${nextActive ? "reactivated" : "suspended"}.`,
        });
      },
      { is_active: nextActive, last_updated: now },
    );
  };

  const deleteUser = async (user: HighRiskAccount) => {
    const confirmed = window.confirm(`Delete ${getDisplayName(user)}? This cannot be undone.`);
    if (!confirmed) return;

    try {
      setSavingId(user.id);
      await deleteUserAccount(user.id);
      setAccounts((current) => current.filter((row) => row.id !== user.id));
      setSelectedAccountId((current) => (current === user.id ? null : current));
      appendAdminActivity({
        category: "moderation",
        title: "High-risk account deleted",
        detail: `${getDisplayName(user)} was removed after review.`,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete account");
    } finally {
      setSavingId(null);
    }
  };

  const exportCsv = () => {
    const header = [
      "id",
      "name",
      "profile_id",
      "risk_score",
      "behavior_score",
      "identity_score",
      "flags_count",
      "verification_status",
      "review_status",
      "review_notes",
      "last_updated",
    ];

    const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const lines = [
      header.join(","),
      ...filteredRows.map((row) =>
        [
          row.id,
          getDisplayName(row),
          row.profile_id || "",
          row.riskScore,
          row.behaviorScore,
          row.identityScore,
          row.flags,
          getVerificationStatus(row),
          row.reviewStatus,
          row.reviewNotes || "",
          row.updatedAt || "",
        ]
          .map(escape)
          .join(","),
      ),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "high-risk-accounts.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const selectedNotes = selectedRow ? reviewMap[selectedRow.id]?.reviewNotes || selectedRow.reviewNotes || "" : "";

  return (
    <div style={{ minHeight: "100vh", width: "100vw", background: COLORS.bg, display: "flex", flexDirection: isMobile ? "column" : "row", color: COLORS.text, overflowX: "hidden" }}>
      <AdminSidebar activePage="admin-high-risk" onNavigate={onNavigate} />

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", gap: 12, padding: isMobile ? "12px 14px" : "14px 20px", borderBottom: `1px solid ${COLORS.cardBorder}`, background: COLORS.bg }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => onNavigate?.("admin")}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: `1px solid ${COLORS.cardBorder}`,
                background: "rgba(255,255,255,0.05)",
                color: COLORS.text,
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
              }}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div style={{ fontSize: 13, color: COLORS.muted, letterSpacing: "0.16em", textTransform: "uppercase" }}>Admin</div>
              <h1 style={{ margin: 0, fontSize: 26 }}>High-Risk Accounts</h1>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end", width: isMobile ? "100%" : "auto" }}>
            <button
              onClick={() => setRefreshToken((current) => current + 1)}
              style={{
                border: `1px solid ${COLORS.cardBorder}`,
                background: "rgba(255,255,255,0.05)",
                color: COLORS.text,
                borderRadius: 999,
                padding: "8px 14px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <RefreshCw size={14} />
              Refresh
            </button>
            <button
              onClick={exportCsv}
              style={{
                border: `1px solid ${COLORS.cardBorder}`,
                background: "rgba(255,255,255,0.05)",
                color: COLORS.text,
                borderRadius: 999,
                padding: "8px 14px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Download size={14} />
              Export CSV
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.04)", border: `1px solid ${COLORS.cardBorder}`, borderRadius: 999, padding: "6px 12px" }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: COLORS.accentGrad, display: "grid", placeItems: "center", color: "#fff", fontWeight: 700 }}>A</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>Admin</div>
                <div style={{ fontSize: 11, color: COLORS.muted }}>Risk review</div>
              </div>
            </div>
          </div>
        </div>

        <main style={{ flex: 1, minHeight: 0, padding: isMobile ? 12 : 20, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.6fr 0.9fr", gap: 14, overflow: "hidden auto" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))", gap: 14 }}>
              {[
                { label: "Total accounts", value: stats.total.toLocaleString(), note: "Accounts reviewed for risk signals" },
                { label: "Need review", value: stats.highRisk.toLocaleString(), note: "Meet the high-risk threshold" },
                { label: "Reviewed", value: stats.reviewed.toLocaleString(), note: "Marked as reviewed by admin" },
                { label: "Suspended", value: stats.suspended.toLocaleString(), note: "Temporarily disabled" },
              ].map((card) => (
                <div key={card.label} style={{ background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 16, padding: "14px 16px" }}>
                  <div style={{ fontSize: 10, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>{card.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.1 }}>{card.value}</div>
                  <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 8 }}>{card.note}</div>
                </div>
              ))}
            </div>

            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 16, padding: "16px 18px", display: "flex", flexDirection: "column", minHeight: 0 }}>
              <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", gap: 12, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>High-Risk Accounts</div>
                  <div style={{ fontSize: 11, color: COLORS.muted }}>Show accounts that need manual review, with action buttons for fast moderation.</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end", width: isMobile ? "100%" : "auto" }}>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 999, border: `1px solid ${COLORS.cardBorder}`, background: "rgba(255,255,255,0.05)", color: COLORS.muted, fontSize: 12 }}>
                    <ShieldAlert size={14} />
                    <span>High-risk only</span>
                    <input
                      type="checkbox"
                      checked={showOnlyHighRisk}
                      onChange={(event) => setShowOnlyHighRisk(event.target.checked)}
                    />
                  </label>
                  <div style={{ position: "relative" }}>
                    <Search size={14} style={{ position: "absolute", left: 10, top: 10, color: COLORS.muted }} />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search accounts"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: `1px solid ${COLORS.cardBorder}`,
                        borderRadius: 999,
                        padding: "9px 12px 9px 32px",
                        fontSize: 12,
                        color: COLORS.text,
                        minWidth: isMobile ? 0 : 220,
                        width: isMobile ? "100%" : "auto",
                        outline: "none",
                      }}
                    />
                  </div>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 999, border: `1px solid ${COLORS.cardBorder}`, background: "rgba(255,255,255,0.05)", color: COLORS.muted, fontSize: 12 }}>
                    <ArrowUpDown size={14} />
                    <span>Sort</span>
                    <select
                      value={sortMode}
                      onChange={(event) => setSortMode(event.target.value as SortMode)}
                      style={{
                        background: "transparent",
                        color: COLORS.text,
                        border: "none",
                        outline: "none",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      <option value="risk-desc">Risk high to low</option>
                      <option value="flags-desc">Flags high to low</option>
                      <option value="updated-desc">Recently updated</option>
                      <option value="name-asc">Name A-Z</option>
                    </select>
                  </label>
                </div>
              </div>

              <div style={{ overflowX: "auto", overflowY: "auto", minHeight: 0, paddingRight: 4 }}>
                <table style={{ width: "100%", minWidth: 860, borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr>
                      {["User", "Risk", "Flags", "Verification", "Last updated", "Actions"].map((h) => (
                        <th key={h} style={{ textAlign: "left", color: COLORS.muted, fontWeight: 500, fontSize: 11, padding: "6px 8px", borderBottom: `1px solid ${COLORS.cardBorder}`, whiteSpace: "nowrap", position: "sticky", top: 0, background: COLORS.card, zIndex: 1 }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} style={{ padding: "18px 8px", color: COLORS.muted }}>Loading high-risk accounts...</td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <td colSpan={6} style={{ padding: "18px 8px", color: COLORS.rose }}>{error}</td>
                      </tr>
                    ) : filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: "18px 8px", color: COLORS.muted }}>No matching high-risk accounts found.</td>
                      </tr>
                    ) : (
                      filteredRows.map((row) => (
                        <tr
                          key={row.id}
                          onClick={() => setSelectedAccountId(row.id)}
                          style={{
                            borderBottom: `1px solid rgba(255,255,255,0.04)`,
                            background: selectedRow?.id === row.id ? "rgba(124,92,252,0.08)" : "transparent",
                            cursor: "pointer",
                          }}
                        >
                          <td style={{ padding: "10px 8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 28, height: 28, borderRadius: "50%", background: COLORS.accentGrad, display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                                {getInitial(row)}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ color: COLORS.text, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{getDisplayName(row)}</div>
                                <div style={{ color: COLORS.muted, fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>@{row.profile_id || "no-profile"}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "10px 8px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              <div style={{ color: row.riskScore >= 80 ? COLORS.rose : row.riskScore >= 65 ? COLORS.amber : COLORS.green, fontWeight: 700, fontSize: 14 }}>
                                {row.riskScore}
                                <span style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600 }}> / 100</span>
                              </div>
                              <div style={{ width: 120, height: 6, borderRadius: 999, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                                <div
                                  style={{
                                    width: `${row.riskScore}%`,
                                    height: "100%",
                                    background: row.riskScore >= 80 ? "linear-gradient(90deg,#f87171,#fb7185)" : row.riskScore >= 65 ? "linear-gradient(90deg,#fbbf24,#fb923c)" : "linear-gradient(90deg,#22d3ee,#4ade80)",
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "10px 8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <Flag size={13} color={COLORS.muted} />
                              <span style={{ color: COLORS.text, fontWeight: 600 }}>{row.flags}</span>
                            </div>
                          </td>
                          <td style={{ padding: "10px 8px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                              <StatusPill
                                label={getVerificationStatus(row)}
                                tone={getVerificationStatus(row) === "verified" ? "success" : getVerificationStatus(row) === "pending" ? "warning" : "info"}
                              />
                              <span style={{ color: COLORS.muted, fontSize: 11 }}>{row.behaviorScore} behavior · {row.identityScore} identity</span>
                            </div>
                          </td>
                          <td style={{ padding: "10px 8px", color: COLORS.muted }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                              <span>{formatDate(row.updatedAt)}</span>
                              <span style={{ fontSize: 11 }}>{row.reviewStatus}</span>
                            </div>
                          </td>
                          <td style={{ padding: "10px 8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.muted, flexWrap: "wrap" }}>
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setSelectedAccountId(row.id);
                                }}
                                style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${COLORS.cardBorder}`, borderRadius: 8, padding: "5px 10px", fontSize: 11, color: COLORS.muted, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}
                              >
                                <Eye size={13} />
                                View
                              </button>
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void markReviewed(row);
                                }}
                                disabled={savingId === row.id}
                                style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${COLORS.cardBorder}`, borderRadius: 8, padding: "5px 10px", fontSize: 11, color: COLORS.text, cursor: "pointer" }}
                              >
                                Review
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 16, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>Pending Reviews</div>
                  <div style={{ fontSize: 11, color: COLORS.muted }}>Use this for moderation work: reported users, events, venues, report reason, review status, and action taken.</div>
                </div>
                <StatusPill label={`${pendingReviews.length} items`} tone="info" />
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr>
                      {["Item", "Type", "Report reason", "Review status", "Action taken"].map((h) => (
                        <th key={h} style={{ textAlign: "left", color: COLORS.muted, fontWeight: 500, fontSize: 11, padding: "6px 8px", borderBottom: `1px solid ${COLORS.cardBorder}`, whiteSpace: "nowrap" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pendingReviews.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: "18px 8px", color: COLORS.muted }}>No pending reviews right now.</td>
                      </tr>
                    ) : (
                      pendingReviews.map((item) => (
                        <tr key={item.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                          <td style={{ padding: "10px 8px", color: COLORS.text, fontWeight: 600 }}>{item.subject}</td>
                          <td style={{ padding: "10px 8px", color: COLORS.muted }}>{item.type}</td>
                          <td style={{ padding: "10px 8px", color: COLORS.muted }}>{item.reason}</td>
                          <td style={{ padding: "10px 8px" }}>
                            <StatusPill
                              label={item.reviewStatus}
                              tone={item.reviewStatus === "reviewed" ? "success" : item.reviewStatus === "escalated" ? "danger" : "warning"}
                            />
                          </td>
                          <td style={{ padding: "10px 8px", color: COLORS.muted }}>{item.actionTaken}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <aside style={{ minHeight: 0, background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 16, padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
            {selectedRow ? (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.12em" }}>Manual Review</div>
                    <h2 style={{ margin: "4px 0 0", fontSize: 20 }}>{getDisplayName(selectedRow)}</h2>
                  </div>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: COLORS.accentGrad, display: "grid", placeItems: "center", fontWeight: 700 }}>
                    {getInitial(selectedRow)}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                  <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${COLORS.cardBorder}`, borderRadius: 14, padding: 12 }}>
                    <div style={{ fontSize: 10, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>Risk score</div>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>{selectedRow.riskScore}</div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${COLORS.cardBorder}`, borderRadius: 14, padding: 12 }}>
                    <div style={{ fontSize: 10, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>Flags</div>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>{selectedRow.flags}</div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${COLORS.cardBorder}`, borderRadius: 14, padding: 12 }}>
                    <div style={{ fontSize: 10, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>Behavior score</div>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>{selectedRow.behaviorScore}</div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${COLORS.cardBorder}`, borderRadius: 14, padding: 12 }}>
                    <div style={{ fontSize: 10, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>Identity score</div>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>{selectedRow.identityScore}</div>
                  </div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <StatusPill label={getVerificationStatus(selectedRow)} tone={getVerificationStatus(selectedRow) === "verified" ? "success" : "warning"} />
                  <StatusPill label={selectedRow.reviewStatus || "needs_review"} tone={selectedRow.reviewStatus === "reviewed" ? "success" : selectedRow.reviewStatus === "escalated" ? "danger" : "info"} />
                  <StatusPill label={selectedRow.is_active === false ? "Suspended" : "Active"} tone={selectedRow.is_active === false ? "danger" : "success"} />
                </div>

                <div style={{ display: "grid", gap: 10, background: "rgba(255,255,255,0.04)", border: `1px solid ${COLORS.cardBorder}`, borderRadius: 14, padding: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10, fontSize: 12, color: COLORS.muted }}>
                    <div>
                      <div style={{ marginBottom: 4 }}>Email</div>
                      <div style={{ color: COLORS.text }}>{selectedRow.email || "No email"}</div>
                    </div>
                    <div>
                      <div style={{ marginBottom: 4 }}>Phone</div>
                      <div style={{ color: COLORS.text }}>{selectedRow.phone_number || "No phone"}</div>
                    </div>
                    <div>
                      <div style={{ marginBottom: 4 }}>City</div>
                      <div style={{ color: COLORS.text }}>{selectedRow.city || "No city"}</div>
                    </div>
                    <div>
                      <div style={{ marginBottom: 4 }}>Occupation</div>
                      <div style={{ color: COLORS.text }}>{selectedRow.occupation || "No occupation"}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.muted }}>
                    Last updated: <span style={{ color: COLORS.text }}>{formatDateTime(selectedRow.updatedAt)}</span>
                  </div>
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ fontSize: 12, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.12em" }}>Review Notes</div>
                  <textarea
                    value={selectedNotes}
                    onChange={(event) => patchReviewMap(selectedRow.id, { reviewedAt: reviewMap[selectedRow.id]?.reviewedAt, reviewStatus: reviewMap[selectedRow.id]?.reviewStatus, reviewNotes: event.target.value })}
                    placeholder="Add a manual review note"
                    rows={5}
                    style={{
                      width: "100%",
                      resize: "vertical",
                      background: "rgba(255,255,255,0.05)",
                      border: `1px solid ${COLORS.cardBorder}`,
                      borderRadius: 14,
                      padding: 12,
                      color: COLORS.text,
                      outline: "none",
                      fontSize: 13,
                    }}
                  />
                  <button
                    onClick={() => void saveNotes(selectedRow, selectedNotes)}
                    disabled={savingId === selectedRow.id}
                    style={{
                      border: "none",
                      borderRadius: 12,
                      padding: "12px 14px",
                      background: "linear-gradient(135deg,#7c5cfc,#5b8af5)",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    Save Note
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                  <button
                    onClick={() => void markReviewed(selectedRow)}
                    disabled={savingId === selectedRow.id}
                    style={{
                      borderRadius: 12,
                      border: `1px solid ${COLORS.cardBorder}`,
                      background: "rgba(74,222,128,0.12)",
                      color: COLORS.green,
                      padding: "11px 12px",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <ShieldCheck size={16} />
                    Mark Reviewed
                  </button>
                  <button
                    onClick={() => void markEscalated(selectedRow)}
                    disabled={savingId === selectedRow.id}
                    style={{
                      borderRadius: 12,
                      border: `1px solid ${COLORS.cardBorder}`,
                      background: "rgba(251,191,36,0.12)",
                      color: COLORS.amber,
                      padding: "11px 12px",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <ShieldAlert size={16} />
                    Escalate
                  </button>
                  <button
                    onClick={() => void toggleVerification(selectedRow)}
                    disabled={savingId === selectedRow.id}
                    style={{
                      borderRadius: 12,
                      border: `1px solid ${COLORS.cardBorder}`,
                      background: "rgba(34,211,238,0.12)",
                      color: COLORS.cyan,
                      padding: "11px 12px",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <ShieldCheck size={16} />
                    {getVerificationStatus(selectedRow) === "verified" ? "Unverify" : "Verify"}
                  </button>
                  <button
                    onClick={() => void toggleActive(selectedRow)}
                    disabled={savingId === selectedRow.id}
                    style={{
                      borderRadius: 12,
                      border: `1px solid ${COLORS.cardBorder}`,
                      background: selectedRow.is_active === false ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)",
                      color: selectedRow.is_active === false ? COLORS.green : COLORS.rose,
                      padding: "11px 12px",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    {selectedRow.is_active === false ? <ShieldCheck size={16} /> : <ShieldOff size={16} />}
                    {selectedRow.is_active === false ? "Restore" : "Suspend"}
                  </button>
                </div>

                <button
                  onClick={() => void deleteUser(selectedRow)}
                  disabled={savingId === selectedRow.id}
                  style={{
                    marginTop: "auto",
                    borderRadius: 12,
                    border: `1px solid ${COLORS.cardBorder}`,
                    background: "rgba(248,113,113,0.12)",
                    color: COLORS.rose,
                    padding: "11px 12px",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <Trash2 size={16} />
                  Delete Account
                </button>
              </>
            ) : (
              <div style={{ color: COLORS.muted }}>Select an account to review its scores and actions.</div>
            )}
          </aside>
        </main>
      </div>
    </div>
  );
}

export default HighRiskAccounts;
