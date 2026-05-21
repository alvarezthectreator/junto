import React, { useState } from 'react';
import { Heart, MapPin, Users, Share2, MessageCircle, Check, AlertCircle, ArrowLeft, DollarSign, Calendar, Clock, MapIcon } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { motion } from 'framer-motion';

interface Attendee {
  id: string;
  name: string;
  avatar: string;
  paymentStatus: 'paid' | 'pending' | 'host_covers' | 'declined';
  joinedAt: Date;
}

interface EventDetailProps {
  eventId?: string;
  onNavigate?: (page: string) => void;
}

export const EventDetail: React.FC<EventDetailProps> = ({ eventId, onNavigate = () => {} }) => {
  const [isJoined, setIsJoined] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'attendees' | 'host'>('overview');

  // Mock event data
  const event = {
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
    description: 'Join us for an exciting evening of beach volleyball! All skill levels welcome. We\'ll play casual games, have fun, and grab drinks after. Bring your energy!',
    billingTier: 'HOST_ALL',
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
      venue: [
        'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=500',
      ],
      host: ['🏐'],
    },
  };

  // Mock attendees
  const attendees: Attendee[] = [
    { id: '1', name: 'Ada M.', avatar: '👩‍🦰', paymentStatus: 'host_covers', joinedAt: new Date(Date.now() - 2 * 24 * 60 * 60000) },
    { id: '2', name: 'Oge K.', avatar: '👨‍🦱', paymentStatus: 'paid', joinedAt: new Date(Date.now() - 1.5 * 24 * 60 * 60000) },
    { id: '3', name: 'Zara P.', avatar: '👩', paymentStatus: 'pending', joinedAt: new Date(Date.now() - 1 * 24 * 60 * 60000) },
    { id: '4', name: 'Chidi J.', avatar: '👨‍💼', paymentStatus: 'paid', joinedAt: new Date(Date.now() - 6 * 60 * 60000) },
    { id: '5', name: 'Kemi A.', avatar: '👩‍🎓', paymentStatus: 'host_covers', joinedAt: new Date(Date.now() - 3 * 60 * 60000) },
    { id: '6', name: 'Tayo B.', avatar: '👨', paymentStatus: 'paid', joinedAt: new Date(Date.now() - 2 * 60 * 60000) },
    { id: '7', name: 'Fatima S.', avatar: '👩‍🔬', paymentStatus: 'pending', joinedAt: new Date(Date.now() - 1 * 60 * 60000) },
  ];

  const paymentStatusColors = {
    host_covers: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', label: 'Host Covers' },
    paid: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', label: 'Paid' },
    pending: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', label: 'Pending' },
    declined: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', label: 'Declined' },
  };

  const billingInfo = {
    HOST_ALL: {
      badge: '100% Covered',
      color: 'bg-green-500',
      attendeePayment: 'Nothing — host covers everything',
    },
    HOST_NO_TRANSPORT: {
      badge: '~75% Covered',
      color: 'bg-blue-500',
      attendeePayment: 'Own transport only',
    },
    SPLIT: {
      badge: '50% Covered',
      color: 'bg-yellow-500',
      attendeePayment: 'Half venue costs + own transport',
    },
    HOST_ME: {
      badge: 'Host Me',
      color: 'bg-red-500',
      attendeePayment: '100% of all costs for both parties',
    },
  };

  return (
    <div className="flex min-h-screen bg-[#0F0F13] text-white">
      <Sidebar activeNav="" setActiveNav={() => {}} onNavigate={onNavigate} />
      
      <main className="mobile-page-main flex-1 ml-0 md:ml-64 overflow-x-hidden pb-40 sm:pb-36 md:pb-24">
        <div className="bg-black text-white pb-10 sm:pb-20 w-full max-w-full">
      {/* Hero Image */}
      <div className="relative h-40 sm:h-48 md:h-64 bg-gradient-to-b from-gray-800 to-black overflow-hidden w-full">
        <img
          src={event.media.venue[0]}
          alt={event.title}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex gap-2">
          <button
            onClick={() => setIsSaved(!isSaved)}
            className="bg-black bg-opacity-60 p-2 sm:p-2.5 rounded-full hover:bg-opacity-80"
          >
            <Heart
              size={20}
              className={`sm:w-6 sm:h-6 ${isSaved ? 'fill-red-500 text-red-500' : 'text-white'}`}
            />
          </button>
          <button className="bg-black bg-opacity-60 p-2 sm:p-2.5 rounded-full hover:bg-opacity-80">
            <Share2 size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>

      {/* Sticky Header */}
      <div className="sticky top-0 bg-black bg-opacity-90 backdrop-blur p-3 sm:p-4 border-b border-gray-800 flex flex-col gap-2 xs:gap-3 sm:gap-0 sm:flex-row sm:items-center sm:justify-between z-40">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-red-500 to-purple-600 rounded-full flex items-center justify-center text-sm sm:text-base flex-shrink-0">
            {event.host.avatar}
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-semibold truncate">{event.host.name}</p>
            <p className="text-[10px] sm:text-xs text-gray-400 truncate">{event.location}</p>
          </div>
        </div>
        <button className="text-gray-400 text-lg hover:text-white self-end xs:self-auto">⋯</button>
      </div>

      {/* Media Tabs */}
      <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-800 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
            activeTab === 'overview'
              ? 'bg-gradient-to-r from-red-500 to-purple-600 text-white'
              : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('attendees')}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all relative ${
            activeTab === 'attendees'
              ? 'bg-gradient-to-r from-red-500 to-purple-600 text-white'
              : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
          }`}
        >
          Attendees <span className="ml-1 text-[10px]">{event.currentAttendees}</span>
        </button>
        <button
          onClick={() => setActiveTab('host')}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
            activeTab === 'host'
              ? 'bg-gradient-to-r from-red-500 to-purple-600 text-white'
              : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
          }`}
        >
          Host Info
        </button>
      </div>

      {/* Content */}
      <div className="px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <>
            {/* Event Title & Details */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 sm:space-y-3">
              <h1 className="text-2xl sm:text-3xl font-bold break-words">{event.title}</h1>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 bg-red-500 bg-opacity-20 text-red-400 text-xs rounded-full font-medium">
                  {event.category}
                </span>
                <span className="px-3 py-1.5 bg-blue-500 bg-opacity-20 text-blue-400 text-xs rounded-full font-medium">
                  {event.genderFilter}
                </span>
                <span className="px-3 py-1.5 bg-purple-500 bg-opacity-20 text-purple-400 text-xs rounded-full font-medium">
                  {event.ageRestriction}
                </span>
              </div>
            </motion.div>

            {/* Key Info Grid */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-3">
              <div className="bg-gray-900/50 border border-gray-800 p-3 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">📅 Date</p>
                <p className="text-sm font-semibold">{new Date(event.date).toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
              </div>
              <div className="bg-gray-900/50 border border-gray-800 p-3 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">🕒 Time</p>
                <p className="text-sm font-semibold">{event.time}</p>
              </div>
              <div className="bg-gray-900/50 border border-gray-800 p-3 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">⏱ Duration</p>
                <p className="text-sm font-semibold">{event.duration}</p>
              </div>
              <div className="bg-gray-900/50 border border-gray-800 p-3 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">💰 Cost</p>
                <p className="text-sm font-semibold text-green-400">{event.estimatedCost}</p>
              </div>
            </motion.div>

            {/* Location */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 p-4 rounded-lg">
              <p className="flex items-start gap-2 text-sm">
                <MapPin size={18} className="text-blue-400 mt-1 flex-shrink-0" />
                <span>{event.location}</span>
              </p>
            </motion.div>

            {/* Description */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gray-900 bg-opacity-50 p-4 rounded-lg border border-gray-800">
              <h3 className="text-sm font-semibold mb-2">About this event</h3>
              <p className="text-sm text-gray-300 leading-relaxed">{event.description}</p>
            </motion.div>

            {/* Squad Progress */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Squad Filling Up</p>
                <p className="text-xs text-gray-400">{event.currentAttendees}/{event.totalSpots} spots</p>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-purple-600"
                  style={{ width: `${(event.currentAttendees / event.totalSpots) * 100}%` }}
                />
              </div>
            </motion.div>

            {/* Billing Info */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-green-400 mb-2">💚 Host Covers Everything</h3>
              <p className="text-sm text-gray-300 mb-3">You don't pay anything for this event.</p>
              <div className="flex items-start gap-2 bg-red-500 bg-opacity-20 p-2 rounded border border-red-500 border-opacity-30">
                <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-300">
                  All payments happen at the venue only. Never send money to the host before the event.
                </p>
              </div>
            </motion.div>

            {/* Event Rules */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-gray-900/50 border border-gray-800 p-4 rounded-lg space-y-2">
              <h3 className="text-sm font-semibold mb-3">📋 Event Guidelines</h3>
              {event.rules.map((rule, idx) => (
                <p key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  {rule}
                </p>
              ))}
            </motion.div>

            {/* Host Card */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-gradient-to-r from-red-500 to-purple-600 bg-opacity-20 border border-gray-700 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-purple-600 rounded-full flex items-center justify-center text-xl">
                    {event.host.avatar}
                  </div>
                  <div>
                    <p className="font-semibold">{event.host.name}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      {event.host.isVerified && <Check size={12} className="text-blue-400" />}
                      <span>Reliability: {event.host.reliabilityScore}%</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-yellow-400">⭐ {event.host.averageRating}</p>
                  <p className="text-xs text-gray-400">{event.host.reviews} reviews</p>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* ATTENDEES TAB */}
        {activeTab === 'attendees' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <h2 className="text-lg font-bold mb-4">{event.currentAttendees} People Attending</h2>
            {attendees.map((attendee, idx) => (
              <motion.div
                key={attendee.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`p-3 rounded-lg border ${paymentStatusColors[attendee.paymentStatus].bg} ${paymentStatusColors[attendee.paymentStatus].border}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{attendee.avatar}</div>
                    <div>
                      <p className="font-semibold text-sm">{attendee.name}</p>
                      <p className="text-xs text-gray-400">Joined {Math.floor((Date.now() - attendee.joinedAt.getTime()) / (1000 * 60))}m ago</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${paymentStatusColors[attendee.paymentStatus].text}`}>
                    {paymentStatusColors[attendee.paymentStatus].label}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* HOST TAB */}
        {activeTab === 'host' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Host Profile Card */}
            <div className="bg-gradient-to-r from-red-500 to-purple-600 bg-opacity-20 border border-gray-700 p-4 rounded-lg">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-purple-600 rounded-full flex items-center justify-center text-3xl">
                    {event.host.avatar}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">{event.host.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      {event.host.isVerified && <Check size={14} className="text-blue-400" />}
                      <span className="text-xs text-gray-400">Verified Host</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Host Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-gray-900/50 p-2 rounded text-center">
                  <p className="text-lg font-bold text-yellow-400">⭐ {event.host.averageRating}</p>
                  <p className="text-xs text-gray-400">Rating</p>
                </div>
                <div className="bg-gray-900/50 p-2 rounded text-center">
                  <p className="text-lg font-bold text-green-400">{event.host.reliabilityScore}%</p>
                  <p className="text-xs text-gray-400">Reliable</p>
                </div>
                <div className="bg-gray-900/50 p-2 rounded text-center">
                  <p className="text-lg font-bold">{event.host.reviews}</p>
                  <p className="text-xs text-gray-400">Reviews</p>
                </div>
              </div>
            </div>

            {/* Host Bio */}
            <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-lg">
              <p className="text-sm text-gray-300">
                Experienced event host who loves bringing people together. All events are planned with safety and fun in mind!
              </p>
            </div>

            {/* Contact Options */}
            <div className="space-y-2">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2">
                <MessageCircle size={18} />
                Message Host
              </button>
              <button className="w-full border border-gray-700 hover:bg-gray-900 text-white font-semibold py-2.5 rounded-lg transition">
                View All Events by {event.host.name}
              </button>
            </div>

            {/* Reviews Preview */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Recent Reviews</h3>
              {[
                { author: 'Sarah M.', rating: 5, text: 'Great event! Tunde was a fantastic host.' },
                { author: 'John D.', rating: 5, text: 'Amazing vibes, highly recommend!' }
              ].map((review, idx) => (
                <div key={idx} className="bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-medium text-sm">{review.author}</p>
                    <p className="text-yellow-400 text-sm">{'⭐'.repeat(review.rating)}</p>
                  </div>
                  <p className="text-xs text-gray-400">{review.text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Action Buttons - Fixed on Mobile, Bottom on Desktop */}
      <div className="fixed bottom-0 left-0 right-0 md:absolute md:bottom-auto md:sticky md:top-full bg-black bg-opacity-95 backdrop-blur border-t border-gray-800 p-3 sm:p-4 space-y-2 sm:space-y-3 ml-0 md:ml-0 z-50">
        {!isJoined ? (
          <>
            <button
              onClick={() => setIsJoined(true)}
              className="w-full bg-gradient-to-r from-red-500 to-purple-600 hover:opacity-90 text-white font-bold py-2.5 sm:py-3 rounded-lg transition text-sm sm:text-base"
            >
              I'm Interested →
            </button>
            <div className="flex gap-2">
              <button className="flex-1 border border-gray-700 hover:bg-gray-900 text-white font-semibold py-1.5 sm:py-2 rounded-lg transition flex items-center justify-center gap-2 text-xs sm:text-sm">
                <MessageCircle size={16} className="sm:w-[18px] sm:h-[18px]" /> Message
              </button>
              <button className="flex-1 border border-gray-700 hover:bg-gray-900 text-white font-semibold py-1.5 sm:py-2 rounded-lg transition text-xs sm:text-sm">
                Share
              </button>
            </div>
          </>
        ) : (
          <>
            <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 sm:py-3 rounded-lg transition flex items-center justify-center gap-2 text-sm sm:text-base">
              <Check size={18} className="sm:w-5 sm:h-5" /> Check In — I've Arrived!
            </button>
            <button className="w-full border border-gray-700 hover:bg-gray-900 text-white font-semibold py-1.5 sm:py-2 rounded-lg transition text-xs sm:text-sm">
              Cancel Application
            </button>
          </>
        )}
      </div>
        </div>
      </main>
    </div>
  );
};
