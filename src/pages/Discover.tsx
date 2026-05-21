import React, { useState } from 'react';
import { Plane, Flame, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { EventCard } from '../components/EventCard';
import { EventsMap } from '../components/EventsMap';
import { fadeInUp, staggerContainer, staggerItem, cardContainer, cardItem } from '../utils/animations';

interface DiscoverProps {
  onNavigate?: (page: string) => void;
}

export function Discover({ onNavigate = () => {} }: DiscoverProps) {
  const [activeFilter, setActiveFilter] = useState('All vibes');
  const [searchTerm, setSearchTerm] = useState('');
  const [joinedEvents, setJoinedEvents] = useState<Set<number>>(new Set());
  const [travelMode, setTravelMode] = useState(false);
  
  const filters = [
  'All vibes',
  'Tonight',
  'This week',
  'Open to all',
  'Females only',
  'Males only',
  'Trending 🔥'];

  const events = [
  {
    userInitial: 'A',
    userName: 'Ada',
    actionText: 'watch a movie',
    emoji: '🎬',
    description: 'Silverbird Cinema, VI. Catching the new Marvel drop!',
    date: 'Sunday, 6pm',
    audience: 'Open to all',
    interestedCount: 3,
    accentColor: 'bg-[#FF6B6B]',
    audienceColor: 'bg-emerald-500/10 text-emerald-400',
    coverImage:
    'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800',
    coords: [6.4281, 3.4219] as [number, number]
  },
  {
    userInitial: 'O',
    userName: 'Oge',
    actionText: 'go to the beach',
    emoji: '🌊',
    description: 'Bar Beach, Lagos. Vibes only, no drama.',
    date: 'Monday, 3pm',
    audience: 'Males only',
    interestedCount: 7,
    accentColor: 'bg-[#4ECDC4] text-gray-900',
    audienceColor: 'bg-blue-500/10 text-blue-400',
    coverImage:
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    coords: [6.4131, 3.4214] as [number, number]
  },
  {
    userInitial: 'K',
    userName: 'Kemi',
    actionText: 'grab brunch',
    emoji: '☕',
    description: 'Hard Rock Cafe, Lekki. Sunday vibes!',
    date: 'Sat, 11am',
    audience: 'Females only',
    interestedCount: 5,
    accentColor: 'bg-[#F59E0B]',
    audienceColor: 'bg-pink-500/10 text-pink-400',
    coverImage:
    'https://images.unsplash.com/photo-1533777324565-a040eb52facd?w=800',
    coords: [6.4474, 3.4736] as [number, number]
  },
  {
    userInitial: 'T',
    userName: 'Tunde',
    actionText: 'hit the gym',
    emoji: '💪',
    description: 'Smart Fitness, Ikoyi. Push day energy.',
    date: 'Tue, 7am',
    audience: 'Open to all',
    interestedCount: 2,
    accentColor: 'bg-[#38BDF8] text-gray-900',
    audienceColor: 'bg-emerald-500/10 text-emerald-400',
    coverImage:
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
    coords: [6.45, 3.4333] as [number, number]
  },
  {
    userInitial: 'Z',
    userName: 'Zara',
    actionText: 'try sushi',
    emoji: '🍣',
    description: 'Izanagi, VI. New rolls on the menu!',
    date: 'Fri, 8pm',
    audience: 'Open to all',
    interestedCount: 12,
    accentColor: 'bg-[#FB7185]',
    audienceColor: 'bg-emerald-500/10 text-emerald-400',
    coverImage:
    'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800',
    coords: [6.4281, 3.4106] as [number, number]
  },
  {
    userInitial: 'C',
    userName: 'Chidi',
    actionText: 'go clubbing',
    emoji: '🪩',
    description: 'Quilox, VI. Saturday night turn up.',
    date: 'Sat, 11pm',
    audience: 'Males only',
    interestedCount: 9,
    accentColor: 'bg-[#FF8E72]',
    audienceColor: 'bg-blue-500/10 text-blue-400',
    coverImage:
    'https://images.unsplash.com/photo-1571266028243-d220bc1c8d1f?w=800',
    coords: [6.425, 3.4197] as [number, number]
  }];

  // Filter events based on active filter and search
  const filteredEvents = events.filter((event) => {
    const matchesFilter = activeFilter === 'All vibes' || 
      (activeFilter === 'Tonight' && event.date.includes('Sunday')) ||
      (activeFilter === 'This week' && true) ||
      (activeFilter === 'Open to all' && event.audience === 'Open to all') ||
      (activeFilter === 'Females only' && event.audience === 'Females only') ||
      (activeFilter === 'Males only' && event.audience === 'Males only') ||
      (activeFilter === 'Trending 🔥' && event.interestedCount >= 7);
    
    const matchesSearch = searchTerm === '' || 
      event.actionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.userName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const handleJoinEvent = (index: number) => {
    const newJoined = new Set(joinedEvents);
    if (newJoined.has(index)) {
      newJoined.delete(index);
    } else {
      newJoined.add(index);
      // Navigate to event detail page
      onNavigate?.(`event`);
    }
    setJoinedEvents(newJoined);
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

      {/* Search Bar */}
      <div className="mb-6 sm:mb-8">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by activity, location, or person..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1A1A21] border border-white/5 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#F59E0B]/50 transition-colors"
          />
          <svg className="absolute right-4 sm:right-5 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
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
            const isJoined = joinedEvents.has(actualIndex);
            return (
              <div key={index} className="relative group">
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
                />
                <motion.button
                  onClick={() => handleJoinEvent(actualIndex)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`absolute bottom-4 right-4 px-4 sm:px-5 py-2 sm:py-3 rounded-full font-semibold text-sm sm:text-base transition-all opacity-0 group-hover:opacity-100 ${
                    isJoined
                      ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                      : 'bg-[#F59E0B] text-black hover:bg-[#ffd700] shadow-lg shadow-[#F59E0B]/30'
                  }`}
                >
                  {isJoined ? '✓ Joined' : 'I\'m interested'}
                </motion.button>
              </div>
            );
          })
        ) : (
          <div className="col-span-1 md:col-span-2 text-center py-12">
            <p className="text-gray-400 text-lg">No vibes found matching your search or filter.</p>
            <button
              onClick={() => { setSearchTerm(''); setActiveFilter('All vibes'); }}
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