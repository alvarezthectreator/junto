import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  ArrowLeft,
  ArrowUpDown,
  MoreVertical,
  PencilLine,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Users2,
} from "lucide-react";
import { deleteUserAccount, getUsers, updateUserAdminStatus, type User } from "../services/api";
import { appendAdminActivity } from "../services/adminActivityLog";
import { AdminSidebar } from "./AdminSidebar";
import { useAdminViewport } from "./useAdminViewport";

const COLORS = {
  bg: "#0f1117",
  card: "#181a23",
  cardBorder: "rgba(255,255,255,0.07)",
  accent: "#7c5cfc",
  accentGrad: "linear-gradient(135deg,#7c5cfc,#5b8af5)",
  text: "#e8eaf6",
  muted: "rgba(232,234,246,0.45)",
  green: "#4ade80",
  rose: "#f87171",
  cyan: "#22d3ee",
};

type AdminUsersProps = {
  onNavigate?: (page: string) => void;
};

type EditableUser = User & {
  city?: string;
  occupation?: string;
  is_active?: boolean;
  fraud_verification_status?: string;
  verification_status?: string;
  reliability_score?: number;
};

type UserEditDraft = {
  display_name: string;
  username: string;
  email: string;
  phone_number: string;
  city: string;
  occupation: string;
  is_active: boolean;
  verification_status: string;
};

const EDITABLE_FIELDS: Array<{ label: string; key: keyof UserEditDraft }> = [
  { label: "Display name", key: "display_name" },
  { label: "Username", key: "username" },
  { label: "Email", key: "email" },
  { label: "Phone", key: "phone_number" },
  { label: "City", key: "city" },
  { label: "Occupation", key: "occupation" },
];

function getDisplayName(user: EditableUser) {
  return user.display_name || user.full_name || user.username || "Unnamed user";
}

function getInitial(user: EditableUser) {
  return (getDisplayName(user).trim()[0] || user.profile_id?.[0] || "U").toUpperCase();
}

function formatDate(value?: string) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getVerificationStatus(user: EditableUser) {
  return String(user.fraud_verification_status || user.verification_status || "").toLowerCase();
}

function getVerificationLabel(user: EditableUser) {
  const status = getVerificationStatus(user);
  if (!status) return "Unverified";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function withStatusFallback(user: EditableUser, updates: Partial<EditableUser>): EditableUser {
  const merged = { ...user, ...updates };
  const verification_status = String(
    merged.fraud_verification_status ||
      merged.verification_status ||
      user.fraud_verification_status ||
      user.verification_status ||
      "unverified"
  ).toLowerCase();

  return {
    ...merged,
    fraud_verification_status: verification_status,
    verification_status,
  };
}

function MetricCard({
  label,
  value,
  note,
  accent,
}: {
  label: string;
  value: string;
  note: string;
  accent: string;
}) {
  return (
    <div
      style={{
        background: "rgba(24,26,35,0.92)",
        border: `1px solid ${COLORS.cardBorder}`,
        borderRadius: 20,
        padding: "16px 18px",
        boxShadow: "0 18px 50px rgba(0,0,0,0.24)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.14em" }}>{label}</div>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: accent, boxShadow: `0 0 0 4px ${accent}22` }} />
      </div>
      <div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.05 }}>{value}</div>
      <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 10 }}>{note}</div>
    </div>
  );
}

function Chip({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "green" | "cyan" | "rose" | "purple";
}) {
  const styles: Record<string, CSSProperties> = {
    neutral: { background: "rgba(255,255,255,0.06)", color: COLORS.muted },
    green: { background: "rgba(74,222,128,0.12)", color: COLORS.green },
    cyan: { background: "rgba(34,211,238,0.12)", color: COLORS.cyan },
    rose: { background: "rgba(248,113,113,0.12)", color: COLORS.rose },
    purple: { background: "rgba(124,92,252,0.14)", color: "#e6ddff" },
  };

  return (
    <span
      style={{
        ...styles[tone],
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        borderRadius: 999,
        padding: "5px 12px",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.04em",
      }}
    >
      {children}
    </span>
  );
}

function UserActionsMenu({
  user,
  isActive,
  isVerified,
  isSaving,
  isDeleting,
  onEdit,
  onToggleSuspend,
  onToggleVerified,
  onRemoveVerifiedTag,
  onDelete,
}: {
  user: EditableUser;
  isActive: boolean;
  isVerified: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  onEdit: () => void;
  onToggleSuspend: () => void;
  onToggleVerified: () => void;
  onRemoveVerifiedTag: () => void;
  onDelete: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { label: "Edit User", icon: PencilLine, action: onEdit, color: COLORS.accent },
    { label: isActive ? "Suspend Account" : "Reactivate Account", icon: isActive ? ShieldOff : ShieldCheck, action: onToggleSuspend, color: isActive ? COLORS.rose : COLORS.green },
    { label: isVerified ? "Unverify" : "Mark as Verified", icon: ShieldCheck, action: onToggleVerified, color: COLORS.cyan },
    { label: "Remove Verified Tag", icon: Trash2, action: onRemoveVerifiedTag, color: COLORS.muted },
    { label: "Delete User", icon: Trash2, action: onDelete, color: COLORS.rose },
  ];

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSaving || isDeleting}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 34,
          height: 34,
          borderRadius: 8,
          border: `1px solid ${COLORS.cardBorder}`,
          background: isOpen ? "rgba(124,92,252,0.16)" : "rgba(255,255,255,0.05)",
          color: COLORS.text,
          cursor: "pointer",
          transition: "all 0.2s",
        }}
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 99,
            }}
            onClick={() => setIsOpen(false)}
          />
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 8px)",
              background: "rgba(24,26,35,0.98)",
              border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 12,
              minWidth: 200,
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
              backdropFilter: "blur(12px)",
              zIndex: 100,
              overflow: "hidden",
            }}
          >
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  item.action();
                  setIsOpen(false);
                }}
                disabled={isSaving || isDeleting}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 14px",
                  borderBottom: index < menuItems.length - 1 ? `1px solid ${COLORS.cardBorder}` : "none",
                  background: "transparent",
                  color: item.color,
                  border: "none",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                }}
              >
                <item.icon size={14} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function AdminUsers({ onNavigate }: AdminUsersProps) {
  const isMobile = useAdminViewport();
  const [users, setUsers] = useState<EditableUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<"name-asc" | "name-desc" | "newest" | "oldest">("name-asc");
  const [refreshToken, setRefreshToken] = useState(0);
  const [selectedUser, setSelectedUser] = useState<EditableUser | null>(null);
  const [draft, setDraft] = useState<UserEditDraft | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadUsers() {
      try {
        setLoading(true);
        setError(null);
        const response = await getUsers({ all: true, limit: 200, offset: 0 });
        if (controller.signal.aborted) return;
        setUsers(Array.isArray(response?.users) ? (response.users as EditableUser[]) : []);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to load users");
        setUsers([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadUsers();
    return () => controller.abort();
  }, [refreshToken]);

  const filteredUsers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return users;

    return users.filter((user) => {
      const haystack = [
        getDisplayName(user),
        user.username,
        user.profile_id,
        user.email,
        user.phone_number,
        user.city,
        user.occupation,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [query, users]);

  const sortedUsers = useMemo(() => {
    const list = [...filteredUsers];

    list.sort((left, right) => {
      const leftName = getDisplayName(left).toLowerCase();
      const rightName = getDisplayName(right).toLowerCase();
      const leftDate = new Date(left.created_at || 0).getTime();
      const rightDate = new Date(right.created_at || 0).getTime();

      switch (sortMode) {
        case "name-asc":
          return leftName.localeCompare(rightName);
        case "name-desc":
          return rightName.localeCompare(leftName);
        case "oldest":
          return leftDate - rightDate;
        case "newest":
        default:
          return rightDate - leftDate;
      }
    });

    return list;
  }, [filteredUsers, sortMode]);

  const stats = useMemo(() => {
    const active = users.filter((user) => user.is_active !== false).length;
    const verified = users.filter((user) => getVerificationStatus(user) === "verified").length;
    const pendingOrUnverified = users.filter((user) => getVerificationStatus(user) !== "verified").length;
    return { total: users.length, active, verified, pendingOrUnverified };
  }, [users]);

  const syncUser = (userId: string, updates: Partial<EditableUser>) => {
    setUsers((current) => current.map((user) => (user.id === userId ? withStatusFallback(user, updates) : user)));
    setSelectedUser((current) => (current && current.id === userId ? withStatusFallback(current, updates) : current));
  };

  const openEdit = (user: EditableUser) => {
    setSelectedUser(user);
    setDraft({
      display_name: getDisplayName(user),
      username: user.username || "",
      email: user.email || "",
      phone_number: user.phone_number || "",
      city: user.city || "",
      occupation: user.occupation || "",
      is_active: user.is_active !== false,
      verification_status: getVerificationStatus(user) || "unverified",
    });
  };

  const closeEdit = () => {
    setSelectedUser(null);
    setDraft(null);
  };

  const saveEdit = async () => {
    if (!selectedUser || !draft) return;

    try {
      setSavingId(selectedUser.id);
      const response = await updateUserAdminStatus(selectedUser.id, {
        display_name: draft.display_name,
        username: draft.username,
        email: draft.email,
        phone_number: draft.phone_number,
        city: draft.city,
        occupation: draft.occupation,
        is_active: draft.is_active,
        verification_status: draft.verification_status,
      });

      syncUser(selectedUser.id, response.user as Partial<EditableUser>);
      appendAdminActivity({
        category: "profile",
        title: "Profile updated",
        detail: `${getDisplayName(selectedUser)} was edited by an admin.`,
      });
      // Dispatch event to notify profile component
      window.dispatchEvent(new CustomEvent('junto-user-admin-status-updated', { detail: { userId: selectedUser.id } }));
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('junto-user-admin-status-updated', JSON.stringify({ userId: selectedUser.id, timestamp: Date.now() }));
        } catch { /* ignore */ }
      }
      closeEdit();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save user");
    } finally {
      setSavingId(null);
    }
  };

  const toggleSuspend = async (user: EditableUser) => {
    try {
      setSavingId(user.id);
      syncUser(user.id, { is_active: user.is_active === false });
      const response = await updateUserAdminStatus(user.id, { is_active: user.is_active === false });
      syncUser(user.id, response.user as Partial<EditableUser>);
      appendAdminActivity({
        category: "profile",
        title: user.is_active === false ? "Account reactivated" : "Account suspended",
        detail: `${getDisplayName(user)} was ${user.is_active === false ? "reactivated" : "suspended"} by an admin.`,
      });
      // Dispatch event to notify profile component
      window.dispatchEvent(new CustomEvent('junto-user-admin-status-updated', { detail: { userId: user.id } }));
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('junto-user-admin-status-updated', JSON.stringify({ userId: user.id, timestamp: Date.now() }));
        } catch { /* ignore */ }
      }
    } finally {
      setSavingId(null);
    }
  };

  const toggleVerified = async (user: EditableUser) => {
    const nextStatus = getVerificationStatus(user) === "verified" ? "unverified" : "verified";
    try {
      setSavingId(user.id);
      syncUser(user.id, { fraud_verification_status: nextStatus, verification_status: nextStatus });
      const response = await updateUserAdminStatus(user.id, { verification_status: nextStatus });
      syncUser(user.id, response.user as Partial<EditableUser>);
      appendAdminActivity({
        category: "profile",
        title: "Verification status changed",
        detail: `${getDisplayName(user)} was marked ${nextStatus}.`,
      });
      // Dispatch event to notify profile component
      window.dispatchEvent(new CustomEvent('junto-user-admin-status-updated', { detail: { userId: user.id } }));
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('junto-user-admin-status-updated', JSON.stringify({ userId: user.id, timestamp: Date.now() }));
        } catch { /* ignore */ }
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update verification status");
    } finally {
      setSavingId(null);
    }
  };

  const removeVerifiedTag = async (user: EditableUser) => {
    try {
      setSavingId(user.id);
      syncUser(user.id, { fraud_verification_status: "unverified", verification_status: "unverified" });
      const response = await updateUserAdminStatus(user.id, { verification_status: "unverified" });
      syncUser(user.id, response.user as Partial<EditableUser>);
      // Dispatch event to notify profile component
      window.dispatchEvent(new CustomEvent('junto-user-admin-status-updated', { detail: { userId: user.id } }));
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('junto-user-admin-status-updated', JSON.stringify({ userId: user.id, timestamp: Date.now() }));
        } catch { /* ignore */ }
      }
      appendAdminActivity({
        category: "profile",
        title: "Verified tag removed",
        detail: `The verified tag was removed from ${getDisplayName(user)}.`,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to remove verified tag");
    } finally {
      setSavingId(null);
    }
  };

  const deleteUser = async (user: EditableUser) => {
    const confirmed = window.confirm(`Delete ${getDisplayName(user)}? This cannot be undone.`);
    if (!confirmed) return;

    try {
      setDeletingId(user.id);
      await deleteUserAccount(user.id);
      setUsers((current) => current.filter((item) => item.id !== user.id));
      appendAdminActivity({
        category: "profile",
        title: "User deleted",
        detail: `${getDisplayName(user)} was removed from the system.`,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setDeletingId(null);
    }
  };

  const shellStyle: CSSProperties = {
    minHeight: "100vh",
    width: "100vw",
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    overflowX: "hidden",
    color: COLORS.text,
    background:
      "radial-gradient(circle at top left, rgba(124,92,252,0.18), transparent 28%), radial-gradient(circle at top right, rgba(34,211,238,0.12), transparent 24%), linear-gradient(180deg, #0a0c12 0%, #0f1117 100%)",
  };

  const panelStyle: CSSProperties = {
    background: "rgba(24,26,35,0.92)",
    border: `1px solid ${COLORS.cardBorder}`,
    borderRadius: 20,
    boxShadow: "0 22px 70px rgba(0,0,0,0.28)",
    backdropFilter: "blur(18px)",
  };

  const softButtonStyle: CSSProperties = {
    border: `1px solid ${COLORS.cardBorder}`,
    background: "rgba(255,255,255,0.05)",
    color: COLORS.text,
    borderRadius: 999,
    padding: "10px 14px",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  };

  const hasFilters = query.trim().length > 0 || sortMode !== "name-asc";

  return (
    <div style={shellStyle}>
      <AdminSidebar activePage="admin-users" onNavigate={onNavigate} />

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", minHeight: "100vh", backdropFilter: "blur(10px)" }}>
        <header style={{ ...panelStyle, margin: isMobile ? 12 : 18, padding: isMobile ? 16 : 20 }}>
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
              <button
                onClick={() => onNavigate?.("admin")}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  border: "none",
                  background: COLORS.accentGrad,
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                  boxShadow: "0 12px 30px rgba(124,92,252,0.35)",
                }}
              >
                <ArrowLeft size={20} />
              </button>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, color: COLORS.muted, letterSpacing: "0.18em", textTransform: "uppercase" }}>Admin / User Directory</div>
                <h1 style={{ margin: "4px 0 6px", fontSize: isMobile ? 26 : 32, lineHeight: 1.05 }}>Registered Users</h1>
                <div style={{ color: COLORS.muted, fontSize: 13, lineHeight: 1.6, maxWidth: 760 }}>
                  Review accounts, adjust access, and manage verification in a cleaner control surface.
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", width: isMobile ? "100%" : "auto" }}>
              <button onClick={() => setRefreshToken((current) => current + 1)} style={softButtonStyle}>
                <RefreshCw size={14} />
                Refresh
              </button>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${COLORS.cardBorder}`,
                  borderRadius: 999,
                  padding: "8px 12px",
                }}
              >
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: COLORS.accentGrad, display: "grid", placeItems: "center", color: "#fff", fontWeight: 700, boxShadow: "0 8px 22px rgba(124,92,252,0.22)" }}>
                  A
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>Admin</div>
                  <div style={{ fontSize: 11, color: COLORS.muted }}>User operations</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main style={{ flex: 1, minHeight: 0, padding: isMobile ? 12 : "0 18px 18px", display: "flex", flexDirection: "column", gap: 16, overflow: "hidden auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 14 }}>
            <MetricCard label="Total users" value={stats.total.toLocaleString()} note="All registered accounts" accent={COLORS.accent} />
            <MetricCard label="Active users" value={stats.active.toLocaleString()} note="Currently enabled" accent={COLORS.green} />
            <MetricCard label="Verified users" value={stats.verified.toLocaleString()} note="Marked trusted" accent={COLORS.cyan} />
            <MetricCard label="Needs review" value={stats.pendingOrUnverified.toLocaleString()} note="Not fully verified" accent={COLORS.rose} />
          </div>

          <section style={{ ...panelStyle, padding: isMobile ? 14 : 18, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", gap: 12, marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Account Table</div>
                <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 3 }}>
                  {loading ? "Loading the latest user directory..." : `${sortedUsers.length.toLocaleString()} of ${stats.total.toLocaleString()} users shown`}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end", width: isMobile ? "100%" : "auto" }}>
                <div style={{ position: "relative", minWidth: isMobile ? "100%" : 260, flex: isMobile ? "1 1 100%" : "0 0 auto" }}>
                  <Search size={14} style={{ position: "absolute", left: 12, top: 12, color: COLORS.muted }} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search by name, email, city..."
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.05)",
                      border: `1px solid ${COLORS.cardBorder}`,
                      borderRadius: 14,
                      padding: "11px 14px 11px 36px",
                      fontSize: 13,
                      color: COLORS.text,
                      outline: "none",
                    }}
                  />
                </div>

                <label style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 12px", borderRadius: 14, border: `1px solid ${COLORS.cardBorder}`, background: "rgba(255,255,255,0.05)", color: COLORS.muted, fontSize: 12 }}>
                  <ArrowUpDown size={14} />
                  <span>Sort</span>
                  <select
                    value={sortMode}
                    onChange={(event) => setSortMode(event.target.value as typeof sortMode)}
                    style={{
                      background: "transparent",
                      color: COLORS.text,
                      border: "none",
                      outline: "none",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="name-asc">Name A-Z</option>
                    <option value="name-desc">Name Z-A</option>
                  </select>
                </label>

                {hasFilters && (
                  <button
                    onClick={() => {
                      setQuery("");
                      setSortMode("name-asc");
                    }}
                    style={softButtonStyle}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            {error ? (
              <div style={{ ...panelStyle, padding: 18, background: "rgba(248,113,113,0.08)", marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#ffd1d1" }}>Unable to load users</div>
                <div style={{ fontSize: 13, color: "#f7b4b4", lineHeight: 1.6 }}>{error}</div>
              </div>
            ) : null}

            <div style={{ overflowX: "auto", overflowY: "auto", minHeight: 0, maxHeight: 620, paddingRight: 4 }}>
              <table style={{ width: "100%", minWidth: 900, borderCollapse: "separate", borderSpacing: 0, fontSize: 12 }}>
                <thead>
                  <tr>
                    {["User", "Email", "Phone", "Location", "Joined", "Status", "Verification", "Actions"].map((heading) => (
                      <th
                        key={heading}
                        style={{
                          textAlign: "left",
                          color: COLORS.muted,
                          fontWeight: 600,
                          fontSize: 11,
                          padding: "12px 12px",
                          borderBottom: `1px solid ${COLORS.cardBorder}`,
                          whiteSpace: "nowrap",
                          position: "sticky",
                          top: 0,
                          background: "rgba(24,26,35,0.98)",
                          backdropFilter: "blur(12px)",
                          zIndex: 1,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                        }}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} style={{ padding: "26px 10px" }}>
                        <div style={{ display: "grid", gap: 12 }}>
                          {[...Array(4)].map((_, index) => (
                            <div key={index} style={{ height: 54, borderRadius: 14, background: "linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.08), rgba(255,255,255,0.04))", backgroundSize: "200% 100%", animation: "pulse 1.4s ease-in-out infinite" }} />
                          ))}
                        </div>
                      </td>
                    </tr>
                  ) : sortedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: "42px 10px" }}>
                        <div style={{ textAlign: "center", color: COLORS.muted }}>
                          <div style={{ width: 64, height: 64, borderRadius: "50%", margin: "0 auto 14px", background: "rgba(255,255,255,0.05)", display: "grid", placeItems: "center", color: COLORS.cyan }}>
                            <Users2 size={28} />
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, marginBottom: 6 }}>No users match your filters</div>
                          <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                            {hasFilters ? "Try clearing the search or sort filter to see the full directory." : "The directory is empty right now."}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sortedUsers.map((user) => {
                      const isActive = user.is_active !== false;
                      const isVerified = getVerificationStatus(user) === "verified";

                      return (
                        <tr key={user.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                          <td style={{ padding: "14px 12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                              <div style={{ width: 34, height: 34, borderRadius: "50%", background: COLORS.accentGrad, display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0, boxShadow: "0 8px 20px rgba(124,92,252,0.22)" }}>
                                {getInitial(user)}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ color: COLORS.text, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>{getDisplayName(user)}</div>
                                <div style={{ color: COLORS.muted, fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>{user.username || "—"}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "14px 12px", color: COLORS.text, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email || "—"}</td>
                          <td style={{ padding: "14px 12px", color: COLORS.text, whiteSpace: "nowrap" }}>{user.phone_number || "—"}</td>
                          <td style={{ padding: "14px 12px", color: COLORS.text, whiteSpace: "nowrap" }}>
                            {user.city || "—"}
                            {user.occupation && <div style={{ fontSize: 11, color: COLORS.muted, whiteSpace: "nowrap" }}>{user.occupation}</div>}
                          </td>
                          <td style={{ padding: "14px 12px", color: COLORS.muted, whiteSpace: "nowrap" }}>{formatDate(user.created_at)}</td>
                          <td style={{ padding: "14px 12px" }}>
                            <Chip tone={isActive ? "green" : "rose"}>{isActive ? "Active" : "Inactive"}</Chip>
                          </td>
                          <td style={{ padding: "14px 12px" }}>
                            <Chip tone={isVerified ? "cyan" : "neutral"}>{getVerificationLabel(user)}</Chip>
                          </td>
                          <td style={{ padding: "14px 10px" }}>
                            <UserActionsMenu
                              user={user}
                              isActive={isActive}
                              isVerified={isVerified}
                              isSaving={savingId === user.id}
                              isDeleting={deletingId === user.id}
                              onEdit={() => openEdit(user)}
                              onToggleSuspend={() => toggleSuspend(user)}
                              onToggleVerified={() => toggleVerified(user)}
                              onRemoveVerifiedTag={() => removeVerifiedTag(user)}
                              onDelete={() => deleteUser(user)}
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {selectedUser && draft && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(3,6,12,0.72)", backdropFilter: "blur(12px)", display: "grid", placeItems: "center", padding: 20, zIndex: 50 }}>
          <div style={{ width: "100%", maxWidth: 860, background: "rgba(24,26,35,0.98)", border: `1px solid ${COLORS.cardBorder}`, borderRadius: 24, padding: 20, boxShadow: "0 32px 100px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", gap: 16, marginBottom: 18, alignItems: isMobile ? "stretch" : "flex-start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: 18, background: COLORS.accentGrad, display: "grid", placeItems: "center", boxShadow: "0 14px 28px rgba(124,92,252,0.25)" }}>
                  {getInitial(selectedUser)}
                </div>
                <div>
                  <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.18em" }}>Edit User</div>
                  <h2 style={{ margin: "4px 0 6px", fontSize: 24 }}>{getDisplayName(selectedUser)}</h2>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Chip>{`Joined ${formatDate(selectedUser.created_at)}`}</Chip>
                    <Chip tone="cyan">{getVerificationLabel(selectedUser)}</Chip>
                    <Chip tone={selectedUser.is_active === false ? "rose" : "green"}>{selectedUser.is_active === false ? "Inactive" : "Active"}</Chip>
                  </div>
                </div>
              </div>
              <button
                onClick={closeEdit}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  border: `1px solid ${COLORS.cardBorder}`,
                  background: "rgba(255,255,255,0.05)",
                  color: COLORS.text,
                  cursor: "pointer",
                  alignSelf: isMobile ? "flex-end" : "flex-start",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.2fr 0.8fr", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                {EDITABLE_FIELDS.map((field) => (
                  <label key={field.key} style={{ display: "grid", gap: 7 }}>
                    <span style={{ fontSize: 12, color: COLORS.muted }}>{field.label}</span>
                    <input
                      value={draft[field.key]}
                      onChange={(event) => setDraft((current) => (current ? { ...current, [field.key]: event.target.value } : current))}
                      style={{
                        borderRadius: 14,
                        border: `1px solid ${COLORS.cardBorder}`,
                        background: "rgba(255,255,255,0.04)",
                        color: COLORS.text,
                        padding: "12px 14px",
                        outline: "none",
                        fontSize: 13,
                      }}
                    />
                  </label>
                ))}

                <label style={{ display: "grid", gap: 7 }}>
                  <span style={{ fontSize: 12, color: COLORS.muted }}>Account state</span>
                  <select
                    value={draft.is_active ? "active" : "inactive"}
                    onChange={(event) => setDraft((current) => (current ? { ...current, is_active: event.target.value === "active" } : current))}
                    style={{
                      borderRadius: 14,
                      border: `1px solid ${COLORS.cardBorder}`,
                      background: "rgba(255,255,255,0.04)",
                      color: COLORS.text,
                      padding: "12px 14px",
                      outline: "none",
                      fontSize: 13,
                    }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>

                <label style={{ display: "grid", gap: 7 }}>
                  <span style={{ fontSize: 12, color: COLORS.muted }}>Verification status</span>
                  <select
                    value={draft.verification_status}
                    onChange={(event) => setDraft((current) => (current ? { ...current, verification_status: event.target.value } : current))}
                    style={{
                      borderRadius: 14,
                      border: `1px solid ${COLORS.cardBorder}`,
                      background: "rgba(255,255,255,0.04)",
                      color: COLORS.text,
                      padding: "12px 14px",
                      outline: "none",
                      fontSize: 13,
                    }}
                  >
                    <option value="verified">verified</option>
                    <option value="unverified">unverified</option>
                    <option value="pending">pending</option>
                  </select>
                </label>
              </div>

              <aside style={{ ...panelStyle, padding: 16, alignSelf: "start" }}>
                <div style={{ fontSize: 12, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 10 }}>Profile Snapshot</div>
                <div style={{ display: "grid", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 4 }}>Username</div>
                    <div style={{ fontSize: 13, color: COLORS.text }}>{selectedUser.username || "No username"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 4 }}>Email</div>
                    <div style={{ fontSize: 13, color: COLORS.text, wordBreak: "break-word" }}>{selectedUser.email || "No email"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 4 }}>Phone</div>
                    <div style={{ fontSize: 13, color: COLORS.text }}>{selectedUser.phone_number || "No phone"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 4 }}>Location</div>
                    <div style={{ fontSize: 13, color: COLORS.text }}>
                      {selectedUser.city || "No city"} {selectedUser.occupation ? `· ${selectedUser.occupation}` : ""}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 4 }}>Profile ID</div>
                    <div style={{ fontSize: 13, color: COLORS.text }}>{selectedUser.profile_id}</div>
                  </div>
                </div>
              </aside>
            </div>

            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", gap: 12, marginTop: 18 }}>
              <div style={{ fontSize: 12, color: COLORS.muted }}>ID {selectedUser.id}</div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  onClick={closeEdit}
                  style={{
                    border: `1px solid ${COLORS.cardBorder}`,
                    background: "rgba(255,255,255,0.05)",
                    color: COLORS.text,
                    borderRadius: 14,
                    padding: "12px 16px",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={savingId === selectedUser.id}
                  style={{
                    border: "none",
                    background: COLORS.accentGrad,
                    color: "#fff",
                    borderRadius: 14,
                    padding: "12px 16px",
                    cursor: "pointer",
                    fontWeight: 700,
                    boxShadow: "0 12px 28px rgba(124,92,252,0.25)",
                  }}
                >
                  {savingId === selectedUser.id ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes pulse {
          0% { background-position: 0% 50%; opacity: 0.75; }
          50% { background-position: 100% 50%; opacity: 1; }
          100% { background-position: 0% 50%; opacity: 0.75; }
        }
      `}</style>
    </div>
  );
}

export default AdminUsers;
