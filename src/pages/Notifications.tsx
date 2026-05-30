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
import {
  isBrowserNotificationsSupported,
  isPushEnabled,
  showBrowserNotification,
} from '../services/browserNotifications';
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
}

interface NotificationsProps {
  onNavigate?: (page: string) => void;
  setActiveNav?: (nav: string) => void;
  activeNav?: string;
  onCloseSidebar?: () => void;
}

const NOTIFICATION_FILTERS = ['All', 'Unread', 'Messages', 'Events'] as const;

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
  const [activeFilter, setActiveFilter] = useState<'All' | 'Unread' | 'Messages' | 'Events'>('All');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const seenNotificationIdsRef = useRef<Set<string>>(new Set());
  const hasSyncedRef = useRef(false);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      if (activeFilter === 'Unread') return !notif.read;
      if (activeFilter === 'Messages') return notif.type === 'message';
      if (activeFilter === 'Events') return notif.type === 'event' || notif.type === 'application';
      return true;
    });
  }, [activeFilter, notifications]);

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

        seenNotificationIdsRef.current = new Set(serverNotifications.map((notification: any) => notification.id));
        hasSyncedRef.current = true;
        setNotifications(nextNotifications);
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

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [userId]);

  const markAsRead = async (id: string) => {
    setNotifications((current) => current.map((n) => (n.id === id ? { ...n, read: true } : n)));

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

    try {
      await deleteNotificationApi(id);
    } catch {
      // If the backend already removed it, the UI state is still correct.
    }
  };

  const archiveNotification = async (id: string) => {
    await deleteNotification(id);
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
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
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

          {/* Mark all as read button */}
          {unreadCount > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 flex justify-end"
            >
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Mark all as read
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
              filteredNotifications.map((notif, index) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`group relative p-4 rounded-xl backdrop-blur-sm border transition-all cursor-pointer ${
                    notif.read
                      ? 'bg-white/5 border-white/10 hover:bg-white/8'
                      : 'bg-gradient-to-r ' +
                        notif.color +
                        ' border-white/20 hover:bg-opacity-80 shadow-lg'
                  }`}
                  onClick={() => markAsRead(notif.id)}
                >
                  <div className="flex gap-4">
                    {/* Icon or Avatar */}
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-xl ${
                        notif.avatar
                          ? 'bg-white/10'
                          : 'bg-white/5'
                      }`}
                    >
                      {notif.avatar ? notif.avatar : notif.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className={`font-semibold text-sm leading-tight ${
                            notif.read ? 'text-slate-300' : 'text-white'
                          }`}>
                            {notif.title}
                          </h3>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                            {notif.description}
                          </p>
                          <span className="text-xs text-slate-500 mt-2 block">
                            {notif.timestamp}
                          </span>
                        </div>
                        {!notif.read && (
                          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1" />
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          archiveNotification(notif.id);
                        }}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                        title="Archive"
                      >
                        <Archive className="w-4 h-4 text-slate-400 hover:text-white" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notif.id);
                        }}
                        className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-400" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
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
