import { appConfig } from '../config/appConfig';

type CrashReport = {
  message: string;
  stack?: string;
  name?: string;
  path?: string;
  timestamp: string;
  url?: string;
  userAgent?: string;
};

const CRASH_QUEUE_KEY = 'junto-crash-queue';

export type QueuedCrashReport = CrashReport;

function readQueue(): CrashReport[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(CRASH_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getQueuedCrashReports(): CrashReport[] {
  return readQueue();
}

function writeQueue(queue: CrashReport[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CRASH_QUEUE_KEY, JSON.stringify(queue.slice(-50)));
}

function sendCrashReport(report: CrashReport): void {
  if (!appConfig.crashReportingEndpoint || !appConfig.crashReportingEnabled) {
    return;
  }

  const payload = JSON.stringify({
    ...report,
    app: appConfig.appName,
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon(appConfig.crashReportingEndpoint, new Blob([payload], { type: 'application/json' }));
    return;
  }

  void fetch(appConfig.crashReportingEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}

export function reportError(error: unknown, context?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;

  const normalized = error instanceof Error ? error : new Error(String(error));
  const report: CrashReport = {
    message: normalized.message,
    name: normalized.name,
    stack: normalized.stack,
    path: window.location.pathname,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: window.navigator.userAgent,
  };

  const nextQueue = [...readQueue(), report];
  writeQueue(nextQueue);

  if (context) {
    console.error('Crash context:', context);
  }

  sendCrashReport(report);
}

export function flushCrashReports(): void {
  if (typeof window === 'undefined' || !appConfig.crashReportingEndpoint || !appConfig.crashReportingEnabled) return;

  const queued = readQueue();
  if (queued.length === 0) return;

  queued.forEach((report) => sendCrashReport(report));
  writeQueue([]);
}
