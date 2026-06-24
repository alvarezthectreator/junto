import { appConfig } from '../config/appConfig';

function isDataUrl(value?: string) {
  return typeof value === 'string' && value.startsWith('data:');
}

export function resolveMediaUrl(value?: string) {
  if (!value || !value.trim()) {
    return '';
  }

  const trimmed = value.trim();
  if (isDataUrl(trimmed) || trimmed.startsWith('blob:') || /^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
    // In production, use current window origin for uploads (Vercel will rewrite to Railway)
    // In development with relative /api path, use window origin
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const uploadPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${baseUrl}${uploadPath}`;
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
