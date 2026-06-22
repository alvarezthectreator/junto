import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowUpDown, PencilLine, Search, ShieldCheck, ShieldOff, Trash2, Users2 } from "lucide-react";
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
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getVerificationStatus(user: EditableUser) {
  return String(user.fraud_verification_status || user.verification_status || "").toLowerCase();
}

function withStatusFallback(user: EditableUser, updates: Partial<EditableUser>): EditableUser {
  const merged = { ...user, ...updates };
  const verification_status = String(
    merged.fraud_verification_status || merged.verification_status || user.fraud_verification_status || user.verification_status || "unverified"
  ).toLowerCase();

  return {
    ...merged,
    fraud_verification_status: verification_status,
    verification_status,
  };
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
    return { total: users.length, active, verified };
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
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setSavingId(null);
    }
  };

  const toggleVerified = async (user: EditableUser) => {
    const isVerified = getVerificationStatus(user) === "verified";
    const nextStatus = isVerified ? "unverified" : "verified";
    try {
      setSavingId(user.id);
      syncUser(user.id, { fraud_verification_status: nextStatus, verification_status: nextStatus });
      const response = await updateUserAdminStatus(user.id, {
        verification_status: nextStatus,
      });
      syncUser(user.id, response.user as Partial<EditableUser>);
      appendAdminActivity({
        category: "profile",
        title: "Verification status changed",
        detail: `${getDisplayName(user)} was marked ${nextStatus}.`,
      });
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

  return (
    <div style={{ minHeight: "100vh", width: "100vw", background: COLORS.bg, display: "flex", flexDirection: isMobile ? "column" : "row", color: COLORS.text, overflowX: "hidden" }}>
      <AdminSidebar activePage="admin-users" onNavigate={onNavigate} />

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
              <h1 style={{ margin: 0, fontSize: 26 }}>Registered Users</h1>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", width: isMobile ? "100%" : "auto" }}>
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
              }}
            >
              Refresh
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.04)", border: `1px solid ${COLORS.cardBorder}`, borderRadius: 999, padding: "6px 12px" }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: COLORS.accentGrad, display: "grid", placeItems: "center", color: "#fff", fontWeight: 700 }}>A</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>Admin</div>
                <div style={{ fontSize: 11, color: COLORS.muted }}>User operations</div>
              </div>
            </div>
          </div>
        </div>

        <main style={{ flex: 1, minHeight: 0, padding: isMobile ? 12 : 20, display: "flex", flexDirection: "column", gap: 16, overflow: "hidden auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 14 }}>
            {[
              { label: "Total users", value: stats.total.toLocaleString(), note: "All registered accounts" },
              { label: "Active users", value: stats.active.toLocaleString(), note: "Currently enabled" },
              { label: "Verified users", value: stats.verified.toLocaleString(), note: "Have verified tags" },
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
                <div style={{ fontSize: 14, fontWeight: 600 }}>Registered Users</div>
                <div style={{ fontSize: 11, color: COLORS.muted }}>Scrollable admin table with edit, suspend, verify, delete, and sorting controls.</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end", width: isMobile ? "100%" : "auto" }}>
                <div style={{ position: "relative" }}>
                  <Search size={14} style={{ position: "absolute", left: 10, top: 10, color: COLORS.muted }} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search users"
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
              </div>
            </div>

            <div style={{ overflowX: "auto", overflowY: "auto", minHeight: 0, maxHeight: 560, paddingRight: 4 }}>
              <table style={{ width: "100%", minWidth: 960, borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr>
                    {["User", "Username / Profile", "Email", "Phone", "City", "Occupation", "Joined", "State", "Verification", "Actions"].map((heading) => (
                      <th
                        key={heading}
                        style={{
                          textAlign: "left",
                          color: COLORS.muted,
                          fontWeight: 500,
                          fontSize: 11,
                          padding: "6px 8px",
                          borderBottom: `1px solid ${COLORS.cardBorder}`,
                          whiteSpace: "nowrap",
                          position: "sticky",
                          top: 0,
                          background: COLORS.card,
                          zIndex: 1,
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
                      <td colSpan={10} style={{ padding: "18px 8px", color: COLORS.muted }}>
                        Loading users...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={10} style={{ padding: "18px 8px", color: COLORS.rose }}>
                        {error}
                      </td>
                    </tr>
                  ) : sortedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ padding: "18px 8px", color: COLORS.muted }}>
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    sortedUsers.map((user) => {
                      const isActive = user.is_active !== false;
                      const isVerified = getVerificationStatus(user) === "verified";

                      return (
                        <tr key={user.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                          <td style={{ padding: "10px 8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 28, height: 28, borderRadius: "50%", background: COLORS.accentGrad, display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                                {getInitial(user)}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ color: COLORS.text, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{getDisplayName(user)}</div>
                                <div style={{ color: COLORS.muted, fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.id}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "10px 8px", color: COLORS.muted }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                              <span style={{ color: COLORS.text }}>{user.username || "No username"}</span>
                              <span>{user.profile_id || "No profile ID"}</span>
                            </div>
                          </td>
                          <td style={{ padding: "10px 8px", color: COLORS.text }}>{user.email || "No email"}</td>
                          <td style={{ padding: "10px 8px", color: COLORS.text }}>{user.phone_number || "No phone"}</td>
                          <td style={{ padding: "10px 8px", color: COLORS.text }}>{user.city || "No city"}</td>
                          <td style={{ padding: "10px 8px", color: COLORS.text }}>{user.occupation || "No occupation"}</td>
                          <td style={{ padding: "10px 8px", color: COLORS.muted }}>{formatDate(user.created_at)}</td>
                          <td style={{ padding: "10px 8px" }}>
                            <span style={{ background: isActive ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)", color: isActive ? COLORS.green : COLORS.rose, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>
                              {isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td style={{ padding: "10px 8px" }}>
                            <span style={{ background: isVerified ? "rgba(34,211,238,0.1)" : "rgba(255,255,255,0.06)", color: isVerified ? COLORS.cyan : COLORS.muted, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>
                              {getVerificationStatus(user) || "unverified"}
                            </span>
                          </td>
                          <td style={{ padding: "10px 8px" }}>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                              <button
                                onClick={() => openEdit(user)}
                                disabled={savingId === user.id || deletingId === user.id}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                  background: "rgba(124,92,252,0.16)",
                                  color: "#d8cdfd",
                                  border: `1px solid ${COLORS.cardBorder}`,
                                  borderRadius: 8,
                                  padding: "6px 10px",
                                  fontSize: 11,
                                  cursor: "pointer",
                                }}
                              >
                                <PencilLine size={12} />
                                Edit
                              </button>
                              <button
                                onClick={() => toggleSuspend(user)}
                                disabled={savingId === user.id || deletingId === user.id}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                  background: isActive ? "rgba(248,113,113,0.12)" : "rgba(74,222,128,0.12)",
                                  color: isActive ? COLORS.rose : COLORS.green,
                                  border: `1px solid ${COLORS.cardBorder}`,
                                  borderRadius: 8,
                                  padding: "6px 10px",
                                  fontSize: 11,
                                  cursor: "pointer",
                                }}
                              >
                                {isActive ? <ShieldOff size={12} /> : <ShieldCheck size={12} />}
                                {isActive ? "Suspend" : "Unsuspend"}
                              </button>
                              <button
                                onClick={() => toggleVerified(user)}
                                disabled={savingId === user.id || deletingId === user.id}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                  background: "rgba(34,211,238,0.12)",
                                  color: COLORS.cyan,
                                  border: `1px solid ${COLORS.cardBorder}`,
                                  borderRadius: 8,
                                  padding: "6px 10px",
                                  fontSize: 11,
                                  cursor: "pointer",
                                }}
                              >
                                <Users2 size={12} />
                                {isVerified ? "Remove verified tag" : "Mark verified"}
                              </button>
                              <button
                                onClick={() => removeVerifiedTag(user)}
                                disabled={savingId === user.id || deletingId === user.id}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                  background: "rgba(255,255,255,0.05)",
                                  color: COLORS.muted,
                                  border: `1px solid ${COLORS.cardBorder}`,
                                  borderRadius: 8,
                                  padding: "6px 10px",
                                  fontSize: 11,
                                  cursor: "pointer",
                                }}
                              >
                                Remove tag
                              </button>
                              <button
                                onClick={() => deleteUser(user)}
                                disabled={savingId === user.id || deletingId === user.id}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                  background: "rgba(248,113,113,0.12)",
                                  color: COLORS.rose,
                                  border: `1px solid ${COLORS.cardBorder}`,
                                  borderRadius: 8,
                                  padding: "6px 10px",
                                  fontSize: 11,
                                  cursor: "pointer",
                                }}
                              >
                                <Trash2 size={12} />
                                {deletingId === user.id ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {selectedUser && draft && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "grid", placeItems: "center", padding: 20, zIndex: 50 }}>
          <div style={{ width: "100%", maxWidth: 640, background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 20, padding: 20, boxShadow: "0 30px 80px rgba(0,0,0,0.45)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 13, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.16em" }}>Edit User</div>
                <h2 style={{ margin: "4px 0 0", fontSize: 24 }}>{getDisplayName(selectedUser)}</h2>
              </div>
              <button
                onClick={closeEdit}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border: `1px solid ${COLORS.cardBorder}`,
                  background: "rgba(255,255,255,0.05)",
                  color: COLORS.text,
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
              {EDITABLE_FIELDS.map((field) => (
                <label key={field.key} style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 12, color: COLORS.muted }}>{field.label}</span>
                  <input
                    value={draft[field.key]}
                    onChange={(event) =>
                      setDraft((current) => (current ? { ...current, [field.key]: event.target.value } : current))
                    }
                    style={{
                      borderRadius: 12,
                      border: `1px solid ${COLORS.cardBorder}`,
                      background: "rgba(255,255,255,0.04)",
                      color: COLORS.text,
                      padding: "12px 14px",
                      outline: "none",
                    }}
                  />
                </label>
              ))}

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, color: COLORS.muted }}>Account state</span>
                <select
                  value={draft.is_active ? "active" : "inactive"}
                  onChange={(event) =>
                    setDraft((current) => current ? { ...current, is_active: event.target.value === "active" } : current)
                  }
                  style={{
                    borderRadius: 12,
                    border: `1px solid ${COLORS.cardBorder}`,
                    background: "rgba(255,255,255,0.04)",
                    color: COLORS.text,
                    padding: "12px 14px",
                    outline: "none",
                  }}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, color: COLORS.muted }}>Verification status</span>
                <select
                  value={draft.verification_status}
                  onChange={(event) =>
                    setDraft((current) => current ? { ...current, verification_status: event.target.value } : current)
                  }
                  style={{
                    borderRadius: 12,
                    border: `1px solid ${COLORS.cardBorder}`,
                    background: "rgba(255,255,255,0.04)",
                    color: COLORS.text,
                    padding: "12px 14px",
                    outline: "none",
                  }}
                >
                  <option value="verified">verified</option>
                  <option value="unverified">unverified</option>
                  <option value="pending">pending</option>
                </select>
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 18 }}>
              <div style={{ fontSize: 12, color: COLORS.muted }}>
                Joined {formatDate(selectedUser.created_at)} · ID {selectedUser.id}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={closeEdit}
                  style={{
                    border: `1px solid ${COLORS.cardBorder}`,
                    background: "rgba(255,255,255,0.05)",
                    color: COLORS.text,
                    borderRadius: 12,
                    padding: "12px 16px",
                    cursor: "pointer",
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
                    borderRadius: 12,
                    padding: "12px 16px",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  {savingId === selectedUser.id ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
