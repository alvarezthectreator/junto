export type AdminActivityCategory = "login" | "admin" | "profile" | "event" | "moderation" | "system";

export type AdminActivityEntry = {
  id: string;
  category: AdminActivityCategory;
  title: string;
  detail?: string;
  timestamp: string;
};

const STORAGE_KEY = "junto-admin-activity-log";
const MAX_ENTRIES = 120;

function safeRead(): AdminActivityEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((entry) => entry && typeof entry === "object") : [];
  } catch {
    return [];
  }
}

function safeWrite(entries: AdminActivityEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function loadAdminActivityLog(): AdminActivityEntry[] {
  return safeRead();
}

export function appendAdminActivity(entry: Omit<AdminActivityEntry, "id" | "timestamp"> & { timestamp?: string }): AdminActivityEntry {
  const next: AdminActivityEntry = {
    id: createId(),
    timestamp: entry.timestamp || new Date().toISOString(),
    category: entry.category,
    title: entry.title,
    detail: entry.detail,
  };

  const current = safeRead();
  safeWrite([next, ...current]);
  return next;
}

export function clearAdminActivityLog(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
