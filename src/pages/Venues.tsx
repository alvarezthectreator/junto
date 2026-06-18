import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MapPin, Clock, Star, Phone, ExternalLink, X, Send,
  Film, Wine, Waves, Trophy, CircleDot, Dumbbell, Sofa, Palette, Building2,
} from 'lucide-react';

const BASE_URL = 'http://localhost:5000';
const CATEGORIES = ['All', 'Cinema', 'Bar', 'Beach', 'Tennis', 'Snooker', 'Gym', 'Lounge', 'Art Gallery'];

const CATEGORY_ICONS: Record<string, any> = {
  Cinema: Film,
  Bar: Wine,
  Beach: Waves,
  Tennis: Trophy,
  Snooker: CircleDot,
  Gym: Dumbbell,
  Lounge: Sofa,
  'Art Gallery': Palette,
};

interface Venue {
  id: string;
  name: string;
  category: string;
  description: string;
  address: string;
  city: string;
  photo_urls: string;
  opening_hours: string;
  price_range: string;
  phone: string;
  website: string;
}

function getCategoryIcon(category: string) {
  return CATEGORY_ICONS[category] || Building2;
}

export function Venues() {
  const navigate = useNavigate();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [companionPhone, setCompanionPhone] = useState('');
  const [companionName, setCompanionName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventNote, setEventNote] = useState('');

  useEffect(() => {
    fetchVenues();
  }, [activeCategory]);

  async function fetchVenues() {
    setLoading(true);
    try {
      const url = activeCategory === 'All'
        ? `${BASE_URL}/api/venues`
        : `${BASE_URL}/api/venues?category=${activeCategory}`;
      const res = await fetch(url);
      const data = await res.json();
      setVenues(data.venues || []);
    } catch (err) {
      console.error('Failed to fetch venues:', err);
      setVenues([]);
    } finally {
      setLoading(false);
    }
  }

  function getPhotos(venue: Venue): string[] {
    try { return JSON.parse(venue.photo_urls) || []; } catch { return []; }
  }

  function handleCreateEvent(venue: Venue) {
    setSelectedVenue(venue);
    setShowEventModal(true);
  }

  function handleWhatsAppShare() {
    if (!selectedVenue) return;
    const msg = encodeURIComponent(
      `Hey ${companionName || 'there'}! 👋\n\nI'd love to hang out with you at *${selectedVenue.name}* on Junto!\n\n📍 ${selectedVenue.address}, ${selectedVenue.city}\n📅 ${eventDate} at ${eventTime}\n💰 ${selectedVenue.price_range}\n\n${eventNote ? `Note: ${eventNote}\n\n` : ''}All payments at the venue only — no advance payments.\n\nDownload Junto to join: junto.app`
    );
    const phone = companionPhone.replace(/\D/g, '');
    const url = phone
      ? `https://wa.me/${phone}?text=${msg}`
      : `https://wa.me/?text=${msg}`;
    window.open(url, '_blank');
  }

  return (
    <div className="min-h-screen bg-[#0F0F13] text-white pb-24">
      {/* Header */}
      <div className="px-4 pt-8 pb-6 bg-gradient-to-b from-[#0a0a14] to-[#0F0F13]">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft size={18} /> Back
        </button>
        <h1 className="text-3xl font-bold mb-1">
          Venues <span className="text-[#F59E0B]">Near You</span>
        </h1>
        <p className="text-gray-400 text-sm">Cinemas, bars, beaches and more in your city</p>
      </div>

      {/* Category Filter */}
      <div className="px-4 mb-6 flex gap-2 overflow-x-auto no-scrollbar">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat ? 'bg-[#F59E0B] text-black' : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Venue Grid */}
      <div className="px-4">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {[...Array(4)].map((_, i) => <div key={i} className="rounded-3xl bg-white/5 animate-pulse h-72" />)}
          </div>
        ) : venues.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🏙️</p>
            <p className="text-gray-400 text-sm">No venues found in your city yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {venues.map((venue, index) => {
              const photos = getPhotos(venue);
              const CategoryIcon = getCategoryIcon(venue.category);
              return (
                <motion.div
                  key={venue.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.15, ease: 'easeOut' }}
                  whileHover={{ y: -4 }}
                  onClick={() => setSelectedVenue(venue)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedVenue(venue);
                    }
                  }}
                  className="bg-[#1A1A21] rounded-3xl border border-white/5 hover:border-white/10 transition-colors relative overflow-hidden flex flex-col h-full group cursor-pointer"
                >
                  {/* Top Accent Stripe */}
                  <div className="absolute top-0 left-0 w-full h-1 z-20 bg-[#F59E0B]" />

                  {/* Category Badge (top right, like Expired/Full badges in EventCard) */}
                  <div className="absolute top-3 right-3 z-30 bg-black/60 text-[#F59E0B] px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm shadow-lg">
                    {venue.category}
                  </div>

                  {/* Cover Image */}
                  <div className="w-full h-28 sm:h-32 md:h-40 relative overflow-hidden bg-[#0F0F13]">
                    {photos[0] ? (
                      <img
                        src={photos[0]}
                        alt={venue.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">🏛️</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A21] via-transparent to-transparent opacity-90" />
                  </div>

                  <div className="p-3 sm:p-4 md:p-6 flex flex-col flex-1 relative z-10 pt-2 sm:pt-3 md:pt-4">
                    {/* Header */}
                    <div className="flex items-start gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-3 md:mb-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-sm shrink-0 bg-[#F59E0B]">
                        <CategoryIcon size={18} className="text-black" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base md:text-lg text-white font-semibold line-clamp-2">
                          {venue.name}
                        </h3>
                        <p className="text-xs sm:text-base md:text-lg font-serif italic text-gradient line-clamp-1">
                          {venue.category}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-gray-300 mb-3 sm:mb-4 md:mb-6 leading-relaxed flex-1 line-clamp-2 sm:line-clamp-3">
                      {venue.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-3 mb-3 sm:mb-4 md:mb-6 w-full">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <div className="flex items-center gap-1 bg-white/5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-xs text-gray-300 whitespace-nowrap">
                          <Clock size={12} className="text-gray-400" />
                          <span className="line-clamp-1">{venue.opening_hours}</span>
                        </div>
                        <div className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-xs font-medium bg-[#F59E0B]/10 text-[#FBBF24] whitespace-nowrap">
                          {venue.price_range}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-gray-500 text-[9px] sm:text-xs whitespace-nowrap">
                        <MapPin size={12} />
                        <span className="line-clamp-1">{venue.address}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 sm:gap-3 mt-auto w-full">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCreateEvent(venue); }}
                        className="flex-1 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl md:rounded-2xl font-semibold text-xs sm:text-sm transition-opacity bg-[#F59E0B] text-black hover:opacity-90 shadow-sm"
                      >
                        Create Event →
                      </button>
                      {venue.website && (
                        <a
                          href={venue.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl md:rounded-2xl bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                        >
                          <ExternalLink size={16} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
                        </a>
                      )}
                      {venue.phone && (
                        <a
                          href={`tel:${venue.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl md:rounded-2xl bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                        >
                          <Phone size={16} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Venue Detail Sheet */}
      {selectedVenue && !showEventModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end" onClick={() => setSelectedVenue(null)}>
          <div className="w-full bg-[#1A1A21] rounded-t-3xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="relative">
              {(() => { const photos = getPhotos(selectedVenue); return photos[0]
                ? <img src={photos[0]} alt={selectedVenue.name} className="w-full h-52 object-cover" />
                : <div className="w-full h-52 bg-[#F59E0B]/10 flex items-center justify-center text-6xl">🏛️</div>; })()}
              <button onClick={() => setSelectedVenue(null)} className="absolute top-4 right-4 bg-black/50 rounded-full p-2"><X size={18} /></button>
            </div>
            <div className="p-5">
              <span className="text-[#F59E0B] text-xs font-medium">{selectedVenue.category}</span>
              <h2 className="text-xl font-bold mt-1 mb-2">{selectedVenue.name}</h2>
              <p className="text-gray-400 text-sm mb-4">{selectedVenue.description}</p>
              <div className="space-y-2 mb-5">
                <div className="flex items-center gap-2 text-gray-400 text-sm"><MapPin size={14} />{selectedVenue.address}, {selectedVenue.city}</div>
                <div className="flex items-center gap-2 text-gray-400 text-sm"><Clock size={14} />{selectedVenue.opening_hours}</div>
                {selectedVenue.phone && <div className="flex items-center gap-2 text-gray-400 text-sm"><Phone size={14} />{selectedVenue.phone}</div>}
              </div>
              <div className="flex items-center justify-between mb-5">
                <span className="text-[#F59E0B] font-semibold">{selectedVenue.price_range}</span>
              </div>
              <button
                onClick={() => { setShowEventModal(true); }}
                className="w-full bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-black font-bold py-3 rounded-xl transition-colors"
              >
                Create Event at this Venue →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Event + WhatsApp Modal */}
      {showEventModal && selectedVenue && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end">
          <div className="w-full bg-[#1A1A21] rounded-t-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold">Create Event</h2>
                  <p className="text-[#F59E0B] text-sm">{selectedVenue.name}</p>
                </div>
                <button onClick={() => { setShowEventModal(false); setSelectedVenue(null); }} className="bg-white/5 rounded-full p-2"><X size={18} /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Companion Name (optional)</label>
                  <input
                    value={companionName}
                    onChange={e => setCompanionName(e.target.value)}
                    placeholder="e.g. Temi"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-[#F59E0B]/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Companion WhatsApp Number (optional)</label>
                  <input
                    value={companionPhone}
                    onChange={e => setCompanionPhone(e.target.value)}
                    placeholder="e.g. 2348012345678"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-[#F59E0B]/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Date</label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={e => setEventDate(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#F59E0B]/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Time</label>
                    <input
                      type="time"
                      value={eventTime}
                      onChange={e => setEventTime(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#F59E0B]/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Add a note (optional)</label>
                  <textarea
                    value={eventNote}
                    onChange={e => setEventNote(e.target.value)}
                    placeholder="e.g. Let's catch the 7pm show!"
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-[#F59E0B]/50 resize-none"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="mt-5 bg-[#25D366]/10 border border-[#25D366]/20 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-2 font-medium">WhatsApp Message Preview</p>
                <p className="text-sm text-gray-300 whitespace-pre-line">{`Hey ${companionName || 'there'}! 👋\n\nI'd love to hang out with you at *${selectedVenue.name}* on Junto!\n\n📍 ${selectedVenue.address}\n📅 ${eventDate || 'TBD'} at ${eventTime || 'TBD'}\n💰 ${selectedVenue.price_range}${eventNote ? `\n\n${eventNote}` : ''}\n\nAll payments at the venue only.`}</p>
              </div>

              <button
                onClick={handleWhatsAppShare}
                className="mt-4 w-full bg-[#25D366] hover:bg-[#25D366]/90 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Send size={18} /> Share on WhatsApp
              </button>

              <p className="text-center text-xs text-gray-500 mt-3">All payments happen at the venue only. Never send money in advance.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}