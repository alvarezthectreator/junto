import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  BadgeCheck,
  Briefcase,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  Download,
  Edit2,
  Eye,
  Globe,
  HelpCircle,
  Lock,
  LogOut,
  Loader,
  MapPin,
  MessageCircle,
  Mail,
  Moon,
  Phone,
  Plus,
  RefreshCcw,
  Settings,
  ShieldCheck,
  Star,
  Sun,
  Trash2,
  User,
  Video,
  X
} from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { appConfig } from '../config/appConfig';
import * as API from '../services/api';
import { compressImageDataUrl } from '../utils/imageCompression';

interface ProfileProps {
  selectedUser?: any;
  onNavigate?: (page: string) => void;
  isLightMode?: boolean;
  onToggleLightMode?: () => void;
  setActiveNav?: (nav: string) => void;
  onCloseSidebar?: () => void;
  currentUser?: any;
  handleLogout?: () => void;
  startEditing?: boolean;
}

const quickTraits = ['Reliable', 'Great communicator', 'Brunch planner', 'Weekend explorer'];
const DEFAULT_AVATAR =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" role="img" aria-label="Avatar placeholder">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#2b2a3d"/>
          <stop offset="100%" stop-color="#151622"/>
        </linearGradient>
        <linearGradient id="hair" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f59e0b"/>
          <stop offset="100%" stop-color="#fcd34d"/>
        </linearGradient>
      </defs>
      <rect width="400" height="400" rx="48" fill="url(#bg)"/>
      <circle cx="200" cy="162" r="72" fill="#f6d2b8"/>
      <path d="M116 156c0-48 38-87 84-87s84 39 84 87c0 2-1 6-1 9-12-22-37-37-66-37-28 0-54 14-66 35-18 1-32 7-41 21-2-10-4-21-4-28Z" fill="#2a2438"/>
      <path d="M136 145c12-36 40-56 72-56 31 0 58 18 71 52-16-11-39-18-68-18-27 0-53 9-75 22Z" fill="url(#hair)"/>
      <circle cx="174" cy="161" r="8" fill="#3b2f2a"/>
      <circle cx="226" cy="161" r="8" fill="#3b2f2a"/>
      <path d="M172 188c9 10 20 15 28 15 10 0 19-4 28-13" fill="none" stroke="#c46a55" stroke-width="8" stroke-linecap="round"/>
      <path d="M122 336c14-52 46-79 78-79s64 26 78 79" fill="#f59e0b"/>
      <path d="M147 253c16 13 33 19 53 19 19 0 37-6 53-18l29 20c-18 30-43 46-82 46-38 0-65-17-82-47l29-20Z" fill="#f6d2b8"/>
    </svg>
  `);

const INTEREST_EMOJIS: Record<string, string> = {
  Music: '🎵',
  Food: '🍜',
  Travel: '✈️',
  Fitness: '💪',
  Movies: '🎬',
  Photography: '📸',
  Art: '🎨',
  Books: '📚',
  Gaming: '🎮',
  Nightlife: '🌃',
  Comedy: '😂',
  Wellness: '🧘',
  Hiking: '🥾',
  Coffee: '☕',
};

const LOCATION_FLAGS: Record<string, string> = {
  Lagos: '🇳🇬',
  Abuja: '🇳🇬',
  'Port Harcourt': '🇳🇬',
  Ibadan: '🇳🇬',
  Kano: '🇳🇬',
  Enugu: '🇳🇬',
  Accra: '🇬🇭',
  Nairobi: '🇰🇪',
};

const ALLOWED_PROFILE_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_PROFILE_IMAGE_BYTES = 8 * 1024 * 1024;
const MIN_NAME_LENGTH = 2;
const MIN_BIO_LENGTH = 40;
const MAX_BIO_LENGTH = 280;
const MAX_OCCUPATION_LENGTH = 80;
const MAX_LOCATION_LENGTH = 80;
const MAX_GENDER_LENGTH = 60;

type VerificationChannel = 'email' | 'phone';
type VerificationState = {
  verified: boolean;
  verifiedAt?: string | null;
  code?: string | null;
  loading: boolean;
};
type ProfileFieldErrors = Partial<Record<'name' | 'bio' | 'location' | 'occupation' | 'dob' | 'avatar' | 'email' | 'phone', string>>;

function getInterestEmoji(interest: string) {
  return INTEREST_EMOJIS[interest] || '✨';
}

function getLocationFlag(location?: string) {
  if (!location) return '📍';
  const matched = Object.entries(LOCATION_FLAGS).find(([key]) => location.toLowerCase().includes(key.toLowerCase()));
  return matched?.[1] || '📍';
}

function isDefaultAvatar(src?: string) {
  return !src || src === DEFAULT_AVATAR;
}

function resolveMediaUrl(value?: string) {
  if (!value || !value.trim()) {
    return '';
  }

  const trimmed = value.trim();
  if (isDataUrl(trimmed) || trimmed.startsWith('blob:') || /^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
    const backendOrigin = appConfig.apiBaseUrl.replace(/\/api\/?$/, '');
    return `${backendOrigin}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
  }

  return trimmed;
}

function getAgeFromDob(dob?: string) {
  if (!dob) {
    return null;
  }

  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age >= 0 ? age : null;
}

function getAvatarSrc(avatarImage?: string) {
  const resolved = resolveMediaUrl(avatarImage);
  return resolved || DEFAULT_AVATAR;
}

function readStoredCurrentUserSnapshot() {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const storedUser = localStorage.getItem('currentUser');
    return storedUser ? JSON.parse(storedUser) : {};
  } catch {
    return {};
  }
}

function isDataUrl(value?: string) {
  return typeof value === 'string' && value.startsWith('data:');
}

function isValidProfileImageSource(value?: string) {
  if (!value || !value.trim()) {
    return false;
  }

  const trimmed = value.trim();
  return (
    isDataUrl(trimmed) ||
    trimmed.startsWith('blob:') ||
    /^https?:\/\//i.test(trimmed) ||
    trimmed.startsWith('/uploads/') ||
    trimmed.startsWith('uploads/')
  );
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeProfileText(value: string, maxLength: number) {
  return value.trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function validateProfileDraft(profile: {
  name: string;
  bio: string;
  interests: string[];
  avatarImage: string;
  photos: string[];
  location: string;
  occupation: string;
  dob: string;
  genderIdentity: string;
}) {
  const errors: ProfileFieldErrors = {};
  const name = profile.name.trim();
  const bio = profile.bio.trim();
  const location = profile.location.trim();
  const occupation = profile.occupation.trim();
  const genderIdentity = profile.genderIdentity.trim();
  const age = profile.dob ? getAgeFromDob(profile.dob) : null;

  if (name.length < MIN_NAME_LENGTH) {
    errors.name = 'Please enter a display name.';
  } else if (name.length > 60) {
    errors.name = 'Names should be 60 characters or less.';
  }

  if (bio.length < MIN_BIO_LENGTH) {
    errors.bio = `Your bio should be at least ${MIN_BIO_LENGTH} characters.`;
  } else if (bio.length > MAX_BIO_LENGTH) {
    errors.bio = `Your bio should be ${MAX_BIO_LENGTH} characters or less.`;
  }

  if (!isDefaultAvatar(profile.avatarImage)) {
    if (!isValidProfileImageSource(profile.avatarImage)) {
      errors.avatar = 'Use a valid profile image URL or upload a new image.';
    }
  } else {
    errors.avatar = 'Add a clear profile picture before saving.';
  }

  if (profile.photos.filter(Boolean).length > 4) {
    errors.avatar = 'Keep your gallery to 4 photos or fewer.';
  }

  if (location.length > MAX_LOCATION_LENGTH) {
    errors.location = `Location should be ${MAX_LOCATION_LENGTH} characters or less.`;
  }

  if (occupation.length > MAX_OCCUPATION_LENGTH) {
    errors.occupation = `Occupation should be ${MAX_OCCUPATION_LENGTH} characters or less.`;
  }

  if (genderIdentity.length > MAX_GENDER_LENGTH) {
    errors.occupation = 'Gender identity text is too long.';
  }

  if (profile.dob) {
    if (Number.isNaN(new Date(profile.dob).getTime())) {
      errors.dob = 'Please choose a valid birthdate.';
    } else if (age !== null && age < 18) {
      errors.dob = 'You must be at least 18 years old to use Junto.';
    }
  }

  if (profile.interests.length < 2) {
    errors.bio = errors.bio || 'Add at least 2 interests so your profile feels complete.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

function getFirstErrorMessage(errors: ProfileFieldErrors) {
  const orderedKeys: (keyof ProfileFieldErrors)[] = ['name', 'avatar', 'bio', 'location', 'occupation', 'dob', 'email', 'phone'];
  for (const key of orderedKeys) {
    if (errors[key]) {
      return errors[key] as string;
    }
  }
  return '';
}

function calculateReliabilityScore(profile: {
  bio: string;
  interests: string[];
  photos: string[];
  avatarImage: string;
  introVideo: string;
  dob: string;
  occupation: string;
}) {
  const completenessScore =
    (profile.bio.trim().length >= 80 ? 14 : profile.bio.trim().length >= 40 ? 8 : 0) +
    (profile.interests.length >= 4 ? 12 : profile.interests.length >= 2 ? 7 : 0) +
    (!isDefaultAvatar(profile.avatarImage) ? 10 : 0) +
    (profile.photos.length >= 2 ? 12 : profile.photos.length >= 1 ? 8 : 0) +
    (profile.introVideo ? 8 : 0) +
    (profile.dob ? 12 : 0) +
    (profile.occupation.trim() ? 6 : 0);

  const trustSignals =
    25 +
    (profile.bio.trim().length >= 80 ? 5 : 0) +
    (profile.interests.length >= 3 ? 5 : 0) +
    (!isDefaultAvatar(profile.avatarImage) ? 4 : 0) +
    (profile.photos.length >= 2 ? 4 : 0) +
    (profile.introVideo ? 5 : 0);

  return clampScore(Math.max(42, Math.min(98, completenessScore + trustSignals)));
}

function getProfileCompletion(profile: {
  name: string;
  bio: string;
  interests: string[];
  photos: string[];
  avatarImage: string;
  introVideo: string;
  dob: string;
  occupation: string;
  location: string;
}) {
  const checklist = [
    { key: 'name', label: 'Name', done: profile.name.trim().length >= 2, weight: 12 },
    { key: 'bio', label: 'Bio', done: profile.bio.trim().length >= 40, weight: 16 },
    { key: 'avatar', label: 'Avatar', done: !isDefaultAvatar(profile.avatarImage), weight: 12 },
    { key: 'photos', label: 'Gallery', done: profile.photos.length >= 2, weight: 16 },
    { key: 'interests', label: 'Interests', done: profile.interests.length >= 3, weight: 12 },
    { key: 'location', label: 'Location', done: profile.location.trim().length >= 2, weight: 10 },
    { key: 'occupation', label: 'Occupation', done: profile.occupation.trim().length >= 2, weight: 8 },
    { key: 'dob', label: 'Birthdate', done: Boolean(profile.dob), weight: 10 },
    { key: 'introVideo', label: 'Intro video', done: Boolean(profile.introVideo), weight: 14 },
  ];

  const completion = checklist.reduce((total, item) => total + (item.done ? item.weight : 0), 0);
  return {
    completion: clampScore(completion),
    checklist,
  };
}

function pickServerReliabilityScore(profile: any): number | null {
  const candidate = [
    profile?.reliability_score,
    profile?.reliabilityScore,
    profile?.trust_score,
    profile?.profile_completion_score,
    profile?.profile_completion_percent,
  ].find((value) => typeof value === 'number' && Number.isFinite(value));

  return typeof candidate === 'number' ? clampScore(candidate) : null;
}

function getAspectRatioValue(aspect: string): number {
  switch (aspect) {
    case 'portrait':
      return 4 / 5;
    case 'landscape':
      return 16 / 9;
    case 'story':
      return 9 / 16;
    default:
      return 1;
  }
}

async function loadImageFromDataUrl(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

async function editPhotoDataUrl(
  dataUrl: string,
  options: { aspectRatio: number; rotation: number; zoom: number }
) {
  if (!dataUrl) return dataUrl;

  const image = await loadImageFromDataUrl(dataUrl);
  const safeZoom = Math.max(1, options.zoom || 1);
  const rotation = ((options.rotation % 360) + 360) % 360;
  const radians = (rotation * Math.PI) / 180;

  const scaledWidth = image.width * safeZoom;
  const scaledHeight = image.height * safeZoom;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));
  const rotatedWidth = Math.max(1, Math.floor(scaledWidth * cos + scaledHeight * sin));
  const rotatedHeight = Math.max(1, Math.floor(scaledWidth * sin + scaledHeight * cos));

  const rotatedCanvas = document.createElement('canvas');
  rotatedCanvas.width = rotatedWidth;
  rotatedCanvas.height = rotatedHeight;

  const rotatedContext = rotatedCanvas.getContext('2d');
  if (!rotatedContext) {
    return dataUrl;
  }

  rotatedContext.translate(rotatedWidth / 2, rotatedHeight / 2);
  rotatedContext.rotate(radians);
  rotatedContext.drawImage(image, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);

  const targetAspect = options.aspectRatio || 1;
  let cropWidth = rotatedWidth;
  let cropHeight = Math.round(cropWidth / targetAspect);

  if (cropHeight > rotatedHeight) {
    cropHeight = rotatedHeight;
    cropWidth = Math.round(cropHeight * targetAspect);
  }

  cropWidth = Math.max(1, cropWidth);
  cropHeight = Math.max(1, cropHeight);

  const cropX = Math.max(0, Math.floor((rotatedWidth - cropWidth) / 2));
  const cropY = Math.max(0, Math.floor((rotatedHeight - cropHeight) / 2));

  const maxDimension = 1280;
  let outputWidth = cropWidth;
  let outputHeight = cropHeight;
  const largestDimension = Math.max(outputWidth, outputHeight);
  if (largestDimension > maxDimension) {
    const scale = maxDimension / largestDimension;
    outputWidth = Math.max(1, Math.round(outputWidth * scale));
    outputHeight = Math.max(1, Math.round(outputHeight * scale));
  }

  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = outputWidth;
  outputCanvas.height = outputHeight;

  const outputContext = outputCanvas.getContext('2d');
  if (!outputContext) {
    return dataUrl;
  }

  outputContext.drawImage(
    rotatedCanvas,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    outputWidth,
    outputHeight
  );

  return outputCanvas.toDataURL('image/jpeg', 0.9);
}

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
  handleLogout,
  startEditing = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showMessage, setShowMessage] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [verificationModal, setVerificationModal] = useState<{
    channel: VerificationChannel;
    destination: string;
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationResendLoading, setVerificationResendLoading] = useState(false);
  const [verificationState, setVerificationState] = useState<Record<VerificationChannel, VerificationState>>({
    email: { verified: false, verifiedAt: null, code: null, loading: false },
    phone: { verified: false, verifiedAt: null, code: null, loading: false },
  });
  const [identityVerified, setIdentityVerified] = useState(false);
  const [identityScore, setIdentityScore] = useState<number | null>(null);
  const [identityRiskLevel, setIdentityRiskLevel] = useState('');
  const [identityStatusLoading, setIdentityStatusLoading] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileValidationError, setProfileValidationError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({});
  const [serverReliabilityScore, setServerReliabilityScore] = useState<number | null>(null);
  const [photoEditorOpen, setPhotoEditorOpen] = useState(false);
  const [photoEditorSource, setPhotoEditorSource] = useState('');
  const [photoEditorRotation, setPhotoEditorRotation] = useState(0);
  const [photoEditorZoom, setPhotoEditorZoom] = useState(1);
  const [photoEditorAspect, setPhotoEditorAspect] = useState('square');
  const [photoEditorBusy, setPhotoEditorBusy] = useState(false);
  const [profileCompletionProgress, setProfileCompletionProgress] = useState(0);
  const [photoUploadTarget, setPhotoUploadTarget] = useState<'avatar' | { type: 'gallery'; index: number } | null>(null);
  const [hostedEventsCount, setHostedEventsCount] = useState<number | null>(null);
  const [showPhoneVerify, setShowPhoneVerify] = useState(false);
const [phoneVerifyOtp, setPhoneVerifyOtp] = useState('');
  const [phoneVerifyLoading, setPhoneVerifyLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const storedUserSnapshot = readStoredCurrentUserSnapshot();
  
  const [profile, setProfile] = useState(() => {
    // Try to get user data from localStorage for initial state
    let initialName = 'Sarah Adeyemi';
    let initialProfileId = 'JTO-9201-NG';
    let initialDob = '';
    let initialGender = '';
    let initialOccupation = '';
    let initialAvatar = DEFAULT_AVATAR;
    let initialPhotos: string[] = [];
    
    try {
      const userData = storedUserSnapshot;
      if (userData && typeof userData === 'object') {
        initialName = userData.username || userData.name || initialName;
        initialProfileId = userData.profile_id || initialProfileId;
        initialDob = userData.date_of_birth || '';
        initialGender = userData.gender || '';
        initialOccupation = userData.occupation || '';
        initialAvatar = getAvatarSrc(
          userData.avatar_image ||
          userData.avatar_url ||
          userData.avatarImage ||
          (Array.isArray(userData.profile_photos) ? userData.profile_photos[0] : '') ||
          initialAvatar
        );
        initialPhotos = Array.isArray(userData.profile_photos) ? userData.profile_photos.slice(1, 5) : [];
      }
    } catch (e) {
      console.error('Failed to parse stored user:', e);
    }
    
    return {
      name: currentUser?.username || currentUser?.name || initialName,
      age: currentUser?.date_of_birth ? getAgeFromDob(currentUser.date_of_birth) : (initialDob ? getAgeFromDob(initialDob) : null),
      dob: currentUser?.date_of_birth || initialDob,
      genderIdentity: currentUser?.gender || initialGender,
      occupation: currentUser?.occupation || initialOccupation,
      bio: '',
      interests: [],
      reliabilityScore: 0,
      isVerified: true,
      location: 'Lagos, Nigeria',
      profileId: currentUser?.profile_id || initialProfileId,
        avatarImage: getAvatarSrc(
          currentUser?.avatar_image ||
          currentUser?.avatar_url ||
          currentUser?.avatarImage ||
          (Array.isArray(currentUser?.profile_photos) ? currentUser.profile_photos[0] : '') ||
          initialAvatar
      ),
      visibility: {
        dob: 'private',
        genderIdentity: 'private',
        occupation: 'public',
        bio: 'public',
        photos: 'public',
      },
      introVideo: '',
      photos: Array.isArray(currentUser?.profile_photos) ? currentUser.profile_photos.slice(1, 5) : initialPhotos,
    };
  });

  const isOwnProfile = !selectedUser;

  // Update profile with currentUser data when it changes
  useEffect(() => {
    if (currentUser && !selectedUser) {
    setProfile(prev => ({
        ...prev,
        name: currentUser.username || currentUser.name || prev.name,
        profileId: currentUser.profile_id || prev.profileId,
        avatarImage: getAvatarSrc(
          currentUser.avatar_image ||
          currentUser.avatar_url ||
          currentUser.avatarImage ||
          (Array.isArray(currentUser.profile_photos) ? currentUser.profile_photos[0] : '') ||
          prev.avatarImage
        ),
        photos: Array.isArray(currentUser.profile_photos) ? currentUser.profile_photos.slice(1, 5) : prev.photos,
      }));
    }
  }, [currentUser, selectedUser]);

  useEffect(() => {
    if (startEditing && isOwnProfile) {
      setIsEditing(true);
    }
  }, [startEditing, isOwnProfile]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        if (currentUser?.id) {
          const userProfile = await API.getUserProfile(currentUser.id);
          const serverPhotos = Array.isArray(userProfile.profile_photos) ? userProfile.profile_photos : [];
          const nextServerReliabilityScore = pickServerReliabilityScore(userProfile);
          setProfile(prev => ({
            ...prev,
            name: currentUser?.username || userProfile.username || userProfile.display_name || userProfile.full_name || userProfile.name || prev.name,
            age: userProfile.date_of_birth ? getAgeFromDob(userProfile.date_of_birth) : null,
            dob: userProfile.date_of_birth || prev.dob,
            bio: userProfile.bio || prev.bio,
            interests: userProfile.interests || prev.interests,
            genderIdentity: userProfile.gender || prev.genderIdentity,
            avatarImage: getAvatarSrc(
              userProfile.avatar_image ||
              userProfile.avatar_url ||
              userProfile.profile_photo ||
              storedUserSnapshot.avatar_image ||
              storedUserSnapshot.avatar_url ||
              storedUserSnapshot.avatarImage ||
              (Array.isArray(storedUserSnapshot.profile_photos) ? storedUserSnapshot.profile_photos[0] : '') ||
              serverPhotos[0] ||
              prev.avatarImage
            ),
            photos: serverPhotos.length > 0 ? serverPhotos.slice(1) : (Array.isArray(storedUserSnapshot.profile_photos) ? storedUserSnapshot.profile_photos.slice(1, 5) : prev.photos),
            introVideo: userProfile.intro_video_url || prev.introVideo,
            location: userProfile.location || userProfile.city || prev.location,
            reliabilityScore: calculateReliabilityScore({
              bio: userProfile.bio || prev.bio,
              interests: userProfile.interests || prev.interests,
              photos: serverPhotos.length > 0 ? serverPhotos.slice(1) : (Array.isArray(storedUserSnapshot.profile_photos) ? storedUserSnapshot.profile_photos.slice(1, 5) : prev.photos),
              avatarImage: getAvatarSrc(
                userProfile.avatar_image ||
                userProfile.avatar_url ||
                userProfile.profile_photo ||
                storedUserSnapshot.avatar_image ||
                storedUserSnapshot.avatar_url ||
                storedUserSnapshot.avatarImage ||
                (Array.isArray(storedUserSnapshot.profile_photos) ? storedUserSnapshot.profile_photos[0] : '') ||
                serverPhotos[0] ||
                prev.avatarImage
              ),
              introVideo: userProfile.intro_video_url || prev.introVideo,
              dob: userProfile.date_of_birth || prev.dob,
              occupation: userProfile.occupation || prev.occupation,
            }),
          }));
          setServerReliabilityScore(nextServerReliabilityScore);
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
      const selectedAvatar = getAvatarSrc(selectedUser.avatarImage || selectedUser.photo || selectedUser.avatar);
      setProfile(prev => ({
        ...prev,
        name: selectedUser.name || prev.name,
        age: selectedUser.age ?? null,
        bio: selectedUser.bio || `Hey! I'm ${selectedUser.name}. Let's connect!`,
        interests: selectedUser.interests || prev.interests,
        location: selectedUser.location || 'Lagos, Nigeria',
        avatarImage: selectedAvatar,
        genderIdentity: selectedUser.gender || prev.genderIdentity,
        reliabilityScore: selectedUser.reliabilityScore || calculateReliabilityScore({
          bio: selectedUser.bio || prev.bio,
          interests: selectedUser.interests || prev.interests,
          photos: prev.photos,
          avatarImage: selectedAvatar,
          introVideo: prev.introVideo,
          dob: prev.dob,
          occupation: prev.occupation,
        }),
        isVerified: true,
      }));
      setServerReliabilityScore(pickServerReliabilityScore(selectedUser));
      setLoading(false);
      setIsEditing(false);
    }
  }, [selectedUser]);

  useEffect(() => {
    const fetchHostedEventsCount = async () => {
      if (!isOwnProfile || !currentUser?.id) {
        setHostedEventsCount(selectedUser?.eventsHosted ?? 0);
        return;
      }

      try {
        const response = await API.getHostEvents(currentUser.id);
        setHostedEventsCount(Array.isArray(response.events) ? response.events.length : 0);
      } catch (error) {
        console.error('Failed to load hosted events count:', error);
        setHostedEventsCount(0);
      }
    };

    fetchHostedEventsCount();
  }, [currentUser?.id, isOwnProfile, selectedUser?.eventsHosted]);

  useEffect(() => {
    const loadTrustSignals = async () => {
      if (!isOwnProfile || !currentUser?.id) {
        return;
      }

      setIdentityStatusLoading(true);
      try {
        const [emailStatus, phoneStatus, fraudStatus] = await Promise.all([
          API.checkVerificationStatus(currentUser.id, 'email').catch(() => null),
          API.checkVerificationStatus(currentUser.id, 'phone').catch(() => null),
          API.getUserFraudStatus(currentUser.id).catch(() => null),
        ]);

        setVerificationState({
          email: {
            verified: Boolean(emailStatus?.is_verified),
            verifiedAt: emailStatus?.verified_at || null,
            code: null,
            loading: false,
          },
          phone: {
            verified: Boolean(phoneStatus?.is_verified),
            verifiedAt: phoneStatus?.verified_at || null,
            code: null,
            loading: false,
          },
        });

        if (fraudStatus?.fraud_status) {
          const status = fraudStatus.fraud_status;
          setIdentityScore(typeof status.identity_score === 'number' ? clampScore(status.identity_score) : null);
          setIdentityRiskLevel(String(status.risk_level || ''));
          setIdentityVerified(
            status.verification_status === 'verified' ||
            (typeof status.identity_score === 'number' && status.identity_score >= 75)
          );
        }
      } catch (error) {
        console.error('Failed to load trust signals:', error);
      } finally {
        setIdentityStatusLoading(false);
      }
    };

    void loadTrustSignals();
  }, [currentUser?.id, isOwnProfile]);

  const stats = {
    outings: 24,
    hosted: hostedEventsCount ?? 0,
    reviews: 18,
    rating: 4.7,
  };
  const phoneVerified = Boolean(verificationState?.phone?.verified);
  const idVerified = identityVerified;
  const computedReliabilityScore = calculateReliabilityScore(profile);
  const displayReliabilityScore = serverReliabilityScore ?? computedReliabilityScore;
  const profileCompletion = getProfileCompletion(profile);
  const displayAge = getAgeFromDob(profile.dob);

  useEffect(() => {
    setProfileCompletionProgress(profileCompletion.completion);
  }, [profileCompletion.completion]);

  const handleAddInterest = () => {
    const nextInterest = newInterest.trim();
    if (nextInterest && !profile.interests.some((interest) => interest.toLowerCase() === nextInterest.toLowerCase())) {
      setProfile({
        ...profile,
        interests: [...profile.interests, nextInterest].slice(0, 12)
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

  const resetPhotoEditor = () => {
    setPhotoEditorSource('');
    setPhotoEditorRotation(0);
    setPhotoEditorZoom(1);
    setPhotoEditorAspect('square');
    setPhotoEditorBusy(false);
    setPhotoUploadTarget(null);
  };

  const openPhotoEditorWithFile = (dataUrl: string, target: 'avatar' | { type: 'gallery'; index: number }) => {
    setPhotoEditorSource(dataUrl);
    setPhotoEditorRotation(0);
    setPhotoEditorZoom(1);
    setPhotoEditorAspect(target === 'avatar' ? 'square' : 'portrait');
    setPhotoEditorBusy(false);
    setPhotoEditorOpen(true);
  };

  const beginPhotoUpload = (target: 'avatar' | { type: 'gallery'; index: number }) => {
    setPhotoUploadTarget(target);
    fileInputRef.current?.click();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) {
      if (!ALLOWED_PROFILE_IMAGE_TYPES.includes(file.type.toLowerCase())) {
        setProfileValidationError('Please upload a JPG, PNG, or WebP image.');
        return;
      }

      if (file.size > MAX_PROFILE_IMAGE_BYTES) {
        setProfileValidationError('Images must be 8MB or smaller.');
        return;
      }

      const reader = new FileReader();
      reader.onload = async (event) => {
        const source = String(event.target?.result || '');
        if (!source) {
          setProfileValidationError('Could not read that photo. Please try again.');
          return;
        }
        openPhotoEditorWithFile(source, photoUploadTarget ?? 'avatar');
        setProfileValidationError('');
        setShowMessage('Photo added!');
        setTimeout(() => setShowMessage(''), 2000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyPhotoEdit = async () => {
    if (!photoEditorSource) {
      setProfileValidationError('Select a photo first.');
      return;
    }

    setPhotoEditorBusy(true);
    try {
      const edited = await editPhotoDataUrl(photoEditorSource, {
        aspectRatio: getAspectRatioValue(photoEditorAspect),
        rotation: photoEditorRotation,
        zoom: photoEditorZoom,
      });
      const compressed = await compressImageDataUrl(edited, { maxDimension: 1280, quality: 0.84, maxBytes: 900000 });
      let storedUrl = compressed;
      try {
        const uploaded = await API.uploadMedia(compressed, {
          fileName: `profile-photo-${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
          folder: 'profiles',
        });
        storedUrl = uploaded.url;
      } catch (uploadError) {
        console.warn('Falling back to local image data for profile photo:', uploadError);
      }
      const nextGallery = [...profile.photos];
      if (photoUploadTarget && typeof photoUploadTarget === 'object' && photoUploadTarget.type === 'gallery') {
        while (nextGallery.length <= photoUploadTarget.index) {
          nextGallery.push('');
        }
        nextGallery[photoUploadTarget.index] = storedUrl;
      }
      const nextProfile = {
        ...profile,
        avatarImage: photoUploadTarget === 'avatar' ? storedUrl : profile.avatarImage,
        photos: photoUploadTarget === 'avatar' ? profile.photos : nextGallery,
      };

      const persistedMedia = [nextProfile.avatarImage, ...nextProfile.photos].filter(Boolean);
      setProfile({
        ...nextProfile,
        reliabilityScore: calculateReliabilityScore(nextProfile),
      });

      try {
        const storedUserRaw = localStorage.getItem('currentUser');
        const storedUser = storedUserRaw ? JSON.parse(storedUserRaw) : {};
        localStorage.setItem(
          'currentUser',
            JSON.stringify({
              ...storedUser,
              id: storedUser.id || currentUser?.id,
              name: storedUser.name || currentUser?.name || currentUser?.username || profile.name,
              username: storedUser.username || currentUser?.username || currentUser?.name || profile.name,
              profile_id: storedUser.profile_id || currentUser?.profile_id || profile.profileId,
              profile_photos: persistedMedia,
              avatar_image: persistedMedia[0] || storedUser.avatar_image || null,
              avatar_url: persistedMedia[0] || storedUser.avatar_url || null,
            })
        );
      } catch (storageError) {
        console.error('Failed to persist photo edit locally:', storageError);
      }

      if (currentUser?.id) {
        void API.updateUserProfile(currentUser.id, {
          avatar_image: photoUploadTarget === 'avatar' ? (persistedMedia[0] || null) : undefined,
          profile_photos: persistedMedia,
        }).catch((error) => {
          console.error('Failed to persist photo edit on the backend:', error);
        });
      }

      setProfileValidationError('');
      setPhotoEditorOpen(false);
      resetPhotoEditor();
      setShowMessage('Photo updated!');
      setTimeout(() => setShowMessage(''), 2000);
    } catch (error) {
      console.error('Failed to edit photo:', error);
      setProfileValidationError('Could not process that photo. Please try another image.');
    } finally {
      setPhotoEditorBusy(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setProfileValidationError('');
      const normalizedProfile = {
        ...profile,
        name: normalizeProfileText(profile.name, 60),
        bio: normalizeProfileText(profile.bio, MAX_BIO_LENGTH),
        location: normalizeProfileText(profile.location, MAX_LOCATION_LENGTH),
        occupation: normalizeProfileText(profile.occupation, MAX_OCCUPATION_LENGTH),
        genderIdentity: normalizeProfileText(profile.genderIdentity, MAX_GENDER_LENGTH),
      };

      const validation = validateProfileDraft(normalizedProfile);
      const hasWarnings = Object.keys(validation.errors).length > 0;
      setFieldErrors({});
      if (hasWarnings) {
        setProfileValidationError('Some profile details could be improved, but your changes were saved.');
      }

      setIsSavingProfile(true);

      const nextReliabilityScore = calculateReliabilityScore(normalizedProfile);
      setProfile((current) => ({ ...current, reliabilityScore: nextReliabilityScore }));

      if (currentUser?.id) {
        const mediaToStore = [normalizedProfile.avatarImage, ...normalizedProfile.photos.filter(Boolean)];
        const storedMediaUrls: string[] = [];

        for (let index = 0; index < mediaToStore.length; index += 1) {
          const media = mediaToStore[index];
          if (!media) continue;

          if (!isDataUrl(media)) {
            storedMediaUrls.push(media);
            continue;
          }

          try {
            const uploaded = await API.uploadMedia(media, {
              fileName: index === 0 ? `avatar-${Date.now()}.jpg` : `gallery-${index}-${Date.now()}.jpg`,
              mimeType: 'image/jpeg',
              folder: 'profiles',
            });
            storedMediaUrls.push(uploaded.url);
          } catch (uploadError) {
            console.warn('Failed to upload profile media, keeping existing data URL:', uploadError);
            storedMediaUrls.push(media);
          }
        }

        const updatedProfile = await API.updateUserProfile(currentUser.id, {
          display_name: normalizedProfile.name,
          bio: normalizedProfile.bio,
          city: normalizedProfile.location,
          gender: normalizedProfile.genderIdentity,
          occupation: normalizedProfile.occupation,
          interests: normalizedProfile.interests,
          avatar_image: storedMediaUrls[0] || undefined,
          profile_photos: storedMediaUrls,
          intro_video_url: normalizedProfile.introVideo || undefined,
          date_of_birth: normalizedProfile.dob || undefined,
        });

        setProfile((current) => ({
          ...current,
          name: updatedProfile.display_name || updatedProfile.full_name || updatedProfile.name || normalizedProfile.name || current.name,
          bio: updatedProfile.bio || current.bio,
          interests: updatedProfile.interests || current.interests,
          avatarImage: getAvatarSrc(updatedProfile.avatar_image || storedMediaUrls[0] || updatedProfile.profile_photos?.[0] || current.avatarImage),
          photos: Array.isArray(updatedProfile.profile_photos)
            ? updatedProfile.profile_photos.slice(1, 5)
            : storedMediaUrls.slice(1, 5).length > 0
              ? storedMediaUrls.slice(1, 5)
              : current.photos,
          location: updatedProfile.location || updatedProfile.city || current.location,
          introVideo: updatedProfile.intro_video_url || current.introVideo,
          dob: updatedProfile.date_of_birth || current.dob,
          age: updatedProfile.date_of_birth ? getAgeFromDob(updatedProfile.date_of_birth) : null,
          genderIdentity: updatedProfile.gender || current.genderIdentity,
          occupation: updatedProfile.occupation || current.occupation,
          reliabilityScore: calculateReliabilityScore({
            bio: updatedProfile.bio || current.bio,
            interests: updatedProfile.interests || current.interests,
            photos: Array.isArray(updatedProfile.profile_photos)
              ? updatedProfile.profile_photos.slice(1, 5)
              : storedMediaUrls.slice(1, 5).length > 0
                ? storedMediaUrls.slice(1, 5)
                : current.photos,
            avatarImage: getAvatarSrc(updatedProfile.avatar_image || storedMediaUrls[0] || updatedProfile.profile_photos?.[0] || current.avatarImage),
            introVideo: updatedProfile.intro_video_url || current.introVideo,
            dob: updatedProfile.date_of_birth || current.dob,
            occupation: updatedProfile.occupation || current.occupation,
          }),
        }));

        try {
          const storedUserRaw = localStorage.getItem('currentUser');
          const storedUser = storedUserRaw ? JSON.parse(storedUserRaw) : {};
          localStorage.setItem(
            'currentUser',
            JSON.stringify({
              ...storedUser,
              name: normalizedProfile.name,
              username: storedUser.username || normalizedProfile.name,
              profile_id: currentUser.profile_id || storedUser.profile_id,
              profile_photos: storedMediaUrls,
              avatar_image: updatedProfile.avatar_image || storedMediaUrls[0] || storedUser.avatar_image || null,
              avatar_url: updatedProfile.avatar_url || updatedProfile.avatar_image || storedMediaUrls[0] || storedUser.avatar_url || null,
              date_of_birth: normalizedProfile.dob || storedUser.date_of_birth || null,
              gender: normalizedProfile.genderIdentity || storedUser.gender || null,
              occupation: normalizedProfile.occupation || storedUser.occupation || null,
              email: storedUser.email || currentUser.email || null,
              phone: storedUser.phone || currentUser.phone || null,
            })
          );
        } catch (storageError) {
          console.error('Failed to update stored user snapshot:', storageError);
        }
      }

      setShowMessage('Profile saved successfully!');
      setIsEditing(false);
      setProfileValidationError('');
      setFieldErrors({});
      setTimeout(() => setShowMessage(''), 2000);
    } catch (error) {
      console.error('Failed to save profile:', error);
      setProfileValidationError(error instanceof Error ? error.message : 'Failed to save profile. Please try again.');
      setTimeout(() => setShowMessage(''), 2500);
    } finally {
      setIsSavingProfile(false);
    }
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
                  onClick={() => {
                    if (isSavingProfile) {
                      return;
                    }

                    if (isEditing) {
                      void handleSaveProfile();
                      return;
                    }

                    setIsEditing(true);
                  }}
                  disabled={isSavingProfile}
                  className="h-10 flex items-center gap-2 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 px-5 text-xs font-bold text-black shadow-lg shadow-yellow-500/10 hover:brightness-105 transition-all"
                >
                  {isSavingProfile ? (
                    <>
                      <Loader size={13} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Edit2 size={13} />
                      <span>{isEditing ? 'Save Changes' : 'Edit Profile'}</span>
                    </>
                  )}
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
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => beginPhotoUpload('avatar')}
                        className={`mb-3 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                          isLightMode
                            ? 'border-amber-900/10 bg-amber-50 text-amber-950 hover:bg-amber-100'
                            : 'border-white/[0.08] bg-white/[0.04] text-white hover:bg-white/[0.08]'
                        }`}
                      >
                        <Camera size={14} />
                        Upload profile picture
                      </button>
                    )}
                    <div className={`h-28 w-28 sm:h-36 sm:w-36 overflow-hidden rounded-2xl border-[4px] shadow-2xl transition-transform duration-300 group-hover:scale-[1.01] ${
                      isLightMode ? 'border-[#FAF8F5] bg-white' : 'border-[#0B0B0E] bg-[#141419]'
                    }`}>
                      <img
                        src={getAvatarSrc(profile.avatarImage)}
                        alt={profile.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    {isEditing && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => beginPhotoUpload('avatar')}
                        className="absolute bottom-2 right-2 rounded-xl bg-yellow-500 p-2.5 text-black shadow-lg hover:bg-yellow-400 transition-all"
                      >
                        <Camera size={16} />
                      </motion.button>
                    )}
                  </div>
                </div>

                {/* Profile Data Canvas */}
                <div className="max-w-2xl">
                  {profileValidationError && (
                    <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                      {profileValidationError}
                    </div>
                  )}

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
                        <div className={`w-full rounded-xl border px-4 py-2.5 text-base font-semibold ${inputStyle} opacity-90`}>
                            {displayAge !== null ? `${displayAge} years old` : 'Not set'}
                        </div>
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
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-60">Date of Birth</label>
                        <input
                          type="date"
                          value={profile.dob}
                          onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
                          className={`w-full rounded-xl border px-4 py-2.5 text-base font-semibold outline-none transition-all ${inputStyle}`}
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isLightMode ? 'text-amber-950' : 'text-white'}`}>
                          {profile.name}, <span className="opacity-80">{displayAge ?? '—'}</span>
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
                        <span>{getLocationFlag(profile.location)} {profile.location}</span>
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
              <StatCard value={stats.hosted} label="Events Hosted" icon={<Award size={16} />} isLightMode={isLightMode} />
              <StatCard value={`★ ${stats.rating}`} label={`${stats.reviews} reviews`} icon={<Star size={16} />} isLightMode={isLightMode} />
              <StatCard value={`${displayReliabilityScore}%`} label={serverReliabilityScore !== null ? 'Server-backed reliability' : 'Estimated reliability'} icon={<ShieldCheck size={16} />} isLightMode={isLightMode} />
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
                          {getInterestEmoji(interest)} {interest}
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
                          {getInterestEmoji(interest)} {interest}
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
                {Array.from({ length: 4 }, (_, idx) => {
                  const photo = profile.photos[idx];
                  const hasPhoto = Boolean(photo);
                  return (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: isEditing ? 1.02 : 1 }}
                      whileTap={{ scale: isEditing ? 0.98 : 1 }}
                      onClick={() => isEditing && beginPhotoUpload({ type: 'gallery', index: idx })}
                      className={`group relative aspect-square overflow-hidden rounded-2xl border transition-all ${
                        isLightMode ? 'border-amber-900/10' : 'border-white/[0.08]'
                      } ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}
                      type="button"
                    >
                      {hasPhoto ? (
                        <>
                          <img
                            src={photo}
                            alt={`Gallery image ${idx + 1}`}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          {isEditing && (
                            <div className="absolute inset-0 flex items-end justify-end bg-gradient-to-t from-black/35 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                              <span className="rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
                                Replace
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className={`flex h-full w-full flex-col items-center justify-center rounded-2xl border border-dashed text-sm font-semibold transition-all ${
                          isLightMode
                            ? 'border-amber-900/20 bg-amber-50 text-amber-900 hover:bg-amber-100/60'
                            : 'border-white/[0.15] bg-white/[0.01] text-gray-400 hover:bg-white/[0.03]'
                        }`}>
                          <Plus size={20} className="mb-1 text-yellow-500" />
                          <span>{isEditing ? 'Add photo' : 'Empty slot'}</span>
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </WidgetCard>

          </div>

          {/* Sidebar Widget Block Stack */}
          <aside className="space-y-6">
            
            {/* Profile Completion Widget */}
            <div className={`rounded-3xl border p-5 sm:p-6 transition-all ${
              isLightMode ? 'border-amber-900/10 bg-white' : 'border-white/[0.05] bg-[#141419]'
            }`}>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 size={16} className="text-green-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Profile Completion
                </h4>
              </div>

              <div className="flex items-end justify-between mb-2">
                <span className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-yellow-400">
                  {profileCompletionProgress}%
                </span>
                <span className="text-xs font-medium opacity-60">{profileCompletionProgress >= 80 ? 'Strong profile' : 'Keep building'}</span>
              </div>

              <div className={`h-2 w-full rounded-full overflow-hidden mb-4 ${isLightMode ? 'bg-amber-900/5' : 'bg-white/[0.08]'}`}>
                <div className="h-full rounded-full bg-gradient-to-r from-green-400 to-yellow-400" style={{ width: `${profileCompletionProgress}%` }} />
              </div>

              <div className="space-y-2">
                {profileCompletion.checklist.map((item) => (
                  <div key={item.key} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 text-xs">
                    <span className="opacity-70">{item.label}</span>
                    <span className={item.done ? 'text-green-400' : 'text-gray-500'}>{item.done ? 'Done' : 'Missing'}</span>
                  </div>
                ))}
              </div>
            </div>

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
                  {displayReliabilityScore}%
                </span>
                <span className="text-xs font-medium opacity-60">
                  {serverReliabilityScore !== null ? 'Server-derived' : 'Estimated from profile'}
                </span>
              </div>
              
              <div className={`h-2 w-full rounded-full overflow-hidden mb-4 ${isLightMode ? 'bg-amber-900/5' : 'bg-white/[0.08]'}`}>
                <div className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-500" style={{ width: `${displayReliabilityScore}%` }} />
              </div>
              
              <p className="text-xs opacity-60 leading-relaxed">
                Your reliability score is now tied to profile completeness and server-backed trust data when available.
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

        {/* Photo Editor Modal */}
        <AnimatePresence>
          {photoEditorOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !photoEditorBusy && (setPhotoEditorOpen(false), resetPhotoEditor())}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              />

              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.98 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
              >
                <div
                  className={`flex w-full max-w-[920px] max-h-[calc(100vh-1.5rem)] flex-col overflow-hidden rounded-3xl border shadow-2xl sm:max-h-[calc(100vh-3rem)] ${
                    isLightMode ? 'border-amber-900/10 bg-white' : 'border-white/[0.05] bg-[#0B0B0E]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 border-b border-white/10 p-4 sm:p-6">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-yellow-500/80">Photo Editor</p>
                      <h3 className="mt-1 text-xl font-bold">Prep your new profile photo</h3>
                      <p className={`mt-1 text-sm ${isLightMode ? 'text-amber-900/60' : 'text-gray-400'}`}>
                        Rotate, zoom, and choose a framing style before we compress it.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => !photoEditorBusy && (setPhotoEditorOpen(false), resetPhotoEditor())}
                      className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-300 transition hover:bg-white/10"
                    >
                      Close
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
                      <div className="space-y-4">
                        <div className={`overflow-hidden rounded-3xl border ${isLightMode ? 'border-amber-900/10 bg-amber-50/30' : 'border-white/[0.08] bg-white/[0.02]'}`}>
                          <div className="mx-auto w-full max-w-[420px] p-3 sm:p-4">
                            <div
                              className={`relative mx-auto overflow-hidden rounded-2xl border ${
                                photoEditorAspect === 'portrait'
                                  ? 'aspect-[4/5]'
                                  : photoEditorAspect === 'landscape'
                                    ? 'aspect-[16/9]'
                                    : photoEditorAspect === 'story'
                                      ? 'aspect-[9/16]'
                                      : 'aspect-square'
                              } ${isLightMode ? 'border-amber-900/10 bg-white' : 'border-white/10 bg-black/30'}`}
                            >
                              <img
                                src={photoEditorSource}
                                alt="Photo preview"
                                className="h-full w-full object-cover"
                                style={{
                                  transform: `scale(${photoEditorZoom}) rotate(${photoEditorRotation}deg)`,
                                  transformOrigin: 'center center',
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <p className="mb-2 text-xs font-bold uppercase tracking-wider opacity-60">Framing</p>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { id: 'square', label: 'Square', hint: 'Default profile crop' },
                                { id: 'portrait', label: 'Portrait', hint: '4:5 for more vertical space' },
                                { id: 'landscape', label: 'Landscape', hint: '16:9 wide crop' },
                                { id: 'story', label: 'Story', hint: '9:16 vertical framing' },
                              ].map((option) => (
                                <button
                                  key={option.id}
                                  type="button"
                                  onClick={() => setPhotoEditorAspect(option.id)}
                                  className={`rounded-2xl border px-3 py-3 text-left transition-all ${
                                    photoEditorAspect === option.id
                                      ? 'border-yellow-500/40 bg-yellow-500/15 text-yellow-200'
                                      : isLightMode
                                        ? 'border-amber-900/10 bg-amber-50/50 text-amber-950 hover:bg-amber-100/60'
                                        : 'border-white/[0.08] bg-white/[0.03] text-gray-200 hover:bg-white/[0.06]'
                                  }`}
                                >
                                  <p className="text-sm font-bold">{option.label}</p>
                                  <p className="mt-1 text-[11px] opacity-60">{option.hint}</p>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <p className="mb-2 text-xs font-bold uppercase tracking-wider opacity-60">Rotation</p>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => setPhotoEditorRotation((current) => (current - 90 + 360) % 360)}
                                  className={`flex-1 rounded-2xl border px-3 py-2.5 text-sm font-semibold transition-all ${
                                    isLightMode
                                      ? 'border-amber-900/10 bg-amber-50/50 text-amber-950 hover:bg-amber-100/60'
                                      : 'border-white/[0.08] bg-white/[0.03] text-gray-200 hover:bg-white/[0.06]'
                                  }`}
                                >
                                  Rotate left
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPhotoEditorRotation((current) => (current + 90) % 360)}
                                  className={`flex-1 rounded-2xl border px-3 py-2.5 text-sm font-semibold transition-all ${
                                    isLightMode
                                      ? 'border-amber-900/10 bg-amber-50/50 text-amber-950 hover:bg-amber-100/60'
                                      : 'border-white/[0.08] bg-white/[0.03] text-gray-200 hover:bg-white/[0.06]'
                                  }`}
                                >
                                  Rotate right
                                </button>
                              </div>
                            </div>

                            <div>
                              <div className="mb-2 flex items-center justify-between">
                                <p className="text-xs font-bold uppercase tracking-wider opacity-60">Zoom</p>
                                <span className="text-xs font-semibold text-yellow-400">{photoEditorZoom.toFixed(1)}x</span>
                              </div>
                              <input
                                type="range"
                                min="1"
                                max="2"
                                step="0.05"
                                value={photoEditorZoom}
                                onChange={(event) => setPhotoEditorZoom(Number(event.target.value))}
                                className="w-full accent-yellow-500"
                              />
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                              <p className="text-xs font-bold uppercase tracking-wider opacity-60">Prep note</p>
                              <p className="mt-2 text-sm opacity-70">
                                Square works best for the profile avatar, while portrait gives your photo a little more room for full-body shots.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                        <div className="space-y-3">
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-400/80">What happens next</p>
                          <div className="space-y-2 text-sm text-gray-300">
                            <p>1. We apply your framing and rotation.</p>
                            <p>2. The image is compressed for faster profile loading.</p>
                            <p>3. The edited photo is saved as your newest gallery image.</p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                          <button
                            type="button"
                            onClick={() => !photoEditorBusy && (setPhotoEditorOpen(false), resetPhotoEditor())}
                            className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all ${
                              isLightMode
                                ? 'border-amber-900/10 bg-amber-50 text-amber-950 hover:bg-amber-100'
                                : 'border-white/[0.08] bg-white/[0.03] text-white hover:bg-white/[0.06]'
                            } ${photoEditorBusy ? 'opacity-60' : ''}`}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleApplyPhotoEdit}
                            disabled={photoEditorBusy}
                            className="flex-1 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 px-4 py-3 text-sm font-bold text-black transition-all hover:brightness-105 disabled:cursor-wait disabled:opacity-60"
                          >
                            {photoEditorBusy ? 'Processing...' : 'Use this photo'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

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
                          setVerificationState(prev => ({
                            ...prev,
                            phone: {
                              ...prev.phone,
                              verified: true,
                              verifiedAt: new Date().toISOString(),
                              loading: false,
                            },
                          }));
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
