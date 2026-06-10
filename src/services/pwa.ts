import { appConfig } from '../config/appConfig';

export async function registerServiceWorker(): Promise<boolean> {
  if (
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator) ||
    import.meta.env.DEV
  ) {
    return false;
  }

  try {
    await navigator.serviceWorker.register('/sw.js');
    return true;
  } catch (error) {
    console.error('Failed to register service worker:', error);
    return false;
  }
}

export async function clearServiceWorkers(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));

    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch (error) {
    console.warn('Failed to clear service workers:', error);
  }
}

export async function requestInstallPrompt(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  return registerServiceWorker();
}

export function updateThemeColor(color: string = appConfig.themeColor): void {
  if (typeof document === 'undefined') return;

  let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }

  meta.content = color;
}
