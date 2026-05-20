import React, { useState } from 'react';
import { Heart, MapPin, Users, Share2, MessageCircle, Check, AlertCircle, ArrowLeft } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { motion } from 'framer-motion';

interface EventDetailProps {
  eventId?: string;
  onNavigate?: (page: string) => void;
}

export const EventDetail: React.FC<EventDetailProps> = ({ eventId, onNavigate = () => {} }) => {
  const [isJoined, setIsJoined] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'venue' | 'host'>('venue');

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
    description: 'Join us for an exciting evening of beach volleyball! All skill levels welcome.',
    billingTier: 'HOST_ALL',
    genderFilter: 'Everyone',
    interested: 21,
    spots: '3 left',
    media: {
      venue: [
        'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=500',
      ],
      host: ['🏐'],
    },
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
      
      <main className="mobile-page-main flex-1 ml-64 overflow-x-hidden">
        <div className="bg-black text-white pb-20">
      {/* Hero Image */}
      <div className="relative h-64 bg-gradient-to-b from-gray-800 to-black overflow-hidden">
        <img
          src={event.media.venue[0]}
          alt={event.title}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={() => setIsSaved(!isSaved)}
            className="bg-black bg-opacity-60 p-2 rounded-full hover:bg-opacity-80"
          >
            <Heart
              size={24}
              className={isSaved ? 'fill-red-500 text-red-500' : 'text-white'}
            />
          </button>
          <button className="bg-black bg-opacity-60 p-2 rounded-full hover:bg-opacity-80">
            <Share2 size={24} />
          </button>
        </div>
      </div>

      {/* Sticky Header */}
      <div className="sticky top-0 bg-black bg-opacity-90 backdrop-blur p-4 border-b border-gray-800 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-purple-600 rounded-full flex items-center justify-center">
            {event.host.avatar}
          </div>
          <div>
            <p className="text-sm font-semibold">{event.host.name}</p>
            <p className="text-xs text-gray-400">{event.location}</p>
          </div>
        </div>
        <button className="self-end text-gray-400 sm:self-auto">⋯</button>
      </div>

      {/* Media Tabs */}
      <div className="px-4 py-3 border-b border-gray-800 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('venue')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            activeTab === 'venue'
              ? 'bg-gray-700 text-white'
              : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
          }`}
        >
          Venue
        </button>
        <button
          onClick={() => setActiveTab('host')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            activeTab === 'host'
              ? 'bg-gray-700 text-white'
              : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
          }`}
        >
          Host
        </button>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Event Title & Details */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold">{event.title}</h1>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-red-500 bg-opacity-20 text-red-400 text-xs rounded-full font-medium">
              {event.category}
            </span>
            <span className="px-3 py-1 bg-blue-500 bg-opacity-20 text-blue-400 text-xs rounded-full font-medium">
              {event.genderFilter}
            </span>
            <span className={`px-3 py-1 ${billingInfo[event.billingTier as keyof typeof billingInfo]?.color} bg-opacity-20 text-xs rounded-full font-medium`}>
              {billingInfo[event.billingTier as keyof typeof billingInfo]?.badge}
            </span>
          </div>
        </div>

        {/* Date & Location */}
        <div className="space-y-2 text-sm">
          <p className="text-gray-400">
            📅 {new Date(event.date).toLocaleDateString()} at {event.time}
          </p>
          <p className="text-gray-400 flex items-center gap-2">
            <MapPin size={16} /> {event.location}
          </p>
          <p className="text-gray-400">👥 {event.interested} interested</p>
        </div>

        {/* Description */}
        <div className="bg-gray-900 bg-opacity-50 p-4 rounded-lg border border-gray-800">
          <p className="text-sm text-gray-300">{event.description}</p>
        </div>

        {/* Host Info Card */}
        <div className="bg-gradient-to-r from-red-500 to-purple-600 bg-opacity-20 border border-gray-700 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
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
        </div>

        {/* Squad Progress Bar */}
        <div className="space-y-2">
          <p className="text-xs text-gray-400">Squad Progress - {event.spots}</p>
          <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-purple-600"
              style={{ width: '70%' }}
            />
          </div>
        </div>

        {/* Billing Breakdown */}
        <div className="bg-gray-900 bg-opacity-50 p-4 rounded-lg border border-gray-800 space-y-3">
          <h3 className="text-sm font-semibold">Billing Details</h3>
          <p className="text-sm text-gray-400">
            {billingInfo[event.billingTier as keyof typeof billingInfo]?.attendeePayment}
          </p>
          <div className="flex items-start gap-2 bg-red-500 bg-opacity-20 p-2 rounded border border-red-500 border-opacity-30">
            <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-300">
              All payments happen at the venue only. Never send money to the host before the event.
            </p>
          </div>
        </div>

        {/* Reviews */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Reviews ({event.host.reviews})</h3>
          <div className="bg-gray-900 bg-opacity-50 p-3 rounded-lg border border-gray-800">
            <div className="flex justify-between items-start mb-2">
              <p className="font-medium text-sm">Sarah M.</p>
              <p className="text-yellow-400 text-sm">⭐⭐⭐⭐⭐</p>
            </div>
            <p className="text-xs text-gray-400">
              "Great event! Tunde was a fantastic host. Everyone had a blast."
            </p>
            <p className="text-xs text-gray-600 mt-2">May 15, 2026</p>
          </div>
        </div>
      </div>

      {/* Action Buttons - Sticky */}
      <div className="fixed bottom-0 left-0 right-0 bg-black bg-opacity-95 backdrop-blur border-t border-gray-800 p-4 space-y-2">
        {!isJoined ? (
          <>
            <button
              onClick={() => setIsJoined(true)}
              className="w-full bg-gradient-to-r from-red-500 to-purple-600 hover:opacity-90 text-white font-bold py-3 rounded-lg transition"
            >
              I'm Interested →
            </button>
            <div className="flex gap-2">
              <button className="flex-1 border border-gray-700 hover:bg-gray-900 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2">
                <MessageCircle size={18} /> Message
              </button>
              <button className="flex-1 border border-gray-700 hover:bg-gray-900 text-white font-semibold py-2 rounded-lg transition">
                Share
              </button>
            </div>
          </>
        ) : (
          <>
            <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2">
              <Check size={20} /> Check In — I've Arrived!
            </button>
            <button className="w-full border border-gray-700 hover:bg-gray-900 text-white font-semibold py-2 rounded-lg transition">
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
