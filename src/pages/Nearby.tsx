import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Loader2,
  MessageCircle,
  Play,
  Plus,
  UserPlus,
  X,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Sidebar } from '../components/Sidebar';
import * as API from '../services/api';
import { resolveMediaUrl as resolveAvatarMediaUrl } from '../utils/avatar';

type NearbyMedia = {
  type: 'image' | 'video';
  src: string;
};

type NearbyPerson = {
  id: string;
  name: string;
  profileId: string;
  city: string;
  bio: string;
  age?: number;
  gender?: string;
  proximityLabel: string;
  isVerified: boolean;
  hobbies: string[];
  avatarImage: string;
  media: NearbyMedia[];
  followLabel?: string;
  likeCount?: number;
  commentCount?: number;
};

type FeedToast = {
  message: string;
  tone: 'like' | 'pass' | 'chat' | 'share' | 'save' | 'follow' | 'info';
};

type EventRequestDraft = {
  person: NearbyPerson | null;
  title: string;
  date: string;
  location: string;
  note: string;
};

const PHOTO_DURATION_MS = 3500;

const demoNearbyPeople: NearbyPerson[] = [
  {
    id: 'demo-1',
    name: 'Chioma',
    profileId: 'JNT-0021',
    city: 'Lagos',
    bio: 'Product manager, brunch enthusiast, and part-time art collector.',
    age: 27,
    gender: 'Female',
    proximityLabel: '0.8 km away',
    isVerified: true,
    hobbies: ['Hiking', 'Photography', 'Cooking'],
    avatarImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600',
    media: [
      { type: 'video', src: 'https://www.w3schools.com/html/mov_bbb.mp4' },
      { type: 'image', src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1200' },
      { type: 'image', src: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=1200' },
    ],
    followLabel: 'Follow',
    likeCount: 18,
    commentCount: 4,
  },
  {
    id: 'demo-2',
    name: 'Tunde',
    profileId: 'JNT-0044',
    city: 'Lagos',
    bio: 'Software engineer who loves live music, football, and trying new spots.',
    age: 31,
    gender: 'Male',
    proximityLabel: '1.4 km away',
    isVerified: true,
    hobbies: ['Sports', 'Music', 'Travel'],
    avatarImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600',
    media: [
      { type: 'video', src: 'https://www.w3schools.com/html/movie.mp4' },
      { type: 'image', src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200' },
      { type: 'image', src: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=1200' },
    ],
    followLabel: 'Follow',
    likeCount: 9,
    commentCount: 2,
  },
  {
    id: 'demo-3',
    name: 'Zara',
    profileId: 'JNT-0067',
    city: 'Abuja',
    bio: 'Designer with a soft spot for galleries, good coffee, and weekend getaways.',
    age: 24,
    gender: 'Female',
    proximityLabel: '2.1 km away',
    isVerified: true,
    hobbies: ['Art', 'Reading', 'Yoga'],
    avatarImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600',
    media: [
      { type: 'image', src: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=1200' },
      { type: 'image', src: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=1200' },
      { type: 'video', src: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    ],
    followLabel: 'Follow',
    likeCount: 12,
    commentCount: 6,
  },
  {
    id: 'demo-4',
    name: 'Chidi',
    profileId: 'JNT-0089',
    city: 'Lagos',
    bio: 'Founder, foodie, and always down for a spontaneous evening plan.',
    age: 29,
    gender: 'Male',
    proximityLabel: '3.0 km away',
    isVerified: false,
    hobbies: ['Fitness', 'Music', 'Travel'],
    avatarImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600',
    media: [
      { type: 'image', src: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=1200' },
      { type: 'video', src: 'https://www.w3schools.com/html/movie.mp4' },
      { type: 'image', src: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=1200' },
    ],
    followLabel: 'Follow',
    likeCount: 7,
    commentCount: 3,
  },
];

function parseMaybeJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter(Boolean).map(String);
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean).map(String);
      }
    } catch {
      return value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function resolveMediaUrl(value?: string) {
  return resolveAvatarMediaUrl(value);
}

function normalizeNearbyPerson(person: any, index: number): NearbyPerson {
  const profilePhotos = parseMaybeJsonArray(person.profile_photos);
  const introVideo = person.intro_video_url || person.introVideo || '';
  const avatarImage =
    person.avatar_image ||
    person.avatar_url ||
    person.profile_avatar ||
    person.profile_photo ||
    person.avatarUrl ||
    person.photo ||
    profilePhotos[0] ||
    '';

  const media: NearbyMedia[] = [
    ...(introVideo ? [{ type: 'video' as const, src: introVideo }] : []),
    ...profilePhotos.map((src) => ({ type: 'image' as const, src })),
  ].filter((item) => Boolean(item.src));

  if (media.length === 0 && avatarImage) {
    media.push({ type: 'image', src: avatarImage });
  }

  return {
    id: String(person.id || `nearby-${index}`),
    name: person.display_name || person.username || person.name || 'Nearby person',
    profileId: person.profile_id || `JNT-${String(index + 1).padStart(4, '0')}`,
    city: person.city || person.location || 'Nearby',
    bio: person.bio || `Say hello to ${person.display_name || person.username || person.name || 'this person'}.`,
    age: typeof person.age === 'number' ? person.age : undefined,
    gender: person.gender || '',
    proximityLabel: person.proximityLabel || person.distanceLabel || `${(index + 1) * 0.6} km away`,
    isVerified: Boolean(
      person.is_verified ||
      person.isVerified ||
      person.fraud_verification_status === 'verified' ||
      person.verification_status === 'verified'
    ),
    hobbies: parseMaybeJsonArray(person.interests || person.hobbies),
    avatarImage: resolveMediaUrl(avatarImage || profilePhotos[0] || ''),
    media,
    followLabel: person.followLabel || 'Follow',
    likeCount: typeof person.likeCount === 'number' ? person.likeCount : undefined,
    commentCount: typeof person.commentCount === 'number' ? person.commentCount : undefined,
  };
}

function normalizeFallbackPeople() {
  return demoNearbyPeople.map((person) => ({
    ...person,
    media: person.media.map((media) => ({ ...media, src: resolveMediaUrl(media.src) })),
    avatarImage: resolveMediaUrl(person.avatarImage),
  }));
}

function MediaViewer({
  open,
  items,
  index,
  onClose,
  onPrev,
  onNext,
  title,
}: {
  open: boolean;
  items: NearbyMedia[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  title: string;
}) {
  if (!open || items.length === 0) {
    return null;
  }

  const active = items[index];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 px-4 py-6 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="relative h-[88vh] w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/10 bg-[#060606] shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#FFD700]/80">Media Viewer</p>
              <h3 className="mt-1 text-sm font-semibold text-white">{title}</h3>
            </div>
            <div className="flex items-center gap-2">
              {items.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={onPrev}
                    className="rounded-full border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10"
                    aria-label="Previous media"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={onNext}
                    className="rounded-full border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10"
                    aria-label="Next media"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10"
                aria-label="Close viewer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex h-[calc(88vh-56px)] items-center justify-center bg-black px-4">
            {active.type === 'video' ? (
              <video
                src={resolveMediaUrl(active.src)}
                controls
                autoPlay
                muted
                playsInline
                className="max-h-full w-full rounded-2xl object-contain"
                onError={() => {
                  console.warn('[Nearby] media viewer video failed to load:', active.src);
                }}
              />
            ) : (
              <img
                src={resolveMediaUrl(active.src)}
                alt={title}
                className="max-h-full w-full rounded-2xl object-contain"
              />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function PersonCard({
  person,
  isActive,
  viewerOpen,
  onLike,
  onPass,
  onChat,
  onProfile,
  onCreateEvent,
  onOpenMedia,
}: {
  person: NearbyPerson;
  isActive: boolean;
  viewerOpen: boolean;
  onLike: (person: NearbyPerson) => void;
  onPass: (person: NearbyPerson) => void;
  onChat: (person: NearbyPerson) => void;
  onProfile: (person: NearbyPerson) => void;
  onCreateEvent: (person: NearbyPerson) => void;
  onOpenMedia: (person: NearbyPerson, index: number) => void;
}) {
  const [mediaIndex, setMediaIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [liked, setLiked] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const transitionTimerRef = useRef<number | null>(null);

  const currentMedia = person.media.length > 0
    ? person.media[Math.min(mediaIndex, person.media.length - 1)]
    : null;

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
  }, []);

  const advanceMedia = useCallback(() => {
    if (person.media.length <= 1) {
      setMediaIndex(0);
      return;
    }

    setTransitioning(true);
    transitionTimerRef.current = window.setTimeout(() => {
      setMediaIndex((current) => (current + 1) % person.media.length);
      setTransitioning(false);
    }, 220);
  }, [person.media.length]);

  useEffect(() => {
    setMediaIndex(0);
    setTransitioning(false);
    clearTimers();
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [person.id, clearTimers]);

  useEffect(() => {
    if (!isActive || viewerOpen) {
      clearTimers();
      if (videoRef.current) {
        videoRef.current.pause();
      }
      return;
    }

    setMediaIndex(0);
  }, [isActive, viewerOpen, clearTimers]);

  useEffect(() => {
    if (!isActive || viewerOpen || !currentMedia) {
      clearTimers();
      return;
    }

    clearTimers();

    if (currentMedia.type === 'image') {
      timerRef.current = window.setTimeout(advanceMedia, PHOTO_DURATION_MS);
      return;
    }

    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      void video.play().catch(() => {});
    }
  }, [advanceMedia, clearTimers, currentMedia, isActive, mediaIndex, viewerOpen]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (!isActive || viewerOpen) {
      video.pause();
    }
  }, [isActive, viewerOpen, mediaIndex]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  const handleLike = () => {
    setLiked(true);
    onLike(person);
  };

  const handlePass = () => {
    onPass(person);
  };

  const handleFollow = () => {
    onCreateEvent(person);
  };

  const mediaCount = person.media.length;

  return (
    <section className="relative h-screen w-full overflow-hidden bg-black">
      <button
        type="button"
        onClick={() => onOpenMedia(person, mediaIndex)}
        onWheel={(event) => {
          const scrollContainer = event.currentTarget.closest('.nearby-feed-scrollbar');
          if (scrollContainer instanceof HTMLElement) {
            scrollContainer.scrollBy({ top: event.deltaY, behavior: 'auto' });
          }
        }}
        className="absolute inset-0 z-0 h-full w-full cursor-pointer"
        style={{ touchAction: 'pan-y' }}
        aria-label={`Open ${person.name}'s media`}
      >
        {currentMedia?.type === 'video' ? (
          <video
            ref={videoRef}
            key={`${person.id}-video-${mediaIndex}`}
            src={resolveMediaUrl(currentMedia.src)}
            className="h-full w-full object-cover"
            autoPlay
            muted
            playsInline
            preload="metadata"
            onEnded={advanceMedia}
            onError={() => {
              console.warn('[Nearby] preview video failed to load:', currentMedia.src);
              advanceMedia();
            }}
          />
        ) : currentMedia?.type === 'image' ? (
          <img
            src={resolveMediaUrl(currentMedia.src)}
            alt={person.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-900">
            <div className="flex flex-col items-center gap-3 text-center text-white/75">
              <UserPlus className="h-16 w-16" />
              <span className="text-sm font-semibold">No media available</span>
            </div>
          </div>
        )}
      </button>

      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.18) 20%, rgba(0,0,0,0.12) 58%, rgba(0,0,0,0.88) 100%)',
        }}
      />

      <div className="absolute inset-x-0 top-0 z-20 px-4 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {person.media.map((_, index) => (
                <span
                  key={`${person.id}-dot-${index}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === mediaIndex ? 'w-6 bg-[#FFD700]' : 'w-3 bg-white/35'
                  }`}
                />
              ))}
            </div>

            <div className="mt-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-[#FFD700]/80">
              <span>{person.profileId}</span>
              <span className="h-1 w-1 rounded-full bg-white/50" />
              <span>{person.proximityLabel}</span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div>
                <h2 className="text-3xl font-black tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.65)] sm:text-4xl">
                  {person.name}, {person.age}
                </h2>
                <p className="mt-1 text-sm font-medium text-white/75">
                  {person.city} {person.gender ? `· ${person.gender}` : ''}
                </p>
              </div>

              {person.isVerified && (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#FFD700]/40 bg-[#FFD700]/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#FFD700]">
                  <span>✓</span>
                  Verified
                </span>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleFollow}
                className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-[#FFD700]/30 bg-[#FFD700]/15 px-4 py-2 text-sm font-bold text-[#FFD700] transition hover:bg-[#FFD700]/20"
              >
                <Plus size={14} />
                Create Event
              </button>

              <button
                type="button"
                onClick={() => onProfile(person)}
                className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-4 py-2 text-sm font-bold text-white transition hover:bg-black/40"
              >
                View profile
              </button>
            </div>
          </div>

         <div className="flex flex-col items-end gap-2">
            <div className="pointer-events-auto rounded-full border border-[#FFD700]/25 bg-black/45 px-3 py-1.5 text-[11px] font-bold text-[#FFD700] backdrop-blur">
              {mediaIndex + 1}/{mediaCount}
            </div>
            <div className="pointer-events-auto rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[11px] font-medium text-white/80 backdrop-blur">
              Tap media to view
            </div>
          </div>
        </div>
      </div>
      

      <div className="absolute inset-x-0 bottom-0 z-20 px-3 pb-[calc(env(safe-area-inset-bottom)+60px)] sm:px-6 lg:px-8">
        <div className="pointer-events-auto mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {person.hobbies.map((hobby) => (
                <span
                  key={hobby}
                  className="rounded-full border border-[#FFD700]/20 bg-[#FFD700]/12 px-2 py-0.5 text-[9px] font-semibold text-[#FFD700]"
                >
                  {hobby}
                </span>
              ))}
            </div>

            <p className="text-xs leading-5 text-white/88 sm:text-sm">
              {person.bio}
            </p>

           <div className="mt-2.5 mb-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handlePass}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/12 sm:flex-none sm:min-w-[100px]"
              >
                <X size={14} />
                Pass
              </button>

              <button
                type="button"
                onClick={() => onProfile(person)}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-xs font-bold text-white transition hover:bg-black/50 sm:flex-none sm:min-w-[130px]"
              >
                <Play size={14} />
                Profile
              </button>

              <button
                type="button"
                onClick={() => onChat(person)}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#FFD700]/30 bg-[#FFD700]/15 px-3 py-2 text-xs font-bold text-[#111] transition hover:bg-[#FFD700]/20 sm:flex-none sm:min-w-[130px]"
              >
                <MessageCircle size={14} />
                Message
              </button>

              <button
                type="button"
                onClick={handleLike}
                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-extrabold transition sm:flex-none sm:min-w-[140px] ${
                  liked
                    ? 'border-[#FFD700]/50 bg-[#FFD700] text-black'
                    : 'border-[#FFD700]/30 bg-gradient-to-r from-[#FFD700] to-[#FFB800] text-black shadow-[0_16px_34px_rgba(255,215,0,0.22)]'
                }`}
              >
                <Heart size={14} fill="currentColor" />
                Like
              </button>
            </div>

            <button
              type="button"
              onClick={() => onChat(person)}
              className="mt-2 flex w-full items-center justify-between rounded-xl border border-[#FFD700]/25 bg-[#FFD700]/12 px-3 py-2.5 text-left transition hover:bg-[#FFD700]/16"
            >
              <span className="text-xs font-semibold text-white/85">
                Start a chat with {person.name}
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFD700] text-xs font-black text-black">
                +
              </span>
            </button>
          </div>
        </div>
      </div>

      {transitioning && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/12">
          <div className="rounded-full border border-white/10 bg-black/45 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-white/75 backdrop-blur">
            Next media
          </div>
        </div>
      )}
    </section>
  );
}

export function Nearby({
  onNavigate,
  setActiveNav,
  currentUser,
}: {
  onNavigate?: (page: string) => void;
  setActiveNav?: (nav: string) => void;
  currentUser?: any;
}) {
  const { setSelectedUser } = useAppContext();
  const [people, setPeople] = useState<NearbyPerson[]>(normalizeFallbackPeople());
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<FeedToast | null>(null);
  const [eventRequestDraft, setEventRequestDraft] = useState<EventRequestDraft>({
    person: null,
    title: '',
    date: '',
    location: '',
    note: '',
  });
  const [submittingEventRequest, setSubmittingEventRequest] = useState(false);
  const [viewer, setViewer] = useState<{
    open: boolean;
    person: NearbyPerson | null;
    items: NearbyMedia[];
    index: number;
  }>({
    open: false,
    person: null,
    items: [],
    index: 0,
  });
  const feedRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((message: string, tone: FeedToast['tone'] = 'info') => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToast({ message, tone });
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, 2200);
  }, []);

  useEffect(() => {
    if (setActiveNav) {
      setActiveNav('Nearby');
    }
  }, [setActiveNav]);

useEffect(() => {
    let cancelled = false;

    const fetchNearby = async (lat: number, lon: number) => {
      if (!currentUser?.id) {
        setPeople(normalizeFallbackPeople());
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await API.getNearbyUsers(currentUser.id, lat, lon);
        if (cancelled) {
          return;
        }

        const normalized = (response.nearby_users || []).map((person, index) =>
          normalizeNearbyPerson(person, index)
        );

        if (normalized.length > 0) {
          setPeople(normalized);
          setUsingFallback(false);
        } else {
          setPeople(normalizeFallbackPeople());
          setUsingFallback(true);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch nearby users:', error);
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Unable to reach nearby backend service.'
          );
          setPeople(normalizeFallbackPeople());
          setUsingFallback(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    const loadNearby = async () => {
      console.log('[Nearby] loadNearby called, currentUser:', currentUser);
      if (!currentUser?.id) {
        console.log('[Nearby] no currentUser.id, using fallback');
        setPeople(normalizeFallbackPeople());
        setLoading(false);
        return;
      }
      console.log('[Nearby] calling getNearbyUsers for', currentUser.id);

      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (!cancelled) {
              void fetchNearby(position.coords.latitude, position.coords.longitude);
            }
          },
          () => {
            if (!cancelled) {
              void fetchNearby(0, 0);
            }
          },
          { timeout: 8000 }
        );
      } else {
        void fetchNearby(0, 0);
      }
    };

    loadNearby();

    return () => {
      cancelled = true;
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, [currentUser?.id]);

  useEffect(() => {
    const container = feedRef.current;
    if (!container || people.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const index = cardRefs.current.findIndex((card) => card === entry.target);
          if (index >= 0) {
            setActiveIdx(index);
          }
        });
      },
      {
        root: container,
        threshold: 0.65,
      }
    );

    cardRefs.current.forEach((card) => {
      if (card) {
        observer.observe(card);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [people]);

  useEffect(() => {
    if (!viewer.open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setViewer({
          open: false,
          person: null,
          items: [],
          index: 0,
        });
      } else if (event.key === 'ArrowLeft') {
        setViewer((current) => ({
          ...current,
          index: (current.index - 1 + current.items.length) % current.items.length,
        }));
      } else if (event.key === 'ArrowRight') {
        setViewer((current) => ({
          ...current,
          index: (current.index + 1) % current.items.length,
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewer.open]);

  const scrollToIndex = useCallback((index: number) => {
    const target = cardRefs.current[index];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  useEffect(() => {
    const handleNavigationKeyDown = (event: KeyboardEvent) => {
      if (viewer.open) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (
        target?.closest('input,textarea,[contenteditable="true"]') ||
        target?.isContentEditable
      ) {
        return;
      }

      const isNext = event.key === 'ArrowDown' || event.key === 'PageDown';
      const isPrev = event.key === 'ArrowUp' || event.key === 'PageUp';
      if (!isNext && !isPrev) {
        return;
      }

      const nextIndex = isNext
        ? Math.min(activeIdx + 1, people.length - 1)
        : Math.max(activeIdx - 1, 0);

      if (nextIndex === activeIdx) {
        return;
      }

      event.preventDefault();
      scrollToIndex(nextIndex);
    };

    window.addEventListener('keydown', handleNavigationKeyDown);
    return () => window.removeEventListener('keydown', handleNavigationKeyDown);
  }, [activeIdx, people.length, scrollToIndex, viewer.open]);

  useEffect(() => {
    const body = document.body;
    const previous = body.style.overflow;
    body.style.overflow = 'hidden';
    return () => {
      body.style.overflow = previous;
    };
  }, []);

  const handleLike = useCallback(
    (person: NearbyPerson) => {
      showToast(`Liked ${person.name}`, 'like');
      if (currentUser?.id) {
        void API.swipeUser(currentUser.id, person.id, 'right').catch((error) => {
          console.error('Failed to record like:', error);
        });
      }
    },
    [currentUser?.id, showToast]
  );

  const handlePass = useCallback(
    (person: NearbyPerson) => {
      showToast(`Passed on ${person.name}`, 'pass');
      if (currentUser?.id) {
        void API.swipeUser(currentUser.id, person.id, 'left').catch((error) => {
          console.error('Failed to record pass:', error);
        });
      }
      const nextIndex = Math.min(activeIdx + 1, Math.max(people.length - 1, 0));
      scrollToIndex(nextIndex);
    },
    [activeIdx, currentUser?.id, people.length, scrollToIndex, showToast]
  );

  const handleChat = useCallback(
    (person: NearbyPerson) => {
      showToast(`Opening chat with ${person.name}`, 'chat');
      if (setSelectedUser) {
        void API.getUserProfile(person.id)
          .then((profile) => {
            setSelectedUser({
              ...person,
              ...profile,
              profile_photos: profile.profile_photos || person.media.filter((item) => item.type === 'image').map((item) => item.src),
              intro_video_url: profile.intro_video_url || person.media.find((item) => item.type === 'video')?.src || null,
            });
          })
          .catch(() => {
            setSelectedUser(person);
          });
      }
      onNavigate?.('messages');
    },
    [onNavigate, setSelectedUser, showToast]
  );

  const openProfile = useCallback(
    async (person: NearbyPerson) => {
      try {
        const profile = await API.getUserProfile(person.id);
        setSelectedUser?.({
          ...person,
          ...profile,
          profile_photos: profile.profile_photos || person.media.filter((item) => item.type === 'image').map((item) => item.src),
          intro_video_url: profile.intro_video_url || person.media.find((item) => item.type === 'video')?.src || null,
        });
      } catch (error) {
        console.error('Failed to load public profile:', error);
        setSelectedUser?.(person);
      }

      setActiveNav?.('Profile');
      onNavigate?.('profile');
    },
    [onNavigate, setActiveNav, setSelectedUser]
  );

  const handleFollow = useCallback((person: NearbyPerson) => {
    setEventRequestDraft({
      person,
      title: '',
      date: '',
      location: '',
      note: '',
    });
    showToast(`Create an event invite for ${person.name}`, 'info');
  }, [showToast]);

  const submitEventRequest = useCallback(async () => {
    if (!eventRequestDraft.person || !currentUser?.id) {
      showToast('Please log in to send an invite', 'info');
      return;
    }

    const title = eventRequestDraft.title.trim();
    const date = eventRequestDraft.date.trim();
    const location = eventRequestDraft.location.trim();
    const note = eventRequestDraft.note.trim();

    if (!title) {
      showToast('Please add a short event title', 'info');
      return;
    }

    setSubmittingEventRequest(true);
    try {
      const payload = {
        __event_request__: true,
        title,
        date,
        location,
        note,
        senderName: currentUser.display_name || currentUser.username || currentUser.name || 'Someone',
        recipientName: eventRequestDraft.person.name,
        createdAt: new Date().toISOString(),
      };

      await API.sendMessage(null, eventRequestDraft.person.id, JSON.stringify(payload), 'text');
      showToast(`Invite request sent to ${eventRequestDraft.person.name}`, 'info');
      setEventRequestDraft({ person: null, title: '', date: '', location: '', note: '' });
    } catch (error) {
      console.error('Failed to send event request:', error);
      showToast('Could not send the invite request', 'info');
    } finally {
      setSubmittingEventRequest(false);
    }
  }, [currentUser?.id, currentUser?.display_name, currentUser?.name, currentUser?.username, eventRequestDraft, showToast]);

  const openMediaViewer = useCallback(
    (person: NearbyPerson, index: number) => {
      setViewer({
        open: true,
        person,
        items: person.media,
        index,
      });
    },
    []
  );

  const closeMediaViewer = useCallback(() => {
    setViewer({
      open: false,
      person: null,
      items: [],
      index: 0,
    });
  }, []);

  const prevMedia = useCallback(() => {
    setViewer((current) => ({
      ...current,
      index: (current.index - 1 + current.items.length) % current.items.length,
    }));
  }, []);

  const nextMedia = useCallback(() => {
    setViewer((current) => ({
      ...current,
      index: (current.index + 1) % current.items.length,
    }));
  }, []);

  const feedEmpty = useMemo(() => !loading && people.length === 0, [loading, people.length]);

  return (
    <div className="relative h-full min-h-screen overflow-hidden bg-black text-white">
      <style>{`
        .nearby-feed-scrollbar::-webkit-scrollbar {
          width: 0;
          height: 0;
        }
      `}</style>

      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#FFD700]" />
            <p className="text-sm text-white/60">Loading nearby people...</p>
          </div>
        </div>
      )}

      {errorMessage && !loading && (
        <div className="fixed left-1/2 top-20 z-[90] w-[min(92vw,640px)] -translate-x-1/2 rounded-3xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100 shadow-2xl backdrop-blur">
          <p className="font-semibold">Unable to load nearby users</p>
          <p className="mt-2 text-white/80">{errorMessage}</p>
          <p className="mt-3 text-xs text-white/60">
            Ensure the backend server is running on <span className="font-mono">http://localhost:5000</span> and your app is connected to it.
          </p>
        </div>
      )}

      <div className="relative">
        <div
          ref={feedRef}
          className="nearby-feed-scrollbar h-screen snap-y snap-mandatory overflow-y-auto overscroll-y-contain pb-28"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
        {people.map((person, index) => (
          <div
            key={person.id}
            ref={(element) => {
              cardRefs.current[index] = element;
            }}
            className="h-screen w-full snap-start snap-always"
          >
            <PersonCard
              person={person}
              isActive={activeIdx === index}
              viewerOpen={viewer.open}
              onLike={handleLike}
              onPass={handlePass}
              onChat={handleChat}
              onProfile={openProfile}
              onCreateEvent={handleFollow}
              onOpenMedia={openMediaViewer}
            />
          </div>
        ))}

        {feedEmpty && (
          <div className="flex h-screen snap-start items-center justify-center px-6">
            <div className="max-w-md rounded-[28px] border border-white/10 bg-white/5 p-8 text-center backdrop-blur">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FFD700]/15 text-3xl">
                ✨
              </div>
              <h2 className="text-2xl font-black">No nearby people yet</h2>
              <p className="mt-3 text-sm leading-6 text-white/65">
                Try a different city or come back later. When the backend returns profiles in your area, they’ll appear here with looping media and snap scrolling.
              </p>
              {usingFallback && (
                <p className="mt-4 text-xs uppercase tracking-[0.2em] text-[#FFD700]/70">
                  Showing demo fallback
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      </div>

      {eventRequestDraft.person && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 px-4 py-6">
          <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#11131A] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#FBBF24]">Invite request</p>
                <h3 className="mt-1 text-xl font-black text-white">Plan a mini hangout with {eventRequestDraft.person.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setEventRequestDraft({ person: null, title: '', date: '', location: '', note: '' })}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
                aria-label="Close invite request"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <label className="block text-sm text-gray-300">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.2em] text-gray-500">Event title</span>
                <input
                  value={eventRequestDraft.title}
                  onChange={(event) => setEventRequestDraft((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Coffee and a walk"
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-white outline-none focus:border-[#FBBF24]"
                />
              </label>

              <label className="block text-sm text-gray-300">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.2em] text-gray-500">Date</span>
                <input
                  type="date"
                  value={eventRequestDraft.date}
                  onChange={(event) => setEventRequestDraft((current) => ({ ...current, date: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-white outline-none focus:border-[#FBBF24]"
                />
              </label>

              <label className="block text-sm text-gray-300">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.2em] text-gray-500">Location</span>
                <input
                  value={eventRequestDraft.location}
                  onChange={(event) => setEventRequestDraft((current) => ({ ...current, location: event.target.value }))}
                  placeholder="Lagos, Ikoyi"
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-white outline-none focus:border-[#FBBF24]"
                />
              </label>

              <label className="block text-sm text-gray-300">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.2em] text-gray-500">Short note</span>
                <textarea
                  value={eventRequestDraft.note}
                  onChange={(event) => setEventRequestDraft((current) => ({ ...current, note: event.target.value }))}
                  placeholder="Keep it casual and low pressure"
                  rows={3}
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-white outline-none focus:border-[#FBBF24]"
                />
              </label>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEventRequestDraft({ person: null, title: '', date: '', location: '', note: '' })}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitEventRequest}
                disabled={submittingEventRequest}
                className="rounded-full bg-[#FBBF24] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#F59E0B] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submittingEventRequest ? 'Sending...' : 'Send request'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Sidebar activeNav="Nearby" onNavigate={onNavigate} setActiveNav={setActiveNav} />

      <MediaViewer
        open={viewer.open}
        items={viewer.items}
        index={viewer.index}
        onClose={closeMediaViewer}
        onPrev={prevMedia}
        onNext={nextMedia}
        title={viewer.person?.name || 'Nearby media'}
      />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            className={`fixed left-1/2 top-5 z-[90] -translate-x-1/2 rounded-full border px-4 py-2 text-sm font-bold shadow-2xl backdrop-blur ${
              toast.tone === 'like'
                ? 'border-[#FFD700]/40 bg-[#FFD700] text-black'
                : toast.tone === 'pass'
                  ? 'border-rose-400/30 bg-rose-500/90 text-white'
                  : 'border-white/10 bg-black/70 text-white'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Nearby;
