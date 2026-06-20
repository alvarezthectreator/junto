import { appConfig } from '../config/appConfig';
import { healthCheck } from './api';
import { flushAnalyticsQueue, trackEvent } from './analytics';
import { flushCrashReports, reportError } from './crashReporting';
import { clearServiceWorkers, registerServiceWorker, updateThemeColor } from './pwa';

let hasBootstrapped = false;
let healthMonitorTimer: number | null = null;

async function pingBackendHealth(): Promise<void> {
  try {
    const status = await healthCheck();
    if (status && typeof status === 'object') {
      const normalizedStatus = String((status as { status?: unknown }).status || '').toLowerCase();
      if (normalizedStatus && !['ok', 'healthy', 'running', 'up', 'api is running'].includes(normalizedStatus)) {
        trackEvent('backend_health_degraded', { status: normalizedStatus });
      }
    }
  } catch (error) {
    trackEvent('backend_health_failure', {
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function bootstrapPlatform(): Promise<void> {
  if (typeof window === 'undefined' || hasBootstrapped) {
    return;
  }

  hasBootstrapped = true;
  updateThemeColor(appConfig.themeColor);

  if (import.meta.env.DEV) {
    await clearServiceWorkers();
  }

  void registerServiceWorker();
  flushAnalyticsQueue();
  flushCrashReports();
  void pingBackendHealth();

  if (healthMonitorTimer !== null) {
    window.clearInterval(healthMonitorTimer);
  }
  healthMonitorTimer = window.setInterval(() => {
    void pingBackendHealth();
  }, 5 * 60 * 1000);

  window.addEventListener('error', (event) => {
    reportError(event.error || event.message);
  });

  window.addEventListener('unhandledrejection', (event) => {
    reportError(event.reason || 'Unhandled promise rejection');
  });

  window.addEventListener('online', () => {
    flushAnalyticsQueue();
    flushCrashReports();
    trackEvent('network_online');
  });
}
