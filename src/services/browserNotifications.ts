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

export function playNotificationTone(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextCtor) {
    return false;
  }

  try {
    const audioContext = new AudioContextCtor();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gainNode.gain.value = 0.0001;

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.28);
    oscillator.stop(audioContext.currentTime + 0.3);

    oscillator.onended = () => {
      audioContext.close().catch(() => {});
    };

    return true;
  } catch {
    return false;
  }
}
