import React, { useEffect, useMemo, useState } from 'react';
import { Heart, MapPin, Share2, MessageCircle, Check, AlertCircle, ArrowLeft, ExternalLink, Edit3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { EventReviewPanel } from '../components/EventReviewPanel';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { discoverEvents, getDiscoverEventById, toEventDetail } from '../data/discoverEvents';
import { useAppContext } from '../context/AppContext';
import * as API from '../services/api';
import { isEventExpired, getRemainingCapacity, isEventAtCapacity } from '../utils/eventUtils';
import { compressImageDataUrl } from '../utils/imageCompression';
import { getAvatarImageFromProfilePhotos, resolveMediaUrl } from '../utils/avatar';
import {
  appendEventActivity,
  appendLocalNotification,
  localActivityEventName,
  readEventActivities,
  type EventActivity,
} from '../utils/localActivity';

const LeafletMapContainer = MapContainer as any;
const LeafletMarker = Marker as any;
const LeafletPopup = Popup as any;
const eventApplicationsStorageKey = 'junto-event-applications';
export const applicationsChangedEventName = 'junto-event-applications-changed';

interface Attendee {
  id: string;
  name: string;
  avatar: string;
  paymentStatus: 'paid' | 'pending' | 'host_covers' | 'declined';
  joinedAt: Date;
}

export interface EventReview {
  author: string;
  rating: number;
  text: string;
  time: string;
}

export interface EventAttendee extends Attendee {
  status: 'confirmed' | 'maybe' | 'pending' | 'declined';
  isHostCover?: boolean;
}

export interface EventDetailData {
  id: string;
  host_id?: string;
  title: string;
  host: {
    name: string;
    avatar: string;
    reliabilityScore: number;
    isVerified: boolean;
    reviews: number;
    averageRating: number;
  };
  category: string;
  date: string;
  time: string;
  location: string;
  description: string;
  genderFilter: string;
  interested: number;
  spots: string;
  totalSpots: number;
  currentAttendees: number;
  estimatedCost: string;
  duration: string;
  ageRestriction: string;
  rules: string[];
  media: {
    venue: string[];
    host: string[];
  };
  coverImage?: string;
  coords?: [number, number];
  attendees?: EventAttendee[];
  reviews?: EventReview[];
  calendar?: {
    start: string;
    end: string;
    timezone?: string;
  };
}

interface StoredEventApplication {
  id: string;
  event_id: string;
  event_title: string;
  host_id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  profile_id?: string;
  bio?: string;
  location?: string;
  backend_id?: string;
  source?: 'api' | 'local';
}

interface EventDetailProps {
  eventId?: string;
  eventData?: EventDetailData;
  onNavigate?: (page: string) => void;
  setActiveNav?: (nav: string) => void;
  onOpenMessages?: () => void;
}

function createMapIcon(label: string) {
  return L.divIcon({
    className: 'event-detail-marker',
    html: `
      <div style="
        width: 34px;
        height: 34px;
        border-radius: 50% 50% 50% 0;
        background: linear-gradient(135deg, #F59E0B, #FB923C);
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid rgba(255,255,255,0.85);
        box-shadow: 0 6px 16px rgba(245, 158, 11, 0.35);
      ">
        <span style="
          transform: rotate(45deg);
          color: white;
          font-size: 12px;
          font-weight: 700;
          font-family: Inter, sans-serif;
        ">${label}</span>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34]
  });
}

function createApplicationId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `app-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const BILLING_TIER_DETAILS = {
  1: {
    title: 'Host covers everything',
    subtitle: 'You pay nothing at the venue.',
    note: 'The host pays for the whole outing, including attendee transport.',
    badgeClass: 'border-green-500/20 bg-green-500/10 text-green-400',
  },
  2: {
    title: 'Host covers the venue',
    subtitle: 'You handle your own transport.',
    note: 'The host pays venue costs and the attendee covers transport.',
    badgeClass: 'border-blue-500/20 bg-blue-500/10 text-blue-400',
  },
  3: {
    title: 'Split the bill',
    subtitle: 'Everyone shares the cost equally.',
    note: 'Venue costs are split between the host and the attendee.',
    badgeClass: 'border-purple-500/20 bg-purple-500/10 text-purple-400',
  },
  4: {
    title: 'Host Me',
    subtitle: 'Premium tier',
    note: 'The attendee covers both sides at the venue.',
    badgeClass: 'border-red-500/20 bg-red-500/10 text-red-400',
  },
} as const;

function getBillingTierDetails(event: any) {
  const tier = Number(event?.billing_tier || event?.billingTier || 1) as 1 | 2 | 3 | 4;
  return BILLING_TIER_DETAILS[tier] || BILLING_TIER_DETAILS[1];
}

function readStoredEventApplications(): StoredEventApplication[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(eventApplicationsStorageKey);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredEventApplications(applications: StoredEventApplication[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(eventApplicationsStorageKey, JSON.stringify(applications));
  window.dispatchEvent(new Event(applicationsChangedEventName));
}

function normalizeApplicationStatus(status?: string): 'pending' | 'accepted' | 'declined' | 'none' {
  if (status === 'accepted') return 'accepted';
  if (status === 'declined' || status === 'rejected') return 'declined';
  if (status === 'pending') return 'pending';
  return 'none';
}

function readCurrentUserSnapshot() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const parsed = API.getStoredCurrentUser();
    if (!parsed || typeof parsed !== 'object') return null;

    return {
      id: String(parsed.id || ''),
      name: String(parsed.name || parsed.username || 'You'),
      profile_id: String(parsed.profile_id || ''),
      avatar: String(parsed.avatar || parsed.photo || parsed.avatar_image || '👤'),
      avatarImage:
        getAvatarImageFromProfilePhotos(parsed.profile_photos) ||
        resolveMediaUrl(parsed.avatar_image) ||
        resolveMediaUrl(parsed.photo) ||
        '',
      bio: String(parsed.bio || ''),
      location: String(parsed.location || ''),
    };
  } catch {
    return null;
  }
}

export const EventDetail: React.FC<EventDetailProps> = ({ eventId, eventData, onNavigate, setActiveNav, onOpenMessages }) => {
  const navigate = useNavigate();
  const { setSelectedUser } = useAppContext();
  const [isJoined, setIsJoined] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'attendees' | 'host' | 'reviews'>('overview');
  const [shareState, setShareState] = useState<string>('');
  const [guestList, setGuestList] = useState<EventAttendee[]>([]);
  const [applicationStatus, setApplicationStatus] = useState<'none' | 'pending' | 'accepted' | 'declined'>('none');
  const [applicationNote, setApplicationNote] = useState('');
  const [applicationUpdatedAt, setApplicationUpdatedAt] = useState('');
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applicationText, setApplicationText] = useState('');
  const [applicationLoaded, setApplicationLoaded] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [eventActivities, setEventActivities] = useState<EventActivity[]>([]);
  const [isWaitlisted, setIsWaitlisted] = useState(false);
  const [hostAvatarImage, setHostAvatarImage] = useState<string>('');
  const [realAttendees, setRealAttendees] = useState<EventAttendee[]>([]);
const [realReviews, setRealReviews] = useState<any[]>([]);
const [hostPastEvents, setHostPastEvents] = useState<any[]>([]);
  const [editDraft, setEditDraft] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    maxSpots: '',
    coverImage: '',
  });

  const defaultEvent = useMemo<EventDetailData>(() => ({
    id: eventId || '1',
    title: 'Beach Volleyball at Lekki',
    host: {
      name: 'Tunde O.',
      avatar: '🏐',
      reliabilityScore: 92,
      isVerified: true,
      reviews: 34,
      averageRating: 4.8,
    },
    category: 'Sports',
    date: '2026-05-25',
    time: '4:00 PM',
    location: 'Lekki Beach, Lagos 🇳🇬',
    description:
      "Join us for an exciting evening of beach volleyball! All skill levels welcome. We'll play casual games, have fun, and grab drinks after. Bring your energy!",

    genderFilter: 'Everyone',
    interested: 21,
    spots: '3 left',
    totalSpots: 10,
    currentAttendees: 7,
    estimatedCost: '₦2,500',
    duration: '3 hours',
    ageRestriction: '18+',
    rules: ['Be respectful to all participants', 'No outside alcohol (drinks provided)', 'Wear comfortable sports attire'],
    media: {
      venue: ['https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=500'],
      host: ['🏐'],
    },
    coords: [6.4281, 3.4128],
    attendees: [
      { id: '1', name: 'Ada M.', avatar: '👩‍🦰', paymentStatus: 'host_covers', joinedAt: new Date(Date.now() - 2 * 24 * 60 * 60000), status: 'confirmed', isHostCover: true },
      { id: '2', name: 'Oge K.', avatar: '👨‍🦱', paymentStatus: 'paid', joinedAt: new Date(Date.now() - 1.5 * 24 * 60 * 60000), status: 'confirmed' },
      { id: '3', name: 'Zara P.', avatar: '👩', paymentStatus: 'pending', joinedAt: new Date(Date.now() - 1 * 24 * 60 * 60000), status: 'maybe' },
    ],
    reviews: [
      { author: 'Sarah M.', rating: 5, text: 'Smooth planning and great vibes.', time: '2 days ago' },
      { author: 'John D.', rating: 5, text: 'Loved the energy, would join again.', time: '1 week ago' },
    ],
    calendar: {
      start: '2026-05-25T16:00:00+01:00',
      end: '2026-05-25T19:00:00+01:00',
      timezone: 'Africa/Lagos',
    },
  }), [eventId]);

  const eventFromCatalog = useMemo(() => {
    if (!eventId) {
      return undefined;
    }

    const match = getDiscoverEventById(eventId);
    return match ? toEventDetail(match, discoverEvents.findIndex((item) => item.id === match.id)) : undefined;
  }, [eventId]);

  // Merge eventData with defaultEvent to ensure all properties exist
  const baseEvent = useMemo(() => ({
    ...defaultEvent,
    ...(eventData ?? eventFromCatalog)
  }), [defaultEvent, eventData, eventFromCatalog]);
  const [event, setEvent] = useState<EventDetailData>(baseEvent);
  const currentUserId = API.getUserId();
  const canEditEvent = Boolean(event.host_id && currentUserId && event.host_id === currentUserId);
  const currentUserSnapshot = readCurrentUserSnapshot();
const resolvedHostAvatar = hostAvatarImage || event.host.avatar;
  const eventCoords = event.coords ?? [6.4281, 3.4219];
  const mapUrl = `https://www.google.com/maps?q=${eventCoords[0]},${eventCoords[1]}`;
  
  // Check event expiry and capacity
  const eventExpired = useMemo(() => isEventExpired(event.date, event.time) || event.status === 'expired', [event.date, event.time, event.status]);
  const atCapacity = useMemo(() => isEventAtCapacity(event.currentAttendees, event.totalSpots), [event.currentAttendees, event.totalSpots]);
  const remainingCapacity = useMemo(() => getRemainingCapacity(event.currentAttendees, event.totalSpots), [event.currentAttendees, event.totalSpots]);
  const currentAttendees = event.attendees ?? [];
  const confirmedAttendees = currentAttendees.filter((attendee) => attendee.status === 'confirmed' || attendee.status === 'maybe');
 const reviews = realReviews.length > 0 ? realReviews : (event.reviews ?? []);
  const canLeaveEventReview = eventExpired && Boolean(currentUserId) && (isJoined || applicationStatus === 'accepted');
  const applicationStorageKey = `junto-event-application-${event.id}`;
  const billingDetails = getBillingTierDetails(event);
  const isSquadEvent = Boolean((event as any).is_squad_event || (event as any).squad_event);
  const applicationTimeline = useMemo(() => {
    const submittedAt = applicationUpdatedAt ? new Date(applicationUpdatedAt).toLocaleString() : 'Just now';
    const responseText =
      applicationStatus === 'accepted'
        ? 'You are in. Message the host and add this outing to your calendar.'
        : applicationStatus === 'declined'
          ? 'The host passed this time. Save the search and try another event.'
          : 'We will update this as soon as the host replies.';

    return [
      {
        title: 'Applied',
        detail: applicationNote || `Your note was sent ${submittedAt}.`,
        state: 'complete' as const,
      },
      {
        title: 'Host review',
        detail:
          applicationStatus === 'pending'
            ? 'The host is reviewing your request now.'
            : 'The host already reviewed your request.',
        state: applicationStatus === 'pending' ? ('active' as const) : ('complete' as const),
      },
      {
        title: applicationStatus === 'accepted' ? 'Accepted' : applicationStatus === 'declined' ? 'Declined' : 'Waiting',
        detail: responseText,
        state:
          applicationStatus === 'pending'
            ? ('waiting' as const)
            : ('complete' as const),
      },
    ];
  }, [applicationNote, applicationStatus, applicationUpdatedAt]);

  useEffect(() => {
    setEvent(baseEvent);
  }, [baseEvent.id]);

  useEffect(() => {
    const loadActivities = () => {
      const nextActivities = readEventActivities().filter((activity) => String(activity.eventId) === String(event.id));
      setEventActivities(nextActivities);
    };

    loadActivities();
    window.addEventListener(localActivityEventName(), loadActivities as EventListener);
    return () => {
      window.removeEventListener(localActivityEventName(), loadActivities as EventListener);
    };
  }, [event.id]);
useEffect(() => {
  if (!event.id) return;

 

  // Fetch real reviews
  API.getEventReviews(event.id)
    .then((data) => {
      const mapped = Array.isArray(data?.reviews) ? data.reviews : Array.isArray(data) ? data : [];
      if (mapped.length > 0) {
        setRealReviews(mapped.map((r: any) => ({
          author: r.reviewer_name || r.display_name || r.name || 'Anonymous',
          rating: Number(r.rating || 5),
          text: r.comment || r.text || r.body || '',
          time: r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Recently',
        })));
      }
    })
    .catch(() => {});

  // Fetch host past events
  if (event.host_id) {
    API.getHostEvents(event.host_id)
      .then((data) => {
        const mapped = Array.isArray(data?.events) ? data.events : Array.isArray(data) ? data : [];
        setHostPastEvents(mapped.filter((e: any) => e.status === 'completed' || e.status === 'expired').slice(0, 3));
      })
      .catch(() => {});
  }
}, [event.id, event.host_id]);
  useEffect(() => {
  if (!event.host_id) return;

  if (canEditEvent && currentUserSnapshot?.avatarImage) {
    setHostAvatarImage(currentUserSnapshot.avatarImage);
    return;
  }

  API.getUserProfile(event.host_id)
    .then((profile) => {
      const img =
        profile?.avatar_image ||
        profile?.avatar_url ||
        profile?.photo ||
        '';
      if (img) setHostAvatarImage(resolveMediaUrl(img) || img);
    })
    .catch(() => {});
}, [event.host_id, canEditEvent]);

useEffect(() => {
  setEditDraft({
    title: event.title,
    description: event.description,
    date: event.date,
    time: event.time,
    location: event.location,
    maxSpots: String(event.totalSpots || 0),
    coverImage: event.coverImage || event.media?.venue?.[0] || '',
  });
}, [event.id]);
  useEffect(() => {
    setApplicationLoaded(false);
setGuestList(realAttendees.length > 0 ? realAttendees : currentAttendees);  
    setIsJoined(false);
    setApplicationStatus('none');
    setApplicationNote('');
    setApplicationText('');
    setShowApplicationModal(false);

    if (typeof window === 'undefined') {
      return;
    }

    const savedApplication = window.localStorage.getItem(applicationStorageKey);
    if (!savedApplication) {
      return;
    }

    try {
      const parsed = JSON.parse(savedApplication) as { status?: string; note?: string; updatedAt?: string };
      const normalizedStatus = normalizeApplicationStatus(parsed.status);
      if (normalizedStatus !== 'none') {
        const currentUserSnapshot = readCurrentUserSnapshot();
        setApplicationStatus(normalizedStatus);
        setApplicationNote(parsed.note ?? '');
        setApplicationUpdatedAt((parsed as any).updatedAt || '');
        if (normalizedStatus === 'pending' || normalizedStatus === 'accepted') {
          setGuestList((current) => [
            {
              id: 'you',
              name: 'You',
              avatar: currentUserSnapshot?.avatarImage || currentUserSnapshot?.avatar || '✨',
              paymentStatus: normalizedStatus === 'accepted' ? 'host_covers' : 'pending',
              joinedAt: new Date(),
              status: normalizedStatus === 'accepted' ? 'confirmed' : 'pending',
            },
            ...current.filter((attendee) => attendee.id !== 'you'),
          ]);
        }
      }
    } catch {
      window.localStorage.removeItem(applicationStorageKey);
    }

    setApplicationLoaded(true);
  }, [event.id]);

  useEffect(() => {
    if (typeof window === 'undefined' || !applicationLoaded) {
      return;
    }

    if (applicationStatus === 'none') {
      window.localStorage.removeItem(applicationStorageKey);
      return;
    }

    window.localStorage.setItem(
      applicationStorageKey,
      JSON.stringify({
        status: applicationStatus,
        note: applicationNote,
        updatedAt: applicationUpdatedAt || new Date().toISOString(),
      })
    );
  }, [applicationStatus, applicationNote, applicationUpdatedAt, applicationStorageKey, applicationLoaded]);

  useEffect(() => {
    if (typeof window === 'undefined' || !applicationLoaded || !currentUserId) {
      return;
    }

    let cancelled = false;

    const syncApplicationStatus = async () => {
      try {
        const response = await API.getUserApplications(currentUserId);
        if (cancelled) return;

        const applications = Array.isArray(response?.applications) ? response.applications : [];
        const currentApplication = applications.find((application: any) =>
          String(application.event_id || application.eventId || application.id) === String(event.id)
        );

        if (!currentApplication) {
          setApplicationStatus('none');
          setApplicationNote('');
          setApplicationUpdatedAt('');
          setIsJoined(false);
          setGuestList((current) => current.filter((attendee) => attendee.id !== 'you'));
          try {
            window.localStorage.removeItem(applicationStorageKey);
            writeStoredEventApplications(
              readStoredEventApplications().filter(
                (application) =>
                  !(
                    String(application.event_id) === String(event.id) &&
                    String(application.user_id) === String(currentUserId)
                  )
              )
            );
          } catch (storageError) {
            console.error('Failed to clear stale application locally:', storageError);
          }
          return;
        }

        const nextStatus = normalizeApplicationStatus(currentApplication.status);
        if (nextStatus === 'none') {
          return;
        }

        const nextNote = String(currentApplication.message || currentApplication.note || applicationNote || '');
        const nextUpdatedAt = String(currentApplication.updated_at || currentApplication.updatedAt || currentApplication.created_at || new Date().toISOString());

        setApplicationStatus(nextStatus);
        setApplicationNote(nextNote);
        setApplicationUpdatedAt(nextUpdatedAt);

        if (nextStatus === 'accepted') {
          const currentUserSnapshot = readCurrentUserSnapshot();
          setIsJoined(true);
          setGuestList((current) => [
            {
              id: 'you',
              name: 'You',
              avatar: currentUserSnapshot?.avatarImage || currentUserSnapshot?.avatar || '✨',
              paymentStatus: 'host_covers',
              joinedAt: new Date(nextUpdatedAt),
              status: 'confirmed',
            },
            ...current.filter((attendee) => attendee.id !== 'you'),
          ]);
        } else if (nextStatus === 'declined') {
          setIsJoined(false);
          setGuestList((current) => current.filter((attendee) => attendee.id !== 'you'));
        }

        try {
          const existingApplications = readStoredEventApplications();
          const nextApplications = existingApplications.map((application) =>
            String(application.event_id) === String(event.id) &&
            String(application.user_id) === String(currentUserId)
              ? {
                  ...application,
                  status: nextStatus,
                  message: nextNote,
                  updated_at: nextUpdatedAt,
                  backend_id: application.backend_id || String(currentApplication.id || currentApplication.application_id || ''),
                  source: 'api',
                }
              : application
          );
          writeStoredEventApplications(nextApplications);
        } catch (storageError) {
          console.error('Failed to sync application status locally:', storageError);
        }
      } catch (error) {
        console.error('Failed to sync application status:', error);
      }
    };

    syncApplicationStatus();
    const intervalId = window.setInterval(syncApplicationStatus, 20000);
    window.addEventListener(applicationsChangedEventName, syncApplicationStatus as EventListener);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener(applicationsChangedEventName, syncApplicationStatus as EventListener);
    };
  }, [applicationLoaded, applicationNote, currentUserId, event.id]);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?page=event&eventId=${event.id}`;
    const shareText = `${event.title}\n${event.location}\nJoin me on Junto: ${shareUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: event.title,
          text: shareText,
          url: shareUrl,
        });
        setShareState('Shared');
        return;
      }

      const popup = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      if (popup) {
        setShareState('WhatsApp opened');
        return;
      }

      await navigator.clipboard.writeText(shareText);
      setShareState('Copied');
    } catch {
      setShareState('Share unavailable');
    } finally {
      window.setTimeout(() => setShareState(''), 2200);
    }
  };

  const handleJoin = () => {
    if (isJoined || applicationStatus === 'pending' || eventExpired || atCapacity) {
      return;
    }

    setShowApplicationModal(true);
  };

  const handleSubmitApplication = () => {
    const currentUser = readCurrentUserSnapshot();
    const localApplication: StoredEventApplication = {
      id: createApplicationId(),
      event_id: event.id,
      event_title: event.title,
      host_id: event.host_id || '',
      user_id: currentUser?.id || API.getUserId() || 'guest',
      user_name: currentUser?.name || 'Guest',
      user_avatar: currentUser?.avatarImage || currentUser?.avatar || '👤',
      message: applicationText.trim(),
      status: 'pending',
      created_at: new Date().toISOString(),
      profile_id: currentUser?.profile_id,
      bio: currentUser?.bio,
      location: currentUser?.location,
      source: 'local',
    };

    setShowApplicationModal(false);
    setApplicationStatus('pending');
    setApplicationNote(applicationText.trim());
    setApplicationUpdatedAt(new Date().toISOString());
    setGuestList((current) => {
      const next = current.filter((attendee) => attendee.id !== 'you');
      return [
        {
          id: 'you',
          name: 'You',
          avatar: currentUser?.avatarImage || currentUser?.avatar || '✨',
          paymentStatus: 'pending',
          joinedAt: new Date(),
          status: 'pending',
        },
        ...next,
      ];
    });
    setShareState('Application sent');

    appendLocalNotification({
      id: `notif-${Date.now()}`,
      recipientUserId: event.host_id || '',
      type: 'application',
      title: `${currentUser?.name || 'A guest'} is interested in ${event.title}`,
      description: applicationText.trim()
        ? `${currentUser?.name || 'A guest'} sent a note: ${applicationText.trim()}`
        : `${currentUser?.name || 'A guest'} clicked I'm interested.`,
      createdAt: new Date().toISOString(),
      read: false,
      eventId: event.id,
      source: 'event-detail',
    });

    appendEventActivity({
      id: `activity-${Date.now()}`,
      eventId: event.id,
      title: 'New application',
      detail: `${currentUser?.name || 'A guest'} clicked I'm interested.`,
      type: 'application',
      createdAt: new Date().toISOString(),
      actorName: currentUser?.name || 'Guest',
    });

    try {
      const existingApplications = readStoredEventApplications();
      const nextApplications = [
        ...existingApplications.filter(
          (application) =>
            !(
              String(application.event_id) === String(localApplication.event_id) &&
              String(application.user_id) === String(localApplication.user_id)
            )
        ),
        localApplication,
      ];
      writeStoredEventApplications(nextApplications);
    } catch (error) {
      console.error('Failed to store local event application:', error);
    }

    if (currentUser?.id) {
      API.applyToEvent(currentUser.id, event.id, applicationText.trim())
        .then((response) => {
          // Check if user was waitlisted
          if (response?.isWaitlisted) {
            setIsWaitlisted(true);
            setShareState('Added to waitlist (event is full)');
          }

          try {
            const backendId = String(response?.id || response?.application_id || '');
            if (!backendId) return;

            const existingApplications = readStoredEventApplications();
            const nextApplications = existingApplications.map((application) =>
              application.id === localApplication.id
                ? {
                    ...application,
                    backend_id: backendId,
                    updated_at: new Date().toISOString(),
                    source: 'api',
                  }
                : application
            );
            writeStoredEventApplications(nextApplications);
          } catch (storageError) {
            console.error('Failed to sync backend application id locally:', storageError);
          }
        })
        .catch((error) => {
          console.error('Failed to submit application to API:', error);
        });
    }

    window.setTimeout(() => setShareState(''), 2200);
  };

  const openHostChat = () => {
    const hostTarget = {
      id: String(event.host_id || event.host.id || event.host.name),
      name: event.host.name,
      display_name: event.host.name,
      profile_id: String(event.host_id || event.host.id || event.host.name),
      avatarImage: event.host.avatar,
      avatar_image: event.host.avatar,
      city: event.location,
      eventId: event.id,
      source: 'event-host',
    };

    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('junto-message-target', JSON.stringify(hostTarget));
    }

    if (onNavigate) {
      onNavigate('messages');
    } else {
      navigate('/messages');
    }
  };

const openHostProfile = async () => {
  const hostId = event.host_id || event.host.id || event.host.name;

  // Set basic info immediately so navigation feels instant
  setSelectedUser({
    id: hostId,
    name: event.host.name,
    username: event.host.name,
    display_name: event.host.name,
    avatar: resolvedHostAvatar,
avatar_image: resolvedHostAvatar,
    avatar_image: event.host.avatar,
    reliabilityScore: event.host.reliabilityScore,
    isVerified: event.host.isVerified,
    city: event.location,
  });

  // Then fetch full profile and update with real data
  try {
    const fullProfile = await API.getUserProfile(hostId);
    setSelectedUser({
      id: hostId,
      name: fullProfile.display_name || fullProfile.username || fullProfile.name || event.host.name,
      username: fullProfile.username || event.host.name,
      display_name: fullProfile.display_name || event.host.name,
      avatar: fullProfile.avatar_image || fullProfile.avatar_url || event.host.avatar,
      avatar_image: fullProfile.avatar_image || fullProfile.avatar_url || event.host.avatar,
      avatarImage: fullProfile.avatar_image || fullProfile.avatar_url || event.host.avatar,
      profile_photos: fullProfile.profile_photos || [],
      bio: fullProfile.bio || '',
      location: fullProfile.location || fullProfile.city || event.location,
      reliabilityScore: event.host.reliabilityScore,
      isVerified: event.host.isVerified,
      averageRating: event.host.averageRating,
      interests: fullProfile.interests || [],
      eventsHosted: event.host.reviews,
    });
  } catch {
    // Keep the basic info already set above
  }

  if (onNavigate) {
    onNavigate('profile');
  } else {
    navigate('/profile');
  }
};

  const handleCancelAttendance = () => {
    setIsJoined(false);
    setApplicationStatus('none');
    setApplicationNote('');
    setApplicationUpdatedAt('');
    setApplicationText('');
    setShowApplicationModal(false);
    setGuestList((current) => current.filter((attendee) => attendee.id !== 'you'));
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(applicationStorageKey);
    }
    setShareState('Application cancelled');
    window.setTimeout(() => setShareState(''), 2200);
  };

  const handleAddToCalendar = () => {
    const title = encodeURIComponent(event.title);
    const details = encodeURIComponent(event.description);
    const location = encodeURIComponent(event.location);
    const start = event.calendar?.start;
    const end = event.calendar?.end ?? start;

    if (!start) {
      setShareState('Calendar unavailable');
      window.setTimeout(() => setShareState(''), 2200);
      return;
    }

    const formatCalendarStamp = (value: string) => new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatCalendarStamp(start)}/${formatCalendarStamp(end as string)}&details=${details}&location=${location}`;
    window.open(googleCalendarUrl, '_blank', 'noopener,noreferrer');
    setShareState('Calendar opened');
    window.setTimeout(() => setShareState(''), 2200);
  };

  const handleOpenEdit = () => {
    setEditError('');
    setShowEditModal(true);
  };

  const handleEditImageUpload = (file: File | null) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setEditError('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setEditDraft((current) => ({
        ...current,
        coverImage: String(event.target?.result || ''),
      }));
      setEditError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEdit = async (submitEvent: React.FormEvent) => {
    submitEvent.preventDefault();

    if (!canEditEvent) {
      setEditError('You can only edit your own event.');
      return;
    }

    if (!editDraft.title.trim() || !editDraft.date || !editDraft.time || !editDraft.location.trim()) {
      setEditError('Please fill in title, date, time, and location.');
      return;
    }

    setEditSaving(true);
    setEditError('');

    const compressedCoverImage = await compressImageDataUrl(editDraft.coverImage || '');

    const payload = {
      title: editDraft.title.trim(),
      description: editDraft.description.trim(),
      location_city: editDraft.location.trim(),
      event_date: editDraft.date,
      event_time: editDraft.time,
      max_guests: Number(editDraft.maxSpots) || event.totalSpots,
      cover_photo_url: compressedCoverImage || undefined,
      status: 'active',
      event_type: (event as any).event_type || 'social',
      is_squad_event: Boolean((event as any).is_squad_event || (event as any).squad_event),
      billing_tier: Number((event as any).billing_tier || (event as any).billingTier || 1),
    };

    try {
      await API.updateEvent(event.id, payload);

      const nextEvent: EventDetailData = {
        ...event,
        title: payload.title,
        description: payload.description,
        location: payload.location_city,
        date: payload.event_date,
        time: payload.event_time,
        totalSpots: payload.max_guests,
        spots: `${Math.max(0, payload.max_guests - event.currentAttendees)} left`,
        currentAttendees: Math.min(event.currentAttendees, payload.max_guests),
        media: {
          ...event.media,
          venue: [payload.cover_photo_url || event.media?.venue?.[0] || ''],
        },
        coverImage: payload.cover_photo_url || event.coverImage || event.media?.venue?.[0] || '',
      };
      setEvent(nextEvent);

      if (typeof window !== 'undefined') {
        try {
          const storedEventsRaw = window.localStorage.getItem('junto-created-events');
          const storedEvents = storedEventsRaw ? JSON.parse(storedEventsRaw) : [];
          if (Array.isArray(storedEvents)) {
            const nextStoredEvents = storedEvents.map((stored: any) =>
              String(stored.id) === String(event.id)
                ? {
                    ...stored,
                    title: payload.title,
                    description: payload.description,
                    location_city: payload.location_city,
                    event_date: payload.event_date,
                    event_time: payload.event_time,
                    max_guests: payload.max_guests,
                    coverImage: payload.cover_photo_url || stored.coverImage || '',
                    cover_photo_url: payload.cover_photo_url || stored.cover_photo_url,
                    status: 'active',
                  }
                : stored
            );
            window.localStorage.setItem('junto-created-events', JSON.stringify(nextStoredEvents));
          }
        } catch (storageError) {
          console.error('Failed to sync updated event locally:', storageError);
        }
      }

      setEditDraft((current) => ({
        ...current,
        coverImage: payload.cover_photo_url || current.coverImage,
      }));
      setShareState('Event updated');
      window.setTimeout(() => setShareState(''), 2200);
      setShowEditModal(false);
    } catch (error) {
      console.error('Failed to update event from detail page:', error);
      setEditError('Failed to update event. Please try again.');
    } finally {
      setEditSaving(false);
    }
  };

  const paymentStatusColors = {
    host_covers: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', label: 'Host Covers' },
    paid: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', label: 'Paid' },
    pending: { bg: 'bg-[#F59E0B]/10', border: 'border-[#F59E0B]/30', text: 'text-[#FBBF24]', label: 'Pending' },
    declined: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', label: 'Declined' },
  };

  const activeTabButton =
    'bg-gradient-to-r from-[#F59E0B] to-[#FB923C] text-white shadow-lg shadow-[#F59E0B]/20';
  const inactiveTabButton = 'border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10';

  return (
<div className="min-h-screen bg-[#0F0F13] text-white pb-40">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="sticky top-0 z-50 -mx-4 mb-4 border-b border-white/5 bg-[#0F0F13]/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <button
            onClick={() => onNavigate?.('main')}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-300 transition-colors hover:text-[#F59E0B]"
          >
            <ArrowLeft size={18} />
            Back to feed
          </button>
        </div>

        <div className="flex-1 pb-44 sm:pb-48">
          <div className="overflow-hidden rounded-3xl border border-white/5 bg-[#141419] shadow-2xl shadow-black/20">
            <div className="relative h-56 sm:h-72 md:h-80">
              <img
                src={event.media?.venue?.[0] || 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=500'}
                alt={event.title}
                className="h-full w-full object-cover opacity-75"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F13] via-[#0F0F13]/30 to-transparent" />
              <div className="absolute right-4 top-4 flex gap-2">
                <button
                  onClick={() => setIsSaved((current) => !current)}
                  className="rounded-full bg-black/50 p-2.5 backdrop-blur transition hover:bg-black/70"
                  aria-label="Save event"
                >
                  <Heart
                    size={20}
                    className={`sm:h-6 sm:w-6 ${isSaved ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-white'}`}
                  />
                </button>
                <button
                  onClick={handleShare}
                  className="rounded-full bg-black/50 p-2.5 backdrop-blur transition hover:bg-black/70"
                  aria-label="Share event"
                >
                  <Share2 size={20} className="sm:h-6 sm:w-6 text-white" />
                </button>
                {canEditEvent && (
                  <button
                    onClick={handleOpenEdit}
                    className="rounded-full bg-black/50 p-2.5 backdrop-blur transition hover:bg-black/70"
                    aria-label="Edit event"
                  >
                    <Edit3 size={20} className="sm:h-6 sm:w-6 text-white" />
                  </button>
                )}
              </div>
              {shareState && (
                <div className="absolute right-4 top-16 rounded-full border border-white/10 bg-black/60 px-3 py-1 text-xs text-gray-200 backdrop-blur">
                  {shareState}
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#F59E0B]/15 px-3 py-1.5 text-xs font-medium text-[#FBBF24]">
                    {event.category}
                  </span>
                  {isSquadEvent && (
                    <span className="rounded-full border border-pink-500/20 bg-pink-500/10 px-3 py-1.5 text-xs font-medium text-pink-300">
                      Squad event
                    </span>
                  )}
                  <span className="rounded-full bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400">
                    {event.genderFilter}
                  </span>
                  <span className="rounded-full bg-[#F59E0B]/15 px-3 py-1.5 text-xs font-medium text-[#FBBF24]">
                    {event.ageRestriction}
                  </span>
                </div>
                <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
                  {event.title}
                </h1>
              </div>
            </div>

            <div className="border-b border-white/5 bg-[#111115] px-4 py-4 sm:px-6 md:px-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-3 min-w-0 cursor-pointer" onClick={() => {
                     setSelectedUser({
  id: event.host_id || event.host.name,
  name: event.host.name,
  avatar: resolvedHostAvatar,
  avatarImage: resolvedHostAvatar,
  photo: resolvedHostAvatar,
  reliabilityScore: event.host.reliabilityScore,
  isVerified: event.host.isVerified,
  averageRating: event.host.averageRating,
  reviews: event.host.reviews,
  location: event.location,
  bio: `${event.host.name} is hosting "${event.title}" in ${event.location}.`,
  interests: [],
  eventsHosted: event.host.reviews,
});
                        navigate('/profile');
                }} style={{ opacity: 1, transition: 'opacity 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'} onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
     <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#F59E0B] to-[#FB923C] text-lg shadow-lg shadow-[#F59E0B]/20 overflow-hidden">
  {resolvedHostAvatar?.startsWith('http') || resolvedHostAvatar?.startsWith('data:') ? (
    <img src={resolvedHostAvatar} alt={event.host.name} className="h-full w-full object-cover rounded-full" />
  ) : (
    <span>{resolvedHostAvatar || event.host.name.charAt(0).toUpperCase()}</span>
  )}
</div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{event.host.name}</p>
                    <p className="truncate text-xs text-gray-400">{event.location}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                          event.host.isVerified
                            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                            : 'border-white/10 bg-white/5 text-gray-400'
                        }`}
                      >
                        {event.host.isVerified ? '✓ Verified' : 'Unverified'}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#F59E0B]/20 bg-[#F59E0B]/10 px-2.5 py-1 text-[10px] font-semibold text-[#FBBF24]">
                        🟢 {event.host.reliabilityScore}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                    {event.currentAttendees}/{event.totalSpots} going
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                    {event.interested} interested
                  </span>
                </div>
              </div>
            </div>

            <div className="px-4 py-4 sm:px-6 md:px-8">
              {applicationStatus === 'pending' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mb-4 rounded-2xl p-4 border ${
                    isWaitlisted 
                      ? 'border-amber-500/25 bg-amber-500/10' 
                      : 'border-[#F59E0B]/25 bg-[#F59E0B]/10'
                  }`}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className={`text-sm font-semibold ${isWaitlisted ? 'text-amber-400' : 'text-[#FBBF24]'}`}>
                        {isWaitlisted ? 'On Waitlist' : 'Application pending'}
                      </p>
                      <p className="text-xs text-gray-300">
                        {isWaitlisted 
                          ? 'You\'re on the waitlist! The host will notify you if a spot opens up.'
                          : 'You applied to join this event. The host will see your note and can approve it.'}
                      </p>
                    </div>
                    <span className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                      isWaitlisted
                        ? 'border-amber-500/20 bg-amber-500/10 text-amber-400'
                        : 'border-[#F59E0B]/20 bg-[#F59E0B]/10 text-[#FBBF24]'
                    }`}>
                      {isWaitlisted ? 'Waitlisted' : 'Pending review'}
                    </span>
                  </div>
                  {applicationNote && (
                    <div className="mt-3 rounded-xl border border-white/5 bg-white/5 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-gray-500">Your note</p>
                      <p className="mt-1 text-sm text-gray-200">{applicationNote}</p>
                    </div>
                  )}
                </motion.div>
              )}

              {applicationStatus !== 'none' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-5 rounded-2xl border border-white/5 bg-white/5 p-4 sm:p-5"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#FBBF24]">Status timeline</p>
                      <p className="text-xs text-gray-400">
                        {applicationStatus === 'accepted'
                          ? 'Follow-up actions are ready.'
                          : applicationStatus === 'declined'
                            ? 'You can save this search and move on to another outing.'
                            : 'We will keep tracking the response for you.'}
                      </p>
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                        applicationStatus === 'accepted'
                          ? 'border-green-500/20 bg-green-500/10 text-green-300'
                          : applicationStatus === 'declined'
                            ? 'border-red-500/20 bg-red-500/10 text-red-300'
                            : 'border-[#F59E0B]/20 bg-[#F59E0B]/10 text-[#FBBF24]'
                      }`}
                    >
                      {applicationStatus}
                    </span>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    {applicationTimeline.map((step) => (
                      <div
                        key={step.title}
                        className={`rounded-2xl border p-4 ${
                          step.state === 'complete'
                            ? 'border-green-500/20 bg-green-500/10'
                            : step.state === 'active'
                              ? 'border-[#F59E0B]/25 bg-[#F59E0B]/10'
                              : 'border-white/5 bg-white/5'
                        }`}
                      >
                        <p className="text-xs uppercase tracking-[0.18em] text-gray-400">{step.title}</p>
                        <p className="mt-2 text-sm text-gray-100">{step.detail}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {applicationStatus === 'pending' && (
                      <>
                        <button
                          onClick={handleCancelAttendance}
                          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                        >
                          Withdraw application
                        </button>
                        <button
                          onClick={openHostChat}
                          className="rounded-full border border-[#F59E0B]/20 bg-[#F59E0B]/10 px-4 py-2 text-sm font-semibold text-[#FBBF24] transition hover:bg-[#F59E0B]/20"
                        >
                          Message host
                        </button>
                      </>
                    )}

                    {applicationStatus === 'accepted' && (
                      <>
                        <button
                          onClick={openHostChat}
                          className="rounded-full border border-[#F59E0B]/20 bg-[#F59E0B]/10 px-4 py-2 text-sm font-semibold text-[#FBBF24] transition hover:bg-[#F59E0B]/20"
                        >
                          Message host
                        </button>
                        <button
                          onClick={handleAddToCalendar}
                          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                        >
                          Add to calendar
                        </button>
                      </>
                    )}

                    {applicationStatus === 'declined' && (
                      <>
                        <button
                          onClick={() => onNavigate?.('main')}
                          className="rounded-full border border-[#F59E0B]/20 bg-[#F59E0B]/10 px-4 py-2 text-sm font-semibold text-[#FBBF24] transition hover:bg-[#F59E0B]/20"
                        >
                          Browse more events
                        </button>
                        <button
                          onClick={openHostChat}
                          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                        >
                          Message host
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              )}

              {eventActivities.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-5 rounded-2xl border border-white/5 bg-white/5 p-4 sm:p-5"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#FBBF24]">Event history feed</p>
                      <p className="text-xs text-gray-400">Shared updates for this event across pages.</p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-300">
                      {eventActivities.length} updates
                    </span>
                  </div>

                  <div className="space-y-3">
                    {eventActivities.slice(0, 4).map((activity) => (
                      <div key={activity.id} className="rounded-2xl border border-white/5 bg-[#0F0F13] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white">{activity.title}</p>
                            <p className="mt-1 text-xs text-gray-400">{new Date(activity.createdAt).toLocaleString()}</p>
                          </div>
                          <span className="rounded-full border border-[#F59E0B]/20 bg-[#F59E0B]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#FBBF24]">
                            {activity.type}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-gray-300">{activity.detail}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
                <button onClick={() => setActiveTab('overview')} className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${activeTab === 'overview' ? activeTabButton : inactiveTabButton}`}>
                  Overview
                </button>
                <button onClick={() => setActiveTab('attendees')} className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${activeTab === 'attendees' ? activeTabButton : inactiveTabButton}`}>
                  Attendees <span className="ml-1 text-[10px] opacity-80">{event.currentAttendees}</span>
                </button>
                <button onClick={() => setActiveTab('reviews')} className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${activeTab === 'reviews' ? activeTabButton : inactiveTabButton}`}>
                  Reviews <span className="ml-1 text-[10px] opacity-80">{reviews.length}</span>
                </button>
                <button onClick={() => setActiveTab('host')} className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${activeTab === 'host' ? activeTabButton : inactiveTabButton}`}>
                  Host Info
                </button>
              </div>

              {activeTab === 'overview' && (
                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="space-y-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-white/5 bg-white/5 p-4 sm:p-5">
                      <p className="text-sm leading-relaxed text-gray-300">{event.description}</p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-white/5 bg-[#101014] p-4">
                        <p className="mb-1 text-xs text-gray-400">📅 Date</p>
                        <p className="text-sm font-semibold">{new Date(event.date).toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                      </div>
                      <div className="rounded-2xl border border-white/5 bg-[#101014] p-4">
                        <p className="mb-1 text-xs text-gray-400">🕒 Time</p>
                        <p className="text-sm font-semibold">{event.time}</p>
                      </div>
                      <div className="rounded-2xl border border-white/5 bg-[#101014] p-4">
                        <p className="mb-1 text-xs text-gray-400">⏱ Duration</p>
                        <p className="text-sm font-semibold">{event.duration}</p>
                      </div>
                      <div className="rounded-2xl border border-white/5 bg-[#101014] p-4">
                        <p className="mb-1 text-xs text-gray-400">💰 Cost</p>
                        <p className="text-sm font-semibold text-[#FBBF24]">{event.estimatedCost}</p>
                      </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-[#F59E0B]/20 bg-[#F59E0B]/10 p-4">
                      <p className="flex items-start gap-2 text-sm">
                        <MapPin size={18} className="mt-1 flex-shrink-0 text-[#FBBF24]" />
                        <span>{event.location}</span>
                      </p>
                    </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="overflow-hidden rounded-2xl border border-white/5 bg-white/5 relative z-0">
                      <div className="flex items-center justify-between px-4 pt-4">
                        <div>
                          <h3 className="text-sm font-semibold">Map Preview</h3>
                          <p className="text-xs text-gray-400">See exactly where to go</p>
                        </div>
                        <button
                          onClick={() => window.open(mapUrl, '_blank', 'noopener,noreferrer')}
                          className="inline-flex items-center gap-1 rounded-full border border-[#F59E0B]/20 bg-[#F59E0B]/10 px-3 py-1.5 text-[11px] font-semibold text-[#FBBF24] transition hover:bg-[#F59E0B]/20"
                        >
                          Open Maps <ExternalLink size={12} />
                        </button>
                      </div>
                      <div className="mt-3 h-56 overflow-hidden relative z-0">
                        <LeafletMapContainer
                          center={eventCoords}
                          zoom={14}
                          scrollWheelZoom={false}
                          dragging={false}
                          doubleClickZoom={false}
                          zoomControl={false}
                          attributionControl={false}
                          className="h-full w-full"
                        >
                          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                          <LeafletMarker position={eventCoords} icon={createMapIcon('J')}>
                            <LeafletPopup>{event.location}</LeafletPopup>
                          </LeafletMarker>
                        </LeafletMapContainer>
                      </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-white/5 bg-white/5 p-4">
                      <h3 className="mb-3 text-sm font-semibold">Event Guidelines</h3>
                      <div className="space-y-2">
                        {event.rules.map((rule, idx) => (
                          <p key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                            <span className="mt-1 text-[#FBBF24]">✓</span>
                            {rule}
                          </p>
                        ))}
                      </div>
                    </motion.div>
                  </div>

                  <div className="space-y-4">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/5 bg-white/5 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold">Squad Filling Up</p>
                          <p className="text-xs text-gray-400">{event.currentAttendees}/{event.totalSpots} spots</p>
                        </div>
                        <p className="text-sm text-[#FBBF24]">{event.spots}</p>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#F59E0B] to-[#FB923C]"
                          style={{ width: `${(event.currentAttendees / event.totalSpots) * 100}%` }}
                        />
                      </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className={`rounded-2xl border p-4 ${billingDetails.badgeClass}`}>
                      <h3 className="mb-2 text-sm font-semibold">{billingDetails.title}</h3>
                      <p className="text-sm text-gray-300">{billingDetails.subtitle}</p>
                      <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-red-400" />
                          <p className="text-xs text-red-200">
                            {billingDetails.note} All payments happen at the venue only. Never send money before the event.
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
                      <h3 className="mb-2 text-sm font-semibold text-blue-400">Cancellation Policy</h3>
                      <p className="text-sm text-gray-300">
                        {event.cancellation_policy === 'strict' && '❌ No refunds allowed. Cancellations accepted until 48 hours before the event.'}
                        {event.cancellation_policy === 'moderate' && '⚠️ 50% refund available. Cancellations accepted until 24 hours before the event.'}
                        {event.cancellation_policy === 'flexible' && '✅ Full refund available. Cancellations accepted until 12 hours before the event.'}
                        {!event.cancellation_policy && '📋 Host has set a cancellation policy. Check details before applying.'}
                      </p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-2xl border border-white/5 bg-white/5 p-4 cursor-pointer" onClick={() => {
                      setSelectedUser({
  id: event.host_id || event.host.name,
  name: event.host.name,
avatar: resolvedHostAvatar,
  avatarImage: resolvedHostAvatar,
  photo: resolvedHostAvatar,
  reliabilityScore: event.host.reliabilityScore,
  isVerified: event.host.isVerified,
  averageRating: event.host.averageRating,
  reviews: event.host.reviews,
  location: event.location,
  bio: `${event.host.name} is hosting "${event.title}" in ${event.location}.`,
  interests: [],
  eventsHosted: event.host.reviews,
});
                      navigate('/profile');
                    }} style={{ opacity: 1, transition: 'opacity 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'} onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#F59E0B] to-[#FB923C] text-lg overflow-hidden">
  {resolvedHostAvatar?.startsWith('http') || resolvedHostAvatar?.startsWith('data:') ? (
    <img src={resolvedHostAvatar} alt={event.host.name} className="h-full w-full object-cover rounded-full" />
  ) : (
    <span>{resolvedHostAvatar || event.host.name.charAt(0).toUpperCase()}</span>
  )}
</div>
                          <div>
                            <p className="font-semibold">{event.host.name}</p>
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              {event.host.isVerified && <Check size={12} className="text-[#FBBF24]" />}
                              <span>Reliability: {event.host.reliabilityScore}%</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#FBBF24]">⭐ {event.host.averageRating}</p>
                          <p className="text-xs text-gray-400">Rating</p>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-3">
                        <div className="rounded-xl bg-[#101014] p-3 text-center">
                          <p className="text-lg font-bold text-green-400">{event.host.reliabilityScore}%</p>
                          <p className="text-xs text-gray-400">Reliable</p>
                        </div>
                        <div className="rounded-xl bg-[#101014] p-3 text-center">
                          <p className="text-lg font-bold">{event.host.reviews}</p>
                          <p className="text-xs text-gray-400">Reviews</p>
                        </div>
                        <div className="rounded-xl bg-[#101014] p-3 text-center">
                          <p className="text-lg font-bold text-[#FBBF24]">{event.interested}</p>
                          <p className="text-xs text-gray-400">Interested</p>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              )}

              {activeTab === 'attendees' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                      <p className="text-xs text-gray-400">Guest list</p>
                      <p className="mt-1 text-2xl font-bold text-white">{confirmedAttendees.length}</p>
                      <p className="text-xs text-gray-500">Accepted / maybe</p>
                    </div>
                    <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                      <p className="text-xs text-gray-400">Pending</p>
                      <p className="mt-1 text-2xl font-bold text-[#FBBF24]">{guestList.filter((attendee) => attendee.status === 'pending').length}</p>
                      <p className="text-xs text-gray-500">Waiting on host</p>
                    </div>
                    <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                      <p className="text-xs text-gray-400">Total</p>
                      <p className="mt-1 text-2xl font-bold text-[#FBBF24]">{guestList.length}</p>
                      <p className="text-xs text-gray-500">Visible guests</p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {guestList.map((attendee, idx) => {
                      const status = paymentStatusColors[attendee.paymentStatus];
                      return (
                        <div key={attendee.id} className="rounded-2xl border border-white/5 bg-white/5 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#101014]">
                                {attendee.avatar}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">{attendee.name}</p>
                                <p className="text-xs text-gray-400">
                                  {attendee.status === 'confirmed' ? 'Accepted' : attendee.status === 'maybe' ? 'Maybe' : attendee.status === 'pending' ? 'Pending' : 'Declined'}
                                </p>
                              </div>
                            </div>
                            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${status.bg} ${status.border} ${status.text}`}>
                              {status.label}
                            </span>
                          </div>
                          <div className="mt-3 text-xs text-gray-500">
                            Joined {Math.max(1, idx + 1)}h ago
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {activeTab === 'host' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-white/5 bg-white/5 p-4 cursor-pointer" onClick={() => {
                     setSelectedUser({
  id: event.host_id || event.host.name,
  name: event.host.name,
 avatar: resolvedHostAvatar,
  avatarImage: resolvedHostAvatar,
  photo: resolvedHostAvatar,
  reliabilityScore: event.host.reliabilityScore,
  isVerified: event.host.isVerified,
  averageRating: event.host.averageRating,
  reviews: event.host.reviews,
  location: event.location,
  bio: `${event.host.name} is hosting "${event.title}" in ${event.location}.`,
  interests: [],
  eventsHosted: event.host.reviews,
});
                      navigate('/profile');
                    }} style={{ opacity: 1, transition: 'opacity 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'} onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
                      <div className="flex items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#F59E0B] to-[#FB923C] text-2xl overflow-hidden">
  {resolvedHostAvatar?.startsWith('http') || resolvedHostAvatar?.startsWith('data:') ? (
    <img src={resolvedHostAvatar} alt={event.host.name} className="h-full w-full object-cover rounded-full" />
  ) : (
    <span>{resolvedHostAvatar || event.host.name.charAt(0).toUpperCase()}</span>
  )}
</div>
                        <div>
                          <p className="text-base font-semibold">{event.host.name}</p>
                          <p className="text-sm text-gray-400">Trusted community host</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                                event.host.isVerified
                                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                                  : 'border-white/10 bg-white/5 text-gray-400'
                              }`}
                            >
                              {event.host.isVerified ? '✓ Verified' : 'Unverified'}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-[#F59E0B]/20 bg-[#F59E0B]/10 px-2.5 py-1 text-[10px] font-semibold text-[#FBBF24]">
                              🟢 {event.host.reliabilityScore}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-white/5 bg-[#101014] p-3 text-center">
                        <p className="text-lg font-bold text-[#FBBF24]">⭐ {event.host.averageRating}</p>
                        <p className="text-xs text-gray-400">Avg Rating</p>
                      </div>
                      <div className="rounded-2xl border border-white/5 bg-[#101014] p-3 text-center">
                        <p className="text-lg font-bold text-green-400">{event.host.reliabilityScore}%</p>
                        <p className="text-xs text-gray-400">Reliable</p>
                      </div>
                      <div className="rounded-2xl border border-white/5 bg-[#101014] p-3 text-center">
                        <p className="text-lg font-bold">{event.host.reviews}</p>
                        <p className="text-xs text-gray-400">Reviews</p>
                      </div>
                      <div className="rounded-2xl border border-white/5 bg-[#101014] p-3 text-center">
                        <p className="text-lg font-bold text-[#FBBF24]">{event.host.reviews + 2}</p>
                        <p className="text-xs text-gray-400">Events Hosted</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                      <p className="text-sm text-gray-300">
                        Experienced event host who loves bringing people together. All events are planned with safety and fun in mind!
                      </p>
                    </div>

                  <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
  <h3 className="mb-4 text-sm font-semibold">Past Events</h3>
  <div className="space-y-3">
    {hostPastEvents.length > 0 ? hostPastEvents.map((pastEvent: any, idx: number) => (
      <div key={idx} className="rounded-xl border border-white/5 bg-[#101014] p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{pastEvent.title || 'Past Event'}</p>
            <p className="text-xs text-gray-500">
              {pastEvent.event_date ? new Date(pastEvent.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Completed'}
            </p>
          </div>
          {pastEvent.average_rating && (
            <span className="text-sm text-[#FBBF24] whitespace-nowrap">⭐ {Number(pastEvent.average_rating).toFixed(1)}</span>
          )}
        </div>
        <div className="space-y-1 mt-2 text-xs text-gray-400">
          {pastEvent.attendee_count && <p>📊 <span className="text-gray-300">{pastEvent.attendee_count} attendees</span></p>}
          {pastEvent.location_city && <p>📍 <span className="text-gray-300">{pastEvent.location_city}</span></p>}
        </div>
      </div>
    )) : (
      // Fallback to hardcoded if no API data yet
      <>
        <div className="rounded-xl border border-white/5 bg-[#101014] p-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">Art Lounge Exhibition</p>
              <p className="text-xs text-gray-500">Completed 2 weeks ago</p>
            </div>
            <span className="text-sm text-[#FBBF24] whitespace-nowrap">⭐ 4.9</span>
          </div>
          <p className="text-xs text-gray-400 italic mt-1">"{event.host.name} was very organized." - Amara</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#101014] p-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">Sunset Dinner Party</p>
              <p className="text-xs text-gray-500">Completed 1 month ago</p>
            </div>
            <span className="text-sm text-[#FBBF24] whitespace-nowrap">⭐ 4.8</span>
          </div>
          <p className="text-xs text-gray-400 italic mt-1">"{event.host.name} made everyone feel welcome." - Chioma</p>
        </div>
      </>
    )}
  </div>
</div>

                    {/* Host Ratings & Reviews */}
                    <HostRating 
                      hostId={event.host_id || event.host.id}
                      eventId={event.id}
                      userId={currentUser?.id}
                      onRatingSubmitted={() => {
                        // Refresh event data or ratings display
                      }}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <button
                        onClick={openHostChat}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#FB923C] py-3 font-semibold text-white transition hover:opacity-90"
                      >
                        <MessageCircle size={18} />
                        Message Host
                      </button>
                      <button
                        onClick={openHostProfile}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 font-semibold text-white transition hover:bg-white/10"
                      >
                        View All Events by {event.host.name}
                      </button>
                    </div>

                    <div className="space-y-3 rounded-2xl border border-white/5 bg-white/5 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold">Recent Reviews</h3>
                        <span className="text-xs text-gray-400">{reviews.length} reviews</span>
                      </div>
                      {reviews.map((review, idx) => (
                        <div key={idx} className="rounded-xl border border-white/5 bg-[#101014] p-3">
                          <div className="mb-1 flex items-start justify-between">
                            <p className="text-sm font-medium">{review.author}</p>
                            <p className="text-sm text-[#FBBF24]">{'⭐'.repeat(review.rating)}</p>
                          </div>
                          <p className="text-xs text-gray-400">{review.text}</p>
                          <p className="mt-2 text-[10px] text-gray-500">{review.time}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'reviews' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="rounded-2xl border border-white/5 bg-white/5 p-6">
                    <div className="mb-6 flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-4xl font-bold text-[#FBBF24]">{event.host.averageRating}</p>
                        <p className="mt-1 text-sm text-gray-400">out of 5</p>
                      </div>
                      <div className="flex-1">
                        <p className="mb-3 text-sm font-semibold text-gray-300">
                          Based on {reviews.length} reviews
                        </p>
                        <div className="space-y-2">
                          {[5, 4, 3, 2, 1].map((rating) => {
                            const count = reviews.filter((r) => r.rating === rating).length;
                            const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                            return (
                              <div key={rating} className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">{rating}⭐</span>
                                <div className="h-2 flex-1 rounded-full bg-white/10">
                                  <div
                                    className="h-full rounded-full bg-[#F59E0B]"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {reviews.length > 0 ? (
                      reviews.map((review, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="rounded-2xl border border-white/5 bg-white/5 p-4"
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <p className="font-semibold text-white">{review.author}</p>
                              <p className="text-xs text-gray-400">{review.time}</p>
                            </div>
                            <span className="text-sm text-[#FBBF24]">{'⭐'.repeat(review.rating)}</span>
                          </div>
                          <p className="text-sm text-gray-300 leading-relaxed">{review.text}</p>
                        </motion.div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-white/5 bg-white/5 p-8 text-center">
                        <p className="text-gray-400">No reviews yet. Be the first to review!</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <div
          className="fixed inset-0 z-[75] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditModal(false);
            }
          }}
        >
      <form
        onSubmit={handleSaveEdit}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#111115] p-5 shadow-2xl shadow-black/40 sm:p-6"
      >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Edit event</h3>
                <p className="text-sm text-gray-400">Update the details, image, and date from here.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300 transition hover:bg-white/10"
              >
                Close
              </button>
            </div>

            {editError && (
              <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {editError}
              </div>
            )}

            <div className="mt-5 flex-1 overflow-y-auto pr-1 grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Title</label>
                <input
                  value={editDraft.title}
                  onChange={(e) => setEditDraft((current) => ({ ...current, title: e.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-[#0F0F13] px-4 py-3 text-white outline-none transition focus:border-[#F59E0B]/50"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Description</label>
                <textarea
                  value={editDraft.description}
                  onChange={(e) => setEditDraft((current) => ({ ...current, description: e.target.value }))}
                  className="min-h-28 w-full rounded-2xl border border-white/10 bg-[#0F0F13] px-4 py-3 text-white outline-none transition focus:border-[#F59E0B]/50"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">Date</label>
                  <input
                    type="date"
                    value={editDraft.date}
                    onChange={(e) => setEditDraft((current) => ({ ...current, date: e.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-[#0F0F13] px-4 py-3 text-white outline-none transition focus:border-[#F59E0B]/50"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">Time</label>
                  <input
                    type="time"
                    value={editDraft.time}
                    onChange={(e) => setEditDraft((current) => ({ ...current, time: e.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-[#0F0F13] px-4 py-3 text-white outline-none transition focus:border-[#F59E0B]/50"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">Location</label>
                  <input
                    value={editDraft.location}
                    onChange={(e) => setEditDraft((current) => ({ ...current, location: e.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-[#0F0F13] px-4 py-3 text-white outline-none transition focus:border-[#F59E0B]/50"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">Max Guests</label>
                  <input
                    type="number"
                    min="1"
                    value={editDraft.maxSpots}
                    onChange={(e) => setEditDraft((current) => ({ ...current, maxSpots: e.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-[#0F0F13] px-4 py-3 text-white outline-none transition focus:border-[#F59E0B]/50"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Cover image URL</label>
                <input
                  value={editDraft.coverImage}
                  onChange={(e) => setEditDraft((current) => ({ ...current, coverImage: e.target.value }))}
                  className="mb-3 w-full rounded-2xl border border-white/10 bg-[#0F0F13] px-4 py-3 text-white outline-none transition focus:border-[#F59E0B]/50"
                  placeholder="Paste image URL or upload a new image"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleEditImageUpload(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-400 file:mr-4 file:rounded-full file:border-0 file:bg-[#F59E0B] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#F59E0B]/90"
                />
                {editDraft.coverImage && (
                  <div className="mt-3 overflow-hidden rounded-2xl border border-white/10">
                    <img src={editDraft.coverImage} alt="Cover preview" className="h-48 w-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 flex shrink-0 gap-3">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 font-semibold text-white transition hover:bg-white/10"
                disabled={editSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editSaving}
                className="w-full rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#FB923C] py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-70"
              >
                {editSaving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {showApplicationModal && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowApplicationModal(false);
            }
          }}
        >
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111115] p-5 shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Apply to join</h3>
                <p className="text-sm text-gray-400">Add a quick note to the host before you submit.</p>
              </div>
              <button
                onClick={() => setShowApplicationModal(false)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300 transition hover:bg-white/10"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-white/5 bg-white/5 p-3">
                <p className="text-xs text-gray-500">Event</p>
                <p className="mt-1 text-sm font-medium text-white">{event.title}</p>
              </div>

              {isSquadEvent && (
                <div className="rounded-2xl border border-pink-500/20 bg-pink-500/10 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-pink-300">Squad event</p>
                  <p className="mt-1 text-sm text-gray-200">
                    This outing is set up for a group. If you join, you’re stepping into a squad-style event.
                  </p>
                </div>
              )}

              <div className={`rounded-2xl border p-4 ${billingDetails.badgeClass}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#FBBF24]">Event terms</p>
                    <p className="mt-1 text-sm font-semibold text-white">Please read the event details carefully</p>
                  </div>
                  <div className="text-right text-xs text-gray-300">
                    <p>{event.estimatedCost}</p>
                    <p>{event.ageRestriction}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-200">
                  {billingDetails.note}
                  {' '}By applying, you&apos;re saying you understand the event terms and timing for this outing.
                </p>
              </div>

              <textarea
                value={applicationText}
                onChange={(e) => setApplicationText(e.target.value)}
                placeholder="Write a short note about why you want to join..."
                className="min-h-28 w-full rounded-2xl border border-white/10 bg-[#0F0F13] px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition focus:border-[#F59E0B]/50"
              />

              <div className="rounded-2xl border border-[#F59E0B]/20 bg-[#F59E0B]/10 p-3">
                <p className="text-xs text-[#FBBF24]">Demo flow</p>
                <p className="mt-1 text-sm text-gray-200">
                  This application will be saved locally and shown as pending until you cancel it.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowApplicationModal(false)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 font-semibold text-white transition hover:bg-white/10"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmitApplication}
                  className="w-full rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#FB923C] py-3 font-bold text-white transition hover:opacity-90"
                >
                  Submit application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/5 bg-[#0F0F13]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto max-w-6xl">
          {applicationStatus === 'none' ? (
            <div className="grid gap-2 sm:grid-cols-[1.4fr_0.8fr_0.8fr]">
              {eventExpired ? (
                <div className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 py-3 font-bold text-red-300">
                  <AlertCircle size={18} /> Event has expired
                </div>
              ) : atCapacity ? (
                <div className="flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 py-3 font-bold text-amber-300">
                  <AlertCircle size={18} /> Event is full
                </div>
              ) : (
                <button
                  onClick={handleJoin}
                  className="w-full rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#FB923C] py-3 font-bold text-white transition hover:opacity-90"
                >
                  I&apos;m Interested → {remainingCapacity > 0 && `(${remainingCapacity} spot${remainingCapacity !== 1 ? 's' : ''} left)`}
                </button>
              )}
              <button onClick={openHostChat} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-3 font-semibold text-white transition hover:bg-white/10">
                <MessageCircle size={16} /> Message
              </button>
              <button onClick={handleAddToCalendar} className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 font-semibold text-white transition hover:bg-white/10">
                Add to Calendar
              </button>
              <button onClick={handleShare} className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 font-semibold text-white transition hover:bg-white/10">
                Share
              </button>
          </div>
          ) : applicationStatus === 'pending' ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#F59E0B]/25 py-3 font-bold text-[#FBBF24]">
                <Check size={18} /> Application sent
              </button>
              <button onClick={handleCancelAttendance} className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 font-semibold text-white transition hover:bg-white/10">
                Cancel Application
              </button>
              <button onClick={openHostChat} className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 font-semibold text-white transition hover:bg-white/10">
                Message Host
              </button>
              <button onClick={handleAddToCalendar} className="sm:col-span-2 w-full rounded-2xl border border-white/10 bg-white/5 py-3 font-semibold text-white transition hover:bg-white/10">
                Add to Calendar
              </button>
              <button onClick={handleShare} className="sm:col-span-2 w-full rounded-2xl border border-white/10 bg-white/5 py-3 font-semibold text-white transition hover:bg-white/10">
                Share
              </button>
            </div>
          ) : applicationStatus === 'accepted' ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-500/20 py-3 font-bold text-green-300">
                <Check size={18} /> You&apos;re in
              </button>
              <button onClick={handleCancelAttendance} className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 font-semibold text-white transition hover:bg-white/10">
                Withdraw
              </button>
              <button onClick={openHostChat} className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 font-semibold text-white transition hover:bg-white/10">
                Message Host
              </button>
              <button onClick={handleAddToCalendar} className="sm:col-span-2 w-full rounded-2xl border border-white/10 bg-white/5 py-3 font-semibold text-white transition hover:bg-white/10">
                Add to Calendar
              </button>
              <button onClick={handleShare} className="sm:col-span-2 w-full rounded-2xl border border-white/10 bg-white/5 py-3 font-semibold text-white transition hover:bg-white/10">
                Share
              </button>
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-500/20 py-3 font-bold text-red-300">
                <AlertCircle size={18} /> Application declined
              </button>
              <button onClick={() => onNavigate?.('main')} className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 font-semibold text-white transition hover:bg-white/10">
                Browse more
              </button>
              <button onClick={openHostChat} className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 font-semibold text-white transition hover:bg-white/10">
                Message Host
              </button>
              <button onClick={handleShare} className="sm:col-span-2 w-full rounded-2xl border border-white/10 bg-white/5 py-3 font-semibold text-white transition hover:bg-white/10">
                Share
              </button>
            </div>
          )}
        </div>
      </div>
      <Sidebar activeNav="Discover" onNavigate={onNavigate} setActiveNav={setActiveNav} />
    </div>
  );
};
