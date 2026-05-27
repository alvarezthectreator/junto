import React, { useState, useEffect } from 'react';
import { Plane, Flame, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { EventCard } from '../components/EventCard';
import { EventsMap } from '../components/EventsMap';
import { type EventDetailData } from './EventDetail';
import { discoverEvents, toEventDetail } from '../data/discoverEvents';
import { fadeInUp, staggerContainer, staggerItem, cardContainer, cardItem } from '../utils/animations';
import * as API from '../services/api';

interface DiscoverProps {
  onNavigate?: (page: string) => void;
  onOpenEvent?: (event: EventDetailData) => void;
  currentUser?: any;
  selectedLocation?: string;
}

export function Discover({ onNavigate = () => {}, onOpenEvent, currentUser, selectedLocation = 'Lagos' }: DiscoverProps) {
  const [activeFilter, setActiveFilter] = useState('All vibes');
  const [searchTerm, setSearchTerm] = useState('');
  const [travelMode, setTravelMode] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'trending' | 'nearest'>('recent');
  const [savedEventIds, setSavedEventIds] = useState<string[]>([]);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [apiEvents, setApiEvents] = useState<API.Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [useBackend, setUseBackend] = useState(true);
  
  const filters = [
  'All vibes',
  'Tonight',
  'This week',
  'Open to all',
  'Females only',
  'Males only',
  'Trending 🔥'];

  // Fetch events from API on component mount or location change
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const events = await API.getEvents({ city: selectedLocation });
        setApiEvents(events);
      } catch (error) {
        console.error('Failed to fetch events:', error);
        // Fall back to mock data if API fails
        setUseBackend(false);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [selectedLocation]);

  const events = useBackend && apiEvents.length > 0 ? apiEvents : discoverEvents;

  // Filter events based on active filter and search
  let filteredEvents = events.filter((event: any) => {
    const matchesFilter = activeFilter === 'All vibes' || 
      (activeFilter === 'Tonight' && event.event_date?.includes('today')) ||
      (activeFilter === 'This week' && true) ||
      (activeFilter === 'Trending 🔥' && event.max_guests && event.max_guests >= 7);
    
    const matchesSearch = searchTerm === '' || 
      event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location_city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSaved = !showSavedOnly || savedEventIds.includes(event.id);
    
    return matchesFilter && matchesSearch && matchesSaved;
  });

  // Sort events
  if (sortBy === 'trending') {
    filteredEvents = [...filteredEvents].sort((a: any, b: any) => (b.max_guests || 0) - (a.max_guests || 0));
  } else if (sortBy === 'nearest') {
    // This would use actual location data in production
    filteredEvents = [...filteredEvents].sort((a: any, b: any) => (a.title?.charCodeAt(0) || 0) - (b.title?.charCodeAt(0) || 0));
  }
  // 'recent' is default array order

  const toggleSaveEvent = (eventId: string) => {
    setSavedEventIds(current =>
      current.includes(eventId)
        ? current.filter(id => id !== eventId)
        : [...current, eventId]
    );
  };

  const openEventDetail = (event: any, index: number) => {
    let detailEvent: EventDetailData;
    
    if (useBackend && apiEvents.length > 0) {
      // Convert API event to EventDetailData format
      detailEvent = {
        id: event.id,
        actionText: event.title,
        description: event.description || '',
        date: event.event_date || new Date().toISOString().split('T')[0],
        time: event.event_time || '18:00',
        location: event.location_city || 'Unknown',
        image: '', // API doesn't provide image
        userName: 'Host',
        userImage: '',
        interestedCount: event.max_guests || 0,
        audience: 'Open to all',
        guestFee: event.guest_fee || 0,
      };
    } else {
      detailEvent = toEventDetail(event, index);
    }

    onOpenEvent?.(detailEvent);
    onNavigate?.('event');
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

        <motion.div
          initial={{
            opacity: 0,
            scale: 0.95
          }}
          animate={{
            opacity: 1,
            scale: 1
          }}
          transition={{
            duration: 1.0,
            delay: 0.4
          }}
          className="w-full md:w-72 bg-[#1A1A21] border border-white/5 rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-6 shadow-lg">
          
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <h3 className="text-xs sm:text-sm font-semibold text-white uppercase tracking-wider">
              Live Vibes
            </h3>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#F59E0B] flex-shrink-0"></div>
              <p className="text-xs sm:text-sm text-gray-300 break-words">
                <span className="text-white font-medium">127</span> people out tonight
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#4ECDC4] flex-shrink-0"></div>
              <p className="text-xs sm:text-sm text-gray-300 break-words">
                <span className="text-white font-medium">24</span> new posts in Lagos
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#FB923C]"></div>
              <p className="text-sm text-gray-300">
                <span className="text-white font-medium">8</span> events near
                you
              </p>
            </div>
          </div>
        </motion.div>
      </div>



      {/* Travel Mode Toggle */}
      <div className="group relative mb-8 sm:mb-10">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-purple-500/0 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur"></div>
        <div className="relative bg-[#1A1A21] border border-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between transition-colors hover:border-white/10 gap-3 sm:gap-4">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <Plane className="text-blue-400 w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-white text-sm sm:text-base">Travel Mode</h3>
              <p className="text-xs sm:text-sm text-gray-400">
                Browse events anywhere in the world
              </p>
            </div>
          </div>
          <button 
            onClick={() => setTravelMode(!travelMode)}
            className={`w-12 h-6 rounded-full relative transition-colors flex-shrink-0 ${
              travelMode ? 'bg-[#F59E0B]' : 'bg-white/20 hover:bg-white/30'
            }`}>
            <motion.div 
              className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm`}
              animate={{ left: travelMode ? '26px' : '2px' }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            ></motion.div>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 overflow-x-auto pb-2 -mx-4 sm:-mx-6 md:mx-0 px-4 sm:px-6 md:px-0">
        <div className="flex items-center gap-2 min-w-max">
          {filters.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`relative px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400 hover:text-white bg-[#1A1A21] border border-white/5 hover:border-white/10'}`}>
                
                {isActive &&
                <motion.div
                  layoutId="activeFilterBg"
                  className="absolute inset-0 bg-[#F59E0B] rounded-full"
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

      {/* Sorting and View Options */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 items-start sm:items-center justify-between">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'trending' | 'nearest')}
            className="bg-[#1A1A21] border border-white/5 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-[#F59E0B]/50 transition-colors"
          >
            <option value="recent">Recent first</option>
            <option value="trending">Trending</option>
            <option value="nearest">Nearest</option>
          </select>
          <button
            onClick={() => setShowSavedOnly(!showSavedOnly)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              showSavedOnly
                ? 'bg-[#F59E0B] text-white'
                : 'bg-[#1A1A21] border border-white/5 text-gray-400 hover:text-white hover:border-white/10'
            }`}
          >
            ❤️ Saved
          </button>
        </div>
        <span className="text-sm text-gray-400">{filteredEvents.length} vibes found</span>
      </div>

      {/* Trending Banner */}
      <div className="mb-8 inline-flex items-center gap-2 bg-gradient-to-r from-[#F59E0B]/10 to-transparent border border-[#F59E0B]/20 rounded-full px-3 sm:px-4 py-2 text-xs sm:text-sm overflow-x-auto max-w-full">
        <Flame size={14} className="sm:w-4 sm:h-4 text-[#F59E0B] flex-shrink-0" />
        <p className="text-gray-300 whitespace-nowrap sm:whitespace-normal">
          <span className="font-medium text-white">Trending:</span> <span className="hidden sm:inline">Movie nights in Lagos · 47 people interested this week</span><span className="sm:hidden">Movie nights</span>
        </p>
      </div>

      {/* Map Section */}
      <div className="mb-8 sm:mb-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-4 gap-3">
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
        <EventsMap events={events} />
      </div>

      {/* Feed Grid with Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pb-12">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event, index) => {
            const actualIndex = events.indexOf(event);
            const isSaved = savedEventIds.includes(event.id);
            return (
              <div key={index} className="relative group">
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSaveEvent(event.id);
                    }}
                    className={`rounded-full p-2 transition-all ${
                      isSaved
                        ? 'bg-[#F59E0B]/20 text-[#F59E0B]'
                        : 'bg-black/30 text-white hover:bg-black/50'
                    }`}
                    aria-label={isSaved ? 'Remove bookmark' : 'Bookmark event'}
                  >
                    <svg
                      className="w-5 h-5"
                      fill={isSaved ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 5a2 2 0 012-2h6a2 2 0 012 2v16l-7-3.5L5 21V5z"
                      />
                    </svg>
                  </button>
                </div>
                <EventCard
                  index={index}
                  userInitial={event.userInitial}
                  userName={event.userName}
                  actionText={event.actionText}
                  emoji={event.emoji}
                  description={event.description}
                  date={event.date}
                  audience={event.audience}
                  interestedCount={event.interestedCount}
                  accentColor={event.accentColor}
                  audienceColor={event.audienceColor}
                  coverImage={event.coverImage}
                  isVerified={event.isVerified}
                  reliabilityScore={event.reliabilityScore}
                  averageRating={event.averageRating}
                  reviewCount={event.reviewCount}
                  onInterested={() => openEventDetail(event, actualIndex)}
                />
              </div>
            );
          })
        ) : (
          <div className="col-span-1 md:col-span-2 text-center py-12">
            <p className="text-gray-400 text-lg">No vibes found matching your search or filter.</p>
            <button
              onClick={() => { setSearchTerm(''); setActiveFilter('All vibes'); setSortBy('recent'); setShowSavedOnly(false); }}
              className="mt-4 text-[#F59E0B] hover:text-[#ffd700] font-semibold transition-colors"
            >
              Clear filters →
            </button>
          </div>
        )}
      </div>

      {/* Load More */}
      <div className="flex justify-center pb-20">
        <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-transparent border border-white/10 text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all group">
          <Loader2 size={16} className="group-hover:animate-spin" />
          <span className="font-medium text-sm">Load more vibes</span>
        </button>
      </div>
    </motion.div>);

}
