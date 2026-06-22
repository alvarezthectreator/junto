import { useEffect, useMemo, useState } from "react";
import { appConfig } from "../config/appConfig";
import { getCelebritiesAdmin, getEvents, getVenues, type Event } from "../services/api";
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
  fuchsia: "#e879f9",
  orange: "#fb923c",
};

const NAV = ["Dashboard", "Alerts", "High-Risk", "Users"];

const WORK_ASSIGNMENTS = [
  { label: "User Review", pct: 13.5, color: "#4ade80" },
  { label: "Venue Audit", pct: 10, color: "#a78bfa" },
  { label: "Celebrity Check", pct: 9.5, color: "#f472b6" },
  { label: "Safety Escalation", pct: 25.5, color: "#fbbf24" },
  { label: "Profile Verification", pct: 40.5, color: "#22d3ee" },
];

const REGISTRATION_GROWTH_SERIES = [
  { label: "Jan", value: 40 },
  { label: "Feb", value: 52 },
  { label: "Mar", value: 61 },
  { label: "Apr", value: 68 },
  { label: "May", value: 84 },
  { label: "Jun", value: 95 },
];

type AdminUserRow = {
  id: string;
  username?: string;
  display_name?: string;
  full_name?: string;
  email?: string;
  phone_number?: string;
  city?: string;
  occupation?: string;
  profile_id?: string;
  created_at?: string;
  avatar_image?: string | null;
  is_active?: boolean;
  fraud_verification_status?: string;
  risk_score?: number;
  behavior_score?: number;
  identity_score?: number;
  flags_count?: number;
  travel_mode_enabled?: boolean;
  travel_destination_city?: string;
};

type VenueRow = {
  id: string;
  name: string;
  category?: string;
  description?: string;
  address?: string;
  city?: string;
  photo_urls?: string | string[];
  opening_hours?: string;
  price_range?: string;
  phone?: string;
  website?: string;
  is_active?: boolean | number;
};

type CelebrityRow = {
  id: string;
  name?: string;
  category?: string;
  is_active?: boolean | number;
};

function DonutChart({ segments }) {
  const total = segments.reduce((s, seg) => s + seg.pct, 0);
  let cumulative = 0;
  const r = 70, cx = 90, cy = 90, stroke = 18;
  const circ = 2 * Math.PI * r;

  const paths = segments.map((seg) => {
    const dash = (seg.pct / total) * circ;
    const offset = circ - dash;
    const rotate = (cumulative / total) * 360 - 90;
    cumulative += seg.pct;
    return (
      <circle
        key={seg.label}
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={seg.color}
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={offset}
        style={{ transform: `rotate(${rotate}deg)`, transformOrigin: `${cx}px ${cy}px` }}
      />
    );
  });

  return (
    <svg width={180} height={180} viewBox="0 0 180 180">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      {paths}
      <text x={cx} y={cy - 8} textAnchor="middle" fill="#e8eaf6" fontSize={22} fontWeight={700}>9.1k</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="rgba(232,234,246,0.45)" fontSize={11}>Application</text>
    </svg>
  );
}

function SparklineChart() {
  const pts = REGISTRATION_GROWTH_SERIES.map((point) => point.value);
  const w = 240, h = 90;
  const min = Math.min(...pts), max = Math.max(...pts);
  const xs = pts.map((_, i) => (i / (pts.length - 1)) * w);
  const ys = pts.map((p) => h - ((p - min) / (max - min)) * (h - 16) - 8);
  const d = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x},${ys[i]}`).join(" ");
  const area = d + ` L${w},${h} L0,${h} Z`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c5cfc" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#7c5cfc" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sparkFill)" />
      <path d={d} fill="none" stroke="#7c5cfc" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={xs[pts.length - 1]} cy={ys[pts.length - 1]} r={5} fill="#fff" stroke="#7c5cfc" strokeWidth={2} />
      <rect x={xs[pts.length - 1] - 20} y={ys[pts.length - 1] - 22} width={50} height={18} rx={4} fill="#7c5cfc" />
      <text x={xs[pts.length - 1] + 5} y={ys[pts.length - 1] - 9} textAnchor="middle" fill="#fff" fontSize={10} fontWeight={600}>+18%</text>
    </svg>
  );
}

type AdminModeratorProps = {
  onNavigate?: (page: string) => void;
  setActiveNav?: (nav: string) => void;
  onCloseSidebar?: () => void;
};

export function AdminModerator({ onNavigate, setActiveNav: setAppActiveNav, onCloseSidebar }: AdminModeratorProps) {
  const isMobile = useAdminViewport();
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeEvents, setActiveEvents] = useState<Event[]>([]);
  const [venues, setVenues] = useState<VenueRow[]>([]);
  const [celebrities, setCelebrities] = useState<CelebrityRow[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingVenues, setIsLoadingVenues] = useState(true);
  const [isLoadingCelebrities, setIsLoadingCelebrities] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);
  const [eventError, setEventError] = useState<string | null>(null);
  const [venueError, setVenueError] = useState<string | null>(null);
  const [celebrityError, setCelebrityError] = useState<string | null>(null);
  const [userQuery, setUserQuery] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadUsers() {
      const endpoints = [
        `${appConfig.apiBaseUrl}/users?all=true&limit=25`,
      ];

      try {
        setIsLoadingUsers(true);
        setUserError(null);

        let lastError: unknown = null;

        for (const endpoint of endpoints) {
          try {
            const response = await fetch(endpoint, {
              headers: {
                "Content-Type": "application/json",
                ...(appConfig.adminSetupKey ? { "x-admin-setup-key": appConfig.adminSetupKey } : {}),
              },
              signal: controller.signal,
            });

            if (!response.ok) {
              throw new Error(`Failed to load users (${response.status})`);
            }

            const payload = await response.json();
            setUsers(Array.isArray(payload?.users) ? payload.users : []);
            setTotalUsers(typeof payload?.total === "number" ? payload.total : Array.isArray(payload?.users) ? payload.users.length : 0);
            return;
          } catch (error) {
            lastError = error;
            if ((error as Error).name === "AbortError") {
              return;
            }
          }
        }

        throw lastError || new Error("Failed to load users");
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }

        setUserError(error instanceof Error ? error.message : "Failed to load users");
        setUsers([]);
        setTotalUsers(0);
      } finally {
        setIsLoadingUsers(false);
      }
    }

    loadUsers();

    return () => controller.abort();
  }, [reloadToken]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCelebrities() {
      try {
        setIsLoadingCelebrities(true);
        setCelebrityError(null);

        const response = await getCelebritiesAdmin(undefined, true);
        if (controller.signal.aborted) {
          return;
        }

        setCelebrities(Array.isArray(response?.celebrities) ? response.celebrities : []);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setCelebrityError(error instanceof Error ? error.message : "Failed to load celebrities");
        setCelebrities([]);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingCelebrities(false);
        }
      }
    }

    loadCelebrities();

    return () => controller.abort();
  }, [reloadToken]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadVenues() {
      try {
        setIsLoadingVenues(true);
        setVenueError(null);

        const response = await getVenues({ all: true });
        if (controller.signal.aborted) {
          return;
        }

        setVenues(Array.isArray(response?.venues) ? response.venues : []);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setVenueError(error instanceof Error ? error.message : "Failed to load venues");
        setVenues([]);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingVenues(false);
        }
      }
    }

    loadVenues();

    return () => controller.abort();
  }, [reloadToken]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadEvents() {
      try {
        setIsLoadingEvents(true);
        setEventError(null);

        const response = await getEvents({ all: true, limit: 100, offset: 0 });
        if (controller.signal.aborted) {
          return;
        }

        setActiveEvents(Array.isArray(response?.events) ? response.events : []);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setEventError(error instanceof Error ? error.message : "Failed to load active events");
        setActiveEvents([]);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingEvents(false);
        }
      }
    }

    loadEvents();

    return () => controller.abort();
  }, [reloadToken]);

  const filteredUsers = useMemo(() => {
    const query = userQuery.trim().toLowerCase();
    if (!query) return users;

    return users.filter((user) => {
      const haystack = [
        user.display_name,
        user.full_name,
        user.username,
        user.email,
        user.phone_number,
        user.city,
        user.occupation,
        user.profile_id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [userQuery, users]);

  const formatDate = (value?: string) => {
    if (!value) return "Unknown";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getUserName = (user: AdminUserRow) =>
    user.display_name || user.full_name || user.username || "Unnamed user";

  const getInitial = (user: AdminUserRow) =>
    (getUserName(user).trim()[0] || user.profile_id?.[0] || "U").toUpperCase();

  const formatEventDateTime = (event: Event) => {
    const date = event.event_date ? new Date(event.event_date) : null;
    const dateLabel = date && !Number.isNaN(date.getTime())
      ? date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : event.event_date || "Unknown date";
    const timeLabel = event.event_time ? event.event_time : "Unknown time";
    return `${dateLabel} at ${timeLabel}`;
  };

  const formatVenueActiveState = (value?: boolean | number) =>
    value === false || value === 0 ? "Inactive" : "Active";

  const venuePhotoCount = (value?: string | string[]) => {
    if (Array.isArray(value)) return value.length;
    if (!value) return 0;
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  };

  const dashboardStats = [
    {
      label: "Registered Users",
      value: totalUsers,
      note: "Amount of registered users",
      icon: "△",
      iconBg: "rgba(124,92,252,0.15)",
      iconColor: "#a78bfa",
      delta: "+42.8% Previous Week",
    },
    {
      label: "Unassign Alerts",
      value: activeEvents.length,
      note: "Amount of events",
      icon: "◎",
      iconBg: "rgba(255,255,255,0.08)",
      iconColor: "#f87171",
      delta: "-56.9% this week",
    },
    {
      label: "Assets Missing",
      value: venues.length,
      note: "Amount of venues",
      icon: "⬡",
      iconBg: "rgba(251,191,36,0.12)",
      iconColor: "#fbbf24",
      delta: "-83.2% Previous Week",
    },
    {
      label: "Celebrities",
      value: celebrities.length,
      note: "Number of celebrities",
      icon: "◉",
      iconBg: "rgba(34,211,238,0.12)",
      iconColor: "#22d3ee",
      delta: "Live directory",
    },
  ];

  const registrationGrowth = useMemo(() => {
    const buckets = new Map<string, number>();
    const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });
    const reference = new Date();

    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(reference.getFullYear(), reference.getMonth() - i, 1);
      buckets.set(`${date.getFullYear()}-${date.getMonth()}`, 0);
    }

    users.forEach((user) => {
      if (!user.created_at) return;
      const date = new Date(user.created_at);
      if (Number.isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (buckets.has(key)) {
        buckets.set(key, (buckets.get(key) || 0) + 1);
      }
    });

    return Array.from(buckets.entries()).map(([key, count]) => {
      const [year, month] = key.split("-").map(Number);
      return {
        label: monthFormatter.format(new Date(year, month, 1)),
        value: count,
      };
    });
  }, [users]);

  const latestGrowth = registrationGrowth[registrationGrowth.length - 1]?.value || 0;
  const previousGrowth = registrationGrowth[registrationGrowth.length - 2]?.value || 0;
  const growthDelta = previousGrowth > 0 ? ((latestGrowth - previousGrowth) / previousGrowth) * 100 : 0;
  const maxRegistrationGrowth = Math.max(...registrationGrowth.map((entry) => entry.value), 1);

  return (
    <div style={{ minHeight: "100vh", width: "100vw", background: COLORS.bg, display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: "stretch", justifyContent: "stretch", padding: 0, fontFamily: "'Inter',system-ui,sans-serif", overflowX: "hidden" }}>
      <div style={{ width: "100%", minHeight: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", background: COLORS.bg }}>
        {/* Top Nav */}
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", gap: 12, padding: isMobile ? "12px 14px" : "14px 20px", borderBottom: `1px solid ${COLORS.cardBorder}`, background: COLORS.bg, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: `1px solid ${COLORS.cardBorder}`, display: "grid", placeItems: "center" }}>
              <span style={{ fontSize: 18 }}>⬡</span>
            </div>
            <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 999, padding: "4px", overflowX: isMobile ? "auto" : "visible", maxWidth: isMobile ? "100%" : "none" }}>
              {NAV.map(n => (
                <button
                  key={n}
                  onClick={() => {
                    setActiveNav(n);
                    if (n === "Users") {
                      onNavigate?.("admin-users");
                    } else if (n === "High-Risk") {
                      onNavigate?.("admin-high-risk");
                    }
                  }}
                  style={{ padding: "8px 18px", borderRadius: 999, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: activeNav === n ? COLORS.accentGrad : "transparent", color: activeNav === n ? "#fff" : COLORS.muted, transition: "all 0.15s" }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => {
                onCloseSidebar?.();
                setAppActiveNav?.("Discover");
                onNavigate?.("main");
              }}
              style={{
                border: `1px solid ${COLORS.cardBorder}`,
                background: "rgba(255,255,255,0.05)",
                color: COLORS.text,
                borderRadius: 999,
                padding: "8px 14px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Back to app
            </button>
            <button style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: `1px solid ${COLORS.cardBorder}`, color: COLORS.muted, fontSize: 15, cursor: "pointer", display: "grid", placeItems: "center" }}>🔍</button>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.04)", border: `1px solid ${COLORS.cardBorder}`, borderRadius: 999, padding: "6px 12px" }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: COLORS.accentGrad, display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>A</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>Alex Robert</div>
                <div style={{ fontSize: 11, color: COLORS.muted }}>alex24y@</div>
              </div>
              <span style={{ color: COLORS.muted, fontSize: 12 }}>▾</span>
            </div>
            <button style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: `1px solid ${COLORS.cardBorder}`, color: COLORS.muted, fontSize: 15, cursor: "pointer", display: "grid", placeItems: "center" }}>☰</button>
          </div>
        </div>

        {/* Main */}
        <div style={{ display: "flex", flex: 1, minHeight: 0, flexDirection: isMobile ? "column" : "row" }}>
          <AdminSidebar activePage="admin" onNavigate={onNavigate} />

          <main style={{ flex: 1, padding: isMobile ? 12 : "20px", display: "flex", flexDirection: "column", gap: 16, overflow: "hidden auto", minHeight: 0 }}>
            {/* Row 1: 4 stat cards + donut + agents bar */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1.3fr 1.3fr", gap: 14 }}>
                {/* 4 stat mini cards */}
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
                {dashboardStats.map((card) => (
                  <div key={card.label} style={{ background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 16, padding: "14px 14px 12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 10, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>{card.label}</div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, lineHeight: 1 }}>
                          {card.value.toLocaleString()}
                        </div>
                      </div>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: card.iconBg, display: "grid", placeItems: "center", color: card.iconColor, fontSize: 14 }}>{card.icon}</div>
                    </div>
                    <div style={{ fontSize: 11, color: card.delta.includes("Live") ? COLORS.cyan : card.delta.startsWith("+") ? COLORS.green : COLORS.rose, marginTop: 8 }}>{card.delta}</div>
                    <div style={{ fontSize: 11, color: COLORS.dimmer, marginTop: 4 }}>{card.note}</div>
                  </div>
                ))}
              </div>

              {/* Assigned Work */}
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 16, padding: "16px 18px" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 12 }}>Assigned Informatics Work</div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <DonutChart segments={WORK_ASSIGNMENTS} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {WORK_ASSIGNMENTS.map((seg) => (
                      <div key={seg.label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ width: 10, height: 10, borderRadius: "50%", background: seg.color, display: "inline-block", flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: COLORS.muted }}>{seg.label}</span>
                        <span style={{ fontSize: 12, color: COLORS.dimmer, marginLeft: "auto" }}>{seg.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* User Registration Growth */}
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 16, padding: "16px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>User Registration Growth</div>
                  <span style={{ fontSize: 11, color: COLORS.muted }}>⋯</span>
                </div>
                <div style={{ fontSize: 26, fontWeight: 700, color: COLORS.text, marginBottom: 2 }}>
                  {totalUsers.toLocaleString()}
                </div>
                <div style={{ fontSize: 12, color: growthDelta >= 0 ? COLORS.green : COLORS.rose, marginBottom: 12 }}>
                  {growthDelta >= 0 ? "+" : ""}{growthDelta.toFixed(1)}% this month
                </div>
                <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 50, marginBottom: 12 }}>
                  {registrationGrowth.map((b, i) => (
                    <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 4 }}>
                      <div style={{ fontSize: 10, color: COLORS.dimmer }}>{b.value.toLocaleString()}</div>
                      <div style={{ width: "100%", borderRadius: 3, background: "#7c5cfc", height: Math.max(8, (b.value / maxRegistrationGrowth) * 38) }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                  {registrationGrowth.map((b) => (
                    <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#7c5cfc", display: "inline-block" }} />
                      <span style={{ fontSize: 10, color: COLORS.muted }}>{b.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 2: High Alerts sparkline + Top 5 Open Alerts table */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "0.8fr 1.6fr", gap: 14 }}>
              {/* High Alerts */}
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 16, padding: "16px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>High Alerts</div>
                  <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "3px 10px", fontSize: 11, color: COLORS.muted }}>Week ▾</div>
                </div>
                <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 2 }}>Total time worked</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>16 hr 30 min</div>
                  <div style={{ fontSize: 13, color: COLORS.green }}>54.34%</div>
                </div>
                <SparklineChart />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  {registrationGrowth.map((point) => (
                    <span key={point.label} style={{ fontSize: 9, color: COLORS.dimmer }}>{point.label}</span>
                  ))}
                  {/* fallback for alignment on wide layouts */}
                  {registrationGrowth.length === 0 && ["Jan","Feb","Mar","Apr"].map(d => (
                    <span key={d} style={{ fontSize: 9, color: COLORS.dimmer }}>{d}</span>
                  ))}
                </div>
              </div>

              {/* Users table */}
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 16, padding: "16px 18px", display: "flex", flexDirection: "column", minHeight: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>Users</div>
                    <div style={{ fontSize: 11, color: COLORS.muted }}>Live directory of registered users and their details</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => {
                        setUserQuery("");
                        setReloadToken((current) => current + 1);
                      }}
                      style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.05)", border: `1px solid ${COLORS.cardBorder}`, borderRadius: 8, padding: "5px 12px", fontSize: 11, color: COLORS.muted, cursor: "pointer" }}
                    >
                      ↻ Refresh
                    </button>
                    <input
                      value={userQuery}
                      onChange={(event) => setUserQuery(event.target.value)}
                      placeholder="Search users"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: `1px solid ${COLORS.cardBorder}`,
                        borderRadius: 8,
                        padding: "6px 12px",
                        fontSize: 11,
                        color: COLORS.text,
                        minWidth: 160,
                        outline: "none",
                      }}
                    />
                  </div>
                </div>
                <div style={{ overflowY: "auto", maxHeight: 430, minHeight: 0, paddingRight: 4 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr>
                        {["User", "Contact", "Location", "Joined", "Account", "Actions"].map(h => (
                          <th key={h} style={{ textAlign: "left", color: COLORS.muted, fontWeight: 500, fontSize: 11, padding: "6px 8px", borderBottom: `1px solid ${COLORS.cardBorder}`, whiteSpace: "nowrap", position: "sticky", top: 0, background: COLORS.card, zIndex: 1 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {isLoadingUsers ? (
                        <tr>
                          <td colSpan={6} style={{ padding: "18px 8px", color: COLORS.muted }}>Loading users...</td>
                        </tr>
                      ) : userError ? (
                        <tr>
                          <td colSpan={6} style={{ padding: "18px 8px", color: COLORS.rose }}>{userError}</td>
                        </tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: "18px 8px", color: COLORS.muted }}>No users found.</td>
                        </tr>
                      ) : (
                        filteredUsers.map((row) => (
                          <tr key={row.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                            <td style={{ padding: "10px 8px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 28, height: 28, borderRadius: "50%", background: COLORS.accentGrad, display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                                  {getInitial(row)}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ color: COLORS.text, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{getUserName(row)}</div>
                                  <div style={{ color: COLORS.muted, fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>@{row.profile_id || "no-profile"}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: "10px 8px" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                <span style={{ color: COLORS.text }}>{row.email || "No email"}</span>
                                <span style={{ color: COLORS.muted }}>{row.phone_number || "No phone"}</span>
                              </div>
                            </td>
                            <td style={{ padding: "10px 8px" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                <span style={{ color: COLORS.text }}>{row.city || "No city"}</span>
                                <span style={{ color: COLORS.muted }}>{row.occupation || "No occupation"}</span>
                              </div>
                            </td>
                            <td style={{ padding: "10px 8px", color: COLORS.muted }}>{formatDate(row.created_at)}</td>
                            <td style={{ padding: "10px 8px" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                                <span style={{ background: row.is_active === false ? "rgba(248,113,113,0.1)" : "rgba(74,222,128,0.1)", color: row.is_active === false ? COLORS.rose : COLORS.green, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600, width: "fit-content" }}>
                                  {row.is_active === false ? "Inactive" : "Active"}
                                </span>
                                <span style={{ background: "rgba(34,211,238,0.1)", color: COLORS.cyan, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600, width: "fit-content" }}>
                                  {row.fraud_verification_status || "unverified"}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: "10px 8px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.muted }}>
                                <button style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${COLORS.cardBorder}`, borderRadius: 8, padding: "5px 10px", fontSize: 11, color: COLORS.muted, cursor: "pointer" }}>
                                  View
                                </button>
                                <span>⋯</span>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Row 3: Active events table + Venue list */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.6fr 0.9fr", gap: 14 }}>
              {/* Active Events */}
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 16, padding: "16px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>Active Events</div>
                    <div style={{ fontSize: 11, color: COLORS.muted }}>All currently active events on the platform</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${COLORS.cardBorder}`, borderRadius: 8, padding: "5px 12px", fontSize: 11, color: COLORS.muted, cursor: "pointer" }}>🔍</button>
                    <button
                      onClick={() => setReloadToken((current) => current + 1)}
                      style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.05)", border: `1px solid ${COLORS.cardBorder}`, borderRadius: 8, padding: "5px 12px", fontSize: 11, color: COLORS.muted, cursor: "pointer" }}
                    >
                      ↻ Refresh
                    </button>
                  </div>
                </div>
                <div style={{ overflowY: "auto", maxHeight: 430, minHeight: 0, paddingRight: 4 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr>
                        {["Event", "Host", "Schedule", "Location", "Details", "Capacity"].map((h) => (
                          <th key={h} style={{ textAlign: "left", color: COLORS.muted, fontWeight: 500, fontSize: 11, padding: "6px 8px", borderBottom: `1px solid ${COLORS.cardBorder}`, whiteSpace: "nowrap", position: "sticky", top: 0, background: COLORS.card, zIndex: 1 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {isLoadingEvents ? (
                        <tr>
                          <td colSpan={6} style={{ padding: "18px 8px", color: COLORS.muted }}>Loading active events...</td>
                        </tr>
                      ) : eventError ? (
                        <tr>
                          <td colSpan={6} style={{ padding: "18px 8px", color: COLORS.rose }}>{eventError}</td>
                        </tr>
                      ) : activeEvents.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: "18px 8px", color: COLORS.muted }}>No active events found.</td>
                        </tr>
                      ) : (
                        activeEvents.map((event) => (
                          <tr key={event.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                            <td style={{ padding: "10px 8px" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                                <div style={{ color: COLORS.text, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{event.title}</div>
                                <div style={{ color: COLORS.muted, fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{event.event_type || "Event"}</div>
                              </div>
                            </td>
                            <td style={{ padding: "10px 8px" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                <span style={{ color: COLORS.text }}>{event.display_name || "Unknown host"}</span>
                                <span style={{ color: COLORS.muted }}>{event.profile_id || event.host_id}</span>
                              </div>
                            </td>
                            <td style={{ padding: "10px 8px", color: COLORS.muted }}>{formatEventDateTime(event)}</td>
                            <td style={{ padding: "10px 8px" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                <span style={{ color: COLORS.text }}>{event.location_city}</span>
                                <span style={{ color: COLORS.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>
                                  {event.location_address || "No address provided"}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: "10px 8px" }}>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                <span style={{ background: "rgba(34,211,238,0.1)", color: COLORS.cyan, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>
                                  {event.status || "active"}
                                </span>
                                <span style={{ background: "rgba(124,92,252,0.16)", color: "#c4b5fd", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>
                                  Tier {event.billing_tier}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: "10px 8px" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <span style={{ color: COLORS.text }}>{event.max_guests || "?"} max guests</span>
                                <span style={{ color: COLORS.muted }}>{event.host_fee ? `Host fee ${event.host_fee}` : "Host fee unavailable"}</span>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Venues */}
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 16, padding: "16px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>Venues</div>
                    <div style={{ fontSize: 11, color: COLORS.muted }}>All venues in the system</div>
                  </div>
                  <button
                    onClick={() => setReloadToken((current) => current + 1)}
                    style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.05)", border: `1px solid ${COLORS.cardBorder}`, borderRadius: 8, padding: "5px 12px", fontSize: 11, color: COLORS.muted, cursor: "pointer" }}
                  >
                    ↻ Refresh
                  </button>
                </div>
                <div style={{ overflowY: "auto", maxHeight: 430, minHeight: 0, paddingRight: 4 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr>
                        {["Venue", "Category", "Location", "Contact", "Hours", "Status"].map((h) => (
                          <th key={h} style={{ textAlign: "left", color: COLORS.muted, fontWeight: 500, fontSize: 11, padding: "6px 8px", borderBottom: `1px solid ${COLORS.cardBorder}`, whiteSpace: "nowrap", position: "sticky", top: 0, background: COLORS.card, zIndex: 1 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {isLoadingVenues ? (
                        <tr>
                          <td colSpan={6} style={{ padding: "18px 8px", color: COLORS.muted }}>Loading venues...</td>
                        </tr>
                      ) : venueError ? (
                        <tr>
                          <td colSpan={6} style={{ padding: "18px 8px", color: COLORS.rose }}>{venueError}</td>
                        </tr>
                      ) : venues.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: "18px 8px", color: COLORS.muted }}>No venues found.</td>
                        </tr>
                      ) : (
                        venues.map((venue) => (
                          <tr key={venue.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                            <td style={{ padding: "10px 8px" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                                <div style={{ color: COLORS.text, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{venue.name}</div>
                                <div style={{ color: COLORS.muted, fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>ID: {venue.id}</div>
                              </div>
                            </td>
                            <td style={{ padding: "10px 8px", color: COLORS.text }}>{venue.category || "Uncategorized"}</td>
                            <td style={{ padding: "10px 8px" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                <span style={{ color: COLORS.text }}>{venue.city || "No city"}</span>
                                <span style={{ color: COLORS.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>
                                  {venue.address || "No address"}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: "10px 8px" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                <span style={{ color: COLORS.text }}>{venue.phone || "No phone"}</span>
                                <span style={{ color: COLORS.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>
                                  {venue.website || "No website"}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: "10px 8px", color: COLORS.muted }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                <span>{venue.opening_hours || "No opening hours"}</span>
                                <span>{venue.price_range || "No price range"}</span>
                                <span>{venuePhotoCount(venue.photo_urls)} photos</span>
                              </div>
                            </td>
                            <td style={{ padding: "10px 8px" }}>
                              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: venue.is_active === false || venue.is_active === 0 ? "rgba(248,113,113,0.1)" : "rgba(74,222,128,0.1)", color: venue.is_active === false || venue.is_active === 0 ? COLORS.rose : COLORS.green, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600, width: "fit-content" }}>
                                {formatVenueActiveState(venue.is_active)}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
