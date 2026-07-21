import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Flame, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { EventCard } from '../components/EventCard';
import { EventsMap } from '../components/EventsMap';
import { type EventDetailData } from './EventDetail';
import { discoverEvents, toEventDetail } from '../data/discoverEvents';
import * as API from '../services/api';
import { DiscoverSocket } from '../services/discoverSocket';
import { getExperimentVariant, getFeatureFlag } from '../config/appConfig';
import { trackEvent } from '../services/analytics';
import type { DiscoverEventSeed } from '../data/discoverEvents';
import { dedupeFeedEvents } from '../utils/eventFeed';

interface DiscoverProps {
  onNavigate?: (page: string) => void;
  onOpenEvent?: (event: EventDetailData) => void;
  currentUser?: any;
  selectedLocation?: string;
}

type FeedEvent = DiscoverEventSeed & {
  location_city?: string;
  event_date?: string;
  event_time?: string;
  max_guests?: number;
  host_id?: string;
  billing_tier?: number;
  host_fee?: number;
  guest_fee?: number;
  created_at?: string;
  status?: string;
  title?: string;
};

const storedEventsKey = 'junto-created-events';
const deletedEventsKey = 'junto-deleted-events';
const savedEventsKey = 'junto-saved-events';
const fallbackCoverImage = 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800';
const cityOptions = ['All cities', 'Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Accra', 'Nairobi'];

function parseEventDateTime(eventDate?: string, eventTime?: string) {
  if (!eventDate) return null;

  const normalizedDate = eventDate.includes('T') ? eventDate.split('T')[0] : eventDate;
  const normalizedTime = eventTime || '23:59';
  const [year, month, day] = normalizedDate.split('-').map(Number);
  const [hour, minute] = normalizedTime.split(':').map(Number);

  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day, hour || 0, minute || 0, 0, 0);
}

function isEventExpired(eventDate?: string, eventTime?: string, status?: string) {
  if (status === 'cancelled') return true;
  if (status === 'completed') return true;

  const eventDateTime = parseEventDateTime(eventDate, eventTime);
  if (!eventDateTime) return false;

  return eventDateTime.getTime() < Date.now();
}

function formatDateForInput(eventDate?: string) {
  if (!eventDate) return '';
  return eventDate.includes('T') ? eventDate.split('T')[0] : eventDate;
}

function normalizeEventSignature(event: {
  host_id?: string;
  title?: string;
  event_date?: string;
  event_time?: string;
  location_city?: string;
}) {
  return [
    (event.host_id || '').trim().toLowerCase(),
    (event.title || '').trim().toLowerCase(),
    formatDateForInput(event.event_date || '').trim(),
    (event.event_time || '').trim(),
    (event.location_city || '').trim().toLowerCase(),
  ].join('|');
}

function readDeletedEventSignatures(): Set<string> {
  try {
    const deletedStored = localStorage.getItem(deletedEventsKey);
    if (!deletedStored) {
      return new Set();
    }

    const parsed = JSON.parse(deletedStored);
    if (!Array.isArray(parsed)) {
      return new Set();
    }

    return new Set(
      parsed.map((entry: any) => {
        if (typeof entry === 'string' || typeof entry === 'number') {
          return String(entry);
        }

        return normalizeEventSignature({
          host_id: entry?.host_id,
          title: entry?.title,
          event_date: entry?.event_date,
          event_time: entry?.event_time,
          location_city: entry?.location_city,
        });
      })
    );
  } catch {
    return new Set();
  }
}

function loadStoredCreatedEvents(): FeedEvent[] {
  try {
    const stored = localStorage.getItem(storedEventsKey);
    const parsed = stored ? JSON.parse(stored) : [];
    const deletedSignatures = readDeletedEventSignatures();
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((event: any) => {
        const eventSignature = normalizeEventSignature(event);
        return !deletedSignatures.has(String(event.id)) && !deletedSignatures.has(eventSignature);
      })
      .map((event: any, index: number) => ({
      id: event.id || `local-${index}`,
      userInitial: event.userInitial || (event.userName || 'U').charAt(0).toUpperCase(),
      userName: event.userName || 'You',
      actionText: event.actionText || event.title || 'host a hangout',
      emoji: event.emoji || '🎉',
      description: event.description || '',
      date: event.date || event.event_date || new Date().toISOString().split('T')[0],
      audience: event.audience || 'Open to all',
      interestedCount: event.interestedCount || event.max_guests || 0,
      isVerified: event.isVerified ?? true,
      reliabilityScore: event.reliabilityScore ?? 100,
      averageRating: event.averageRating ?? 5,
      reviewCount: event.reviewCount ?? 0,
      accentColor: event.accentColor || 'bg-[#F59E0B]',
      audienceColor: event.audienceColor || 'bg-emerald-500/10 text-emerald-400',
      coverImage: event.coverImage || event.cover_photo_url || fallbackCoverImage,
      coords: event.coords || [3.4219, 6.4281],
      location_city: event.location_city || 'Lagos',
      event_date: event.event_date || event.date,
      event_time: event.event_time || '18:00',
      max_guests: event.max_guests || 0,
      host_id: event.host_id || '',
      billing_tier: event.billing_tier || 1,
      host_fee: event.host_fee || 0,
      guest_fee: event.guest_fee || 0,
      created_at: event.created_at || new Date().toISOString(),
      status: event.status || 'active',
      title: event.title || `${event.userName || 'You'}'s ${event.actionText || 'event'}`,
    }));
  } catch (error) {
    console.error('Failed to load locally created events:', error);
    return [];
  }
}

function toFeedEventFromApi(event: API.Event, index: number): FeedEvent {
  const hostName = (event as any).display_name || 'Host';
  const actionText = event.title || 'host a hangout';
  return {
    id: event.id,
    userInitial: hostName.charAt(0).toUpperCase(),
    userName: hostName,
    actionText,
    emoji: '🎉',
    description: event.description || `${event.location_city || 'Nearby'} · ${event.event_date || ''}`.trim(),
    date: event.event_date || new Date().toISOString().split('T')[0],
    audience: 'Open to all',
    interestedCount: event.max_guests || 0,
    isVerified: true,
    reliabilityScore: 100,
    averageRating: 5,
    reviewCount: 0,
    accentColor: 'bg-[#F59E0B]',
    audienceColor: 'bg-emerald-500/10 text-emerald-400',
    coverImage: event.cover_photo_url || event.coverImage || fallbackCoverImage,
    coords: [3.4219 + (index * 0.01), 6.4281 + (index * 0.01)],
    location_city: event.location_city,
    event_date: event.event_date,
    event_time: event.event_time,
    max_guests: event.max_guests,
    host_id: event.host_id,
    billing_tier: event.billing_tier,
    host_fee: event.host_fee,
    guest_fee: event.guest_fee,
    created_at: event.created_at,
    status: (event as any).status || 'active',
    title: event.title,
  };
}

function toFeedEventFromSeed(event: DiscoverEventSeed): FeedEvent {
  return {
    ...event,
    location_city: 'Lagos',
    event_date: event.date,
    event_time: '18:00',
    max_guests: event.interestedCount,
    host_id: event.id,
    billing_tier: 1,
    host_fee: 0,
    guest_fee: 0,
    created_at: new Date().toISOString(),
    status: 'active',
    title: `${event.userName}'s ${event.actionText}`,
  };
}

export function Discover({ onNavigate = () => {}, onOpenEvent, currentUser, selectedLocation = 'Lagos' }: DiscoverProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [activeFilter, setActiveFilter] = useState('All vibes');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'trending' | 'nearest'>('recent');
  const [savedEventIds, setSavedEventIds] = useState<string[]>([]);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [apiEvents, setApiEvents] = useState<API.Event[]>([]);
  const [useBackend, setUseBackend] = useState(true);
  const [localEvents, setLocalEvents] = useState<FeedEvent[]>([]);
  const [displayLimit, setDisplayLimit] = useState(12);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [selectedCity, setSelectedCity] = useState(selectedLocation || currentUser?.city || 'All cities');
  const [showCityMenu, setShowCityMenu] = useState(false);
  const [feedNotice, setFeedNotice] = useState('');
  const [applyingEventId, setApplyingEventId] = useState<string | null>(null);
  const cityMenuRef = useRef<HTMLDivElement | null>(null);

  const filters = [
  'All vibes',
  'Tonight',
  'This week',
  'Open to all',
  'Females only',
  'Males only',
  'Trending 🔥'];

  useEffect(() => {
    const nextCity = selectedLocation || currentUser?.city || 'All cities';
    setSelectedCity(nextCity);
  }, [selectedLocation, currentUser?.city]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await API.getEvents({
          city: selectedCity === 'All cities' ? undefined : selectedCity,
        });
        setUseBackend(true);
        setApiEvents(response.events || []);
      } catch (error) {
        console.error('Failed to fetch events:', error);
        // Fall back to mock data if API fails
        setUseBackend(false);
      }
    };

    fetchEvents();
  }, [selectedCity]);

  // Connect to WebSocket for real-time updates
  useEffect(() => {
    const socket = new DiscoverSocket(
      // On event updated
      (eventId) => {
        console.log('🔄 Event updated:', eventId);
        API.getEventById(eventId)
          .then((response) => {
            setApiEvents((prev) => {
              const exists = prev.some((event) => event.id === eventId);
              if (!exists) {
                return [response.event, ...prev];
              }
              return prev.map((event) => (event.id === eventId ? response.event : event));
            });
          })
          .catch((error) => console.error('Failed to fetch updated event:', error));
      },
      // On event created
      (eventId) => {
        console.log('➕ Event created:', eventId);
        API.getEventById(eventId)
          .then((response) => {
            setApiEvents((prev) => {
              const exists = prev.some((event) => event.id === eventId);
              if (exists) {
                return prev.map((event) => (event.id === eventId ? response.event : event));
              }
              return [response.event, ...prev];
            });
          })
          .catch((error) => console.error('Failed to fetch new event:', error));
      },
      // On event deleted
      (eventId) => {
        console.log('❌ Event deleted:', eventId);
        setApiEvents((prev) => prev.filter((event) => event.id !== eventId));
      }
    );

    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    setLocalEvents(loadStoredCreatedEvents());

    const handleStorageUpdate = () => {
      setLocalEvents(loadStoredCreatedEvents());
    };

    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  useEffect(() => {
    if (!currentUser?.id) {
      try {
        const savedStored = localStorage.getItem(savedEventsKey);
        const parsed = savedStored ? JSON.parse(savedStored) : [];
        setSavedEventIds(Array.isArray(parsed) ? parsed.map(String) : []);
      } catch {
        setSavedEventIds([]);
      }
      return;
    }

    const loadSavedEvents = async () => {
      try {
        const response = await API.getSavedEvents(currentUser.id);
        const ids = Array.isArray(response.events) ? response.events.map((event) => String(event.id)) : [];
        setSavedEventIds(ids);
        localStorage.setItem(savedEventsKey, JSON.stringify(ids));
      } catch (error) {
        console.error('Failed to load saved events:', error);
      }
    };

    void loadSavedEvents();
  }, [currentUser?.id]);

  useEffect(() => {
    const shouldPrompt = localStorage.getItem('junto-profile-completion-prompt') === 'true' || Boolean((location.state as any)?.showProfilePrompt);
    if (shouldPrompt) {
      setShowProfilePrompt(true);
      localStorage.removeItem('junto-profile-completion-prompt');
    }
  }, [location.state]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cityMenuRef.current && !cityMenuRef.current.contains(event.target as Node)) {
        setShowCityMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-clear filters on every load so all events show immediately
  useEffect(() => {
    setSearchTerm('');
    setActiveFilter('All vibes');
    setSortBy('recent');
    setShowSavedOnly(false);
    setSelectedCity('All cities');
    setDisplayLimit(12);
  }, []);

  const events = useMemo<FeedEvent[]>(() => {
    const deletedSignatures = readDeletedEventSignatures();

    const backendEvents = useBackend
      ? apiEvents.map((event, index) => {
        const feedEvent = toFeedEventFromApi(event, index);
        // If this is the current user's event, display as "You"
        if (event.host_id === currentUser?.id) {
          feedEvent.userName = currentUser?.name || currentUser?.username || 'You';
          feedEvent.userInitial = (currentUser?.name || currentUser?.username || 'Y').charAt(0).toUpperCase();
        }
        return feedEvent;
      })
      : discoverEvents.map(toFeedEventFromSeed);

    const merged = [...backendEvents, ...localEvents];
    const deduped = dedupeFeedEvents(merged, deletedSignatures);

    return deduped
      .filter((event) => !deletedSignatures.has(String(event.id)) && !deletedSignatures.has(normalizeEventSignature(event)))
      .sort((a, b) => {
        const aExpired = isEventExpired(a.event_date, a.event_time, a.status);
        const bExpired = isEventExpired(b.event_date, b.event_time, b.status);
        if (aExpired === bExpired) return 0;
        return aExpired ? 1 : -1;
      });
  }, [apiEvents, localEvents, useBackend, currentUser?.id, currentUser?.name, currentUser?.username]);
  // Filter events based on active filter and search
  let filteredEvents = events.filter((event: any) => {
    const matchesFilter = activeFilter === 'All vibes' || 
      (activeFilter === 'Tonight' && event.event_date?.includes('today')) ||
      (activeFilter === 'This week' && true) ||
      (activeFilter === 'Trending 🔥' && event.max_guests && event.max_guests >= 7);

    // NOTE: city filter disabled so all events show regardless of selected city
    const matchesCity = true;

    const matchesSearch = searchTerm === '' || 
      event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location_city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSaved = !showSavedOnly || savedEventIds.includes(event.id);
    
    return matchesFilter && matchesSearch && matchesSaved && matchesCity;
  });

  // Sort events, keeping active events ahead of expired ones
  filteredEvents = [...filteredEvents].sort((a: any, b: any) => {
    const aExpired = isEventExpired(a.event_date, a.event_time, a.status);
    const bExpired = isEventExpired(b.event_date, b.event_time, b.status);
    if (aExpired !== bExpired) {
      return aExpired ? 1 : -1;
    }

    if (sortBy === 'trending') {
      return (b.max_guests || 0) - (a.max_guests || 0);
    }

    if (sortBy === 'nearest') {
      return (a.title?.charCodeAt(0) || 0) - (b.title?.charCodeAt(0) || 0);
    }

    return 0;
  });

  useEffect(() => {
    setDisplayLimit(12);
  }, [searchTerm, activeFilter, showSavedOnly, selectedCity, sortBy]);

  const displayedEvents = filteredEvents.length > 0 ? filteredEvents : events;
  const visibleEvents = displayedEvents.slice(0, displayLimit);

  useEffect(() => {
    if (displayedEvents.length <= displayLimit) {
      return;
    }

    const node = loadMoreRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry?.isIntersecting) {
        setDisplayLimit((prev) => Math.min(prev + 12, displayedEvents.length));
      }
    }, { rootMargin: '240px' });

    observer.observe(node);
    return () => observer.disconnect();
  }, [displayedEvents.length, displayLimit]);

  const openEventDetail = (event: FeedEvent, index: number) => {
    let detailEvent: EventDetailData;

    if (event.userName && event.actionText && event.coords) {
      detailEvent = {
        id: event.id,
        host_id: event.host_id,
        title: `${event.userName}'s ${event.actionText}`,
        host: {
          name: event.userName,
          avatar: event.userInitial,
          reliabilityScore: event.reliabilityScore,
          isVerified: event.isVerified,
          reviews: event.reviewCount,
          averageRating: event.averageRating,
        },
        category: 'Social',
        date: event.event_date || event.date,
        time: event.event_time || '18:00',
        location: event.location_city || 'Lagos',
        description: event.description,
        billingTier: 'HOST_ME',
        genderFilter: 'Everyone',
        interested: event.interestedCount,
        spots: `${event.max_guests || 0} spots`,
        totalSpots: event.max_guests || 0,
        currentAttendees: Math.max((event.max_guests || 0) - 1, 0),
        estimatedCost: 'Free',
        duration: '2 hours',
        ageRestriction: '18+',
        rules: ['Be respectful', 'Keep it friendly'],
        media: {
          venue: [event.coverImage],
          host: [event.userInitial],
        },
        coords: event.coords,
      };
    } else {
      detailEvent = toEventDetail(event as any, index);
    }

    onOpenEvent?.(detailEvent);
    navigate(`/event/${detailEvent.id}`, { state: { event: detailEvent } });
  };

  const handleInterested = async (event: FeedEvent, index: number) => {
    if (applyingEventId === event.id) {
      return;
    }

    if (currentUser?.id) {
      setApplyingEventId(event.id);
      try {
        await API.applyToEvent(currentUser.id, event.id, `Interested in ${event.title || event.actionText}`);
        setFeedNotice('Interest sent to host');
        window.setTimeout(() => setFeedNotice(''), 2500);
      } catch (error) {
        console.error('Failed to submit interest:', error);
        setFeedNotice('Could not send interest right now');
        window.setTimeout(() => setFeedNotice(''), 2500);
      } finally {
        setApplyingEventId(null);
      }
    }

    openEventDetail(event, index);
  };


  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 10
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      transition={{
        duration: 0.8
      }}>
      {showProfilePrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-md rounded-3xl border border-white/10 bg-[#121218] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.55)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-300/80">
              Profile setup
            </p>
            <h3 className="mt-3 text-2xl font-bold text-white">Finish your profile</h3>
            <p className="mt-3 text-sm leading-6 text-gray-300">
              Your interests and location are set. Head to your profile to add your photo, bio, and any other details you want people to see.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => {
                  setShowProfilePrompt(false);
                  navigate('/profile', { state: { startEditing: true } });
                }}
                className="rounded-full bg-gradient-to-r from-[#FCD34D] to-[#F59E0B] px-5 py-3 text-sm font-bold text-black transition-opacity hover:opacity-95"
              >
                Go to Profile
              </button>
              <button
                onClick={() => setShowProfilePrompt(false)}
                className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-gray-200 transition-colors hover:bg-white/[0.08]"
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Hero Section & Stats */}
      <div className="flex flex-col gap-6 sm:gap-8 md:gap-0 md:flex-row mb-6 sm:mb-8 items-start md:items-center">
        <section className="flex-1 w-full md:w-auto">
          <motion.h2
            initial={{
              opacity: 0,
              y: 20
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            transition={{
              duration: 1.2,
              ease: 'easeOut'
            }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-3 sm:mb-4 tracking-tight leading-tight">
            
            Find someone to go{' '}
            <span className="italic text-gradient font-normal">out with.</span>
          </motion.h2>
          <motion.p
            initial={{
              opacity: 0,
              y: 20
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            transition={{
              duration: 1.2,
              delay: 0.2,
              ease: 'easeOut'
            }}
            className="text-gray-400 text-sm sm:text-base lg:text-lg max-w-md">
            
            Post where you're going. Find company. Zero obligations.
          </motion.p>
        </section>

      </div>



      <div className="mb-4 flex items-center justify-between gap-3 relative z-40">
        <div ref={cityMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setShowCityMenu((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#16161C]/90 px-3.5 py-2 text-sm font-medium text-gray-200 shadow-sm backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10"
          >
            <span className="text-gray-400">City</span>
            <span className="text-white">{selectedCity}</span>
            <ChevronDown size={16} className={`transition-transform ${showCityMenu ? 'rotate-180' : ''}`} />
          </button>

          {showCityMenu && (
            <div className="absolute left-0 top-full z-[60] mt-2 w-44 overflow-hidden rounded-2xl border border-white/10 bg-[#121218]/95 shadow-[0_16px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl">
              {cityOptions.map((option) => {
                const isActive = selectedCity === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setSelectedCity(option);
                      setShowCityMenu(false);
                    }}
                    className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm transition-colors ${isActive ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                  >
                    <span>{option}</span>
                    {isActive && <span className="text-[#F59E0B]">●</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 overflow-x-auto pb-2 -mx-4 sm:-mx-6 md:mx-0 px-4 sm:px-6 md:px-0 relative z-10">
        <div className="flex items-center gap-2.5 min-w-max">
          {filters.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`relative px-4 sm:px-5 py-2.5 rounded-full text-[11px] sm:text-sm font-semibold transition-all duration-200 flex-shrink-0 shadow-sm backdrop-blur-sm ${isActive ? 'text-white' : 'text-gray-300 hover:text-white bg-[#16161C] border border-white/10 hover:border-white/20 hover:bg-white/10'}`}>
                
                {isActive &&
                <motion.div
                  layoutId="activeFilterBg"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-[#F59E0B] via-[#FB923C] to-[#FCD34D] shadow-[0_8px_24px_rgba(245,158,11,0.25)]"
                  initial={false}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 30
                  }} />

                }
                <span className="relative z-10 whitespace-nowrap">{filter}</span>
              </button>);

          })}
        </div>
      </div>

      {/* Trending Banner */}
      <div className="mb-8 inline-flex items-center gap-2 bg-gradient-to-r from-[#F59E0B]/10 to-transparent border border-[#F59E0B]/20 rounded-full px-3 sm:px-4 py-2 text-xs sm:text-sm overflow-x-auto max-w-full">
        <Flame size={14} className="sm:w-4 sm:h-4 text-[#F59E0B] flex-shrink-0" />
        <p className="text-gray-300 whitespace-nowrap sm:whitespace-normal">
          <span className="font-medium text-white">{displayedEvents.length}</span> vibes found around you
        </p>
      </div>

      {feedNotice && (
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs sm:text-sm text-emerald-300">
          <Sparkles size={14} />
          <span>{feedNotice}</span>
        </div>
      )}

      {/* Map Section */}
      <div className="mb-8 sm:mb-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-3 gap-3">
          <div className="min-w-0">
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-white">
              Vibes{' '}
              <span className="italic text-gradient font-normal">
                on the map.
              </span>
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              See what's happening around you in real time.
            </p>
          </div>
          <button className="text-xs sm:text-sm text-[#F59E0B] hover:text-[#FB923C] font-medium transition-colors flex-shrink-0">
            Expand →
          </button>
        </div>
        <EventsMap events={displayedEvents} />
      </div>

      {/* Feed Grid with Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pb-12">
        {visibleEvents.length > 0 ? (
          visibleEvents.map((event, index) => {
            const actualIndex = events.indexOf(event);
            return (
              <div key={index} className="relative group">
  {(() => {
    const expired = isEventExpired(event.event_date, event.event_time, event.status);
    return (
      <>
        {expired && (
          <div className="absolute top-3 left-3 z-20 rounded-full bg-black/70 border border-white/10 px-2.5 py-1 text-[10px] font-semibold text-gray-400 backdrop-blur-sm">
            Ended
          </div>
        )}
        <div className={expired ? 'opacity-50 pointer-events-none' : ''}>
          <EventCard
            index={index}
            userInitial={event.userInitial}
            userName={event.userName}
            actionText={event.actionText}
            emoji={event.emoji}
            description={event.description}
            location={event.location_city || event.location || ''}
            date={event.date}
            eventTime={event.event_time}
            audience={event.audience}
            interestedCount={event.interestedCount}
            accentColor={event.accentColor}
            audienceColor={event.audienceColor}
            coverImage={event.coverImage}
            isVerified={event.isVerified}
            reliabilityScore={event.reliabilityScore}
            averageRating={event.averageRating}
            reviewCount={event.reviewCount}
            eventId={event.id}
            currentUserId={currentUser?.id}
            onCardClick={() => openEventDetail(event, actualIndex)}
            onInterested={() => handleInterested(event, actualIndex)}
            onSaveChange={(saved) => {
              setSavedEventIds((current) => {
                const next = saved
                  ? Array.from(new Set([...current, event.id]))
                  : current.filter((id) => id !== event.id);
                localStorage.setItem(savedEventsKey, JSON.stringify(next));
                return next;
              });
            }}
          />
        </div>
      </>
    );
  })()}
</div>
            );
          })
        ) : (
          <div className="col-span-1 md:col-span-2 text-center py-12">
            <p className="text-gray-400 text-lg">No vibes found matching your search or filter.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setActiveFilter('All vibes');
                setSortBy('recent');
                setShowSavedOnly(false);
                setSelectedCity('All cities');
                setDisplayLimit(12);
              }}
              className="mt-4 text-[#F59E0B] hover:text-[#ffd700] font-semibold transition-colors"
            >
              Clear filters →
            </button>
          </div>
        )}
      </div>

      {/* Load More */}
      <div className="flex justify-center pb-20">
        {displayedEvents.length > displayLimit && (
          <button 
            onClick={() => setDisplayLimit(prev => prev + 12)}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-transparent border border-white/10 text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all group">
            <Loader2 size={16} className="group-hover:animate-spin" />
            <span className="font-medium text-sm">Load more vibes</span>
          </button>
        )}
        <div ref={loadMoreRef} className="h-1 w-full" />
      </div>
    </motion.div>);

}