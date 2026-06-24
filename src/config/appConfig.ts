type EnvValue = string | undefined;

function readEnv(key: string): EnvValue {
  const value = (import.meta.env as Record<string, unknown>)[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function parseBoolean(value: EnvValue, defaultValue = false): boolean {
  if (value === undefined) {
    return defaultValue;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function parseJsonRecord(value: EnvValue): Record<string, boolean> {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return Object.entries(parsed).reduce<Record<string, boolean>>((acc, [key, flag]) => {
        acc[key] = Boolean(flag);
        return acc;
      }, {});
    }
  } catch {
    // Ignore malformed flag JSON and fall back to defaults.
  }

  return {};
}

function normalizeUrl(value: EnvValue, fallback: string): string {
  if (!value) {
    return fallback;
  }

  return value.replace(/\/+$/, '');
}

function deriveWebSocketUrl(apiBaseUrl: string): string | undefined {
  try {
    const resolved = new URL(apiBaseUrl, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    const protocol = resolved.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${resolved.host}`;
  } catch {
    return undefined;
  }
}

const apiBaseUrl = normalizeUrl(readEnv('VITE_API_BASE_URL'), '/api');

export const appConfig = {
  appName: readEnv('VITE_APP_NAME') || 'Wantuu',
  appDescription:
    readEnv('VITE_APP_DESCRIPTION') || 'Wantuu helps people discover events, nearby people, messages, and travel plans in one place.',
  apiBaseUrl,
  adminSetupKey: readEnv('VITE_ADMIN_SETUP_KEY') || '',
  wsUrl: readEnv('VITE_WS_URL') || deriveWebSocketUrl(apiBaseUrl),
  releaseVersion: readEnv('VITE_RELEASE_VERSION') || readEnv('VITE_APP_VERSION') || 'development',
  buildSha: readEnv('VITE_BUILD_SHA') || readEnv('VITE_COMMIT_SHA') || '',
  deploymentChannel: readEnv('VITE_DEPLOYMENT_CHANNEL') || (import.meta.env.PROD ? 'production' : 'development'),
  analyticsEndpoint: readEnv('VITE_ANALYTICS_ENDPOINT'),
  analyticsEnabled: parseBoolean(readEnv('VITE_ENABLE_ANALYTICS'), Boolean(readEnv('VITE_ANALYTICS_ENDPOINT'))),
  crashReportingEndpoint: readEnv('VITE_CRASH_REPORT_ENDPOINT'),
  crashReportingEnabled: parseBoolean(
    readEnv('VITE_ENABLE_CRASH_REPORTING'),
    Boolean(readEnv('VITE_CRASH_REPORT_ENDPOINT'))
  ),
  featureFlags: parseJsonRecord(readEnv('VITE_FEATURE_FLAGS_JSON')),
  vapidPublicKey: readEnv('VITE_VAPID_PUBLIC_KEY') || readEnv('VITE_PUBLIC_KEY') || '',
  themeColor: readEnv('VITE_THEME_COLOR') || '#0f0f13',
};

export function getApiBaseCandidates(): string[] {
  const candidates = new Set<string>();

  if (appConfig.apiBaseUrl) {
    candidates.add(appConfig.apiBaseUrl);
  }

  if (typeof window !== 'undefined') {
    candidates.add('/api');
    candidates.add(`${window.location.origin}/api`);
  }

  candidates.add('http://localhost:5000/api');

  return Array.from(candidates).filter(Boolean);
}

export function getFeatureFlag(flagName: string, defaultValue = false): boolean {
  if (flagName in appConfig.featureFlags) {
    return appConfig.featureFlags[flagName];
  }

  const stored = typeof window !== 'undefined' ? window.localStorage.getItem(`junto-flag-${flagName}`) : null;
  if (stored === 'true') return true;
  if (stored === 'false') return false;

  return defaultValue;
}

export function setFeatureFlag(flagName: string, enabled: boolean): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(`junto-flag-${flagName}`, enabled ? 'true' : 'false');
}

export function getExperimentVariant(experimentName: string, variants: string[] = ['A', 'B']): string {
  if (typeof window === 'undefined' || variants.length === 0) {
    return variants[0] || 'A';
  }

  const storageKey = `junto-exp-${experimentName}`;
  const stored = window.localStorage.getItem(storageKey);
  if (stored && variants.includes(stored)) {
    return stored;
  }

  const stableSeed = Array.from(experimentName).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const assigned = variants[stableSeed % variants.length];
  window.localStorage.setItem(storageKey, assigned);
  return assigned;
}
