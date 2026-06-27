import { useEffect, useMemo, useState, type ComponentType, type FormEvent } from "react";
import {
  Activity,
  Bell,
  Bug,
  Cloud,
  RefreshCw,
  Trash2,
  Wifi,
  Plus,
  Shield,
} from "lucide-react";
import { AdminSidebar } from "./AdminSidebar";
import { useAdminViewport } from "./useAdminViewport";
import { appConfig } from "../config/appConfig";
import { getDeploymentOpsReport, healthCheck, type DeploymentOpsReport } from "../services/api";
import { appendAdminActivity, clearAdminActivityLog, loadAdminActivityLog, type AdminActivityCategory, type AdminActivityEntry } from "../services/adminActivityLog";
import { getQueuedCrashReports, type QueuedCrashReport } from "../services/crashReporting";

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

type StatusTone = "success" | "warning" | "danger" | "info";

type StatusCard = {
  title: string;
  value: string;
  note: string;
  tone: StatusTone;
  icon: ComponentType<{ size?: number }>;
};

type ActivityComposer = {
  category: AdminActivityCategory;
  title: string;
  detail: string;
};

const QUICK_ACTIVITY_TYPES: Array<{ category: AdminActivityCategory; label: string; description: string }> = [
  { category: "login", label: "Login activity", description: "Record admin sign-in or sign-out events." },
  { category: "admin", label: "Admin action", description: "Record settings, listings, or operational changes." },
  { category: "profile", label: "Profile change", description: "Record profile edits or user updates." },
  { category: "event", label: "Event change", description: "Record event creation, edits, or deletion." },
  { category: "moderation", label: "Moderation action", description: "Record reviews, escalations, and removals." },
];

function formatTimestamp(value?: string) {
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

function getSeverityTone(status?: string): StatusTone {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "ok" || normalized === "healthy" || normalized === "ready") return "success";
  if (normalized === "warning" || normalized === "partial") return "warning";
  if (normalized === "missing" || normalized === "needs_attention" || normalized === "down" || normalized === "failed") return "danger";
  return "info";
}

function toneStyles(tone: StatusTone) {
  switch (tone) {
    case "success":
      return { background: "rgba(74,222,128,0.12)", color: COLORS.green };
    case "warning":
      return { background: "rgba(251,191,36,0.12)", color: COLORS.amber };
    case "danger":
      return { background: "rgba(248,113,113,0.12)", color: COLORS.rose };
    default:
      return { background: "rgba(34,211,238,0.12)", color: COLORS.cyan };
  }
}

function resolveWebSocketUrl() {
  const configured = appConfig.wsUrl;
  if (configured) {
    try {
      return new URL(configured).toString().replace(/\/+$/, "");
    } catch {
      // Fall through to runtime-derived fallback.
    }
  }

  if (typeof window === "undefined") {
    return "ws://localhost:5000";
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.hostname}:5000`;
}

function probeWebSocketHealth(timeoutMs = 1800): Promise<{ status: StatusTone; note: string }> {
  if (typeof window === "undefined" || typeof WebSocket === "undefined") {
    return Promise.resolve({ status: "warning", note: "WebSocket checks are not available in this environment." });
  }

  return new Promise((resolve) => {
    const wsUrl = resolveWebSocketUrl();
    const socket = new WebSocket(wsUrl);
    let finished = false;

    const finalize = (status: StatusTone, note: string) => {
      if (finished) return;
      finished = true;
      try {
        socket.close();
      } catch {
        // Ignore close failures.
      }
      window.clearTimeout(timer);
      resolve({ status, note });
    };

    const timer = window.setTimeout(() => {
      finalize("warning", `No response from ${wsUrl} within ${timeoutMs}ms.`);
    }, timeoutMs);

    socket.onopen = () => finalize("success", `Connected to ${wsUrl}.`);
    socket.onerror = () => finalize("warning", `Could not open ${wsUrl}.`);
    socket.onclose = () => {
      if (!finished) {
        finalize("warning", `WebSocket closed before the connection settled.`);
      }
    };
  });
}

export function SystemStatusPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const isMobile = useAdminViewport();
  const [report, setReport] = useState<DeploymentOpsReport | null>(null);
  const [apiStatus, setApiStatus] = useState<{ status: StatusTone; note: string }>({ status: "info", note: "Waiting for checks..." });
  const [wsStatus, setWsStatus] = useState<{ status: StatusTone; note: string }>({ status: "info", note: "Waiting for checks..." });
  const [loading, setLoading] = useState(true);
  const [refreshToken, setRefreshToken] = useState(0);
  const [activities, setActivities] = useState<AdminActivityEntry[]>([]);
  const [crashReports, setCrashReports] = useState<QueuedCrashReport[]>([]);
  const [filter, setFilter] = useState<AdminActivityCategory | "all">("all");
  const [draft, setDraft] = useState<ActivityComposer>({
    category: "system",
    title: "",
    detail: "",
  });

  const refreshStatus = async () => {
    setLoading(true);

    const [apiResult, deploymentResult, webSocketResult] = await Promise.all([
      healthCheck()
        .then(() => ({ status: "success" as StatusTone, note: "API responded successfully." }))
        .catch((error) => ({
          status: "danger" as StatusTone,
          note: error instanceof Error ? error.message : "API check failed.",
        })),
      getDeploymentOpsReport().catch((error) => {
        console.error("Deployment ops report failed:", error);
        return null;
      }),
      probeWebSocketHealth(),
    ]);

    setApiStatus(apiResult);
    setReport(deploymentResult);
    setWsStatus(webSocketResult);
    setActivities(loadAdminActivityLog());
    setCrashReports(getQueuedCrashReports());
    setLoading(false);
  };

  useEffect(() => {
    void refreshStatus();
  }, [refreshToken]);

  const notificationSupport = useMemo(() => {
    if (typeof window === "undefined") {
      return { status: "warning" as StatusTone, note: "Browser notifications are unavailable here." };
    }

    if (!("Notification" in window)) {
      return { status: "warning" as StatusTone, note: "This browser does not support notifications." };
    }

    if (Notification.permission === "granted") {
      return { status: "success" as StatusTone, note: "Notifications are enabled for this browser session." };
    }

    if (Notification.permission === "denied") {
      return { status: "danger" as StatusTone, note: "Notifications are blocked in this browser." };
    }

    return { status: "warning" as StatusTone, note: "Notifications are supported but still awaiting permission." };
  }, [refreshToken]);

  const crashCount = crashReports.length;

  const deploymentSummary = report?.summary;
  const checks = report?.checks || [];
  const visibleActivities = activities.filter((item) => filter === "all" || item.category === filter);

  const cards: StatusCard[] = [
    {
      title: "API health",
      value: apiStatus.status === "success" ? "Healthy" : "Attention",
      note: apiStatus.note,
      tone: apiStatus.status,
      icon: Cloud,
    },
    {
      title: "WebSocket health",
      value: wsStatus.status === "success" ? "Connected" : "Degraded",
      note: wsStatus.note,
      tone: wsStatus.status,
      icon: Wifi,
    },
    {
      title: "Notification delivery",
      value: notificationSupport.status === "success" ? "Ready" : notificationSupport.status === "danger" ? "Blocked" : "Pending",
      note: notificationSupport.note,
      tone: notificationSupport.status,
      icon: Bell,
    },
    {
      title: "Error logs",
      value: String(crashCount),
      note: crashCount > 0 ? "Pending crash reports found in the local queue." : "No crash reports are queued locally.",
      tone: crashCount > 0 ? "warning" : "success",
      icon: Bug,
    },
    {
      title: "Deployment readiness",
      value: deploymentSummary?.overall ? deploymentSummary.overall.replaceAll("_", " ") : "Loading",
      note: deploymentSummary ? `${deploymentSummary.ok} ok, ${deploymentSummary.warning} warning, ${deploymentSummary.missing} missing, ${deploymentSummary.pending} pending.` : "Deployment report is loading.",
      tone: getSeverityTone(deploymentSummary?.overall),
      icon: Shield,
    },
  ];

  const addQuickActivity = (category: AdminActivityCategory, title: string, detail: string) => {
    appendAdminActivity({ category, title, detail });
    setActivities(loadAdminActivityLog());
  };

  const handleDraftSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.title.trim()) return;

    appendAdminActivity({
      category: draft.category,
      title: draft.title.trim(),
      detail: draft.detail.trim() || undefined,
    });
    setActivities(loadAdminActivityLog());
    setDraft({ category: "system", title: "", detail: "" });
  };

  const handleClearLog = () => {
    clearAdminActivityLog();
    setActivities([]);
  };

  const renderCrashLogs = () => {
    if (crashReports.length === 0) {
      return (
        <div style={{ color: COLORS.muted, fontSize: 13 }}>
          No crash reports are queued locally.
        </div>
      );
    }

    return (
      <div style={{ display: "grid", gap: 10 }}>
        {crashReports.slice(0, 8).map((report, index) => (
          <div
            key={`${report.timestamp}-${index}`}
            style={{
              border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 14,
              background: "rgba(255,255,255,0.03)",
              padding: 12,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 700 }}>{report.name || "Error"}</div>
              <div style={{ color: COLORS.muted, fontSize: 11 }}>{formatTimestamp(report.timestamp)}</div>
            </div>
            <div style={{ marginTop: 6, fontSize: 13, color: COLORS.text }}>{report.message}</div>
            <div style={{ marginTop: 6, fontSize: 11, color: COLORS.muted }}>
              {report.path || "Unknown path"}{report.url ? ` • ${report.url}` : ""}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", width: "100vw", background: COLORS.bg, display: "flex", flexDirection: isMobile ? "column" : "row", color: COLORS.text, overflowX: "hidden" }}>
      <AdminSidebar activePage="admin-system" onNavigate={onNavigate} />

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", gap: 12, padding: isMobile ? "12px 14px" : "14px 20px", borderBottom: `1px solid ${COLORS.cardBorder}`, background: COLORS.bg }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.02 }}>System Status</div>
            <div style={{ fontSize: 12, color: COLORS.muted }}>Operational health, delivery checks, and a running activity log.</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => {
                setRefreshToken((current) => current + 1);
              }}
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
              }}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            <button
              onClick={handleClearLog}
              style={{
                border: `1px solid ${COLORS.cardBorder}`,
                background: "rgba(248,113,113,0.12)",
                color: COLORS.rose,
                borderRadius: 12,
                padding: "10px 14px",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Trash2 size={16} />
              Clear log
            </button>
          </div>
        </div>

        <main style={{ padding: isMobile ? 12 : 20, display: "grid", gap: 18 }}>
          <section
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(210px, 1fr))",
              gap: 14,
            }}
          >
            {cards.map((card) => {
              const styles = toneStyles(card.tone);
              const Icon = card.icon;
              return (
                <article
                  key={card.title}
                  style={{
                    background: COLORS.card,
                    border: `1px solid ${COLORS.cardBorder}`,
                    borderRadius: 18,
                    padding: 18,
                    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ display: "grid", gap: 8 }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: COLORS.muted, fontSize: 12 }}>
                        <Icon size={14} />
                        {card.title}
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.02 }}>{card.value}</div>
                    </div>
                    <span
                      style={{
                        ...styles,
                        borderRadius: 999,
                        padding: "6px 10px",
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "capitalize",
                      }}
                    >
                      {card.tone}
                    </span>
                  </div>
                  <div style={{ marginTop: 10, color: COLORS.muted, fontSize: 12, lineHeight: 1.5 }}>{card.note}</div>
                </article>
              );
            })}
          </section>

          <section style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.15fr) minmax(320px, 0.85fr)", gap: 18 }}>
            <article
              style={{
                background: COLORS.card,
                border: `1px solid ${COLORS.cardBorder}`,
                borderRadius: 20,
                padding: 18,
                minWidth: 0,
              }}
            >
              <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>Deployment checks</div>
                  <div style={{ fontSize: 12, color: COLORS.muted }}>The same checks the app uses for release readiness.</div>
                </div>
                <div style={{ display: "inline-flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ padding: "6px 10px", borderRadius: 999, background: "rgba(255,255,255,0.05)", color: COLORS.text, fontSize: 11 }}>
                    Version {report?.release.version || "n/a"}
                  </span>
                  <span style={{ padding: "6px 10px", borderRadius: 999, background: "rgba(255,255,255,0.05)", color: COLORS.text, fontSize: 11 }}>
                    Channel {report?.release.channel || appConfig.deploymentChannel}
                  </span>
                </div>
              </div>

              {loading && !report ? (
                <div style={{ color: COLORS.muted, fontSize: 13 }}>Loading status checks...</div>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {checks.map((check) => {
                    const styles = toneStyles(getSeverityTone(check.status));
                    return (
                      <div
                        key={check.key}
                        style={{
                          display: "grid",
                          gap: 8,
                          padding: 14,
                          borderRadius: 16,
                          border: `1px solid ${COLORS.cardBorder}`,
                          background: "rgba(255,255,255,0.03)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>{check.label}</div>
                            <div style={{ fontSize: 12, color: COLORS.muted }}>{check.note || "No note provided."}</div>
                          </div>
                          <span style={{ ...styles, borderRadius: 999, padding: "5px 10px", fontSize: 11, fontWeight: 700, textTransform: "capitalize" }}>
                            {check.status}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: COLORS.text, display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ color: COLORS.muted }}>Value:</span>
                          <span>{check.value || "—"}</span>
                          <span style={{ color: COLORS.muted }}>Category:</span>
                          <span>{check.category}</span>
                          <span style={{ color: COLORS.muted }}>Required:</span>
                          <span>{check.required ? "Yes" : "No"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </article>

            <article
              style={{
                background: COLORS.card,
                border: `1px solid ${COLORS.cardBorder}`,
                borderRadius: 20,
                padding: 18,
                minWidth: 0,
                display: "grid",
                gap: 14,
              }}
            >
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>Error logs</div>
                <div style={{ fontSize: 12, color: COLORS.muted }}>Local crash reports captured in this browser session.</div>
              </div>
              {renderCrashLogs()}
            </article>

            <article
              style={{
                background: COLORS.card,
                border: `1px solid ${COLORS.cardBorder}`,
                borderRadius: 20,
                padding: 18,
                minWidth: 0,
                display: "grid",
                gap: 14,
              }}
            >
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>Activity log</div>
                <div style={{ fontSize: 12, color: COLORS.muted }}>Login activity, admin actions, profile changes, event changes, and moderation actions.</div>
              </div>

              <form onSubmit={handleDraftSubmit} style={{ display: "grid", gap: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1.2fr", gap: 10 }}>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontSize: 11, color: COLORS.muted }}>Category</span>
                    <select
                      value={draft.category}
                      onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value as AdminActivityCategory }))}
                      style={{
                        width: "100%",
                        borderRadius: 12,
                        border: `1px solid ${COLORS.cardBorder}`,
                        background: "rgba(255,255,255,0.04)",
                        color: COLORS.text,
                        padding: "10px 12px",
                        outline: "none",
                      }}
                    >
                      <option value="system">System</option>
                      <option value="login">Login</option>
                      <option value="admin">Admin</option>
                      <option value="profile">Profile</option>
                      <option value="event">Event</option>
                      <option value="moderation">Moderation</option>
                    </select>
                  </label>

                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontSize: 11, color: COLORS.muted }}>Title</span>
                    <input
                      value={draft.title}
                      onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                      placeholder="Enter an activity title"
                      style={{
                        width: "100%",
                        borderRadius: 12,
                        border: `1px solid ${COLORS.cardBorder}`,
                        background: "rgba(255,255,255,0.04)",
                        color: COLORS.text,
                        padding: "10px 12px",
                        outline: "none",
                      }}
                    />
                  </label>
                </div>

                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 11, color: COLORS.muted }}>Detail</span>
                  <textarea
                    value={draft.detail}
                    onChange={(event) => setDraft((current) => ({ ...current, detail: event.target.value }))}
                    rows={3}
                    placeholder="Add context for the log entry"
                    style={{
                      width: "100%",
                      borderRadius: 12,
                      border: `1px solid ${COLORS.cardBorder}`,
                      background: "rgba(255,255,255,0.04)",
                      color: COLORS.text,
                      padding: "10px 12px",
                      outline: "none",
                      resize: "vertical",
                    }}
                  />
                </label>

                <button
                  type="submit"
                  style={{
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
                  }}
                >
                  <Plus size={16} />
                  Add entry
                </button>
              </form>

              <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))" }}>
                {QUICK_ACTIVITY_TYPES.map((item) => (
                  <button
                    key={item.category}
                    type="button"
                    onClick={() =>
                      addQuickActivity(
                        item.category,
                        item.label,
                        item.description
                      )
                    }
                    style={{
                      textAlign: "left",
                      border: `1px solid ${COLORS.cardBorder}`,
                      borderRadius: 14,
                      padding: 12,
                      background: "rgba(255,255,255,0.04)",
                      color: COLORS.text,
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <Activity size={14} />
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{item.label}</span>
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.muted, lineHeight: 1.5 }}>{item.description}</div>
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "inline-flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => setFilter("all")}
                    style={{
                      border: `1px solid ${COLORS.cardBorder}`,
                      background: filter === "all" ? COLORS.accentGrad : "rgba(255,255,255,0.04)",
                      color: filter === "all" ? "#fff" : COLORS.muted,
                      borderRadius: 999,
                      padding: "7px 12px",
                      fontSize: 11,
                      cursor: "pointer",
                    }}
                  >
                    All
                  </button>
                  {(["login", "admin", "profile", "event", "moderation"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFilter(value)}
                      style={{
                        border: `1px solid ${COLORS.cardBorder}`,
                        background: filter === value ? COLORS.accentGrad : "rgba(255,255,255,0.04)",
                        color: filter === value ? "#fff" : COLORS.muted,
                        borderRadius: 999,
                        padding: "7px 12px",
                        fontSize: 11,
                        cursor: "pointer",
                        textTransform: "capitalize",
                      }}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                <div style={{ color: COLORS.muted, fontSize: 11 }}>{visibleActivities.length} entries</div>
              </div>

              <div style={{ display: "grid", gap: 10, maxHeight: 460, overflow: "auto", paddingRight: 4 }}>
                {visibleActivities.length === 0 ? (
                  <div style={{ color: COLORS.muted, fontSize: 13, padding: "14px 0" }}>No activity entries yet. Use the quick buttons or add a manual note.</div>
                ) : (
                  visibleActivities.map((item) => {
                    const styles = toneStyles(item.category === "login" ? "success" : item.category === "moderation" ? "warning" : item.category === "event" ? "info" : "info");
                    return (
                      <div
                        key={item.id}
                        style={{
                          border: `1px solid ${COLORS.cardBorder}`,
                          borderRadius: 14,
                          padding: 12,
                          background: "rgba(255,255,255,0.03)",
                          display: "grid",
                          gap: 6,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ ...styles, borderRadius: 999, padding: "4px 9px", fontSize: 10, fontWeight: 700, textTransform: "capitalize" }}>
                              {item.category}
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 700 }}>{item.title}</span>
                          </div>
                          <span style={{ color: COLORS.muted, fontSize: 11 }}>{formatTimestamp(item.timestamp)}</span>
                        </div>
                        {item.detail ? <div style={{ color: COLORS.muted, fontSize: 12, lineHeight: 1.6 }}>{item.detail}</div> : null}
                      </div>
                    );
                  })
                )}
              </div>
            </article>
          </section>
        </main>
      </div>
    </div>
  );
}

export default SystemStatusPage;
