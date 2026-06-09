import { appConfig } from '../config/appConfig';

type AnalyticsEvent = {
  name: string;
  properties?: Record<string, unknown>;
  timestamp: string;
  path?: string;
  userId?: string | null;
};

const ANALYTICS_QUEUE_KEY = 'junto-analytics-queue';

function readQueue(): AnalyticsEvent[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(ANALYTICS_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: AnalyticsEvent[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ANALYTICS_QUEUE_KEY, JSON.stringify(queue.slice(-100)));
}

function dispatchToBrowserAnalytics(event: AnalyticsEvent): void {
  const dataLayer = (window as any).dataLayer;
  if (Array.isArray(dataLayer)) {
    dataLayer.push({ event: event.name, ...event.properties });
  }

  const gtag = (window as any).gtag;
  if (typeof gtag === 'function') {
    gtag('event', event.name, event.properties || {});
  }
}

function sendBeacon(event: AnalyticsEvent): void {
  if (!appConfig.analyticsEndpoint) {
    return;
  }

  const payload = JSON.stringify({
    ...event,
    app: appConfig.appName,
    url: window.location.href,
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon(appConfig.analyticsEndpoint, new Blob([payload], { type: 'application/json' }));
    return;
  }

  void fetch(appConfig.analyticsEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}

export function trackEvent(name: string, properties: Record<string, unknown> = {}, userId?: string | null): void {
  if (typeof window === 'undefined') return;

  const event: AnalyticsEvent = {
    name,
    properties,
    timestamp: new Date().toISOString(),
    path: window.location.pathname,
    userId: userId || null,
  };

  const nextQueue = [...readQueue(), event];
  writeQueue(nextQueue);

  if (!appConfig.analyticsEnabled) {
    return;
  }

  dispatchToBrowserAnalytics(event);
  sendBeacon(event);
}

export function trackPageView(path: string, title?: string, userId?: string | null): void {
  trackEvent('page_view', { path, title: title || document.title }, userId);
}

export function flushAnalyticsQueue(): void {
  if (typeof window === 'undefined' || !appConfig.analyticsEndpoint) return;

  const queued = readQueue();
  if (queued.length === 0) return;

  queued.forEach((event) => sendBeacon(event));
  writeQueue([]);
}

