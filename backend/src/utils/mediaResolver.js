/**
 * Media URL Resolver - Constructs full URLs for media files
 * Mirrors the frontend resolveMediaUrl utility for consistency
 */

function getRequestOrigin(req = null) {
  if (!req || !req.headers) {
    return '';
  }

  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const forwardedHost = String(req.headers['x-forwarded-host'] || '').split(',')[0].trim();
  const host = forwardedHost || String(req.headers.host || '').split(',')[0].trim();

  if (!host) {
    return '';
  }

  const protocol = forwardedProto || (req.secure ? 'https' : 'http');
  return `${protocol}://${host}`;
}

function getPublicOrigin(req = null) {
  const configuredOrigin = String(process.env.UPLOAD_PUBLIC_ORIGIN || process.env.PUBLIC_URL || '').trim();

  if (/^https?:\/\//i.test(configuredOrigin)) {
    try {
      const parsed = new URL(configuredOrigin);
      return `${parsed.protocol}//${parsed.host}`;
    } catch {
      return configuredOrigin.replace(/\/+$/, '');
    }
  }

  const requestOrigin = getRequestOrigin(req);
  if (requestOrigin) {
    return requestOrigin;
  }

  return 'http://localhost:5000';
}

export function resolveMediaUrl(value, req = null) {
  if (!value || !value.trim()) {
    return null;
  }

  const trimmed = value.trim();

  // Data URLs and blob URLs pass through as-is
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // Already full URLs
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Paths starting with /uploads/
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
    const origin = getPublicOrigin(req);
    const uploadPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${origin}${uploadPath}`;
  }

  // Simple filenames (assume they're in profiles folder)
  if (/^[^/?#]+\.(png|jpe?g|webp|gif|mp4|webm|mov)$/i.test(trimmed)) {
    const origin = getPublicOrigin(req);
    return `${origin}/uploads/profiles/${trimmed}`;
  }

  // Return as-is if no pattern matches
  return trimmed;
}

export function normalizeProfilePhotos(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).map(String);
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean).map(String);
      }
    } catch {
      return value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
    }
  }

  return [];
}

export function getAvatarImageFromProfilePhotos(value, req = null) {
  const photos = normalizeProfilePhotos(value);
  if (photos.length > 0) {
    return resolveMediaUrl(photos[0], req);
  }
  return null;
}

export function enrichUserWithMediaUrls(user, req = null) {
  if (!user || typeof user !== 'object') {
    return user;
  }

  return {
    ...user,
    avatar_image: resolveMediaUrl(user.avatar_image, req) || resolveMediaUrl(user.user_avatar_image, req) || getAvatarImageFromProfilePhotos(user.profile_photos, req),
    avatar_url: resolveMediaUrl(user.avatar_image, req) || resolveMediaUrl(user.user_avatar_image, req) || getAvatarImageFromProfilePhotos(user.profile_photos, req),
    profile_photos: normalizeProfilePhotos(user.profile_photos).map(p => resolveMediaUrl(p, req)),
  };
}

export function enrichEventWithMediaUrls(event, req = null) {
  if (!event || typeof event !== 'object') {
    return event;
  }

  return {
    ...event,
    cover_photo_url: resolveMediaUrl(event.cover_photo_url, req),
    coverImage: resolveMediaUrl(event.cover_photo_url, req),
  };
}
