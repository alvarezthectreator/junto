import React, { useEffect, useState } from 'react';
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
  Globe,
  KeyRound,
  RefreshCw,
  Copy,
  Download,
  Clock3,
  Laptop,
} from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import {
  isBrowserNotificationsSupported,
  isPushEnabled,
  requestPushPermission,
  setPushEnabled,
} from '../services/browserNotifications';
import {
  deleteUserAccount,
  exportUserAccountData,
  getBlockedUsers,
  getReferralInfo,
  getUserId,
  logout as clearSession,
  unblockUser,
  getNotificationPreferences,
  updateNotificationPreferences,
  changePassword,
  getSecuritySessions,
  revokeSecuritySession,
  revokeOtherSecuritySessions,
  generateRecoveryCodes,
  getSecurityActivity,
  recoverAccount,
  registerForPushNotifications,
  setSessionToken,
  type SecuritySession,
  type SecurityActivityEntry,
} from '../services/api';
import {
  readBlockedUserRecords,
  removeBlockedUserRecord,
  type BlockedUserRecord,
} from '../utils/localActivity';

interface SettingsProps {
  onNavigate?: (page: string) => void;
  setActiveNav?: (nav: string) => void;
  onCloseSidebar?: () => void;
  isLightMode?: boolean;
  onToggleLightMode?: () => void;
  handleLogout?: () => void;
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
  handleLogout = () => {},
}: SettingsProps) {
  const userId = getUserId();
  const [activeTab, setActiveTab] = useState<'account' | 'security' | 'notifications' | 'privacy' | 'preferences' | 'about'>('account');
  const [referralInfo, setReferralInfo] = useState<{
    code: string;
    link: string;
    referral_count: number;
    referred_users: Array<{ id: string; username?: string; display_name?: string; profile_id: string }>;
  } | null>(null);
  const [accountActionMessage, setAccountActionMessage] = useState('');
  const [accountBusy, setAccountBusy] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserRecord[]>([]);
  const [blockedUsersBusy, setBlockedUsersBusy] = useState(false);
  const [blockedUsersMessage, setBlockedUsersMessage] = useState('');
  const [securityBusy, setSecurityBusy] = useState(false);
  const [securityMessage, setSecurityMessage] = useState('');
  const [securitySessions, setSecuritySessions] = useState<SecuritySession[]>([]);
  const [securityActivity, setSecurityActivity] = useState<SecurityActivityEntry[]>([]);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [recoveryCodesGeneratedAt, setRecoveryCodesGeneratedAt] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryUsername, setRecoveryUsername] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState('');
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
      description: 'Allow wantuu to send push notifications to your device',
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
      description: 'Show when you\'re active on wantuu',
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

  useEffect(() => {
    const pushAllowed = isBrowserNotificationsSupported() && isPushEnabled() && Notification.permission === 'granted';
    setNotificationSettings((current) =>
      current.map((setting) => (setting.id === 'push' ? { ...setting, enabled: pushAllowed } : setting))
    );
  }, []);

  // Load notification preferences from backend
  useEffect(() => {
    let active = true;

    const loadPreferences = async () => {
      if (!userId) {
        return;
      }

      try {
        const response = await getNotificationPreferences(userId);
        if (active && response?.preferences) {
          const prefs = response.preferences;
          setNotificationSettings((current) =>
            current.map((setting) => {
              switch (setting.id) {
                case 'interests':
                  return { ...setting, enabled: prefs.interests_enabled !== false };
                case 'messages':
                  return { ...setting, enabled: prefs.messages_enabled !== false };
                case 'reminders':
                  return { ...setting, enabled: prefs.reminders_enabled !== false };
                case 'promotions':
                  return { ...setting, enabled: prefs.promotions_enabled === true };
                case 'push':
                  return { ...setting, enabled: prefs.push_enabled !== false };
                default:
                  return setting;
              }
            })
          );

          if (
            prefs.push_enabled !== false &&
            isBrowserNotificationsSupported() &&
            Notification.permission === 'granted'
          ) {
            void registerForPushNotifications(userId).catch((error) => {
              console.warn('Unable to refresh push subscription:', error);
            });
          }
        }
      } catch (error) {
        console.error('Error loading notification preferences:', error);
      }
    };

    loadPreferences();

    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    let active = true;

    const loadSecurityData = async () => {
      if (!userId || activeTab !== 'security') {
        return;
      }

      try {
        setSecurityBusy(true);
        const [sessionsResponse, activityResponse] = await Promise.all([
          getSecuritySessions(userId),
          getSecurityActivity(userId),
        ]);

        if (!active) {
          return;
        }

        setSecuritySessions(Array.isArray(sessionsResponse?.sessions) ? sessionsResponse.sessions : []);
        setSecurityActivity(Array.isArray(activityResponse?.activity) ? activityResponse.activity : []);
      } catch (error) {
        console.error('Error loading security data:', error);
        if (active) {
          setSecuritySessions([]);
          setSecurityActivity([]);
        }
      } finally {
        if (active) {
          setSecurityBusy(false);
        }
      }
    };

    loadSecurityData();

    return () => {
      active = false;
    };
  }, [activeTab, userId]);

  useEffect(() => {
    let active = true;

    const loadReferralInfo = async () => {
      if (!userId) {
        return;
      }

      try {
        const response = await getReferralInfo(userId);
        if (active) {
          setReferralInfo(response.referral);
        }
      } catch {
        if (active) {
          setReferralInfo(null);
        }
      }
    };

    loadReferralInfo();

    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    let active = true;

    const loadBlockedUsers = async () => {
      if (!userId) {
        setBlockedUsers(readBlockedUserRecords());
        return;
      }

      try {
        setBlockedUsersBusy(true);
        const response = await getBlockedUsers(userId);
        const apiBlocked = Array.isArray(response?.blocked_users) ? response.blocked_users : [];
        const mappedBlocked = apiBlocked.map((entry: any) => ({
          id: String(entry.id),
          name: entry.display_name || entry.username || 'Blocked user',
          reason: entry.reason || entry.block_reason || '',
          blockedAt: entry.blockedAt || entry.created_at || entry.createdAt || '',
        }));

        if (active && mappedBlocked.length > 0) {
          setBlockedUsers(mappedBlocked);
        } else if (active) {
          setBlockedUsers(readBlockedUserRecords());
        }
      } catch {
        if (active) {
          setBlockedUsers(readBlockedUserRecords());
        }
      } finally {
        if (active) {
          setBlockedUsersBusy(false);
        }
      }
    };

    loadBlockedUsers();

    return () => {
      active = false;
    };
  }, [userId]);

  const toggleNotification = async (id: string) => {
    const target = notificationSettings.find((setting) => setting.id === id);

    if (id === 'push' && target && !target.enabled) {
      const granted = await requestPushPermission();
      const registered = granted && userId ? await registerForPushNotifications(userId) : false;
      const enabled = granted && registered;
      setNotificationSettings((current) =>
        current.map((setting) => (setting.id === id ? { ...setting, enabled } : setting))
      );
      setPushEnabled(enabled);

      // Save to backend
      if (userId) {
        try {
          await updateNotificationPreferences(userId, { push_enabled: enabled });
        } catch (error) {
          console.error('Error updating push preference:', error);
        }
      }
      return;
    }

    setNotificationSettings((current) =>
      current.map((setting) => {
        if (setting.id !== id) return setting;
        const nextEnabled = !setting.enabled;
        if (id === 'push') {
          setPushEnabled(nextEnabled);
        }
        return { ...setting, enabled: nextEnabled };
      })
    );

    // Save updated preference to backend
    if (userId) {
      try {
        const updateData: any = {};
        switch (id) {
          case 'interests':
            updateData.interests_enabled = !target?.enabled;
            break;
          case 'messages':
            updateData.messages_enabled = !target?.enabled;
            break;
          case 'reminders':
            updateData.reminders_enabled = !target?.enabled;
            break;
          case 'promotions':
            updateData.promotions_enabled = !target?.enabled;
            break;
          case 'push':
            updateData.push_enabled = !target?.enabled;
            break;
        }
        await updateNotificationPreferences(userId, updateData);
      } catch (error) {
        console.error('Error updating notification preference:', error);
      }
    }
  };

  const togglePrivacy = (id: string) => {
    setPrivacySettings(
      privacySettings.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const copyReferralLink = async () => {
    if (!referralInfo?.link) return;
    await navigator.clipboard.writeText(referralInfo.link);
    setAccountActionMessage('Referral link copied to clipboard.');
  };

  const refreshSecurityData = async () => {
    if (!userId) return;

    try {
      const [sessionsResponse, activityResponse] = await Promise.all([
        getSecuritySessions(userId),
        getSecurityActivity(userId),
      ]);

      setSecuritySessions(Array.isArray(sessionsResponse?.sessions) ? sessionsResponse.sessions : []);
      setSecurityActivity(Array.isArray(activityResponse?.activity) ? activityResponse.activity : []);
    } catch (error) {
      console.error('Error refreshing security data:', error);
    }
  };

  const handleChangePassword = async () => {
    if (!userId) {
      setSecurityMessage('Please sign in again before changing your password.');
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      setSecurityMessage('Please fill out the current password, new password, and confirmation.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecurityMessage('New password confirmation does not match.');
      return;
    }

    setSecurityBusy(true);
    setSecurityMessage('');

    try {
      const response = await changePassword(userId, currentPassword, newPassword);
      if (response.session_token) {
        setSessionToken(response.session_token);
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSecurityMessage('Password updated and other sessions refreshed.');
      await refreshSecurityData();
    } catch (error: any) {
      setSecurityMessage(error?.message || 'Could not update password.');
    } finally {
      setSecurityBusy(false);
    }
  };

  const handleGenerateRecoveryCodes = async () => {
    if (!userId) {
      setSecurityMessage('Please sign in again before generating backup codes.');
      return;
    }

    setSecurityBusy(true);
    setSecurityMessage('');

    try {
      const response = await generateRecoveryCodes();
      setRecoveryCodes(response.recovery_codes || []);
      setRecoveryCodesGeneratedAt(new Date().toISOString());
      setSecurityMessage('New backup codes generated. Save them somewhere secure.');
      await refreshSecurityData();
    } catch (error: any) {
      setSecurityMessage(error?.message || 'Could not generate backup codes.');
    } finally {
      setSecurityBusy(false);
    }
  };

  const handleCopyRecoveryCodes = async () => {
    if (!recoveryCodes.length) return;
    await navigator.clipboard.writeText(recoveryCodes.join('\n'));
    setSecurityMessage('Backup codes copied to clipboard.');
  };

  const handleDownloadRecoveryCodes = () => {
    if (!recoveryCodes.length) return;

    const blob = new Blob([recoveryCodes.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `junto-backup-codes-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!userId) return;

    setSecurityBusy(true);
    setSecurityMessage('');
    try {
      await revokeSecuritySession(userId, sessionId);
      setSecurityMessage('Session revoked.');
      await refreshSecurityData();
    } catch (error: any) {
      setSecurityMessage(error?.message || 'Could not revoke session.');
    } finally {
      setSecurityBusy(false);
    }
  };

  const handleRevokeOtherSessions = async () => {
    if (!userId) return;

    setSecurityBusy(true);
    setSecurityMessage('');
    try {
      await revokeOtherSecuritySessions(userId);
      setSecurityMessage('Other sessions signed out.');
      await refreshSecurityData();
    } catch (error: any) {
      setSecurityMessage(error?.message || 'Could not sign out other sessions.');
    } finally {
      setSecurityBusy(false);
    }
  };

  const handleAccountRecovery = async () => {
    if (!recoveryUsername || !recoveryCode || !recoveryPassword || !recoveryConfirmPassword) {
      setSecurityMessage('Complete the recovery form to continue.');
      return;
    }

    if (recoveryPassword !== recoveryConfirmPassword) {
      setSecurityMessage('Recovery password confirmation does not match.');
      return;
    }

    setSecurityBusy(true);
    setSecurityMessage('');

    try {
      const response = await recoverAccount(recoveryUsername, recoveryCode, recoveryPassword);
      if (response.session_token) {
        setSessionToken(response.session_token);
      }
      setSecurityMessage('Account recovered successfully with the backup code.');
      setRecoveryCode('');
      setRecoveryPassword('');
      setRecoveryConfirmPassword('');
      await refreshSecurityData();
    } catch (error: any) {
      setSecurityMessage(error?.message || 'Could not recover the account.');
    } finally {
      setSecurityBusy(false);
    }
  };

  const downloadAccountExport = async () => {
    if (!userId) {
      setAccountActionMessage('Please sign in again before exporting your data.');
      return;
    }

    setAccountBusy(true);
    setAccountActionMessage('');

    try {
      const data = await exportUserAccountData(userId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `junto-account-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setAccountActionMessage('Your account export is downloading now.');
    } catch (error: any) {
      setAccountActionMessage(error?.message || 'Could not export your account data.');
    } finally {
      setAccountBusy(false);
    }
  };

  const deleteAccount = async () => {
    if (!userId) {
      setAccountActionMessage('No active account found.');
      return;
    }

    const confirmed = window.confirm(
      'Delete your account? This will remove your profile, events, messages, subscriptions, notifications, and related data.'
    );

    if (!confirmed) {
      return;
    }

    setAccountBusy(true);
    setAccountActionMessage('');

    try {
      await deleteUserAccount(userId);
      clearSession();
      onNavigate('Landing');
    } catch (error: any) {
      setAccountActionMessage(error?.message || 'Could not delete your account.');
    } finally {
      setAccountBusy(false);
    }
  };

  const handleUnblockUser = async (blockedUserId: string) => {
    if (!userId) {
      setBlockedUsersMessage('No active account found.');
      return;
    }

    try {
      setBlockedUsersBusy(true);
      await unblockUser(userId, blockedUserId);
      removeBlockedUserRecord(blockedUserId);
      setBlockedUsers((current) => current.filter((user) => user.id !== blockedUserId));
      setBlockedUsersMessage('User unblocked.');
    } catch {
      removeBlockedUserRecord(blockedUserId);
      setBlockedUsers((current) => current.filter((user) => user.id !== blockedUserId));
      setBlockedUsersMessage('User removed from your blocked list.');
    } finally {
      setBlockedUsersBusy(false);
      window.setTimeout(() => setBlockedUsersMessage(''), 2200);
    }
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: <User className="w-5 h-5" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-5 h-5" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
    { id: 'preferences', label: 'Preferences', icon: <Globe className="w-5 h-5" /> },
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

              {/* Referral System */}
              <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">Referral System</h3>
                    <p className="text-sm text-slate-400 mt-1">Share your code and track invites</p>
                  </div>
                  <button
                    onClick={copyReferralLink}
                    disabled={!referralInfo?.link}
                    className="rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Copy Link
                  </button>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Your code</p>
                    <p className="mt-2 break-all font-mono text-sm text-white">{referralInfo?.code || 'Loading...'}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Successful invites</p>
                    <p className="mt-2 text-2xl font-bold text-white">{referralInfo?.referral_count ?? 0}</p>
                  </div>
                </div>

                {referralInfo?.referred_users?.length ? (
                  <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">People who used your code</p>
                    <div className="mt-3 space-y-2">
                      {referralInfo.referred_users.slice(0, 5).map((person) => (
                        <div key={person.id} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm">
                          <span className="text-white">{person.display_name || person.username || 'New user'}</span>
                          <span className="text-slate-400">{person.profile_id}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Data Export */}
              <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">Download Your Data</h3>
                    <p className="text-sm text-slate-400 mt-1">Export your profile, messages, notifications, and activity</p>
                  </div>
                  <button
                    onClick={downloadAccountExport}
                    disabled={accountBusy}
                    className="rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-300 transition hover:bg-blue-500/20 disabled:cursor-wait disabled:opacity-50"
                  >
                    {accountBusy ? 'Preparing...' : 'Export JSON'}
                  </button>
                </div>
              </div>

              {/* Account Deletion */}
              <div className="p-6 bg-white/5 border border-red-500/20 rounded-xl">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-red-300">Delete Account</h3>
                    <p className="text-sm text-slate-400 mt-1">Permanently remove your account and personal data</p>
                  </div>
                  <button
                    onClick={deleteAccount}
                    disabled={accountBusy}
                    className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-wait disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {accountActionMessage && (
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                  {accountActionMessage}
                </div>
              )}

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
              <div
                className="p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/8 transition-colors cursor-pointer"
                onClick={() => setActiveTab('security')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-slate-400" />
                    <div>
                      <h3 className="font-semibold">Password & Security</h3>
                      <p className="text-sm text-slate-400 mt-1">Change password, manage sessions, and generate backup codes</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </div>

              {/* Blocked Users */}
              <div className="p-6 bg-white/5 border border-white/10 rounded-xl space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-slate-400" />
                    <div>
                      <h3 className="font-semibold">Blocked Users</h3>
                      <p className="text-sm text-slate-400 mt-1">Manage your blocked list</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate('Safety')}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
                  >
                    Open Safety Centre
                  </button>
                </div>

                {blockedUsersMessage && (
                  <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                    {blockedUsersMessage}
                  </div>
                )}

                <div className="space-y-3">
                  {blockedUsersBusy && blockedUsers.length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400">
                      Loading blocked users...
                    </div>
                  ) : blockedUsers.length > 0 ? (
                    blockedUsers.map((blockedUser) => (
                      <div key={blockedUser.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-white">{blockedUser.name}</p>
                            <p className="mt-1 text-xs text-slate-400">
                              {blockedUser.reason || 'Blocked from your account'}
                            </p>
                            {blockedUser.blockedAt && (
                              <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                                {new Date(blockedUser.blockedAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleUnblockUser(blockedUser.id)}
                            disabled={blockedUsersBusy}
                            className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
                          >
                            Unblock
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400">
                      You have not blocked anyone yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Logout */}
              <motion.button
                onClick={() => {
                  handleLogout();
                  onNavigate('Landing');
                }}
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

          {/* Security Tab */}
          {activeTab === 'security' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4">
                  <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <KeyRound className="w-5 h-5 text-amber-300" />
                          <h3 className="text-lg font-semibold">Change Password</h3>
                        </div>
                        <p className="text-sm text-slate-400 mt-2">
                          Updating your password now revokes other sessions and refreshes your current session token.
                        </p>
                      </div>
                      <button
                        onClick={handleChangePassword}
                        disabled={securityBusy}
                        className="rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20 disabled:cursor-wait disabled:opacity-50"
                      >
                        {securityBusy ? 'Saving...' : 'Update Password'}
                      </button>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Current password"
                        className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-500/40"
                      />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New password"
                        className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-500/40"
                      />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-500/40"
                      />
                    </div>
                  </div>

                  <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-3">
                          <Laptop className="w-5 h-5 text-sky-300" />
                          <h3 className="text-lg font-semibold">Session Management</h3>
                        </div>
                        <p className="text-sm text-slate-400 mt-2">Review active sessions and revoke devices you no longer trust.</p>
                      </div>
                      <button
                        onClick={handleRevokeOtherSessions}
                        disabled={securityBusy}
                        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-wait disabled:opacity-50"
                      >
                        Sign out others
                      </button>
                    </div>

                    <div className="mt-4 space-y-3">
                      {securitySessions.length > 0 ? (
                        securitySessions.map((session, index) => (
                          <div key={session.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-white">{session.device_label || 'Unknown device'}</p>
                                  {session.active ? (
                                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                                      Active
                                    </span>
                                  ) : null}
                                </div>
                                <p className="mt-1 text-xs text-slate-400">
                                  {session.ip_address || 'IP unavailable'} · Last seen {session.last_seen_at ? new Date(session.last_seen_at).toLocaleString() : 'unknown'}
                                </p>
                                <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                                  Started {new Date(session.created_at).toLocaleString()}
                                </p>
                              </div>
                              <button
                                onClick={() => handleRevokeSession(session.id)}
                                disabled={securityBusy || !session.active}
                                className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Revoke
                              </button>
                            </div>
                          </div>
                        ))
                      ) : securityBusy ? (
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400">
                          Loading sessions...
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400">
                          No active sessions found.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-emerald-300" />
                      <h3 className="text-lg font-semibold">Backup Codes</h3>
                    </div>
                    <p className="text-sm text-slate-400 mt-2">
                      Generate one-time recovery codes for account recovery. Store them somewhere safe because they are shown only once.
                    </p>
                    <button
                      onClick={handleGenerateRecoveryCodes}
                      disabled={securityBusy}
                      className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-wait disabled:opacity-50"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Generate codes
                    </button>

                    {recoveryCodes.length > 0 && (
                      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Generated</p>
                            <p className="mt-1 text-sm text-slate-300">
                              {recoveryCodesGeneratedAt ? new Date(recoveryCodesGeneratedAt).toLocaleString() : 'Just now'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={handleCopyRecoveryCodes}
                              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
                            >
                              <Copy className="mr-1 inline w-3.5 h-3.5" />
                              Copy
                            </button>
                            <button
                              onClick={handleDownloadRecoveryCodes}
                              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
                            >
                              <Download className="mr-1 inline w-3.5 h-3.5" />
                              Download
                            </button>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-2">
                          {recoveryCodes.map((code) => (
                            <div key={code} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm tracking-[0.18em] text-white">
                              {code}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                    <div className="flex items-center gap-3">
                      <KeyRound className="w-5 h-5 text-cyan-300" />
                      <h3 className="text-lg font-semibold">Account Recovery</h3>
                    </div>
                    <p className="text-sm text-slate-400 mt-2">
                      Use a backup code to recover access if you are locked out of the account.
                    </p>

                    <div className="mt-4 space-y-3">
                      <input
                        type="text"
                        value={recoveryUsername}
                        onChange={(e) => setRecoveryUsername(e.target.value)}
                        placeholder="Username"
                        className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-500/40"
                      />
                      <input
                        type="text"
                        value={recoveryCode}
                        onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                        placeholder="Backup code"
                        className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-500/40"
                      />
                      <input
                        type="password"
                        value={recoveryPassword}
                        onChange={(e) => setRecoveryPassword(e.target.value)}
                        placeholder="New password"
                        className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-500/40"
                      />
                      <input
                        type="password"
                        value={recoveryConfirmPassword}
                        onChange={(e) => setRecoveryConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-500/40"
                      />
                      <button
                        onClick={handleAccountRecovery}
                        disabled={securityBusy}
                        className="w-full rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/20 disabled:cursor-wait disabled:opacity-50"
                      >
                        Recover Account
                      </button>
                    </div>
                  </div>

                  <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Clock3 className="w-5 h-5 text-slate-300" />
                      <h3 className="text-lg font-semibold">Security Activity</h3>
                    </div>
                    <p className="text-sm text-slate-400 mt-2">
                      A timeline of logins, password changes, session actions, and recovery events.
                    </p>

                    <div className="mt-4 space-y-3">
                      {securityActivity.length > 0 ? (
                        securityActivity.map((entry) => (
                          <div key={entry.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-white">{entry.title}</p>
                                <p className="mt-1 text-sm text-slate-400">{entry.description}</p>
                                <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                                  {entry.created_at ? new Date(entry.created_at).toLocaleString() : 'Unknown time'}
                                </p>
                              </div>
                              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                                {entry.type.replace(/_/g, ' ')}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : securityBusy ? (
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400">
                          Loading activity...
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400">
                          No security activity recorded yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {securityMessage && (
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                  {securityMessage}
                </div>
              )}
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

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                <LanguageSwitcher />
              </div>
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
                <h2 className="text-2xl font-bold mb-2">wantuu</h2>
                <p className="text-sm text-slate-400">Version 1.0.0</p>
                <p className="text-xs text-slate-500 mt-3">The easiest way to find fun plans nearby</p>
              </div>

              <div className="p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/8 transition-colors cursor-pointer" onClick={() => onNavigate('terms')}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Terms of Service</h3>
                    <p className="text-sm text-slate-400 mt-1">Read the legal terms that govern use of wantuu</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </div>

              <div className="p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/8 transition-colors cursor-pointer" onClick={() => onNavigate('privacy')}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Privacy Policy</h3>
                    <p className="text-sm text-slate-400 mt-1">See how we collect, use, and safeguard your data</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </div>

              <div className="p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/8 transition-colors cursor-pointer" onClick={() => onNavigate('help')}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Help & Support</h3>
                    <p className="text-sm text-slate-400 mt-1">Find answers, contact support, and browse FAQs</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </div>

              <div className="p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/8 transition-colors cursor-pointer" onClick={() => onNavigate('assessment')}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Comprehensive Assessment</h3>
                    <p className="text-sm text-slate-400 mt-1">Open the latest wantuu feature status report</p>
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
                  Love wantuu? Please rate us on the app store!
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
      <Sidebar activeNav="Settings" handleLogout={handleLogout} onNavigate={onNavigate} setActiveNav={setActiveNav} onCloseSidebar={onCloseSidebar} />
    </div>
  );
}
