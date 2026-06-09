import { appConfig } from '../config/appConfig';
import { flushAnalyticsQueue, trackEvent } from './analytics';
import { flushCrashReports, reportError } from './crashReporting';
import { registerServiceWorker, updateThemeColor } from './pwa';

let hasBootstrapped = false;

export async function bootstrapPlatform(): Promise<void> {
  if (typeof window === 'undefined' || hasBootstrapped) {
    return;
  }

  hasBootstrapped = true;
  updateThemeColor(appConfig.themeColor);

  void registerServiceWorker();
  flushAnalyticsQueue();
  flushCrashReports();

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
