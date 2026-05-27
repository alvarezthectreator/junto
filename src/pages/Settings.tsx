import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  Bell,
  Lock,
  Eye,
  Shield,
  LogOut,
  HelpCircle,
  ChevronRight,
  Toggle2,
  Moon,
  Volume2,
  Smartphone,
  MapPin,
  User,
  AlertCircle,
} from 'lucide-react';

interface SettingsProps {
  onNavigate?: (page: string) => void;
  setActiveNav?: (nav: string) => void;
  onCloseSidebar?: () => void;
  isLightMode?: boolean;
  onToggleLightMode?: () => void;
}

interface SettingToggle {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  icon: React.ReactNode;
}

export function Settings({
  onNavigate = () => {},
  setActiveNav = () => {},
  onCloseSidebar = () => {},
  isLightMode = false,
  onToggleLightMode = () => {},
}: SettingsProps) {
  const [activeTab, setActiveTab] = useState<'account' | 'notifications' | 'privacy' | 'about'>('account');
  const [notificationSettings, setNotificationSettings] = useState<SettingToggle[]>([
    {
      id: 'interests',
      label: 'Interest & Application Notifications',
      description: 'Get notified when someone shows interest in your event',
      enabled: true,
      icon: <Bell className="w-5 h-5" />,
    },
    {
      id: 'messages',
      label: 'Message Notifications',
      description: 'Get notified when you receive new messages',
      enabled: true,
      icon: <Bell className="w-5 h-5" />,
    },
    {
      id: 'reminders',
      label: 'Event Reminders',
      description: 'Get reminders about upcoming events you\'re attending',
      enabled: true,
      icon: <Bell className="w-5 h-5" />,
    },
    {
      id: 'promotions',
      label: 'Promotional & News',
      description: 'Receive updates about new features and promotions',
      enabled: false,
      icon: <Bell className="w-5 h-5" />,
    },
    {
      id: 'push',
      label: 'Push Notifications',
      description: 'Allow Junto to send push notifications to your device',
      enabled: true,
      icon: <Smartphone className="w-5 h-5" />,
    },
  ]);

  const [privacySettings, setPrivacySettings] = useState<SettingToggle[]>([
    {
      id: 'profile',
      label: 'Public Profile',
      description: 'Allow others to view your profile',
      enabled: true,
      icon: <Eye className="w-5 h-5" />,
    },
    {
      id: 'location',
      label: 'Share Location',
      description: 'Share your approximate location with event hosts',
      enabled: true,
      icon: <MapPin className="w-5 h-5" />,
    },
    {
      id: 'activity',
      label: 'Activity Status',
      description: 'Show when you\'re active on Junto',
      enabled: true,
      icon: <User className="w-5 h-5" />,
    },
    {
      id: 'search',
      label: 'Searchable Profile',
      description: 'Allow your profile to appear in search results',
      enabled: true,
      icon: <Eye className="w-5 h-5" />,
    },
  ]);

  const toggleNotification = (id: string) => {
    setNotificationSettings(
      notificationSettings.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const togglePrivacy = (id: string) => {
    setPrivacySettings(
      privacySettings.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: <User className="w-5 h-5" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
    { id: 'privacy', label: 'Privacy', icon: <Lock className="w-5 h-5" /> },
    { id: 'about', label: 'About', icon: <HelpCircle className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white">
      <div className="pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <SettingsIcon className="w-8 h-8 text-amber-400" />
              <h1 className="text-3xl font-bold">Settings</h1>
            </div>
            <p className="text-slate-400 text-sm">Manage your account and preferences</p>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-2 mb-8 overflow-x-auto pb-2 border-b border-white/10"
          >
            {tabs.map((tab, index) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-3 font-medium transition-all flex items-center gap-2 whitespace-nowrap border-b-2 ${
                  activeTab === tab.id
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.icon}
                {tab.label}
              </motion.button>
            ))}
          </motion.div>

          {/* Account Tab */}
          {activeTab === 'account' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Account Info */}
              <div className="p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/8 transition-colors cursor-pointer" onClick={() => onNavigate('Profile')}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Edit Profile</h3>
                    <p className="text-sm text-slate-400 mt-1">Update your personal information</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </div>

              {/* Theme Toggle */}
              <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Moon className="w-5 h-5 text-slate-400" />
                    <div>
                      <h3 className="font-semibold">Dark Mode</h3>
                      <p className="text-sm text-slate-400 mt-1">Use dark theme for the app</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onToggleLightMode}
                    className={`relative w-12 h-7 rounded-full transition-colors ${
                      !isLightMode ? 'bg-amber-500' : 'bg-slate-600'
                    }`}
                  >
                    <motion.div
                      animate={{ x: !isLightMode ? 24 : 2 }}
                      className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full"
                    />
                  </motion.button>
                </div>
              </div>

              {/* Account Security */}
              <div className="p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/8 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-slate-400" />
                    <div>
                      <h3 className="font-semibold">Password & Security</h3>
                      <p className="text-sm text-slate-400 mt-1">Change password, enable 2FA</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </div>

              {/* Blocked Users */}
              <div className="p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/8 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-slate-400" />
                    <div>
                      <h3 className="font-semibold">Blocked Users</h3>
                      <p className="text-sm text-slate-400 mt-1">Manage your blocked list</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </div>

              {/* Logout */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full p-6 bg-red-500/10 border border-red-500/30 rounded-xl hover:bg-red-500/20 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="w-5 h-5 text-red-400" />
                  <div className="text-left">
                    <h3 className="font-semibold text-red-400">Log Out</h3>
                    <p className="text-sm text-red-400/70 mt-1">Sign out of your account</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-red-400 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </motion.div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {notificationSettings.map((setting, index) => (
                <motion.div
                  key={setting.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/8 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="text-slate-400">{setting.icon}</div>
                      <div>
                        <h3 className="font-semibold text-sm">{setting.label}</h3>
                        <p className="text-xs text-slate-400 mt-1">{setting.description}</p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleNotification(setting.id)}
                      className={`relative w-12 h-7 rounded-full transition-colors ml-4 flex-shrink-0 ${
                        setting.enabled ? 'bg-amber-500' : 'bg-slate-600'
                      }`}
                    >
                      <motion.div
                        animate={{ x: setting.enabled ? 24 : 2 }}
                        className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full"
                      />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {privacySettings.map((setting, index) => (
                <motion.div
                  key={setting.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/8 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="text-slate-400">{setting.icon}</div>
                      <div>
                        <h3 className="font-semibold text-sm">{setting.label}</h3>
                        <p className="text-xs text-slate-400 mt-1">{setting.description}</p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => togglePrivacy(setting.id)}
                      className={`relative w-12 h-7 rounded-full transition-colors ml-4 flex-shrink-0 ${
                        setting.enabled ? 'bg-amber-500' : 'bg-slate-600'
                      }`}
                    >
                      <motion.div
                        animate={{ x: setting.enabled ? 24 : 2 }}
                        className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full"
                      />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="p-6 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 rounded-xl text-center">
                <h2 className="text-2xl font-bold mb-2">Junto</h2>
                <p className="text-sm text-slate-400">Version 1.0.0</p>
                <p className="text-xs text-slate-500 mt-3">The easiest way to find fun plans nearby</p>
              </div>

              <div className="p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/8 transition-colors cursor-pointer" onClick={() => onNavigate('Terms')}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Terms of Service</h3>
                    <p className="text-sm text-slate-400 mt-1">Read our terms and conditions</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </div>

              <div className="p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/8 transition-colors cursor-pointer" onClick={() => onNavigate('Privacy')}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Privacy Policy</h3>
                    <p className="text-sm text-slate-400 mt-1">Learn how we protect your data</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </div>

              <div className="p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/8 transition-colors cursor-pointer" onClick={() => onNavigate('Help')}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Help & Support</h3>
                    <p className="text-sm text-slate-400 mt-1">Contact us or browse FAQs</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </div>

              <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                <h3 className="font-semibold mb-3">Rate Us</h3>
                <div className="flex gap-2 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      className="text-2xl hover:text-yellow-400 transition-colors"
                    >
                      ⭐
                    </motion.button>
                  ))}
                </div>
                <p className="text-xs text-slate-400">
                  Love Junto? Please rate us on the app store!
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
