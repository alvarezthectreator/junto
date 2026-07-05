/**
 * Media URL Resolver - Constructs full URLs for media files
 * Mirrors the frontend resolveMediaUrl utility for consistency
 */

function getPublicOrigin(req = null) {
  // First, try environment variable
  const configuredOrigin = String(process.env.UPLOAD_PUBLIC_ORIGIN || process.env.PUBLIC_URL || '').trim().replace(/\/+$/, '');
  if (configuredOrigin) {
    return configuredOrigin;
  }

  // Fall back to localhost for development
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
