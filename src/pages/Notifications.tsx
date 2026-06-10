import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from '../components/Sidebar';
import { PrivateInviteCard } from '../components/PrivateInviteCard';
import {
  deleteNotification as deleteNotificationApi,
  getNotifications as getNotificationsApi,
  getUserId,
  markNotificationAsRead as markNotificationAsReadApi,
} from '../services/api';
import { appConfig } from '../config/appConfig';
import {
  isBrowserNotificationsSupported,
  isPushEnabled,
  playNotificationTone,
  showBrowserNotification,
} from '../services/browserNotifications';
import {
  localActivityEventName,
  deleteLocalNotification,
  markLocalNotificationRead,
  readLocalNotifications,
} from '../utils/localActivity';
import {
  Bell,
  Heart,
  MessageCircle,
  Users,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Archive,
  Settings,
  ChevronRight,
} from 'lucide-react';

function resolveNotificationsWebSocketUrl() {
  if (appConfig.wsUrl) {
    try {
      return new URL(appConfig.wsUrl).toString().replace(/\/+$/, '');
    } catch {
      // Ignore malformed config and fall back to the backend port.
    }
  }

  if (typeof window === 'undefined') {
    return 'ws://localhost:5000';
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.hostname}:5000`;
}

interface NotificationItem {
  id: string;
  type: 'interest' | 'message' | 'application' | 'system' | 'event';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  avatar?: string;
  actionUrl?: string;
  icon: React.ReactNode;
  color: string;
  createdAt?: string;
}

interface NotificationGroup {
  label: string;
  items: NotificationItem[];
}

interface NotificationsProps {
  onNavigate?: (page: string) => void;
  setActiveNav?: (nav: string) => void;
  activeNav?: string;
  onCloseSidebar?: () => void;
}

const NOTIFICATION_FILTERS = ['All', 'Unread', 'Messages', 'Events', 'Applications'] as const;

function getNotificationDayLabel(value: string): string {
  const createdAt = new Date(value);
  if (Number.isNaN(createdAt.getTime())) {
    return 'Earlier';
  }

  const today = new Date();
  const diffDays = Math.floor(
    (Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) - Date.UTC(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate())) /
      (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return 'This week';
  return createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTimestamp(value: string): string {
  const createdAt = new Date(value);
  if (Number.isNaN(createdAt.getTime())) {
    return 'Just now';
  }

  const diffMs = Date.now() - createdAt.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

function getNotificationPresentation(type: string): Pick<NotificationItem, 'icon' | 'color' | 'type' | 'avatar'> {
  switch (type) {
    case 'message':
      return { type: 'message', icon: <MessageCircle className="w-5 h-5" />, color: 'from-blue-500/20 to-cyan-500/10', avatar: '💬' };
    case 'event_accepted':
    case 'new_application':
    case 'application':
      return { type: 'application', icon: <CheckCircle2 className="w-5 h-5" />, color: 'from-emerald-500/20 to-green-500/10', avatar: '✅' };
    case 'interest':
    case 'match':
      return { type: 'interest', icon: <Heart className="w-5 h-5" />, color: 'from-red-500/20 to-pink-500/10', avatar: '❤️' };
    case 'event':
      return { type: 'event', icon: <AlertCircle className="w-5 h-5" />, color: 'from-yellow-500/20 to-orange-500/10' };
    default:
      return { type: 'system', icon: <Users className="w-5 h-5" />, color: 'from-purple-500/20 to-violet-500/10' };
  }
}

export function Notifications({
  onNavigate = () => {},
  setActiveNav = () => {},
  activeNav = 'Notifications',
  onCloseSidebar = () => {},
}: NotificationsProps) {
  const userId = getUserId();
  const [activeFilter, setActiveFilter] = useState<'All' | 'Unread' | 'Messages' | 'Events' | 'Applications'>('All');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const seenNotificationIdsRef = useRef<Set<string>>(new Set());
  const hasSyncedRef = useRef(false);
  const serverNotificationsRef = useRef<NotificationItem[]>([]);
  const [selectedNotificationIds, setSelectedNotificationIds] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [unreadPulse, setUnreadPulse] = useState(false);
  const [liveConnected, setLiveConnected] = useState(false);
  const previousUnreadCountRef = useRef(0);

  const mergeNotifications = (serverItems: NotificationItem[]) => {
    const localItems = readLocalNotifications()
      .filter((notification) => !notification.recipientUserId || notification.recipientUserId === userId)
      .map((notification) => {
        const presentation = getNotificationPresentation(notification.type);
        return {
          id: notification.id,
          type: presentation.type,
          title: notification.title,
          description: notification.description,
          timestamp: formatTimestamp(notification.createdAt),
          read: Boolean(notification.read),
          avatar: presentation.avatar,
          icon: presentation.icon,
          color: presentation.color,
          createdAt: notification.createdAt,
        } as NotificationItem;
      });

    const merged = new Map<string, NotificationItem>();
    [...localItems, ...serverItems].forEach((notification) => {
      merged.set(notification.id, notification);
    });

    return Array.from(merged.values()).sort((a, b) => {
      const aTime = new Date(a.createdAt || a.timestamp).getTime();
      const bTime = new Date(b.createdAt || b.timestamp).getTime();
      return bTime - aTime;
    });
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      if (activeFilter === 'Unread') return !notif.read;
      if (activeFilter === 'Messages') return notif.type === 'message';
      if (activeFilter === 'Events') return notif.type === 'event' || notif.type === 'application';
      if (activeFilter === 'Applications') return notif.type === 'application';
      return true;
    });
  }, [activeFilter, notifications]);

  const groupedNotifications = useMemo<NotificationGroup[]>(() => {
    const groups = new Map<string, NotificationItem[]>();

    filteredNotifications.forEach((notification) => {
      const label = getNotificationDayLabel(notification.createdAt || notification.timestamp);
      const current = groups.get(label) || [];
      current.push(notification);
      groups.set(label, current);
    });

    return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
  }, [filteredNotifications]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  useEffect(() => {
    let active = true;

    const syncNotifications = async () => {
      if (!userId) {
        if (active) {
          setNotifications([]);
          setLoading(false);
          setError('Sign in to view your notifications.');
        }
        return;
      }

      try {
        const response = await getNotificationsApi(userId);
        const serverNotifications = response.notifications || [];
        const nextNotifications = serverNotifications.map((notification: any) => {
          const presentation = getNotificationPresentation(notification.notification_type || notification.type || 'system');
          return {
            id: notification.id,
            type: presentation.type,
            title: notification.title || 'Notification',
            description: notification.body || notification.message || 'You have a new update.',
            timestamp: formatTimestamp(notification.created_at),
            read: Boolean(notification.is_read ?? notification.read),
            avatar: presentation.avatar,
            icon: presentation.icon,
            color: presentation.color,
            createdAt: notification.created_at,
          } as NotificationItem;
        });

        if (!active) {
          return;
        }

        if (hasSyncedRef.current && isBrowserNotificationsSupported() && isPushEnabled() && Notification.permission === 'granted') {
          const newUnread = serverNotifications.filter(
            (notification: any) => !notification.is_read && !seenNotificationIdsRef.current.has(notification.id)
          );

          newUnread.forEach((notification: any) => {
            showBrowserNotification(notification.title || 'Junto notification', {
              body: notification.body || 'You have a new notification.',
              icon: '/favicon.ico',
            });
          });
        }

        if (hasSyncedRef.current && nextNotifications.length > 0) {
          const nextUnreadCount = nextNotifications.filter((notification: NotificationItem) => !notification.read).length;
          if (nextUnreadCount > previousUnreadCountRef.current) {
            setUnreadPulse(true);
            window.setTimeout(() => setUnreadPulse(false), 1800);
            playNotificationTone();
            if (isBrowserNotificationsSupported() && isPushEnabled() && Notification.permission === 'granted') {
              showBrowserNotification('New notification on Junto', {
                body: nextNotifications[0]?.description || 'You have a new update.',
                icon: '/favicon.ico',
              });
            }
          }
          previousUnreadCountRef.current = nextUnreadCount;
        } else {
          previousUnreadCountRef.current = nextNotifications.filter((notification: NotificationItem) => !notification.read).length;
        }

        seenNotificationIdsRef.current = new Set(serverNotifications.map((notification: any) => notification.id));
        hasSyncedRef.current = true;
        serverNotificationsRef.current = nextNotifications;
        setNotifications(mergeNotifications(nextNotifications));
        setError(null);
      } catch (syncError: any) {
        if (active) {
          setError(syncError?.message || 'Could not load notifications right now.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    syncNotifications();
    const timer = window.setInterval(syncNotifications, 30000);
    const refreshLocalNotifications = () => {
      setNotifications(mergeNotifications(serverNotificationsRef.current));
    };
    window.addEventListener(localActivityEventName(), refreshLocalNotifications as EventListener);

    const wsUrl = resolveNotificationsWebSocketUrl();
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(wsUrl);
      ws.onopen = () => setLiveConnected(true);
      ws.onmessage = () => {
        void syncNotifications();
      };
      ws.onclose = () => setLiveConnected(false);
      ws.onerror = () => setLiveConnected(false);
    } catch {
      setLiveConnected(false);
    }

    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener(localActivityEventName(), refreshLocalNotifications as EventListener);
      ws?.close();
    };
  }, [userId]);

  const markAsRead = async (id: string) => {
    setNotifications((current) => current.map((n) => (n.id === id ? { ...n, read: true } : n)));
    markLocalNotificationRead(id);

    try {
      await markNotificationAsReadApi(id);
    } catch {
      setNotifications((current) => current.map((n) => (n.id === id ? { ...n, read: false } : n)));
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    setNotifications((current) => current.map((n) => ({ ...n, read: true })));

    await Promise.all(
      unreadIds.map(async (notificationId) => {
        try {
          await markNotificationAsReadApi(notificationId);
        } catch {
          // Keep the UI responsive even if a single update fails.
        }
      })
    );
  };

  const deleteNotification = async (id: string) => {
    setNotifications((current) => current.filter((n) => n.id !== id));
    deleteLocalNotification(id);

    try {
      await deleteNotificationApi(id);
    } catch {
      // If the backend already removed it, the UI state is still correct.
    }
  };

  const archiveNotification = async (id: string) => {
    await deleteNotification(id);
  };

  const toggleSelection = (id: string) => {
    setSelectedNotificationIds((current) =>
      current.includes(id) ? current.filter((notificationId) => notificationId !== id) : [...current, id]
    );
  };

  const clearSelection = () => {
    setSelectedNotificationIds([]);
    setBulkMode(false);
  };

  const bulkMarkAsRead = async () => {
    await Promise.all(selectedNotificationIds.map((id) => markAsRead(id)));
    clearSelection();
  };

  const bulkDelete = async () => {
    await Promise.all(selectedNotificationIds.map((id) => deleteNotification(id)));
    clearSelection();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white pb-24">
      <div className="pt-24 pb-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Bell className="w-8 h-8 text-blue-400" />
                  <span className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-slate-950 ${liveConnected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                  {unreadCount > 0 && (
                    <span className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${unreadPulse ? 'animate-pulse' : ''}`}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-bold">Notifications</h1>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate('Profile')}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <Settings className="w-6 h-6 text-slate-400 hover:text-white" />
              </motion.button>
            </div>
            <p className="text-slate-400 text-sm">
              {unreadCount > 0 ? `${unreadCount} new notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </motion.div>

          {/* Filter Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-2 mb-6 overflow-x-auto pb-2"
          >
            {NOTIFICATION_FILTERS.map((filter) => (
              <motion.button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-full font-medium transition-all whitespace-nowrap ${
                  activeFilter === filter
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {filter}
              </motion.button>
            ))}
          </motion.div>

          {/* Bulk actions */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setBulkMode(!bulkMode)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  bulkMode ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {bulkMode ? 'Done selecting' : 'Select notifications'}
              </button>
              {selectedNotificationIds.length > 0 && (
                <span className="text-xs text-slate-400">{selectedNotificationIds.length} selected</span>
              )}
            </div>

            {unreadCount > 0 && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={markAllAsRead}
                className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Mark all as read
              </motion.button>
            )}
          </div>

          {bulkMode && selectedNotificationIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 flex flex-wrap justify-end gap-2"
            >
              <button
                onClick={bulkMarkAsRead}
                className="rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/20"
              >
                Mark selected read
              </button>
              <button
                onClick={bulkDelete}
                className="rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
              >
                Delete selected
              </button>
              <button
                onClick={clearSelection}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
              >
                Clear
              </button>
            </motion.div>
          )}

          {/* Notifications List */}
          <div className="space-y-3">
            {loading ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-sm text-slate-400"
              >
                Loading notifications...
              </motion.div>
            ) : error ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-6 text-center text-sm text-amber-100"
              >
                {error}
              </motion.div>
            ) : filteredNotifications.length > 0 ? (
              groupedNotifications.map((group) => (
                <div key={group.label} className="space-y-3">
                  <div className="flex items-center justify-between px-1 pt-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{group.label}</p>
                    <p className="text-[11px] text-slate-500">{group.items.length} item{group.items.length === 1 ? '' : 's'}</p>
                  </div>
                  {group.items.map((notif, index) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className={`group relative overflow-hidden rounded-xl border transition-all ${
                        notif.read
                          ? 'bg-white/5 border-white/10 hover:bg-white/8'
                          : 'bg-gradient-to-r ' +
                            notif.color +
                            ' border-white/20 hover:bg-opacity-80 shadow-lg'
                      } ${selectedNotificationIds.includes(notif.id) ? 'ring-2 ring-blue-400/50' : ''}`}
                      drag={bulkMode ? false : 'x'}
                      dragConstraints={{ left: -120, right: 0 }}
                      dragElastic={0.08}
                      onDragEnd={(_, info) => {
                        if (bulkMode) {
                          return;
                        }

                        if (info.offset.x < -90 || info.velocity.x < -500) {
                          deleteNotification(notif.id);
                        }
                      }}
                      onClick={() => (bulkMode ? toggleSelection(notif.id) : markAsRead(notif.id))}
                    >
                      <div className="flex gap-4 p-4">
                        {/* Icon or Avatar */}
                        <div
                          className={`flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center font-xl ${
                            notif.avatar ? 'bg-white/10' : 'bg-white/5'
                          }`}
                        >
                          {notif.avatar ? notif.avatar : notif.icon}
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h3 className={`text-sm font-semibold leading-tight ${notif.read ? 'text-slate-300' : 'text-white'}`}>
                                {notif.title}
                              </h3>
                              <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                                {notif.description}
                              </p>
                              <span className="mt-2 block text-xs text-slate-500">
                                {notif.timestamp}
                              </span>
                            </div>
                            {!notif.read && <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex-shrink-0 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              archiveNotification(notif.id);
                            }}
                            className="rounded-lg p-1.5 transition-colors hover:bg-white/10"
                            title="Archive"
                          >
                            <Archive className="h-4 w-4 text-slate-400 hover:text-white" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notif.id);
                            }}
                            className="rounded-lg p-1.5 transition-colors hover:bg-red-500/20"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-400" />
                          </motion.button>
                          {bulkMode && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelection(notif.id);
                              }}
                              className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition ${
                                selectedNotificationIds.includes(notif.id)
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-white/10 text-slate-200'
                              }`}
                            >
                              {selectedNotificationIds.includes(notif.id) ? 'Selected' : 'Select'}
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <Bell className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">No notifications</p>
                <p className="text-slate-500 text-sm mt-1">
                  {activeFilter === 'Unread' ? 'You\'re all caught up!' : 'Nothing to show here'}
                </p>
              </motion.div>
            )}
          </div>

          {/* Notification Settings Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/8 transition-colors cursor-pointer"
            onClick={() => onNavigate('Settings')}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">Notification Settings</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Customize what notifications you receive
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>
          </motion.div>
        </div>
      </div>
      <Sidebar activeNav={activeNav} onNavigate={onNavigate} setActiveNav={setActiveNav} onCloseSidebar={onCloseSidebar} />
    </div>
  );
}
