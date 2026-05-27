const PUSH_ENABLED_KEY = 'junto-push-enabled';

export function isBrowserNotificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function isPushEnabled(): boolean {
  return localStorage.getItem(PUSH_ENABLED_KEY) === 'true';
}

export function setPushEnabled(enabled: boolean): void {
  localStorage.setItem(PUSH_ENABLED_KEY, enabled ? 'true' : 'false');
}

export async function requestPushPermission(): Promise<boolean> {
  if (!isBrowserNotificationsSupported()) {
    return false;
  }

  if (Notification.permission === 'granted') {
    setPushEnabled(true);
    return true;
  }

  const permission = await Notification.requestPermission();
  const enabled = permission === 'granted';
  setPushEnabled(enabled);
  return enabled;
}

export function showBrowserNotification(title: string, options?: NotificationOptions): boolean {
  if (!isBrowserNotificationsSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const notification = new Notification(title, options);
  window.setTimeout(() => notification.close(), 5000);
  return true;
}

