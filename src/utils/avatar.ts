import { appConfig } from '../config/appConfig';

function getApiServerOrigin() {
  const configuredApiBaseUrl = appConfig.apiBaseUrl?.trim();

  if (!configuredApiBaseUrl) {
    return '';
  }

  if (/^https?:\/\//i.test(configuredApiBaseUrl)) {
    try {
      const url = new URL(configuredApiBaseUrl);
      return `${url.protocol}//${url.host}`;
    } catch {
      return configuredApiBaseUrl.replace(/\/api\/?$/, '');
    }
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${configuredApiBaseUrl.replace(/\/api\/?$/, '')}`;
  }

  return configuredApiBaseUrl.replace(/\/api\/?$/, '');
}

const API_SERVER_ORIGIN = getApiServerOrigin();
const DEFAULT_UPLOAD_FOLDER = 'profiles';

function isDataUrl(value?: string) {
  return typeof value === 'string' && value.startsWith('data:');
}

function isLocalHost(value: string) {
  try {
    const hostname = new URL(`http://${value}`).hostname.toLowerCase();
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  } catch {
    return false;
  }
}

export function resolveMediaUrl(value?: string) {
  if (!value || !value.trim()) {
    return '';
  }

  const trimmed = value.trim();
  if (isDataUrl(trimmed) || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    if (typeof window !== 'undefined' && isLocalHost(new URL(trimmed).host)) {
      return `${API_SERVER_ORIGIN}${new URL(trimmed).pathname}${new URL(trimmed).search}${new URL(trimmed).hash}`;
    }

    return trimmed;
  }

  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
    // Uploaded files are served by the backend, not the Vercel frontend.
    const baseUrl = API_SERVER_ORIGIN;
    const uploadPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${baseUrl}${uploadPath}`;
  }

  if (/^[^/?#]+\.(png|jpe?g|webp|gif|mp4|webm|mov)$/i.test(trimmed)) {
    return `${API_SERVER_ORIGIN}/uploads/${DEFAULT_UPLOAD_FOLDER}/${trimmed}`;
  }

  return trimmed;
}

export function isAvatarImageSource(value?: string) {
  if (!value || !value.trim()) {
    return false;
  }

  const trimmed = value.trim();
  return (
    isDataUrl(trimmed) ||
    trimmed.startsWith('blob:') ||
    /^https?:\/\//i.test(trimmed) ||
    trimmed.startsWith('/uploads/') ||
    trimmed.startsWith('uploads/')
  );
}

export function getAvatarInitial(name?: string) {
  const firstChar = (name || '').trim().charAt(0);
  return firstChar ? firstChar.toUpperCase() : 'U';
}

export function getAvatarImageFromProfilePhotos(value: unknown) {
  if (Array.isArray(value)) {
    return resolveMediaUrl(value.find((entry) => Boolean(entry)) as string | undefined);
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return resolveMediaUrl(parsed.find((entry) => Boolean(entry)) as string | undefined);
      }
    } catch {
      return resolveMediaUrl(value);
    }
  }

  return '';
}
