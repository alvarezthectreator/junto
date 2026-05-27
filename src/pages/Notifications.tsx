import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
  X,
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

export function Notifications({
  onNavigate = () => {},
  setActiveNav = () => {},
  activeNav = 'Notifications',
  onCloseSidebar = () => {},
}: NotificationsProps) {
  const [activeFilter, setActiveFilter] = useState<'All' | 'Unread' | 'Messages' | 'Events'>('All');
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      type: 'interest',
      title: 'Zainab showed interest in your beach day',
      description: 'Tarkwa Bay • Tomorrow, 10am',
      timestamp: '5 minutes ago',
      read: false,
      avatar: '👩‍🦰',
      icon: <Heart className="w-5 h-5" />,
      color: 'from-red-500/20 to-pink-500/10',
    },
    {
      id: '2',
      type: 'message',
      title: 'New message from Oge',
      description: 'Hey! Are you still up for the movie tonight?',
      timestamp: '32 minutes ago',
      read: false,
      avatar: '👨‍🦱',
      icon: <MessageCircle className="w-5 h-5" />,
      color: 'from-blue-500/20 to-cyan-500/10',
    },
    {
      id: '3',
      type: 'application',
      title: 'Ada accepted your request to join',
      description: 'Beach volleyball at Victoria Island • Saturday, 4pm',
      timestamp: '2 hours ago',
      read: false,
      avatar: '👩',
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: 'from-emerald-500/20 to-green-500/10',
    },
    {
      id: '4',
      type: 'event',
      title: 'Event starting soon: Night brunch',
      description: 'Starts in 3 hours at Lekki Phase 1',
      timestamp: '3 hours ago',
      read: true,
      icon: <AlertCircle className="w-5 h-5" />,
      color: 'from-yellow-500/20 to-orange-500/10',
    },
    {
      id: '5',
      type: 'interest',
      title: 'Marcus showed interest in your hangout',
      description: 'City exploration • This weekend',
      timestamp: '5 hours ago',
      read: true,
      avatar: '👨',
      icon: <Heart className="w-5 h-5" />,
      color: 'from-red-500/20 to-pink-500/10',
    },
    {
      id: '6',
      type: 'system',
      title: 'Your profile is 85% complete',
      description: 'Add a profile photo and bio to increase your chances',
      timestamp: '1 day ago',
      read: true,
      icon: <Users className="w-5 h-5" />,
      color: 'from-purple-500/20 to-violet-500/10',
    },
  ]);

  const filters = ['All', 'Unread', 'Messages', 'Events'] as const;

  const filteredNotifications = notifications.filter((notif) => {
    if (activeFilter === 'Unread') return !notif.read;
    if (activeFilter === 'Messages') return notif.type === 'message';
    if (activeFilter === 'Events') return notif.type === 'event' || notif.type === 'application';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const archiveNotification = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white">
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
            {filters.map((filter) => (
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
            {filteredNotifications.length > 0 ? (
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
    </div>
  );
}
