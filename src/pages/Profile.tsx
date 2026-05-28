import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  CheckCircle2,
  ChevronRight,
  Download,
  Edit2,
  HelpCircle,
  LogOut,
  MapPin,
  Moon,
  Settings,
  ShieldCheck,
  Star,
  Sun,
  Video,
  Trash2,
  Loader,
  MessageCircle,
  Calendar,
  Briefcase,
  User,
  Eye,
  Plus,
  X,
  Award,
  Lock,
  Globe
} from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import * as API from '../services/api';

interface ProfileProps {
  selectedUser?: any;
  onNavigate?: (page: string) => void;
  isLightMode?: boolean;
  onToggleLightMode?: () => void;
  setActiveNav?: (nav: string) => void;
  onCloseSidebar?: () => void;
  currentUser?: any;
  handleLogout?: () => void;
}

const quickTraits = ['Reliable', 'Great communicator', 'Brunch planner', 'Weekend explorer'];

// --- PREMIUM REUSABLE SUB-COMPONENTS ---

interface StatCardProps {
  value: string | number;
  label: string;
  icon: React.ReactNode;
  isLightMode: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ value, label, icon, isLightMode }) => (
  <motion.div
    whileHover={{ y: -4, scale: 1.02 }}
    className={`relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 ${
      isLightMode
        ? 'border-amber-900/10 bg-white shadow-[0_8px_30px_rgb(120,53,15,0.04)]'
        : 'border-white/[0.06] bg-gradient-to-b from-[#16161a] to-[#0f0f12] shadow-xl'
    }`}
  >
    <div className="flex items-center justify-between">
      <span className={`text-2xl font-bold tracking-tight ${isLightMode ? 'text-amber-950' : 'text-white'}`}>
        {value}
      </span>
      <div className={`rounded-xl p-2 ${isLightMode ? 'bg-amber-100/80 text-amber-800' : 'bg-yellow-500/10 text-yellow-400'}`}>
        {icon}
      </div>
    </div>
    <p className={`mt-2 text-xs font-medium uppercase tracking-wider ${isLightMode ? 'text-amber-800/60' : 'text-gray-400'}`}>
      {label}
    </p>
  </motion.div>
);

interface WidgetCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  isLightMode: boolean;
  children: React.ReactNode;
  action?: React.ReactNode;
}

const WidgetCard: React.FC<WidgetCardProps> = ({ title, subtitle, icon, isLightMode, children, action }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    className={`relative rounded-3xl border p-5 sm:p-6 lg:p-8 transition-all duration-300 ${
      isLightMode
        ? 'border-amber-900/10 bg-white/90 shadow-[0_20px_50px_rgba(120,53,15,0.05)] backdrop-blur-md'
        : 'border-white/[0.05] bg-gradient-to-b from-[#141419] to-[#0c0c0f] shadow-2xl backdrop-blur-md'
    }`}
  >
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className={`rounded-xl p-2.5 ${isLightMode ? 'bg-amber-50 text-amber-700' : 'bg-white/[0.03] text-yellow-400'}`}>
            {icon}
          </div>
        )}
        <div>
          <h3 className={`text-lg font-bold tracking-tight ${isLightMode ? 'text-amber-950' : 'text-white'}`}>
            {title}
          </h3>
          {subtitle && (
            <p className={`text-xs mt-0.5 ${isLightMode ? 'text-amber-800/60' : 'text-gray-400'}`}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
    {children}
  </motion.div>
);

// --- MAIN PROFILE COMPONENT ---

export const Profile: React.FC<ProfileProps> = ({
  selectedUser,
  onNavigate = () => {},
  isLightMode = false,
  onToggleLightMode = () => {},
  setActiveNav = () => {},
  onCloseSidebar = () => {},
  currentUser,
  handleLogout
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [showMessage, setShowMessage] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPhoneVerify, setShowPhoneVerify] = useState(false);
  const [phoneVerifyOtp, setPhoneVerifyOtp] = useState('');
  const [phoneVerifyLoading, setPhoneVerifyLoading] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [idVerified, setIdVerified] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState(() => {
    // Try to get user data from localStorage for initial state
    let initialName = 'Sarah Adeyemi';
    let initialProfileId = 'JTO-9201-NG';
    
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        initialName = userData.name || userData.username || initialName;
        initialProfileId = userData.profile_id || initialProfileId;
      }
    } catch (e) {
      console.error('Failed to parse stored user:', e);
    }
    
    return {
      name: currentUser?.name || initialName,
      age: 26,
      dob: '1999-08-14',
      genderIdentity: 'Woman',
      occupation: 'Product Designer',
      bio: 'Adventure seeker, coffee lover, dog parent. Usually down for brunch, beach days, and spontaneous city plans.',
      interests: ['Hiking', 'Photography', 'Coffee', 'Art'],
      reliabilityScore: 92,
      isVerified: true,
      location: 'Lagos, Nigeria',
      profileId: currentUser?.profile_id || initialProfileId,
      visibility: {
        dob: 'private',
        genderIdentity: 'private',
        occupation: 'public',
        bio: 'public',
        photos: 'public',
      },
      introVideo: '',
      photos: [
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600',
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600',
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600',
      ],
    };
  });

  const isOwnProfile = !selectedUser;

  // Update profile with currentUser data when it changes
  useEffect(() => {
    if (currentUser && !selectedUser) {
      setProfile(prev => ({
        ...prev,
        name: currentUser.name || currentUser.username || prev.name,
        profileId: currentUser.profile_id || prev.profileId,
      }));
    }
  }, [currentUser, selectedUser]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        if (currentUser?.id) {
          const userProfile = await API.getUserProfile(currentUser.id);
          setProfile(prev => ({
            ...prev,
            name: userProfile.name || userProfile.display_name || prev.name,
            bio: userProfile.bio || prev.bio,
            interests: userProfile.interests || prev.interests,
            photos: userProfile.profile_photos || prev.photos,
            location: userProfile.location || prev.location,
          }));
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOwnProfile && currentUser?.id) {
      fetchProfile();
    }
  }, [currentUser?.id, isOwnProfile]);

  useEffect(() => {
    if (selectedUser) {
      setProfile(prev => ({
        ...prev,
        name: selectedUser.name || prev.name,
        age: selectedUser.age || prev.age,
        bio: selectedUser.bio || `Hey! I'm ${selectedUser.name}. Let's connect!`,
        interests: selectedUser.interests || prev.interests,
        location: selectedUser.location || 'Lagos, Nigeria',
        reliabilityScore: selectedUser.reliabilityScore || 92,
        isVerified: true,
      }));
      setLoading(false);
      setIsEditing(false);
    }
  }, [selectedUser]);

  const stats = {
    outings: 24,
    hosted: 5,
    reviews: 18,
    rating: 4.7,
  };

  const handleAddInterest = () => {
    if (newInterest.trim() && !profile.interests.includes(newInterest)) {
      setProfile({
        ...profile,
        interests: [...profile.interests, newInterest]
      });
      setNewInterest('');
      setShowMessage('Interest added!');
      setTimeout(() => setShowMessage(''), 2000);
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setProfile({
      ...profile,
      interests: profile.interests.filter(i => i !== interest)
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newPhotoUrl = event.target?.result as string;
        setProfile({
          ...profile,
          photos: [newPhotoUrl, ...profile.photos]
        });
        setShowPhotoUpload(false);
        setShowMessage('Photo added!');
        setTimeout(() => setShowMessage(''), 2000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    setShowMessage('Profile saved successfully!');
    setIsEditing(false);
    setTimeout(() => setShowMessage(''), 2000);
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      const userId = currentUser?.id || API.getUserId();
      
      if (!userId) {
        setShowMessage('Error: User ID not found');
        return;
      }

      await API.deleteUserAccount(userId);
      setShowMessage('Account deleted successfully');
      setTimeout(() => {
        handleLogout?.();
        onNavigate?.('landing');
      }, 1500);
    } catch (error) {
      console.error('Failed to delete account:', error);
      setShowMessage('Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Modern Dynamic Class Mappings
  const pageBg = isLightMode ? 'bg-[#FAF8F5] text-[#1E1915]' : 'bg-[#0B0B0E] text-[#F3F4F6]';
  const inputStyle = isLightMode
    ? 'border-amber-900/10 bg-amber-50/50 text-amber-950 focus:border-amber-500 focus:bg-white'
    : 'border-white/[0.08] bg-white/[0.03] text-white focus:border-yellow-500 focus:bg-white/[0.06]';

  return (
    <div className={`flex min-h-screen transition-colors duration-500 font-sans antialiased ${pageBg}`}>
      {/* Sidebar Layout Alignment */}
      <div className="relative z-50">
        <Sidebar
          activeNav="Profile"
          setActiveNav={setActiveNav}
          onNavigate={onNavigate}
          onCloseSidebar={onCloseSidebar}
          handleLogout={handleLogout}
        />
      </div>

      {/* Main Container */}
      <main className="relative ml-0 lg:ml-64 flex-1 overflow-x-hidden min-h-screen pb-24">
        {/* Subtle Brand Background Glow Accents */}
        <div className="absolute top-0 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-yellow-500/[0.03] blur-[120px] pointer-events-none" />
        <div className="absolute top-[300px] left-0 -z-10 h-[400px] w-[400px] rounded-full bg-amber-600/[0.02] blur-[100px] pointer-events-none" />

        {/* Global Toast Notification Toast */}
        <AnimatePresence>
          {showMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-full bg-neutral-900 px-5 py-3 text-sm font-medium text-white shadow-2xl border border-white/10 backdrop-blur-md"
            >
              <CheckCircle2 size={16} className="text-yellow-400" />
              <span>{showMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sub-Header Area */}
        <header className={`border-b px-6 py-6 sm:px-10 flex flex-wrap items-center justify-between gap-6 ${isLightMode ? 'border-amber-900/5 bg-white/40' : 'border-white/[0.04] bg-[#0B0B0E]/40'} backdrop-blur-md sticky top-0 z-40`}>
          <div>
            <span className={`text-[11px] font-bold uppercase tracking-[0.25em] ${isLightMode ? 'text-amber-800/70' : 'text-yellow-500/80'}`}>
              Account Settings
            </span>
            <h1 className={`text-xl font-bold tracking-tight mt-0.5 ${isLightMode ? 'text-amber-950' : 'text-white'}`}>
              {isOwnProfile ? 'Your Dashboard Profile' : `${profile.name}'s Profile`}
            </h1>
          </div>

          {/* Core Layout Utility Bar */}
          <div className="flex items-center gap-2.5">
            {isOwnProfile ? (
              <>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={onToggleLightMode}
                  className={`flex h-10 items-center gap-2 rounded-xl border px-4 text-xs font-semibold tracking-wide transition-all ${
                    isLightMode 
                      ? 'border-amber-900/10 bg-white hover:bg-amber-50 text-amber-950' 
                      : 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-gray-200'
                  }`}
                >
                  {isLightMode ? <Moon size={14} /> : <Sun size={14} />}
                  <span className="hidden sm:inline">{isLightMode ? 'Dark Theme' : 'Light Theme'}</span>
                </motion.button>

                <motion.button 
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onNavigate?.('settings')}
                  className={`h-10 w-10 flex items-center justify-center rounded-xl border transition-all ${
                    isLightMode ? 'border-amber-900/10 bg-white text-amber-950' : 'border-white/[0.08] bg-white/[0.03] text-gray-200'
                  }`}
                >
                  <Settings size={15} />
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                  className="h-10 flex items-center gap-2 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 px-5 text-xs font-bold text-black shadow-lg shadow-yellow-500/10 hover:brightness-105 transition-all"
                >
                  <Edit2 size={13} />
                  <span>{isEditing ? 'Save Changes' : 'Edit Profile'}</span>
                </motion.button>

                {isEditing && (
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setShowDeleteConfirm(true)}
                    className="h-10 flex items-center gap-2 rounded-xl bg-red-600/20 border border-red-500/30 px-5 text-xs font-bold text-red-500 hover:bg-red-600/30 transition-all"
                  >
                    <Trash2 size={13} />
                    <span>Delete Account</span>
                  </motion.button>
                )}
              </>
            ) : (
              <motion.button
                whileTap={{ scale: 0.96 }}
                className="h-10 flex items-center gap-2 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 px-5 text-xs font-bold text-black shadow-lg shadow-yellow-500/10 hover:brightness-105 transition-all"
              >
                <MessageCircle size={14} />
                <span>Message</span>
              </motion.button>
            )}
          </div>
        </header>

        {/* Dynamic Grid Layout Viewport */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-8 grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8">
          
          {/* Main Layout Stream */}
          <div className="space-y-8 min-w-0">
            
            {/* Premium Profile Billboard Section */}
            <div className={`relative overflow-hidden rounded-3xl border transition-all duration-300 ${
              isLightMode 
                ? 'border-amber-900/10 bg-white shadow-[0_30px_70px_rgba(120,53,15,0.04)]' 
                : 'border-white/[0.05] bg-gradient-to-b from-[#131317] to-[#0A0A0D] shadow-2xl'
            }`}>
              {/* Dynamic Cover Drop */}
              <div className={`relative h-40 sm:h-48 md:h-52 w-full overflow-hidden ${
                isLightMode 
                  ? 'bg-gradient-to-br from-amber-100 to-amber-200/40' 
                  : 'bg-gradient-to-br from-[#1F1C18] via-[#141419] to-[#0B0B0E]'
              }`}>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.12),transparent_60%)]" />
                <div className="absolute bottom-4 right-6 hidden sm:flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-[11px] font-medium text-white/90 backdrop-blur-md">
                  <Globe size={12} className="text-yellow-400" />
                  <span>Publicly visible profile</span>
                </div>
              </div>

              {/* Identity Blueprint Block */}
              <div className="relative px-6 pb-6 sm:pb-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 -mt-16 sm:-mt-20 mb-6">
                  {/* Avatar Engine */}
                  <div className="relative inline-block group">
                    <div className={`h-28 w-28 sm:h-36 sm:w-36 overflow-hidden rounded-2xl border-[4px] shadow-2xl transition-transform duration-300 group-hover:scale-[1.01] ${
                      isLightMode ? 'border-[#FAF8F5] bg-white' : 'border-[#0B0B0E] bg-[#141419]'
                    }`}>
                      <img
                        src={profile.photos[0]}
                        alt={profile.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    {isEditing && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-2 right-2 rounded-xl bg-yellow-500 p-2.5 text-black shadow-lg hover:bg-yellow-400 transition-all"
                      >
                        <Camera size={16} />
                      </motion.button>
                    )}
                  </div>
                </div>

                {/* Profile Data Canvas */}
                <div className="max-w-2xl">
                  {isEditing ? (
                    <div className="space-y-4 max-w-xl">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-60">Full Name</label>
                        <input
                          type="text"
                          value={profile.name}
                          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                          className={`w-full rounded-xl border px-4 py-2.5 text-base font-semibold outline-none transition-all ${inputStyle}`}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-60">Age</label>
                          <input
                            type="number"
                            value={profile.age}
                            onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value || '0', 10) })}
                            className={`w-full rounded-xl border px-4 py-2.5 text-base font-semibold outline-none transition-all ${inputStyle}`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-60">Location</label>
                          <input
                            type="text"
                            value={profile.location}
                            onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                            className={`w-full rounded-xl border px-4 py-2.5 text-base font-semibold outline-none transition-all ${inputStyle}`}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isLightMode ? 'text-amber-950' : 'text-white'}`}>
                          {profile.name}, <span className="opacity-80">{profile.age}</span>
                        </h2>
                        {profile.isVerified && (
                          <div className="inline-flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-400">
                            <ShieldCheck size={12} />
                            <span>Verified Connection</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-2 flex items-center gap-2 text-sm font-medium opacity-70">
                        <MapPin size={14} className="text-yellow-500" />
                        <span>{profile.location}</span>
                      </div>

                      <p className={`mt-4 text-sm leading-relaxed ${isLightMode ? 'text-amber-900/80' : 'text-gray-300'}`}>
                        {profile.bio}
                      </p>
                    </div>
                  )}
                </div>

                {/* Micro Traits Matrix */}
                <div className={`mt-6 flex flex-wrap gap-2 border-t pt-5 ${isLightMode ? 'border-amber-900/5' : 'border-white/[0.04]'}`}>
                  {quickTraits.map((trait) => (
                    <span
                      key={trait}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-semibold tracking-wide ${
                        isLightMode
                          ? 'border-amber-900/5 bg-amber-50 text-amber-950'
                          : 'border-white/[0.05] bg-white/[0.02] text-gray-300'
                      }`}
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Core Stats Block */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard value={stats.outings} label="Total Outings" icon={<Globe size={16} />} isLightMode={isLightMode} />
              <StatCard value={stats.hosted} label="Events Hosted" icon={<Award size={16} />} isLightMode={isLightMode} />
              <StatCard value={`★ ${stats.rating}`} label={`${stats.reviews} reviews`} icon={<Star size={16} />} isLightMode={isLightMode} />
              <StatCard value={`${profile.reliabilityScore}%`} label="Reliability" icon={<ShieldCheck size={16} />} isLightMode={isLightMode} />
            </div>

            {/* Panel Widget: Professional Identity Map */}
            <WidgetCard title="Identity Portfolio" subtitle="Key identity attributes visible to community members" icon={<User size={18} />} isLightMode={isLightMode}>
              {isEditing ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-60">Date of Birth</label>
                    <input
                      type="date"
                      value={profile.dob}
                      onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all ${inputStyle}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-60">Gender Identity</label>
                    <input
                      type="text"
                      value={profile.genderIdentity}
                      onChange={(e) => setProfile({ ...profile, genderIdentity: e.target.value })}
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all ${inputStyle}`}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-60">Occupation</label>
                    <input
                      type="text"
                      value={profile.occupation}
                      onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all ${inputStyle}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-60">Birthdate Privacy</label>
                    <select
                      value={profile.visibility.dob}
                      onChange={(e) => setProfile({ ...profile, visibility: { ...profile.visibility, dob: e.target.value } })}
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all ${inputStyle}`}
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-60">Occupation Privacy</label>
                    <select
                      value={profile.visibility.occupation}
                      onChange={(e) => setProfile({ ...profile, visibility: { ...profile.visibility, occupation: e.target.value } })}
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all ${inputStyle}`}
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {[
                    { label: 'Profile ID Token', value: profile.profileId, icon: <Lock size={12} />, meta: 'Secure internal reference' },
                    { label: 'Date of Birth', value: profile.dob, icon: <Calendar size={12} />, meta: `${profile.visibility.dob} view state` },
                    { label: 'Gender Alignment', value: profile.genderIdentity, icon: <User size={12} />, meta: `${profile.visibility.genderIdentity} visibility` },
                    { label: 'Current Profession', value: profile.occupation, icon: <Briefcase size={12} />, meta: `${profile.visibility.occupation} status` },
                    { label: 'Bio Feed Privacy', value: profile.visibility.bio, icon: <Eye size={12} />, meta: 'Feed global standard' },
                    { label: 'Media Authorization', value: profile.visibility.photos, icon: <Globe size={12} />, meta: 'Asset global scope' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`rounded-2xl border p-4 flex flex-col justify-between transition-all ${
                        isLightMode ? 'border-amber-900/5 bg-amber-50/30' : 'border-white/[0.04] bg-white/[0.01]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5 opacity-50">
                          {item.icon}
                          <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                        </div>
                        <p className={`mt-2 text-sm font-bold ${isLightMode ? 'text-amber-950' : 'text-white'}`}>
                          {item.value}
                        </p>
                      </div>
                      <span className="mt-3 text-[11px] opacity-40 block">{item.meta}</span>
                    </div>
                  ))}
                </div>
              )}
            </WidgetCard>

            {/* Panel Widget: Narrative Framework */}
            <WidgetCard title="Personal Interests & Bio" subtitle="Contextual traits that describe you" icon={<Award size={18} />} isLightMode={isLightMode}>
              {isEditing ? (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-60">Bio</label>
                    <textarea
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all ${inputStyle}`}
                      rows={4}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-60">Manage Interests</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {profile.interests.map((interest) => (
                        <span
                          key={interest}
                          className="inline-flex items-center gap-1 rounded-xl bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 text-xs font-semibold text-yellow-500"
                        >
                          {interest}
                          <button onClick={() => handleRemoveInterest(interest)} className="hover:text-red-400 transition-all ml-1">
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex gap-2 max-w-sm">
                      <input
                        type="text"
                        placeholder="Add interest tag..."
                        value={newInterest}
                        onChange={(e) => setNewInterest(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddInterest();
                            e.preventDefault();
                          }
                        }}
                        className={`flex-1 rounded-xl border px-3 py-1.5 text-xs outline-none transition-all ${inputStyle}`}
                      />
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleAddInterest}
                        className="rounded-xl bg-yellow-500 px-4 py-1.5 text-xs font-bold text-black shadow-md hover:bg-yellow-400 transition-all"
                      >
                        Add
                      </motion.button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                  <div>
                    <p className={`text-sm leading-relaxed ${isLightMode ? 'text-amber-900/80' : 'text-gray-300'}`}>
                      {profile.bio}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className={`rounded-xl border px-3 py-1 text-xs font-medium ${isLightMode ? 'bg-amber-50 text-amber-950' : 'bg-white/[0.02] text-gray-300'}`}>
                        {profile.occupation}
                      </span>
                      <span className={`rounded-xl border px-3 py-1 text-xs font-medium ${isLightMode ? 'bg-amber-50 text-amber-950' : 'bg-white/[0.02] text-gray-300'}`}>
                        {profile.genderIdentity}
                      </span>
                    </div>
                  </div>

                  <div className={`rounded-2xl border p-4 ${isLightMode ? 'border-amber-900/5 bg-amber-50/20' : 'border-white/[0.04] bg-white/[0.01]'}`}>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-50 block mb-3">
                      Interests Matrix
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.interests.map((interest) => (
                        <span
                          key={interest}
                          className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                            isLightMode 
                              ? 'border-amber-600/10 bg-amber-100/50 text-amber-900' 
                              : 'border-yellow-500/10 bg-yellow-500/[0.04] text-yellow-400'
                          }`}
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </WidgetCard>

            {/* Verification & Safety Section */}
            <WidgetCard title="Verification & Safety" subtitle="Build trust with verified credentials" icon={<ShieldCheck size={18} />} isLightMode={isLightMode}>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Phone Verification */}
                <motion.div
                  className={`rounded-2xl border p-4 transition-all ${
                    isLightMode ? 'border-amber-900/5 bg-amber-50/30' : 'border-white/[0.04] bg-white/[0.01]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`rounded-lg p-2 ${phoneVerified ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                        <Phone size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider opacity-60">Phone Verification</p>
                        <p className={`mt-1 text-sm font-semibold ${phoneVerified ? 'text-green-400' : 'text-yellow-300'}`}>
                          {phoneVerified ? '✓ Verified' : 'Not verified'}
                        </p>
                      </div>
                    </div>
                  </div>
                  {!phoneVerified && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowPhoneVerify(true)}
                      className="mt-3 w-full rounded-lg bg-yellow-500/20 border border-yellow-500/30 px-3 py-2 text-xs font-bold text-yellow-300 hover:bg-yellow-500/30 transition-all"
                    >
                      Verify Phone
                    </motion.button>
                  )}
                </motion.div>

                {/* ID Verification */}
                <motion.div
                  className={`rounded-2xl border p-4 transition-all ${
                    isLightMode ? 'border-amber-900/5 bg-amber-50/30' : 'border-white/[0.04] bg-white/[0.01]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`rounded-lg p-2 ${idVerified ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>
                        <Award size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider opacity-60">ID Verification</p>
                        <p className={`mt-1 text-sm font-semibold ${idVerified ? 'text-green-400' : 'text-gray-400'}`}>
                          {idVerified ? '✓ Verified' : 'Coming soon'}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </WidgetCard>

            {/* Panel Widget: Media Vault Layout */}
            <WidgetCard title="Media Gallery" subtitle="Visual presentation of your lifestyle profile" icon={<Camera size={18} />} isLightMode={isLightMode}>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {profile.photos.slice(0, 4).map((photo, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.02 }}
                    className={`group relative aspect-square overflow-hidden rounded-2xl border transition-all ${
                      isLightMode ? 'border-amber-900/10' : 'border-white/[0.08]'
                    }`}
                  >
                    <img
                      src={photo}
                      alt={`Asset allocation ${idx + 1}`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </motion.div>
                ))}
                
                {isEditing && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex aspect-square flex-col items-center justify-center rounded-2xl border border-dashed text-sm font-semibold transition-all ${
                      isLightMode
                        ? 'border-amber-900/20 bg-amber-50 text-amber-900 hover:bg-amber-100/60'
                        : 'border-white/[0.15] bg-white/[0.01] text-gray-400 hover:bg-white/[0.03]'
                    }`}
                  >
                    <Plus size={20} className="mb-1 text-yellow-500" />
                    <span>Upload</span>
                  </motion.button>
                )}

                <div className={`flex aspect-square flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all ${
                  isLightMode ? 'border-amber-900/5 bg-amber-50/20' : 'border-white/[0.04] bg-white/[0.01]'
                }`}>
                  <Video size={18} className="text-yellow-500 mb-1" />
                  <span className="text-[10px] font-bold uppercase tracking-wider block">Intro Video</span>
                  <span className="text-xs opacity-40 mt-1">
                    {profile.introVideo ? 'Active Profile Clip' : 'No Video'}
                  </span>
                </div>
              </div>
            </WidgetCard>

          </div>

          {/* Sidebar Widget Block Stack */}
          <aside className="space-y-6">
            
            {/* Trust Optimization Blueprint Widget */}
            <div className={`rounded-3xl border p-5 sm:p-6 transition-all ${
              isLightMode ? 'border-amber-900/10 bg-white' : 'border-white/[0.05] bg-[#141419]'
            }`}>
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck size={16} className="text-yellow-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Profile Status Score
                </h4>
              </div>
              
              <div className="flex items-end justify-between mb-2">
                <span className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">
                  88%
                </span>
                <span className="text-xs font-medium opacity-60">Excellent Integrity</span>
              </div>
              
              <div className={`h-2 w-full rounded-full overflow-hidden mb-4 ${isLightMode ? 'bg-amber-900/5' : 'bg-white/[0.08]'}`}>
                <div className="h-full w-[88%] rounded-full bg-gradient-to-r from-yellow-400 to-amber-500" />
              </div>
              
              <p className="text-xs opacity-60 leading-relaxed">
                Your absolute trustworthiness signals are active. Verification enhances priority discovery states across your locale.
              </p>
            </div>

            {/* Secondary Option Canvas Widget */}
            <WidgetCard title="App Interface" subtitle="Personalize operational views" icon={<Sun size={16} />} isLightMode={isLightMode}>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onToggleLightMode}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all ${
                  isLightMode
                    ? 'border-amber-900/10 bg-amber-50/50 text-amber-950 hover:bg-amber-100/50'
                    : 'border-white/[0.06] bg-white/[0.02] text-white hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isLightMode ? 'bg-white text-amber-950' : 'bg-white/[0.04] text-yellow-400'}`}>
                    {isLightMode ? <Moon size={14} /> : <Sun size={14} />}
                  </div>
                  <div>
                    <p className="text-xs font-bold">Theme Toggle Engine</p>
                    <p className="text-[11px] opacity-50 mt-0.5">Currently: {isLightMode ? 'Light View' : 'Dark View'}</p>
                  </div>
                </div>
                <ChevronRight size={14} className="opacity-40" />
              </motion.button>
            </WidgetCard>

          </aside>
        </div>

        {/* Delete Account Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !isDeleting && setShowDeleteConfirm(false)}
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              />
              
              {/* Modal */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className={`fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border p-8 shadow-2xl ${
                  isLightMode
                    ? 'border-amber-900/10 bg-white'
                    : 'border-white/[0.05] bg-[#0B0B0E]'
                }`}
              >
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
                    <Trash2 size={20} className="text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Delete Account?</h3>
                    <p className={`text-sm opacity-60 ${isLightMode ? 'text-amber-950' : 'text-gray-400'}`}>
                      This action cannot be undone
                    </p>
                  </div>
                </div>

                <div className={`mb-8 rounded-xl p-4 ${isLightMode ? 'bg-red-50 text-red-900' : 'bg-red-500/10 text-red-400'}`}>
                  <p className="text-sm font-medium">
                    All your data will be permanently deleted, including:
                  </p>
                  <ul className="mt-3 space-y-1 text-xs opacity-80">
                    <li>• Profile and personal information</li>
                    <li>• Events and applications</li>
                    <li>• Messages and conversations</li>
                    <li>• All account activity</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    className={`flex-1 rounded-lg border px-4 py-3 text-sm font-semibold transition-all ${
                      isLightMode
                        ? 'border-amber-900/10 bg-amber-50 text-amber-950 hover:bg-amber-100'
                        : 'border-white/[0.08] bg-white/[0.03] text-white hover:bg-white/[0.06]'
                    } ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="flex-1 rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isDeleting ? (
                      <>
                        <Loader size={14} className="animate-spin" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 size={14} />
                        <span>Delete Account</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Phone Verification Modal */}
        <AnimatePresence>
          {showPhoneVerify && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !phoneVerifyLoading && setShowPhoneVerify(false)}
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              />
              
              {/* Modal */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className={`fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border p-8 shadow-2xl ${
                  isLightMode
                    ? 'border-amber-900/10 bg-white'
                    : 'border-white/[0.05] bg-[#0B0B0E]'
                }`}
              >
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/20">
                    <Phone size={20} className="text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Verify Your Phone</h3>
                    <p className={`text-sm opacity-60 ${isLightMode ? 'text-amber-950' : 'text-gray-400'}`}>
                      Build trust by verifying your phone number
                    </p>
                  </div>
                </div>

                <div className="mb-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-60">Phone Number</label>
                    <input
                      type="tel"
                      value={currentUser?.phone || ''}
                      disabled
                      placeholder="+234 803 456 7890"
                      className={`w-full rounded-lg border px-4 py-3 text-sm outline-none opacity-60 cursor-not-allowed ${
                        isLightMode 
                          ? 'border-amber-900/10 bg-amber-50' 
                          : 'border-white/[0.08] bg-white/[0.03]'
                      }`}
                    />
                    <p className="text-[11px] text-gray-500 mt-1">From your registered account</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-60">Verification Code</label>
                    <input
                      type="text"
                      value={phoneVerifyOtp}
                      onChange={(e) => setPhoneVerifyOtp(e.target.value.slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      className={`w-full rounded-lg border px-4 py-3 text-sm text-center tracking-[0.5em] font-mono outline-none transition-all ${
                        isLightMode 
                          ? 'border-amber-600/20 focus:border-amber-600/50 bg-white' 
                          : 'border-white/[0.08] focus:border-yellow-500/50 bg-white/[0.03]'
                      }`}
                    />
                    <p className="text-[11px] text-gray-500 mt-1">Check your phone for a 6-digit code</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowPhoneVerify(false)}
                    disabled={phoneVerifyLoading}
                    className={`flex-1 rounded-lg border px-4 py-3 text-sm font-semibold transition-all ${
                      isLightMode
                        ? 'border-amber-900/10 bg-amber-50 text-amber-950 hover:bg-amber-100'
                        : 'border-white/[0.08] bg-white/[0.03] text-white hover:bg-white/[0.06]'
                    } ${phoneVerifyLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={async () => {
                      if (phoneVerifyOtp.length === 6) {
                        setPhoneVerifyLoading(true);
                        // Simulate OTP verification
                        setTimeout(() => {
                          setPhoneVerified(true);
                          setShowPhoneVerify(false);
                          setPhoneVerifyOtp('');
                          setShowMessage('✓ Phone verified successfully');
                          setTimeout(() => setShowMessage(''), 2000);
                          setPhoneVerifyLoading(false);
                        }, 1500);
                      }
                    }}
                    disabled={phoneVerifyLoading || phoneVerifyOtp.length !== 6}
                    className="flex-1 rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {phoneVerifyLoading ? (
                      <>
                        <Loader size={14} className="animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} />
                        <span>Verify</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Hidden Form Capture Handlers */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handlePhotoUpload}
          accept="image/*"
          className="hidden"
        />
      </main>
    </div>
  );
};
