import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
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
  Globe,
  ArrowLeft
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
  currentUser
}) => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId?: string }>();
  const [isEditing, setIsEditing] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [showMessage, setShowMessage] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState({
    name: 'Loading...',
    age: 0,
    dob: '',
    genderIdentity: '',
    occupation: '',
    bio: '',
    interests: [],
    reliabilityScore: 0,
    isVerified: false,
    location: '',
    profileId: '',
    visibility: {
      dob: 'private',
      genderIdentity: 'private',
      occupation: 'public',
      bio: 'public',
      photos: 'public',
    },
    introVideo: '',
    photos: [],
  });

  // Determine if viewing own profile or another user's
  const viewingUserId = userId;
  const isOwnProfile = !viewingUserId || viewingUserId === localStorage.getItem('userId')?.replace(/"/g, '');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        if (viewingUserId) {
          // Viewing another user's profile by ID
          console.log('Fetching profile for user:', viewingUserId);
          const response = await API.getUserById(viewingUserId);
          const userData = response.user || response;
          console.log('Profile data received:', userData);
          
          setProfile(prev => ({
            ...prev,
            name: userData.display_name || userData.full_name || userData.username || 'User',
            bio: userData.bio || 'No bio available',
            interests: userData.interests ? (typeof userData.interests === 'string' ? JSON.parse(userData.interests) : userData.interests) : [],
            location: userData.city || userData.location || 'Location not specified',
            profileId: userData.id || '',
            isVerified: userData.is_verified || true,
            reliabilityScore: 85,
            photos: userData.profile_photos ? (typeof userData.profile_photos === 'string' ? JSON.parse(userData.profile_photos) : userData.profile_photos) : [
              'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600',
              'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600',
            ]
          }));
        } else {
          // Viewing own profile
          const currentUserId = localStorage.getItem('userId')?.replace(/"/g, '');
          if (currentUserId) {
            console.log('Fetching own profile for user:', currentUserId);
            const response = await API.getUserById(currentUserId);
            const userData = response.user || response;
            console.log('Own profile data received:', userData);
            
            setProfile(prev => ({
              ...prev,
              name: userData.display_name || userData.full_name || userData.username || 'User',
              bio: userData.bio || 'No bio available',
              interests: userData.interests ? (typeof userData.interests === 'string' ? JSON.parse(userData.interests) : userData.interests) : [],
              location: userData.city || userData.location || 'Location not specified',
              profileId: userData.id || '',
              isVerified: userData.is_verified || true,
              reliabilityScore: 85,
              photos: userData.profile_photos ? (typeof userData.profile_photos === 'string' ? JSON.parse(userData.profile_photos) : userData.profile_photos) : [
                'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600',
                'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600',
              ]
            }));
          } else {
            setError('Please log in to view your profile');
          }
        }
      } catch (err: any) {
        console.error('Failed to fetch profile:', err);
        setError(err.message || 'Failed to load profile');
        // Set fallback data
        setProfile(prev => ({
          ...prev,
          name: 'Profile User',
          bio: 'Welcome to my profile!',
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [viewingUserId]);

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

  // Modern Dynamic Class Mappings
  const pageBg = isLightMode ? 'bg-[#FAF8F5] text-[#1E1915]' : 'bg-[#0B0B0E] text-[#F3F4F6]';
  const inputStyle = isLightMode
    ? 'border-amber-900/10 bg-amber-50/50 text-amber-950 focus:border-amber-500 focus:bg-white'
    : 'border-white/[0.08] bg-white/[0.03] text-white focus:border-yellow-500 focus:bg-white/[0.06]';

  return (
    <div className={`flex min-h-screen transition-colors duration-500 font-sans antialiased ${pageBg}`}>
      {/* Sidebar Layout Alignment */}
      <div className="relative z-50">
        <Sidebar activeNav="" setActiveNav={setActiveNav} onNavigate={onNavigate} onCloseSidebar={onCloseSidebar} />
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
        <header className={`border-b px-4 sm:px-6 py-4 sm:py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6 ${isLightMode ? 'border-amber-900/5 bg-white/40' : 'border-white/[0.04] bg-[#0B0B0E]/40'} backdrop-blur-md sticky top-0 z-40`}>
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {viewingUserId && (
              <button 
                onClick={() => navigate(-1)}
                className={`p-2 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0`}
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold truncate">{isOwnProfile ? 'Your Profile' : `${profile.name}'s Profile`}</h1>
              {error && <p className="text-xs sm:text-sm text-red-400 mt-1">{error}</p>}
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 flex-shrink-0">
            {isOwnProfile && (
              <>
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-3 sm:px-4 py-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-colors text-xs sm:text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      className="px-3 sm:px-4 py-2 rounded-lg bg-[#F59E0B] text-black hover:bg-[#F59E0B]/90 transition-colors text-xs sm:text-sm font-semibold"
                    >
                      Save
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg bg-[#F59E0B] text-black hover:bg-[#F59E0B]/90 transition-colors text-xs sm:text-sm font-semibold"
                  >
                    <Edit2 size={14} className="hidden sm:block" /> <span className="sm:hidden">Edit</span><span className="hidden sm:inline">Edit Profile</span>
                  </button>
                )}
              </>
            )}
            {!isOwnProfile && (
              <button className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg bg-[#F59E0B] text-black hover:bg-[#F59E0B]/90 transition-colors text-xs sm:text-sm font-semibold">
                <MessageCircle size={14} className="hidden sm:block" /> <span className="sm:hidden">Msg</span><span className="hidden sm:inline">Message</span>
              </button>
            )}
          </div>
        </header>

        {/* Dynamic Grid Layout Viewport */}
        <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-10 py-4 sm:py-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader className="animate-spin text-[#F59E0B]" size={32} />
            </div>
          ) : error && !profile.name.includes('Profile User') ? (
            <div className={`rounded-2xl p-4 sm:p-6 flex items-start sm:items-center gap-3 sm:gap-4 ${
              isLightMode 
                ? 'border-red-900/10 bg-red-50/50 text-red-900' 
                : 'border-red-500/20 bg-red-500/10 text-red-400'
            }`}>
              <X size={20} className="flex-shrink-0 mt-1 sm:mt-0" />
              <div>
                <p className="font-semibold text-sm">{error}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] xl:grid-cols-[1fr_360px] gap-4 sm:gap-6 md:gap-8">
          
          {/* Main Layout Stream */}
          <div className="space-y-8 min-w-0">
            
            {/* Premium Profile Billboard Section */}
            <div className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border transition-all duration-300 ${
              isLightMode 
                ? 'border-amber-900/10 bg-white shadow-[0_30px_70px_rgba(120,53,15,0.04)]' 
                : 'border-white/[0.05] bg-gradient-to-b from-[#131317] to-[#0A0A0D] shadow-2xl'
            }`}>
              {/* Dynamic Cover Drop */}
              <div className={`relative h-24 sm:h-40 md:h-48 lg:h-52 w-full overflow-hidden ${
                isLightMode 
                  ? 'bg-gradient-to-br from-amber-100 to-amber-200/40' 
                  : 'bg-gradient-to-br from-[#1F1C18] via-[#141419] to-[#0B0B0E]'
              }`}>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.12),transparent_60%)]" />
                <div className="absolute bottom-2 right-3 sm:bottom-4 sm:right-6 hidden sm:flex items-center gap-1.5 rounded-full bg-black/40 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-[11px] font-medium text-white/90 backdrop-blur-md">
                  <Globe size={10} className="sm:w-3 sm:h-3" />
                  <span className="hidden sm:inline">Publicly visible</span>
                </div>
              </div>

              {/* Identity Blueprint Block */}
              <div className="relative px-4 sm:px-6 pb-4 sm:pb-6 md:pb-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6 -mt-12 sm:-mt-16 md:-mt-20 mb-4 sm:mb-6">
                  {/* Avatar Engine */}
                  <div className="relative inline-block group">
                    <div className={`h-20 w-20 sm:h-28 md:h-36 sm:w-28 md:w-36 overflow-hidden rounded-xl sm:rounded-2xl border-[3px] sm:border-[4px] shadow-2xl transition-transform duration-300 group-hover:scale-[1.01] ${
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
                        className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 rounded-xl bg-yellow-500 p-1.5 sm:p-2.5 text-black shadow-lg hover:bg-yellow-400 transition-all"
                      >
                        <Camera size={14} className="sm:w-4 sm:h-4" />
                      </motion.button>
                    )}
                  </div>
                </div>

                {/* Profile Data Canvas */}
                <div className="max-w-2xl">
                  {isEditing ? (
                    <div className="space-y-3 sm:space-y-4 max-w-xl">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-60">Full Name</label>
                        <input
                          type="text"
                          value={profile.name}
                          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                          className={`w-full rounded-xl border px-3 sm:px-4 py-2 text-sm sm:text-base font-semibold outline-none transition-all ${inputStyle}`}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-60">Age</label>
                          <input
                            type="number"
                            value={profile.age}
                            onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value || '0', 10) })}
                            className={`w-full rounded-xl border px-3 sm:px-4 py-2 text-sm sm:text-base font-semibold outline-none transition-all ${inputStyle}`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-60">Location</label>
                          <input
                            type="text"
                            value={profile.location}
                            onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                            className={`w-full rounded-xl border px-3 sm:px-4 py-2 text-sm sm:text-base font-semibold outline-none transition-all ${inputStyle}`}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <h2 className={`text-lg sm:text-2xl md:text-3xl font-bold tracking-tight ${isLightMode ? 'text-amber-950' : 'text-white'}`}>
                          {profile.name}, <span className="opacity-80 text-sm sm:text-xl md:text-2xl">{profile.age}</span>
                        </h2>
                        {profile.isVerified && (
                          <div className="inline-flex items-center gap-1 rounded-full border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-green-400">
                            <ShieldCheck size={10} className="sm:w-3 sm:h-3" />
                            <span className="hidden sm:inline">Verified</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-2 flex items-center gap-2 text-xs sm:text-sm font-medium opacity-70">
                        <MapPin size={12} className="sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">{profile.location}</span>
                      </div>

                      <p className={`mt-3 sm:mt-4 text-xs sm:text-sm leading-relaxed ${isLightMode ? 'text-amber-900/80' : 'text-gray-300'}`}>
                        {profile.bio}
                      </p>
                    </div>
                  )}
                </div>

                {/* Micro Traits Matrix */}
                <div className={`mt-4 sm:mt-6 flex flex-wrap gap-1.5 sm:gap-2 border-t pt-3 sm:pt-5 ${isLightMode ? 'border-amber-900/5' : 'border-white/[0.04]'}`}>
                  {quickTraits.map((trait) => (
                    <span
                      key={trait}
                      className={`rounded-xl border px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold tracking-wide ${
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

          </aside>          </div>
          )}        </div>

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