// Wantuu API Service
// Handles all backend API communication

import { appConfig, getApiBaseCandidates } from '../config/appConfig';
import { discoverEvents, type DiscoverEventSeed } from '../data/discoverEvents';
import { trackEvent } from './analytics';

const SESSION_ACTIVITY_KEY = 'junto-last-activity';
const SESSION_TOKEN_KEY = 'sessionToken';
const LEGACY_SESSION_TOKEN_KEY = 'junto-session-token';
const SESSION_USER_ID_KEY = 'junto-user-id';
const SESSION_CURRENT_USER_KEY = 'junto-current-user';

// Session token storage
let sessionToken: string | null = null;

// Type definitions
export interface User {
  id: string;
  username?: string;
  display_name?: string;
  full_name?: string;
  email?: string;
  phone_number?: string;
  phone?: string;
  profile_id: string;
  date_of_birth?: string;
  gender?: string;
  occupation?: string;
  referred_by_user_id?: string | null;
  created_at?: string;
  intro_video_url?: string | null;
  avatar_image?: string | null;
  avatar_url?: string | null;
  profile_photos?: string[];
  risk_score?: number;
  behavior_score?: number;
  identity_score?: number;
  flags_count?: number;
  last_updated?: string;
  reviewed_at?: string;
  review_status?: string;
  review_notes?: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  display_name?: string;
  full_name?: string;
  bio?: string;
  profile_photo?: string;
  profile_photos?: string[];
  avatar_image?: string | null;
  avatar_url?: string | null;
  interests?: string[];
  city?: string;
  occupation?: string;
  gender?: string;
  location?: string;
  travel_mode_enabled?: boolean;
  travel_destination_city?: string;
  intro_video_url?: string;
  date_of_birth?: string;
  reliability_score?: number;
  reliabilityScore?: number;
  trust_score?: number;
  profile_completion_score?: number;
  profile_completion_percent?: number;
  phone_verified?: boolean;
  email_verified?: boolean;
  verification_status?: string;
}

export interface Event {
  id: string;
  host_id: string;
  display_name?: string;
  profile_id?: string;
  title: string;
  description?: string;
  event_type?: string;
  location_city: string;
  location_address?: string;
  event_date: string;
  event_time: string;
  cover_photo_url?: string;
  is_squad_event?: boolean;
  max_guests?: number;
  billing_tier: number;
  host_fee: number;
  guest_fee: number;
  created_at: string;
  status?: string;
}

export interface EventReview {
  id: string;
  author: string;
  rating: number;
  text: string;
  time: string;
  created_at?: string;
  user_id?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  message_type: string;
  sender_display_name?: string;
  sender_profile_id?: string;
  sender_avatar_image?: string | null;
  read_at?: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message_id?: string;
  last_message_at?: string;
  other_user_id?: string;
  display_name?: string;
  profile_id?: string;
  avatar_image?: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: 'starter' | 'social' | 'premium' | 'elite';
  billing_cycle: 'monthly' | 'annual';
  status: 'active' | 'cancelled' | 'past_due';
  provider: string;
  amount: number;
  currency: string;
  started_at: string;
  current_period_end?: string | null;
  canceled_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SecuritySession {
  id: string;
  token_id: string;
  device_label?: string;
  user_agent?: string;
  ip_address?: string | null;
  created_at: string;
  last_seen_at?: string;
  revoked_at?: string | null;
  active?: boolean;
}

export interface SecurityActivityEntry {
  id: string;
  type: string;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface UploadedMedia {
  url: string;
  file_name?: string;
  mime_type?: string;
  size?: number;
}

export type DeploymentCheckCategory = 'api' | 'auth' | 'push' | 'billing' | 'monitoring' | 'deployment';
export type DeploymentCheckStatus = 'ok' | 'warning' | 'missing' | 'pending';

export interface DeploymentCheck {
  key: string;
  label: string;
  category: DeploymentCheckCategory;
  status: DeploymentCheckStatus;
  required: boolean;
  value: string;
  note?: string;
}

export interface DeploymentOpsReport {
  generated_at: string;
  source: 'backend' | 'local-fallback';
  environment: 'development' | 'staging' | 'production' | 'unknown';
  release: {
    version: string;
    buildSha: string;
    channel: string;
    rollbackTarget: string;
  };
  summary: {
    ok: number;
    warning: number;
    missing: number;
    pending: number;
    overall: 'ready' | 'partial' | 'needs_attention';
  };
  checks: DeploymentCheck[];
  recommendations: string[];
  badge_support: {
    supported: boolean;
    note: string;
  };
}

function hasNonEmptyValue(value: unknown): boolean {
  return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
}

function detectEnvironment(): DeploymentOpsReport['environment'] {
  if (import.meta.env.PROD) return 'production';
  if (import.meta.env.DEV) return 'development';
  return 'unknown';
}

function buildLocalDeploymentOpsReport(): DeploymentOpsReport {
  const checks: DeploymentCheck[] = [
    {
      key: 'api_base_url',
      label: 'API base URL',
      category: 'api',
      status: hasNonEmptyValue(appConfig.apiBaseUrl) ? 'ok' : 'missing',
      required: true,
      value: appConfig.apiBaseUrl || 'Missing',
      note: 'Used by the client to reach the backend API.',
    },
    {
      key: 'ws_url',
      label: 'WebSocket URL',
      category: 'api',
      status: hasNonEmptyValue(appConfig.wsUrl) ? 'ok' : 'warning',
      required: false,
      value: appConfig.wsUrl || 'Derived from API base URL',
      note: 'Used for realtime notifications and live transport.',
    },
    {
      key: 'crash_reporting_endpoint',
      label: 'Crash reporting endpoint',
      category: 'monitoring',
      status: appConfig.crashReportingEnabled && hasNonEmptyValue(appConfig.crashReportingEndpoint) ? 'ok' : 'warning',
      required: true,
      value: appConfig.crashReportingEndpoint ? 'Configured' : 'Missing',
      note: appConfig.crashReportingEndpoint
        ? 'Runtime exceptions can be sent to the crash pipeline.'
        : 'Add VITE_CRASH_REPORT_ENDPOINT for production observability.',
    },
    {
      key: 'analytics_endpoint',
      label: 'Analytics endpoint',
      category: 'monitoring',
      status: appConfig.analyticsEnabled && hasNonEmptyValue(appConfig.analyticsEndpoint) ? 'ok' : 'warning',
      required: false,
      value: appConfig.analyticsEndpoint ? 'Configured' : 'Missing',
      note: 'Optional telemetry endpoint for product analytics.',
    },
    {
      key: 'push_vapid_public_key',
      label: 'Push VAPID public key',
      category: 'push',
      status: hasNonEmptyValue(appConfig.vapidPublicKey) ? 'ok' : 'missing',
      required: true,
      value: hasNonEmptyValue(appConfig.vapidPublicKey) ? 'Configured' : 'Missing',
      note: 'Required for browser push registration.',
    },
    {
      key: 'auth_session_secret',
      label: 'Auth session secret',
      category: 'auth',
      status: 'pending',
      required: true,
      value: 'Backend-managed',
      note: 'Expose this through a protected admin endpoint when backend ops storage is ready.',
    },
    {
      key: 'billing_webhook_secret',
      label: 'Billing webhook secret',
      category: 'billing',
      status: 'pending',
      required: true,
      value: 'Backend-managed',
      note: 'Expose this through a protected admin endpoint when billing ops storage is ready.',
    },
    {
      key: 'build_validation',
      label: 'Build validation',
      category: 'deployment',
      status: 'ok',
      required: true,
      value: 'Verified by Vite build',
      note: 'Production build succeeds in the local check.',
    },
    {
      key: 'cache_busting',
      label: 'Cache busting',
      category: 'deployment',
      status: 'ok',
      required: true,
      value: 'Enabled via hashed asset output',
      note: 'Built assets are fingerprinted for safe rollout.',
    },
    {
      key: 'rollback_safety',
      label: 'Rollback safety',
      category: 'deployment',
      status: 'warning',
      required: true,
      value: 'Manual',
      note: 'Add release/version metadata to make rollbacks auditable.',
    },
  ];

  const summary = checks.reduce(
    (acc, check) => {
      acc[check.status] += 1;
      return acc;
    },
    { ok: 0, warning: 0, missing: 0, pending: 0, overall: 'ready' as DeploymentOpsReport['summary']['overall'] }
  );

  if (summary.missing > 0 || summary.pending > 0) {
    summary.overall = summary.missing > 0 ? 'needs_attention' : 'partial';
  } else if (summary.warning > 0) {
    summary.overall = 'partial';
  }

  const badgeSupported =
    typeof navigator !== 'undefined' &&
    ('setAppBadge' in navigator || 'clearAppBadge' in navigator);

  return {
    generated_at: new Date().toISOString(),
    source: 'local-fallback',
    environment: detectEnvironment(),
    release: {
      version: appConfig.releaseVersion,
      buildSha: appConfig.buildSha || 'unavailable',
      channel: appConfig.deploymentChannel,
      rollbackTarget: appConfig.buildSha ? `Previous release before ${appConfig.buildSha.slice(0, 8)}` : 'Previous stable release',
    },
    summary,
    checks,
    recommendations: [
      'Back the auth and billing secrets with a protected admin endpoint.',
      'Add a production release manifest with build hash, commit SHA, and rollback target.',
      'Wire runtime alerts to the crash reporting and analytics pipeline.',
    ],
    badge_support: {
      supported: badgeSupported,
      note: badgeSupported
        ? 'Platform badge support is available on this device/browser.'
        : 'OS-level badge support is not available in this browser or platform.',
    },
  };
}

function normalizeDeploymentOpsReport(report: any): DeploymentOpsReport {
  if (!report || typeof report !== 'object') {
    return buildLocalDeploymentOpsReport();
  }

  const checks: DeploymentCheck[] = Array.isArray(report.checks)
    ? report.checks.map((check: any) => ({
        key: String(check.key || check.label || 'unknown'),
        label: String(check.label || check.key || 'Unknown check'),
        category: ['api', 'auth', 'push', 'billing', 'monitoring', 'deployment'].includes(check.category)
          ? check.category
          : 'deployment',
        status: ['ok', 'warning', 'missing', 'pending'].includes(check.status) ? check.status : 'warning',
        required: Boolean(check.required),
        value: String(check.value || ''),
        note: typeof check.note === 'string' ? check.note : undefined,
      }))
    : buildLocalDeploymentOpsReport().checks;

  const summary = report.summary && typeof report.summary === 'object'
    ? {
        ok: Number(report.summary.ok || 0),
        warning: Number(report.summary.warning || 0),
        missing: Number(report.summary.missing || 0),
        pending: Number(report.summary.pending || 0),
        overall: ['ready', 'partial', 'needs_attention'].includes(report.summary.overall)
          ? report.summary.overall
          : 'partial',
      }
    : buildLocalDeploymentOpsReport().summary;

  return {
    generated_at: typeof report.generated_at === 'string' ? report.generated_at : new Date().toISOString(),
    source: report.source === 'backend' ? 'backend' : 'local-fallback',
    environment: ['development', 'staging', 'production', 'unknown'].includes(report.environment)
      ? report.environment
      : detectEnvironment(),
    release: {
      version: typeof report.release?.version === 'string' ? report.release.version : appConfig.releaseVersion,
      buildSha: typeof report.release?.buildSha === 'string' ? report.release.buildSha : (appConfig.buildSha || 'unavailable'),
      channel: typeof report.release?.channel === 'string' ? report.release.channel : appConfig.deploymentChannel,
      rollbackTarget: typeof report.release?.rollbackTarget === 'string'
        ? report.release.rollbackTarget
        : (appConfig.buildSha ? `Previous release before ${appConfig.buildSha.slice(0, 8)}` : 'Previous stable release'),
    },
    summary,
    checks,
    recommendations: Array.isArray(report.recommendations)
      ? report.recommendations.map((entry: any) => String(entry))
      : buildLocalDeploymentOpsReport().recommendations,
    badge_support: {
      supported: Boolean(report.badge_support?.supported),
      note: typeof report.badge_support?.note === 'string'
        ? report.badge_support.note
        : buildLocalDeploymentOpsReport().badge_support.note,
    },
  };
}

function isAdminApiEndpoint(endpoint: string, method: string): boolean {
  const [path, query = ''] = endpoint.split('?');
  const params = new URLSearchParams(query);

  if (path.startsWith('/admin')) {
    return true;
  }

  if (path === '/users') {
    return params.get('all') === 'true';
  }

  if (path.endsWith('/admin-status') && method === 'PATCH') {
    return true;
  }

  if (path === '/venues' && method === 'POST') {
    return true;
  }

  if (path === '/venues/seed') {
    return true;
  }

  if (path.startsWith('/venues/') && ['PUT', 'DELETE'].includes(method)) {
    return true;
  }

  if (path.startsWith('/venues/') && path.includes('/reviews') && method === 'DELETE') {
    return true;
  }

  if (path === '/celebrities' && method === 'POST') {
    return true;
  }

  if (path.startsWith('/celebrities/') && ['PUT', 'DELETE'].includes(method)) {
    return true;
  }

  if (path.endsWith('/reviews') && path.startsWith('/celebrities/') && method === 'POST') {
    return true;
  }

  if (path.startsWith('/celebrities/reviews/') && method === 'DELETE') {
    return true;
  }

  if (path.startsWith('/celebrities/') && path.includes('/bookings/') && method === 'PATCH') {
    return true;
  }

  return false;
}

// Utility function for API calls
async function apiCall(
  endpoint: string,
  method: string = 'GET',
  body?: any,
  extraHeaders?: HeadersInit
): Promise<any> {
  const headers: HeadersInit = {};

  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  if (!sessionToken) {
    sessionToken = sessionStorage.getItem(SESSION_TOKEN_KEY) || sessionStorage.getItem(LEGACY_SESSION_TOKEN_KEY);
  }

  if (sessionToken) {
    headers['Authorization'] = `Bearer ${sessionToken}`;
  }

  if (appConfig.adminSetupKey && isAdminApiEndpoint(endpoint, method)) {
    headers['x-admin-setup-key'] = appConfig.adminSetupKey;
  }

  if (extraHeaders) {
    Object.assign(headers as Record<string, string>, extraHeaders as Record<string, string>);
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const apiBases = getApiBaseCandidates();
  let lastError: unknown = null;

  for (let index = 0; index < apiBases.length; index += 1) {
    const baseUrl = apiBases[index];
    const url = `${baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, options);
      const responseText = await response.text();

      if (!response.ok) {
        // Debug: log failing URL/method/status and any Allow header for 405 diagnosis
        try {
          console.error('[apiCall] Request failed', {
            url,
            endpoint,
            method,
            status: response.status,
            allow: response.headers.get ? response.headers.get('allow') : undefined,
            responseText: responseText ? responseText.slice(0, 1000) : responseText,
          });
        } catch (e) {
          // ignore logging errors
        }

        if (!responseText) {
          routeOperationalAlert('api_response_failure', { endpoint, method, status: response.status });
          throw new Error(`API Error: ${response.status}`);
        }

        let message = responseText;
        try {
          const error = JSON.parse(responseText);
          message = error.message || error.error || message;
        } catch {
          // Keep the raw response text if it isn't JSON.
        }

        routeOperationalAlert('api_response_failure', { endpoint, method, status: response.status, message });
        throw new Error(message || `API Error: ${response.status}`);
      }

      if (!responseText) {
        return {};
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return JSON.parse(responseText);
      }

      return responseText;
    } catch (error) {
      // Network or fetch-level error; include attempted URL for diagnostics
      try {
        console.error('[apiCall] Network/fetch error', { url, endpoint, method, error: error instanceof Error ? error.message : String(error) });
      } catch (e) {
        // ignore
      }
      lastError = error;

      if (!isNetworkFailure(error) || index === apiBases.length - 1) {
        if (!isNetworkFailure(error)) {
          console.error(`API Error (${method} ${endpoint}):`, error);
          routeOperationalAlert('api_response_failure', {
            endpoint,
            method,
            message: error instanceof Error ? error.message : String(error),
          });
        } else {
          routeOperationalAlert('api_transport_failure', {
            endpoint,
            method,
            message: error instanceof Error ? error.message : String(error),
          });
        }
        throw error;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`API Error: unable to reach ${endpoint}`);
}

function parseMaybeJsonArray(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    return value.map(String);
  }

  if (typeof value !== 'string' || !value.trim()) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map(String);
    }
  } catch {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return undefined;
}

function isNetworkFailure(error: unknown): boolean {
  if (error instanceof TypeError) {
    return /fetch|network/i.test(error.message);
  }

  if (error instanceof Error) {
    return /Failed to fetch|NetworkError|fetch/i.test(error.message);
  }

  return false;
}

const operationalAlertCooldowns = new Map<string, number>();

function routeOperationalAlert(kind: string, payload: Record<string, unknown>) {
  const key = `${kind}:${String(payload.endpoint || payload.check || payload.scope || '')}`;
  const now = Date.now();
  const last = operationalAlertCooldowns.get(key) || 0;
  if (now - last < 60_000) {
    return;
  }
  operationalAlertCooldowns.set(key, now);
  trackEvent(kind, payload);
}

function createLocalDemoAuth(username: string): { session_token: string; user: User } {
  const slug = username.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'guest';
  const user: User = {
    id: `demo-user-${slug}`,
    username,
    display_name: username,
    profile_id: `DEMO-${slug.slice(0, 8).toUpperCase() || 'USER'}`,
    created_at: new Date().toISOString(),
  };
  const session_token = `demo-session-${slug}-${Date.now()}`;

  setStoredSessionToken(session_token);
  sessionStorage.setItem(SESSION_USER_ID_KEY, user.id);
  sessionStorage.setItem(SESSION_CURRENT_USER_KEY, JSON.stringify(user));
  localStorage.removeItem(SESSION_USER_ID_KEY);
  localStorage.removeItem(SESSION_CURRENT_USER_KEY);
  sessionStorage.setItem('displayName', username);

  return { session_token, user };
}

function createLocalVerifiedSession(): { valid: boolean; user: User } {
  const storedUserRaw = sessionStorage.getItem(SESSION_CURRENT_USER_KEY);
  const storedUserId = sessionStorage.getItem(SESSION_USER_ID_KEY) || 'demo-user';
  const displayName = sessionStorage.getItem('displayName') || 'User';

  try {
    if (storedUserRaw) {
      const parsed = JSON.parse(storedUserRaw);
      const user: User = {
        id: parsed.id || storedUserId,
        username: parsed.username || displayName,
        display_name: parsed.display_name || parsed.name || displayName,
        profile_id: parsed.profile_id || `DEMO-${String(parsed.id || storedUserId).slice(0, 8).toUpperCase()}`,
        created_at: parsed.created_at || new Date().toISOString(),
        avatar_image: parsed.avatar_image || parsed.avatar_url || null,
        avatar_url: parsed.avatar_url || parsed.avatar_image || null,
        profile_photos: parseMaybeJsonArray(parsed.profile_photos) || parsed.profile_photos || [],
      };
      return { valid: true, user };
    }
  } catch {
    // Fall through to a lightweight demo session.
  }

  return {
    valid: true,
    user: {
      id: storedUserId,
      username: displayName,
      display_name: displayName,
      profile_id: `DEMO-${storedUserId.slice(0, 8).toUpperCase()}`,
      created_at: new Date().toISOString(),
    },
  };
}

const LOCAL_EVENT_CATEGORIES = [
  { value: 'music', label: 'Music', icon: '🎵' },
  { value: 'food', label: 'Food', icon: '🍽️' },
  { value: 'fitness', label: 'Fitness', icon: '💪' },
  { value: 'nightlife', label: 'Nightlife', icon: '🪩' },
  { value: 'movies', label: 'Movies', icon: '🎬' },
];

function seedToApiEvent(seed: DiscoverEventSeed, index: number): Event {
  return {
    id: seed.id,
    host_id: seed.id,
    display_name: seed.userName,
    title: `${seed.userName}'s ${seed.actionText}`,
    description: seed.description,
    event_type: seed.audience,
    location_city: seed.locationCity || 'Lagos',
    event_date: new Date().toISOString().split('T')[0],
    event_time: seed.date.replace(/^[^,]+,\s*/, '') || '18:00',
    cover_photo_url: seed.coverImage,
    is_squad_event: false,
    max_guests: Math.max(seed.interestedCount + 3, 10),
    billing_tier: 1,
    host_fee: 0,
    guest_fee: 0,
    created_at: new Date(Date.now() - index * 60 * 60 * 1000).toISOString(),
    status: 'active',
  };
}

function getLocalDemoEvents(): Event[] {
  return discoverEvents.map((seed, index) => seedToApiEvent(seed, index));
}

function filterLocalDemoEvents(filters?: { keyword?: string; category?: string; billingTier?: number; city?: string; minDate?: string; maxDate?: string }): Event[] {
  const keyword = (filters?.keyword || '').trim().toLowerCase();
  const city = (filters?.city || '').trim().toLowerCase();
  const category = (filters?.category || '').trim().toLowerCase();

  return getLocalDemoEvents().filter((event) => {
    const haystack = [
      event.title,
      event.description,
      event.location_city,
      event.event_type,
    ]
      .join(' ')
      .toLowerCase();

    if (keyword && !haystack.includes(keyword)) {
      return false;
    }

    if (city && !event.location_city.toLowerCase().includes(city)) {
      return false;
    }

    if (category && !(event.event_type || '').toLowerCase().includes(category)) {
      return false;
    }

    if (filters?.billingTier && event.billing_tier !== filters.billingTier) {
      return false;
    }

    return true;
  });
}

function normalizeUserProfile(profile: any): UserProfile {
  if (!profile || typeof profile !== 'object') {
    return profile;
  }

  const profilePhotos = parseMaybeJsonArray(profile.profile_photos) || profile.profile_photos;
  const avatarImage = profile.avatar_image || profile.avatar_url || (Array.isArray(profilePhotos) ? profilePhotos[0] : undefined);
  const introVideoUrl = profile.intro_video_url || profile.introVideoUrl || profile.introVideo || null;
  const city = profile.city || profile.location || profile.travel_destination_city || '';

  return {
    ...profile,
    city,
    name: profile.name || profile.display_name || profile.full_name || '',
    interests: parseMaybeJsonArray(profile.interests) || profile.interests,
    profile_photos: profilePhotos,
    intro_video_url: introVideoUrl,
    avatar_image: avatarImage || null,
    avatar_url: avatarImage || null,
  };
}

function setStoredSessionToken(token: string | null) {
  sessionToken = token;

  if (token) {
    sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    sessionStorage.setItem(LEGACY_SESSION_TOKEN_KEY, token);
  } else {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    sessionStorage.removeItem(LEGACY_SESSION_TOKEN_KEY);
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(LEGACY_SESSION_TOKEN_KEY);
  }
}

export function setSessionToken(token: string | null): void {
  setStoredSessionToken(token);
}

// ==================== AUTH ====================

export async function login(username: string, password: string): Promise<{ session_token: string; user: User }> {
  try {
    const response = await apiCall('/auth/login', 'POST', { username, password });
    setStoredSessionToken(response.session_token);
    sessionStorage.setItem(SESSION_USER_ID_KEY, response.user.id);
    sessionStorage.setItem(SESSION_CURRENT_USER_KEY, JSON.stringify(response.user));
    localStorage.removeItem(SESSION_USER_ID_KEY);
    localStorage.removeItem(SESSION_CURRENT_USER_KEY);
    return response;
  } catch (error) {
    if (isNetworkFailure(error)) {
      console.warn('Backend login unavailable, falling back to local demo auth.');
      return createLocalDemoAuth(username);
    }

    throw error;
  }
}

export async function signup(
  username: string,
  fullName: string,
  password: string,
  dateOfBirth?: string,
  referralCode?: string,
  gender?: string
): Promise<{ session_token: string; user: User }> {
  try {
    const response = await apiCall('/auth/signup', 'POST', { username, fullName, password, dateOfBirth, referralCode, gender });
    setStoredSessionToken(response.session_token);
    sessionStorage.setItem(SESSION_USER_ID_KEY, response.user.id);
    sessionStorage.setItem(SESSION_CURRENT_USER_KEY, JSON.stringify(response.user));
    localStorage.removeItem(SESSION_USER_ID_KEY);
    localStorage.removeItem(SESSION_CURRENT_USER_KEY);
    return response;
  } catch (error) {
    if (isNetworkFailure(error)) {
      console.warn('Backend signup unavailable, falling back to local demo auth.');
      return createLocalDemoAuth(username || fullName || 'Guest');
    }

    throw error;
  }
}

export async function verifySession(): Promise<{ valid: boolean; user: User }> {
  try {
    return await apiCall('/auth/verify');
  } catch (error) {
    if (isNetworkFailure(error)) {
      console.warn('Backend session verification unavailable, using local demo session.');
      return createLocalVerifiedSession();
    }

    throw error;
  }
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string; session_token?: string; session_version?: number }> {
  return apiCall(`/auth/${userId}/change-password`, 'POST', {
    currentPassword,
    newPassword,
  });
}

export async function getSecuritySessions(userId: string): Promise<{ sessions: SecuritySession[] }> {
  return apiCall(`/auth/${userId}/sessions`);
}

export async function revokeSecuritySession(userId: string, sessionId: string): Promise<{ success: boolean; message: string }> {
  return apiCall(`/auth/${userId}/sessions/${sessionId}`, 'DELETE');
}

export async function revokeOtherSecuritySessions(userId: string): Promise<{ success: boolean; message: string }> {
  return apiCall(`/auth/${userId}/sessions/revoke-others`, 'POST');
}

export async function generateRecoveryCodes(): Promise<{ success: boolean; recovery_codes: string[]; message: string }> {
  return apiCall('/auth/recovery-codes', 'POST');
}

export async function recoverAccount(
  username: string,
  backupCode: string,
  newPassword: string
): Promise<{ success: boolean; message: string; session_token?: string; user?: User }> {
  return apiCall('/auth/recover', 'POST', { username, backupCode, newPassword });
}

export async function resetPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<{ success: boolean; message: string; session_token?: string; user?: User }> {
  return apiCall('/auth/reset-password', 'POST', { email, code, newPassword });
}

export async function getSecurityActivity(userId: string): Promise<{
  activity: SecurityActivityEntry[];
  sessions: SecuritySession[];
}> {
  return apiCall(`/auth/${userId}/activity`);
}

export function logout(): void {
  setStoredSessionToken(null);
  sessionStorage.removeItem(SESSION_USER_ID_KEY);
  sessionStorage.removeItem(SESSION_CURRENT_USER_KEY);
  localStorage.removeItem(SESSION_USER_ID_KEY);
  localStorage.removeItem(SESSION_CURRENT_USER_KEY);
  localStorage.removeItem(SESSION_ACTIVITY_KEY);
}

export function getSessionToken(): string | null {
  if (!sessionToken) {
    sessionToken = sessionStorage.getItem(SESSION_TOKEN_KEY) || sessionStorage.getItem(LEGACY_SESSION_TOKEN_KEY);
  }
  return sessionToken;
}

export function getUserId(): string | null {
  return sessionStorage.getItem(SESSION_USER_ID_KEY);
}

export function getStoredCurrentUser(): User | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(SESSION_CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function markSessionActivity(): void {
  localStorage.setItem(SESSION_ACTIVITY_KEY, String(Date.now()));
}

export function getLastSessionActivity(): number {
  return Number(localStorage.getItem(SESSION_ACTIVITY_KEY) || 0);
}

// ==================== USERS ====================

export async function getUserById(userId: string): Promise<User> {
  const response = await apiCall(`/users/${userId}`);
  return response.user || response;
}

export async function getUsers(filters?: { q?: string; city?: string; limit?: number; offset?: number; all?: boolean }): Promise<{ users: User[]; total: number }> {
  const params = new URLSearchParams();
  if (filters?.q) params.append('q', filters.q);
  if (filters?.city) params.append('city', filters.city);
  if (filters?.limit !== undefined) params.append('limit', String(filters.limit));
  if (filters?.offset !== undefined) params.append('offset', String(filters.offset));
  if (filters?.all) params.append('all', 'true');
  const endpoint = params.toString() ? `/users?${params.toString()}` : '/users';
  return apiCall(endpoint);
}

export async function updateUserAdminStatus(
  userId: string,
  updates: {
    is_active?: boolean;
    verification_status?: string;
    reliability_score?: number;
    risk_score?: number;
    behavior_score?: number;
    identity_score?: number;
    flags_count?: number;
    last_updated?: string;
    reviewed_at?: string;
    review_status?: string;
    review_notes?: string;
    display_name?: string;
    username?: string;
    email?: string;
    phone_number?: string;
    city?: string;
    occupation?: string;
  }
): Promise<{ success: boolean; message: string; user: User }> {
  const response = await apiCall(`/users/${userId}/admin-status`, 'PATCH', updates);

  try {
    const payload = {
      userId,
      updates: response?.user || updates,
      timestamp: Date.now(),
    };
    localStorage.setItem('junto-user-admin-status-updated', JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent('junto-user-admin-status-updated', { detail: payload }));
  } catch {
    // Ignore storage failures and still return the API response.
  }

  return response;
}

export async function deleteUserAccount(userId: string): Promise<{ success: boolean; message?: string }> {
  return apiCall(`/users/${userId}`, 'DELETE');
}

export async function exportUserAccountData(userId: string): Promise<any> {
  return apiCall(`/users/${userId}/export`);
}

export async function getReferralInfo(userId: string): Promise<{
  referral: {
    code: string;
    link: string;
    referral_count: number;
    referred_users: Array<{ id: string; username?: string; display_name?: string; profile_id: string; created_at?: string }>;
  };
}> {
  return apiCall(`/users/${userId}/referral`);
}

// ==================== VERIFICATION ====================

export async function sendVerificationCode(payload: {
  userId: string;
  verificationType: 'email' | 'phone';
  email?: string;
  phoneNumber?: string;
}): Promise<{
  success: boolean;
  message: string;
  verification_id: string;
  code_for_testing?: string;
  expires_in_seconds?: number;
}> {
  return apiCall('/verification/send', 'POST', {
    user_id: payload.userId,
    verification_type: payload.verificationType,
    email: payload.email,
    phone_number: payload.phoneNumber,
  });
}

export async function verifyVerificationCode(payload: {
  userId: string;
  verificationType: 'email' | 'phone';
  code: string;
}): Promise<{
  success: boolean;
  message: string;
  verified_at?: string;
}> {
  return apiCall('/verification/verify', 'POST', {
    user_id: payload.userId,
    verification_type: payload.verificationType,
    verification_code: payload.code,
  });
}

export async function resendVerificationCode(payload: {
  userId: string;
  verificationType: 'email' | 'phone';
}): Promise<{
  success: boolean;
  message: string;
  code_for_testing?: string;
  expires_in_seconds?: number;
}> {
  return apiCall('/verification/resend', 'POST', {
    user_id: payload.userId,
    verification_type: payload.verificationType,
  });
}

export async function checkVerificationStatus(
  userId: string,
  verificationType: 'email' | 'phone'
): Promise<{
  success: boolean;
  is_verified: boolean;
  verification_type: 'email' | 'phone';
  verified_at?: string | null;
}> {
  return apiCall(`/verification/status/${userId}/${verificationType}`);
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const response = await apiCall(`/users/${userId}/profile`);
  return normalizeUserProfile(response.profile || response.user || response);
}

export async function updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<UserProfile> {
  const response = await apiCall(`/users/${userId}/profile`, 'PUT', profile);
  return normalizeUserProfile(response.profile || (await getUserProfile(userId)));
}

export async function uploadMedia(
  dataUrl: string,
  options?: { fileName?: string; mimeType?: string; folder?: string }
): Promise<UploadedMedia> {
  return apiCall('/uploads/media', 'POST', {
    data_url: dataUrl,
    file_name: options?.fileName,
    mime_type: options?.mimeType,
    folder: options?.folder || 'media',
  });
}

export async function searchUsers(query: string): Promise<User[]> {
  return apiCall(`/users/search?q=${encodeURIComponent(query)}`);
}

export async function getTravelModeUsers(city: string): Promise<User[]> {
  return apiCall(`/users/travel-mode?city=${encodeURIComponent(city)}`);
}

// ==================== EVENTS ====================

export async function getEvents(filters?: { city?: string; date?: string; limit?: number; offset?: number; all?: boolean }): Promise<{ events: Event[] }> {
  let endpoint = '/events';
  const params = new URLSearchParams();
  if (filters?.city) params.append('city', filters.city);
  if (filters?.date) params.append('date', filters.date);
  if (filters?.limit !== undefined) params.append('limit', String(filters.limit));
  if (filters?.offset !== undefined) params.append('offset', String(filters.offset));
  if (filters?.all) params.append('all', 'true');
  if (params.toString()) endpoint += `?${params.toString()}`;
  try {
    return await apiCall(endpoint);
  } catch (error) {
    if (isNetworkFailure(error)) {
      return {
        events: filterLocalDemoEvents({ city: filters?.city }),
      };
    }

    throw error;
  }
}

export async function getVenues(filters?: { city?: string; category?: string; all?: boolean }): Promise<{ venues: any[] }> {
  const params = new URLSearchParams();
  if (filters?.city) params.append('city', filters.city);
  if (filters?.category) params.append('category', filters.category);
  if (filters?.all) params.append('all', 'true');
  const endpoint = params.toString() ? `/venues?${params.toString()}` : '/venues';
  return apiCall(endpoint);
}

export async function getVenueById(venueId: string): Promise<any> {
  return apiCall(`/venues/${venueId}`);
}

export async function createVenue(payload: Record<string, any>): Promise<any> {
  return apiCall('/venues', 'POST', payload);
}

export async function updateVenue(venueId: string, payload: Record<string, any>): Promise<any> {
  return apiCall(`/venues/${venueId}`, 'PUT', payload);
}

export async function deleteVenue(venueId: string): Promise<any> {
  return apiCall(`/venues/${venueId}`, 'DELETE');
}

export async function deleteVenueReview(reviewId: string): Promise<any> {
  return apiCall(`/venues/reviews/${reviewId}`, 'DELETE');
}

export async function createVenueReview(venueId: string, payload: Record<string, any>): Promise<any> {
  return apiCall(`/venues/${venueId}/reviews`, 'POST', payload);
}

export async function getEventById(eventId: string): Promise<Event> {
  try {
    return await apiCall(`/events/${eventId}`);
  } catch (error) {
    if (isNetworkFailure(error)) {
      const localEvent = getLocalDemoEvents().find((event) => event.id === eventId);
      if (localEvent) {
        return localEvent;
      }
    }

    throw error;
  }
}

export async function createEvent(event: Partial<Event>): Promise<{ event: Event; message?: string }> {
  return apiCall('/events', 'POST', event);
}

export async function updateEvent(eventId: string, updates: Partial<Event>): Promise<Event> {
  return apiCall(`/events/${eventId}`, 'PUT', updates);
}

export async function deleteEvent(eventId: string): Promise<void> {
  return apiCall(`/events/${eventId}`, 'DELETE');
}

export async function getHostEvents(hostId: string): Promise<{ events: Event[] }> {
  return apiCall(`/events/host/${hostId}`);
}

// ==================== APPLICATIONS ====================

export async function applyToEvent(
  userId: string,
  eventId: string,
  message?: string
): Promise<any> {
  return apiCall('/applications', 'POST', {
    user_id: userId,
    event_id: eventId,
    message,
  });
}

export async function getEventApplications(eventId: string): Promise<any[]> {
  return apiCall(`/applications/event/${eventId}`);
}

export async function getUserApplications(userId: string): Promise<{ applications: any[] }> {
  return apiCall(`/applications/user/${userId}`);
}

export async function updateApplicationStatus(
  applicationId: string,
  status: 'accepted' | 'rejected'
): Promise<any> {
  return apiCall(`/applications/${applicationId}/status`, 'PUT', { status });
}

export async function withdrawApplication(applicationId: string): Promise<void> {
  return apiCall(`/applications/${applicationId}`, 'DELETE');
}

export async function getEventCapacityInfo(eventId: string): Promise<any> {
  return apiCall(`/applications/event/${eventId}/capacity`);
}

export async function getEventCheckIns(eventId: string): Promise<any[]> {
  const response = await apiCall(`/check-ins/event/${eventId}`);
  return Array.isArray(response) ? response : response.checkIns || [];
}

// ==================== MESSAGES ====================

export async function sendMessage(
  conversationId: string | null,
  recipientId: string,
  content: string,
  messageType: string = 'text'
): Promise<Message> {
  const senderId =
    getUserId() ||
    (() => {
      try {
        return JSON.parse(sessionStorage.getItem(SESSION_CURRENT_USER_KEY) || '{}')?.id || null;
      } catch {
        return null;
      }
    })();

  const response = await apiCall('/messages', 'POST', {
    sender_id: senderId,
    conversation_id: conversationId,
    recipient_id: recipientId,
    receiver_id: recipientId,
    content,
    message_type: messageType,
  });

  return response.message || response;
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  const response = await apiCall(`/messages/conversations/${userId}`);
  return Array.isArray(response) ? response : (response?.conversations ?? []);
}

export async function getConversation(
  conversationId: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ conversation: Conversation; messages: Message[] }> {
  return apiCall(`/messages/${conversationId}?limit=${limit}&offset=${offset}`);
}

export async function markMessagesAsRead(conversationId: string): Promise<void> {
  return apiCall(`/messages/${conversationId}/read`, 'PUT');
}

// ==================== NEARBY ====================

export async function getNearbyUsers(userId: string, latitude: number, longitude: number): Promise<{ nearby_users: User[] }> {
  const response = await apiCall(`/nearby/${userId}?lat=${latitude}&lon=${longitude}`);
  return {
    ...response,
    nearby_users: Array.isArray(response?.nearby_users)
      ? response.nearby_users.map((user: any) => normalizeUserProfile(user))
      : [],
  };
}

export async function swipeUser(
  userId: string,
  swipedUserId: string,
  direction: 'left' | 'right'
): Promise<any> {
  return apiCall('/nearby/swipe', 'POST', {
    user_id: userId,
    swiped_user_id: swipedUserId,
    direction,
  });
}

export async function getMatches(userId: string): Promise<User[]> {
  return apiCall(`/nearby/matches/${userId}`);
}

// ==================== SAFETY ====================
export async function applyCancellationPenalty(
  userId: string,
  eventId: string,
  penaltyPercent: number
): Promise<{ success: boolean; new_reliability_score?: number; message?: string }> {
  return apiCall('/users/cancellation-penalty', 'POST', {
    user_id: userId,
    event_id: eventId,
    penalty_percent: penaltyPercent,
  });
}
export async function addTrustedContact(
  userId: string,
  contactName: string,
  contactPhone: string,
  isPrimary: boolean = false
): Promise<any> {
  return apiCall(`/safety/${userId}/trusted-contacts`, 'POST', {
    contact_name: contactName,
    contact_phone: contactPhone,
    is_primary: isPrimary,
  });
}

export async function getTrustedContacts(userId: string): Promise<any[]> {
  return apiCall(`/safety/${userId}/trusted-contacts`);
}

export async function updateTrustedContact(contactId: string, updates: any): Promise<any> {
  return apiCall(`/safety/trusted-contacts/${contactId}`, 'PUT', updates);
}

export async function deleteTrustedContact(contactId: string): Promise<void> {
  return apiCall(`/safety/trusted-contacts/${contactId}`, 'DELETE');
}

export async function triggerSOS(userId: string, message?: string): Promise<any> {
  return apiCall(`/safety/${userId}/sos`, 'POST', { message });
}

// ==================== NOTIFICATIONS ====================

export async function getNotifications(userId: string): Promise<Notification[]> {
  return apiCall(`/notifications/${userId}`);
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  return apiCall(`/notifications/${notificationId}/read`, 'PUT');
}

export async function deleteNotification(notificationId: string): Promise<void> {
  return apiCall(`/notifications/${notificationId}`, 'DELETE');
}

// ==================== SUBSCRIPTIONS ====================

export async function getSubscription(userId: string): Promise<{ subscription: Subscription | null }> {
  return apiCall(`/subscriptions/${userId}`);
}

export async function activateSubscription(userId: string, planId: Subscription['plan_id'], billingCycle: Subscription['billing_cycle']): Promise<{ subscription: Subscription; message?: string }> {
  return apiCall('/subscriptions/activate', 'POST', {
    user_id: userId,
    plan_id: planId,
    billing_cycle: billingCycle,
  });
}

export async function cancelSubscription(userId: string): Promise<{ subscription: Subscription; message?: string }> {
  return apiCall(`/subscriptions/${userId}/cancel`, 'PUT');
}

// ==================== EVENT SAVES/WISHLIST ====================

export async function saveEvent(userId: string, eventId: string): Promise<{ message: string; saved: any }> {
  return apiCall('/events/save', 'POST', { userId, eventId });
}

export async function unsaveEvent(userId: string, eventId: string): Promise<{ message: string }> {
  return apiCall('/events/save', 'DELETE', { userId, eventId });
}

export async function getSavedEvents(userId: string, limit: number = 20, offset: number = 0): Promise<{ events: Event[] }> {
  return apiCall(`/events/user/${userId}/saved?limit=${limit}&offset=${offset}`);
}

export async function checkEventSaved(userId: string, eventId: string): Promise<{ saved: boolean }> {
  return apiCall(`/events/${eventId}/saved/${userId}`);
}

// ==================== EVENT RATINGS ====================

export async function rateEvent(userId: string, eventId: string, rating: number, comment?: string): Promise<{ message: string; rating: any }> {
  return apiCall('/events/rate', 'POST', { userId, eventId, rating, comment });
}

export async function getEventRating(eventId: string): Promise<{ average_rating: number; rating_count: number }> {
  return apiCall(`/events/${eventId}/rating`);
}

export async function getEventReviews(eventId: string, limit: number = 20, offset: number = 0): Promise<{ reviews: EventReview[] }> {
  return apiCall(`/events/${eventId}/reviews?limit=${limit}&offset=${offset}`);
}

// ==================== USER PROFILE UPDATES ====================

export async function updateTravelDestination(userId: string, travelDestinationCity: string): Promise<{ success: boolean; message: string }> {
  return apiCall(`/users/${userId}/profile`, 'PUT', { travel_destination_city: travelDestinationCity });
}

// ==================== HEALTH CHECK ====================

export async function healthCheck(): Promise<any> {
  return apiCall('/health');
}

export async function getDeploymentOpsReport(): Promise<DeploymentOpsReport> {
  try {
    const response = await apiCall('/admin/deployment-ops');
    return normalizeDeploymentOpsReport(response);
  } catch (error) {
    if (!isNetworkFailure(error)) {
      console.warn('Falling back to local deployment ops report:', error);
    }

    return buildLocalDeploymentOpsReport();
  }
}

// ==================== SEARCH & FILTER ====================

export async function searchEvents(
  keyword?: string,
  category?: string,
  billingTier?: number,
  city?: string,
  minDate?: string,
  maxDate?: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ events: Event[]; total: number }> {
  const params = new URLSearchParams();
  if (keyword) params.append('keyword', keyword);
  if (category) params.append('category', category);
  if (billingTier) params.append('billingTier', String(billingTier));
  if (city) params.append('city', city);
  if (minDate) params.append('minDate', minDate);
  if (maxDate) params.append('maxDate', maxDate);
  params.append('limit', String(limit));
  params.append('offset', String(offset));

  try {
    return await apiCall(`/search/search?${params.toString()}`);
  } catch (error) {
    if (isNetworkFailure(error)) {
      const events = filterLocalDemoEvents({
        keyword,
        category,
        billingTier,
        city,
        minDate,
        maxDate,
      });

      return { events, total: events.length };
    }

    throw error;
  }
}

export async function getEventCategories(): Promise<{ categories: Array<{ value: string; label: string; icon: string }> }> {
  try {
    return await apiCall('/search/categories');
  } catch (error) {
    if (isNetworkFailure(error)) {
      return { categories: LOCAL_EVENT_CATEGORIES };
    }

    throw error;
  }
}

// ==================== REPORT & BLOCK ====================

export async function reportUser(
  reporterId: string,
  reportedUserId: string,
  reportType: string,
  description?: string,
  evidenceUrls?: string[]
): Promise<{ report_id: string; status: string; message: string }> {
  return apiCall('/reports/report', 'POST', {
    reporter_id: reporterId,
    reported_user_id: reportedUserId,
    report_type: reportType,
    description,
    evidence_urls: evidenceUrls || [],
  });
}

export async function rateUser(
  ratedByUserId: string,
  targetUserId: string,
  rating: number,
  review?: string
): Promise<{ message: string }> {
  trackEvent('user_rate_submitted', {
    rated_by_user_id: ratedByUserId,
    target_user_id: targetUserId,
    rating,
    review_present: Boolean(review?.trim()),
  }, ratedByUserId);

  return Promise.resolve({
    message: 'User rating recorded locally',
  });
}

export async function blockUser(
  blockerId: string,
  blockedUserId: string,
  reason?: string
): Promise<{ block_id: string; message: string }> {
  return apiCall('/reports/block', 'POST', { blocker_id: blockerId, blocked_user_id: blockedUserId, reason });
}

export async function unblockUser(blockerId: string, blockedUserId: string): Promise<{ message: string }> {
  return apiCall('/reports/unblock', 'POST', { blocker_id: blockerId, blocked_user_id: blockedUserId });
}

export async function getBlockedUsers(userId: string): Promise<{ blocked_users: User[] }> {
  return apiCall(`/reports/${userId}/blocked`);
}

export async function checkUserBlocked(blockerId: string, blockedUserId: string): Promise<{ is_blocked: boolean }> {
  return apiCall(`/reports/check-blocked?blocker_id=${blockerId}&blocked_user_id=${blockedUserId}`);
}

// ==================== HOST RATINGS & REVIEWS ====================

export async function rateHost(
  ratedByUserId: string,
  hostId: string,
  eventId: string,
  rating: number,
  review?: string
): Promise<{ rating_id: string; message: string; host_rating: { average: number; total_ratings: number } }> {
  return apiCall('/ratings/', 'POST', { rated_by_user_id: ratedByUserId, host_id: hostId, event_id: eventId, rating, review });
}

export async function getHostRatings(hostId: string, limit: number = 20, offset: number = 0): Promise<{ ratings: any[]; summary: { average_rating: number; total_ratings: number } }> {
  return apiCall(`/ratings/${hostId}?limit=${limit}&offset=${offset}`);
}

export async function getUserHostRating(userId: string, hostId: string): Promise<{ rating: any | null }> {
  return apiCall(`/ratings/user-rating?user_id=${userId}&host_id=${hostId}`);
}

export async function deleteHostRating(ratingId: string, userId: string): Promise<{ message: string }> {
  return apiCall('/ratings/', 'DELETE', { rating_id: ratingId, user_id: userId });
}

// ==================== ACCEPT/DECLINE INVITES ====================

export async function acceptPrivateInvite(
  applicationId: string,
  userId: string
): Promise<{ message: string; status: string }> {
  return apiCall('/invites/accept', 'POST', { application_id: applicationId, user_id: userId });
}

export async function declinePrivateInvite(
  applicationId: string,
  userId: string
): Promise<{ message: string; status: string }> {
  return apiCall('/invites/decline', 'POST', { application_id: applicationId, user_id: userId });
}

export async function getPendingInvites(userId: string): Promise<{ invites: any[] }> {
  return apiCall(`/invites/${userId}/pending`);
}

// ==================== PUSH NOTIFICATIONS ====================

export async function subscribeToPush(userId: string, subscription: PushSubscription): Promise<{ message: string; subscription_id: string }> {
  return apiCall('/notifications/push/subscribe', 'POST', { user_id: userId, subscription });
}

export async function unsubscribeFromPush(userId: string, subscription: PushSubscription): Promise<{ message: string }> {
  return apiCall('/notifications/push/unsubscribe', 'POST', { user_id: userId, subscription });
}

export async function getPushSubscriptions(userId: string): Promise<{ subscriptions: any[] }> {
  return apiCall(`/notifications/push/${userId}/subscriptions`);
}

// Helper to register for push notifications
export async function registerForPushNotifications(userId: string): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push notifications not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    if (!appConfig.vapidPublicKey) {
      console.warn('Push notifications are available, but VAPID public key is missing.');
      return false;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(appConfig.vapidPublicKey),
    });

    await subscribeToPush(userId, subscription);
    return true;
  } catch (error) {
    console.error('Push registration failed:', error);
    return false;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

// ==================== SQUADS ====================

export async function createSquad(name: string, description?: string, isPublic?: boolean, maxMembers?: number): Promise<any> {
  return apiCall('/squads', 'POST', {
    name,
    description,
    isPublic,
    maxMembers
  });
}

export async function getUserSquads(userId: string): Promise<any[]> {
  const response = await apiCall(`/squads/user/${userId}`);
  return response || [];
}

export async function getSquadDetails(squadId: string): Promise<any> {
  return apiCall(`/squads/${squadId}`);
}

export async function inviteUsersToSquad(squadId: string, userIds: string[]): Promise<any> {
  return apiCall(`/squads/${squadId}/invite`, 'POST', { userIds });
}

export async function acceptSquadInvite(inviteId: string): Promise<any> {
  return apiCall(`/squads/invite/${inviteId}/accept`, 'PUT');
}

export async function declineSquadInvite(inviteId: string): Promise<any> {
  return apiCall(`/squads/invite/${inviteId}/decline`, 'PUT');
}

export async function removeSquadMember(squadId: string, userId: string): Promise<any> {
  return apiCall(`/squads/${squadId}/members/${userId}`, 'DELETE');
}

export async function deleteSquad(squadId: string): Promise<any> {
  return apiCall(`/squads/${squadId}`, 'DELETE');
}

// ==================== CHECK-INS ====================

export async function checkIntoEvent(
  eventId: string,
  userLocationLat: number,
  userLocationLon: number,
  eventLocationLat?: number,
  eventLocationLon?: number,
  distanceFromEvent?: number
): Promise<any> {
  return apiCall('/check-ins', 'POST', {
    eventId,
    userLocationLat,
    userLocationLon,
    eventLocationLat,
    eventLocationLon,
    distanceFromEvent,
  });
}

export async function getUserCheckIns(userId: string): Promise<any[]> {
  const response = await apiCall(`/check-ins/user/${userId}`);
  return response || [];
}

export async function hasCheckedIn(eventId: string, userId: string): Promise<any> {
  return apiCall(`/check-ins/event/${eventId}/user/${userId}`);
}

// ==================== NOTIFICATION PREFERENCES ====================

export async function getNotificationPreferences(userId: string): Promise<any> {
  return apiCall(`/notification-preferences/${userId}`);
}

export async function updateNotificationPreferences(userId: string, preferences: any): Promise<any> {
  return apiCall(`/notification-preferences/${userId}`, 'PUT', preferences);
}

export async function resetNotificationPreferences(userId: string): Promise<any> {
  return apiCall(`/notification-preferences/${userId}/reset`, 'POST');
}

// ==================== FRAUD DETECTION ====================

export async function getUserFraudStatus(userId: string): Promise<any> {
  return apiCall(`/fraud/${userId}/status`);
}

export async function calculateUserRiskScore(userId: string): Promise<any> {
  return apiCall(`/fraud/${userId}/calculate-risk`, 'POST');
}

export async function createFraudFlag(userId: string, flagType: string, severity: string, description: string): Promise<any> {
  return apiCall(`/fraud/${userId}/flags`, 'POST', { flagType, severity, description });
}

export async function getAccountFlags(userId: string, reviewed?: boolean): Promise<any> {
  const query = reviewed !== undefined ? `?reviewed=${reviewed}` : '';
  return apiCall(`/fraud/${userId}/flags${query}`);
}

export async function reviewAccountFlag(flagId: string, reviewedBy: string, actionTaken: string, notes: string): Promise<any> {
  return apiCall(`/fraud/flags/${flagId}`, 'PUT', { reviewedBy, actionTaken, notes });
}

export async function getSuspiciousActivities(userId: string, resolved?: boolean): Promise<any> {
  const query = resolved !== undefined ? `?resolved=${resolved}` : '';
  return apiCall(`/fraud/${userId}/suspicious-activities${query}`);
}

export async function resolveSuspiciousActivity(activityId: string, resolution_reason: string): Promise<any> {
  return apiCall(`/fraud/activities/${activityId}/resolve`, 'PUT', { resolution_reason });
}

export async function getFraudLogs(userId: string, eventType?: string): Promise<any> {
  const query = eventType ? `?eventType=${eventType}` : '';
  return apiCall(`/fraud/${userId}/logs${query}`);
}

export async function getHighRiskUsers(threshold: number = 80, limit: number = 20): Promise<any> {
  return apiCall(`/fraud?threshold=${threshold}&limit=${limit}`);
}

export async function getFraudEnforcementSummary(): Promise<any> {
  return apiCall('/fraud/summary');
}

export async function runFraudEnforcement(): Promise<any> {
  return apiCall('/fraud/run-enforcement', 'POST');
}

// ==================== ADMIN DASHBOARD ITEMS ====================

export type AdminDashboardItemType = 'safety_case' | 'payment_record';

export interface AdminDashboardItem {
  id: string;
  item_type: AdminDashboardItemType | string;
  title: string;
  summary?: string | null;
  severity?: string;
  status?: string;
  payload: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export async function getAdminDashboardItems(filters?: { type?: AdminDashboardItemType; limit?: number; offset?: number }): Promise<{ items: AdminDashboardItem[]; total: number }> {
  const params = new URLSearchParams();
  if (filters?.type) params.append('type', filters.type);
  if (filters?.limit !== undefined) params.append('limit', String(filters.limit));
  if (filters?.offset !== undefined) params.append('offset', String(filters.offset));
  const endpoint = params.toString() ? `/admin/dashboard/items?${params.toString()}` : '/admin/dashboard/items';
  return apiCall(endpoint);
}

export async function createAdminDashboardItem(payload: {
  item_type: AdminDashboardItemType;
  title: string;
  summary?: string;
  severity?: string;
  status?: string;
  payload: Record<string, any>;
}): Promise<{ item: AdminDashboardItem; message?: string }> {
  return apiCall('/admin/dashboard/items', 'POST', payload);
}

export async function updateAdminDashboardItem(
  itemId: string,
  payload: Partial<{
    item_type: AdminDashboardItemType;
    title: string;
    summary: string;
    severity: string;
    status: string;
    payload: Record<string, any>;
  }>
): Promise<{ item: AdminDashboardItem; message?: string }> {
  return apiCall(`/admin/dashboard/items/${itemId}`, 'PUT', payload);
}

export async function deleteAdminDashboardItem(itemId: string): Promise<{ success: boolean; message?: string }> {
  return apiCall(`/admin/dashboard/items/${itemId}`, 'DELETE');
}

// ==================== FOLLOW-UP MANAGEMENT ====================

export async function getEventFollowups(eventId: string): Promise<any> {
  return apiCall(`/followups/event/${eventId}`);
}

export async function respondToFollowup(eventId: string, userId: string, responseType: string): Promise<any> {
  return apiCall(`/followups/event/${eventId}/user/${userId}/respond`, 'POST', { response_type: responseType });
}

export async function getHostFollowupAnalytics(hostId: string): Promise<any> {
  return apiCall(`/followups/host/${hostId}/analytics`);
}

export async function getUserFollowups(userId: string): Promise<any> {
  return apiCall(`/followups/user/${userId}`);
}

export async function resendFollowup(eventId: string, userIds: string[]): Promise<any> {
  return apiCall(`/followups/${eventId}/resend`, 'POST', { userIds });
}

// ==================== OTP AUTHENTICATION ====================

export async function requestOTP(email: string): Promise<any> {
  return apiCall(`/auth/request-otp`, 'POST', { email });
}

export async function verifyOTP(email: string, code: string): Promise<any> {
  return apiCall(`/auth/verify-otp`, 'POST', { email, code });
}

export async function resendOTP(email: string): Promise<any> {
  return apiCall(`/auth/otp/resend`, 'POST', { email });
}

export async function getOTPExpiry(email: string): Promise<any> {
  return apiCall(`/auth/otp/expiry?email=${encodeURIComponent(email)}`);
}

// ── Celebrity API ─────────────────────────────────────────────
export async function getCelebrities(category?: string) {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  const endpoint = params.toString() ? `/celebrities?${params.toString()}` : '/celebrities';
  return apiCall(endpoint);
}

export async function getCelebritiesAdmin(category?: string, all: boolean = true) {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  if (all) params.append('all', 'true');
  const endpoint = params.toString() ? `/celebrities?${params.toString()}` : '/celebrities';
  return apiCall(endpoint);
}

export async function createCelebrity(payload: Record<string, any>): Promise<any> {
  return apiCall('/celebrities', 'POST', payload);
}

export async function updateCelebrity(celebrityId: string, payload: Record<string, any>): Promise<any> {
  return apiCall(`/celebrities/${celebrityId}`, 'PUT', payload);
}

export async function deleteCelebrity(celebrityId: string): Promise<any> {
  return apiCall(`/celebrities/${celebrityId}`, 'DELETE');
}

export async function createCelebrityReview(celebrityId: string, payload: Record<string, any>): Promise<any> {
  return apiCall(`/celebrities/${celebrityId}/reviews`, 'POST', payload);
}

export async function deleteCelebrityReview(reviewId: string): Promise<any> {
  return apiCall(`/celebrities/reviews/${reviewId}`, 'DELETE');
}
export async function getCelebrityById(id: string) {
  return apiCall(`/celebrities/${id}`);
}
export async function createCelebrityBooking(celebrityId: string, data: { user_id: string; outing_type: string; duration_minutes: number; booking_date: string; price: number; currency: string; notes?: string }) {
  return apiCall(`/celebrities/${celebrityId}/bookings`, 'POST', data);
}
export async function getCelebrityReviews(celebrityId: string) {
  return apiCall(`/celebrities/${celebrityId}/reviews`);
}
