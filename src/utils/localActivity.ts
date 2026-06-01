const LOCAL_NOTIFICATIONS_KEY = 'junto-local-notifications';
const EVENT_ACTIVITY_KEY = 'junto-event-activity';
const TRAVEL_SEARCHES_KEY = 'junto-travel-mode-searches';
const SAFETY_REPORT_QUEUE_KEY = 'junto-safety-reports';
const BLOCKED_USERS_KEY = 'junto-blocked-users';
const LOCAL_ACTIVITY_EVENT = 'junto-local-activity-updated';

export type LocalNotification = {
  id: string;
  recipientUserId?: string;
  type: 'interest' | 'message' | 'application' | 'system' | 'event';
  title: string;
  description: string;
  createdAt: string;
  read?: boolean;
  eventId?: string;
  source?: string;
};

export type EventActivity = {
  id: string;
  eventId: string;
  title: string;
  detail: string;
  type: 'application' | 'status' | 'update' | 'review';
  createdAt: string;
  actorName?: string;
  targetName?: string;
};

export type TravelSearchRecord = {
  id: string;
  city: string;
  eventType: string;
  label?: string;
  createdAt: string;
  lastUsedAt: string;
};

export type SafetyEvidenceAttachment = {
  name: string;
  type: string;
  size: number;
  previewUrl?: string;
  dataUrl?: string;
};

export type SafetyReportCase = {
  id: string;
  reporterUserId: string;
  targetUserId: string;
  targetUserName: string;
  reportType: string;
  description: string;
  evidence: SafetyEvidenceAttachment[];
  status: 'submitted' | 'under_review' | 'resolved' | 'needs_follow_up';
  createdAt: string;
  updatedAt: string;
  reviewNote?: string;
};

export type BlockedUserRecord = {
  id: string;
  name: string;
  reason?: string;
  blockedAt?: string;
};

function notifyLocalActivityUpdate() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(LOCAL_ACTIVITY_EVENT));
}

export function readLocalNotifications(): LocalNotification[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(LOCAL_NOTIFICATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendLocalNotification(notification: LocalNotification): LocalNotification[] {
  if (typeof window === 'undefined') return [];

  const nextNotifications = [
    notification,
    ...readLocalNotifications().filter((existing) => existing.id !== notification.id),
  ].slice(0, 100);

  window.localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(nextNotifications));
  notifyLocalActivityUpdate();
  return nextNotifications;
}

export function markLocalNotificationRead(notificationId: string): LocalNotification[] {
  if (typeof window === 'undefined') return [];

  const nextNotifications = readLocalNotifications().map((notification) =>
    notification.id === notificationId ? { ...notification, read: true } : notification
  );

  window.localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(nextNotifications));
  notifyLocalActivityUpdate();
  return nextNotifications;
}

export function deleteLocalNotification(notificationId: string): LocalNotification[] {
  if (typeof window === 'undefined') return [];

  const nextNotifications = readLocalNotifications().filter((notification) => notification.id !== notificationId);
  window.localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(nextNotifications));
  notifyLocalActivityUpdate();
  return nextNotifications;
}

export function readEventActivities(): EventActivity[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(EVENT_ACTIVITY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendEventActivity(activity: EventActivity): EventActivity[] {
  if (typeof window === 'undefined') return [];

  const nextActivities = [
    activity,
    ...readEventActivities().filter((existing) => existing.id !== activity.id),
  ].slice(0, 60);

  window.localStorage.setItem(EVENT_ACTIVITY_KEY, JSON.stringify(nextActivities));
  notifyLocalActivityUpdate();
  return nextActivities;
}

export function readTravelSearches(): TravelSearchRecord[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(TRAVEL_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((search: any) => ({
      id: String(search?.id || `${search?.city || 'city'}-${search?.eventType || 'all'}-${search?.createdAt || Date.now()}`),
      city: String(search?.city || ''),
      eventType: String(search?.eventType || 'all'),
      label: search?.label ? String(search.label) : undefined,
      createdAt: String(search?.createdAt || new Date().toISOString()),
      lastUsedAt: String(search?.lastUsedAt || search?.createdAt || new Date().toISOString()),
    }));
  } catch {
    return [];
  }
}

export function writeTravelSearches(searches: TravelSearchRecord[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TRAVEL_SEARCHES_KEY, JSON.stringify(searches));
  notifyLocalActivityUpdate();
}

export function cleanupTravelSearches(maxAgeDays = 14): TravelSearchRecord[] {
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  const filtered = readTravelSearches().filter((search) => {
    const lastUsed = new Date(search.lastUsedAt || search.createdAt).getTime();
    return Number.isFinite(lastUsed) && lastUsed >= cutoff;
  });

  writeTravelSearches(filtered);
  return filtered;
}

export function readSafetyReportCases(): SafetyReportCase[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(SAFETY_REPORT_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeSafetyReportCases(casesList: SafetyReportCase[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SAFETY_REPORT_QUEUE_KEY, JSON.stringify(casesList));
  notifyLocalActivityUpdate();
}

export function appendSafetyReportCase(reportCase: SafetyReportCase): SafetyReportCase[] {
  if (typeof window === 'undefined') return [];

  const nextCases = [
    reportCase,
    ...readSafetyReportCases().filter((existing) => existing.id !== reportCase.id),
  ].slice(0, 50);

  writeSafetyReportCases(nextCases);
  return nextCases;
}

export function updateSafetyReportCase(reportCaseId: string, updates: Partial<SafetyReportCase>): SafetyReportCase[] {
  if (typeof window === 'undefined') return [];

  const nextCases = readSafetyReportCases().map((entry) =>
    entry.id === reportCaseId ? { ...entry, ...updates, updatedAt: new Date().toISOString() } : entry
  );

  writeSafetyReportCases(nextCases);
  return nextCases;
}

export function readBlockedUserRecords(): BlockedUserRecord[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(BLOCKED_USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeBlockedUserRecords(blockedUsers: BlockedUserRecord[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify(blockedUsers));
  notifyLocalActivityUpdate();
}

export function upsertBlockedUserRecord(entry: BlockedUserRecord): BlockedUserRecord[] {
  if (typeof window === 'undefined') return [];

  const nextBlocked = [
    entry,
    ...readBlockedUserRecords().filter((user) => String(user.id) !== String(entry.id)),
  ].slice(0, 50);

  writeBlockedUserRecords(nextBlocked);
  return nextBlocked;
}

export function removeBlockedUserRecord(blockedUserId: string): BlockedUserRecord[] {
  if (typeof window === 'undefined') return [];

  const nextBlocked = readBlockedUserRecords().filter((user) => String(user.id) !== String(blockedUserId));
  writeBlockedUserRecords(nextBlocked);
  return nextBlocked;
}

export function localActivityEventName(): string {
  return LOCAL_ACTIVITY_EVENT;
}
