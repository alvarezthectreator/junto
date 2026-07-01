import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sidebar } from '../components/Sidebar';
import { getVenues } from '../services/api';
import { resolveMediaUrl } from '../utils/avatar';
import {
  ArrowLeft, MapPin, Clock, Phone, X, Send,
  Film, Wine, Waves, Trophy, CircleDot, Dumbbell, Sofa, Palette, Building2,
  Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, ChevronDown,
} from 'lucide-react';

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

const COUNTRIES = [
  {
    name: 'Nigeria',
    flag: '🇳🇬',
    cities: [
      { name: 'Lagos', map: '/maps/lagos.jpg' },
      { name: 'Abuja', map: '/maps/abuja.jpg' },
      { name: 'Port Harcourt', map: '/maps/port-harcourt.jpg' },
      { name: 'Ibadan', map: '/maps/ibadan.jpg' },
      { name: 'Kano', map: '/maps/kano.jpg' },
      { name: 'Enugu', map: '/maps/enugu.jpg' },
    ],
  },
  {
    name: 'Ghana',
    flag: '🇬🇭',
    cities: [
      { name: 'Accra', map: '/maps/accra.jpg' },
      { name: 'Kumasi', map: '/maps/kumasi.jpg' },
      { name: 'Takoradi', map: '/maps/takoradi.jpg' },
    ],
  },
  {
    name: 'South Africa',
    flag: '🇿🇦',
    cities: [
      { name: 'Cape Town', map: '/maps/cape-town.jpg' },
      { name: 'Johannesburg', map: '/maps/johannesburg.jpg' },
      { name: 'Durban', map: '/maps/durban.jpg' },
    ],
  },
  {
    name: 'Kenya',
    flag: '🇰🇪',
    cities: [
      { name: 'Nairobi', map: '/maps/nairobi.jpg' },
      { name: 'Mombasa', map: '/maps/mombasa.jpg' },
    ],
  },
  {
    name: 'Egypt',
    flag: '🇪🇬',
    cities: [
      { name: 'Cairo', map: '/maps/cairo.jpg' },
      { name: 'Alexandria', map: '/maps/alexandria.jpg' },
    ],
  },
];

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
  const [activeNav, setActiveNav] = useState('Discover');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeCountry, setActiveCountry] = useState(COUNTRIES[0]);
  const [activeCity, setActiveCity] = useState(COUNTRIES[0].cities[0].name);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [companionPhone, setCompanionPhone] = useState('');
  const [companionName, setCompanionName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventNote, setEventNote] = useState('');
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchVenues();
  }, [activeCategory, activeCity]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowCountryDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function fetchVenues() {
    setLoading(true);
    try {
      const response = await getVenues({
        category: activeCategory !== 'All' ? activeCategory : undefined,
        city: activeCity,
      });
      setVenues(Array.isArray(response?.venues) ? response.venues : []);
    } catch (err) {
      console.error('Failed to fetch venues:', err);
      setVenues([]);
    } finally {
      setLoading(false);
    }
  }

  function selectCountry(country: typeof COUNTRIES[0]) {
    setActiveCountry(country);
    setActiveCity(country.cities[0].name);
    setShowCountryDropdown(false);
  }

  function getPhotos(venue: Venue): string[] {
    try {
      const parsed = JSON.parse(venue.photo_urls) || [];
      return Array.isArray(parsed)
        ? parsed.map((photo) => resolveMediaUrl(String(photo || ''))).filter(Boolean)
        : [];
    } catch {
      return [];
    }
  }

  function toggleLike(id: string) {
    setLikedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSave(id: string) {
    setSavedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleWhatsAppShare() {
    if (!selectedVenue) return;
    const msg = encodeURIComponent(
      `Hey ${companionName || 'there'}! 👋\n\nI'd love to hang out with you at *${selectedVenue.name}* on Junto!\n\n📍 ${selectedVenue.address}, ${selectedVenue.city}\n📅 ${eventDate} at ${eventTime}\n💰 ${selectedVenue.price_range}\n\n${eventNote ? `Note: ${eventNote}\n\n` : ''}All payments at the venue only — no advance payments.\n\nDownload Junto to join: junto.app`
    );
    const phone = companionPhone.replace(/\D/g, '');
    const url = phone ? `https://wa.me/${phone}?text=${msg}` : `https://wa.me/?text=${msg}`;
    window.open(url, '_blank');
  }

  return (
    <div className="min-h-screen bg-[#0F0F13] text-white pb-24">

      {/* ── Header ── */}
      <div className="sticky top-0 z-40 bg-[#0F0F13]/95 backdrop-blur-md border-b border-white/5">
        <div className="mx-auto max-w-[468px] px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={22} />
          </button>
          <span className="text-xl font-bold tracking-tight">
            jun<span className="text-[#F59E0B]">to</span>
          </span>
          <div className="flex items-center gap-4 text-white">
            <Heart size={22} />
            <Send size={22} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[468px]">

        {/* ── Country Selector Button ── */}
        <div className="px-4 pt-4 pb-2" ref={dropdownRef}>
          <div className="relative inline-block">
            <button
              onClick={() => setShowCountryDropdown(prev => !prev)}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/8 border border-white/10 rounded-full px-4 py-2 transition-colors"
            >
              <span className="text-base leading-none">{activeCountry.flag}</span>
              <span className="text-sm font-semibold text-white">{activeCountry.name}</span>
              <ChevronDown
                size={14}
                className={`text-gray-400 transition-transform duration-200 ${showCountryDropdown ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown */}
            {showCountryDropdown && (
              <div className="absolute top-full left-0 mt-2 z-50 bg-[#1A1A21] border border-white/10 rounded-2xl overflow-hidden shadow-xl min-w-[180px]">
                {COUNTRIES.map(country => (
                  <button
                    key={country.name}
                    onClick={() => selectCountry(country)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-white/5 ${
                      activeCountry.name === country.name
                        ? 'text-[#F59E0B] font-semibold'
                        : 'text-gray-300'
                    }`}
                  >
                    <span className="text-base">{country.flag}</span>
                    <span>{country.name}</span>
                    {activeCountry.name === country.name && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── City Story Bubbles — scrollable, no visible scrollbar ── */}
        <div
          className="flex gap-4 px-4 pt-2 pb-3"
          style={{ overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
          {activeCountry.cities.map(city => {
            const isActive = city.name === activeCity;
            return (
              <button
                key={city.name}
                onClick={() => setActiveCity(city.name)}
                className="flex flex-col items-center gap-1.5 flex-shrink-0"
              >
                <div
                  className={`w-16 h-16 rounded-full p-[2.5px] transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-br from-[#F59E0B] to-[#f97316]'
                      : 'bg-white/10'
                  }`}
                >
                  <div className="w-full h-full rounded-full border-2 border-[#0F0F13] bg-[#1A1A21] flex items-center justify-center overflow-hidden">
                    <img
                      src={city.map}
                      alt={city.name}
                      className="w-8 h-8 object-contain"
                    />
                  </div>
                </div>
                <span className={`text-[10px] font-medium max-w-[64px] truncate ${isActive ? 'text-[#F59E0B]' : 'text-gray-400'}`}>
                  {city.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Category Filter Pills — scrollable, no visible scrollbar ── */}
        <div
          className="flex gap-2 px-4 pb-4"
          style={{ overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                activeCategory === cat ? 'bg-[#F59E0B] text-black' : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ── Feed ── */}
        <div>
          {loading ? (
            <div className="space-y-1">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border-b border-white/5">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-9 h-9 rounded-full bg-white/5 animate-pulse" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-28 bg-white/5 rounded animate-pulse" />
                      <div className="h-2.5 w-20 bg-white/5 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="w-full aspect-square bg-white/5 animate-pulse" />
                  <div className="px-4 py-3 space-y-2">
                    <div className="h-3 w-48 bg-white/5 rounded animate-pulse" />
                    <div className="h-3 w-36 bg-white/5 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : venues.length === 0 ? (
            <div className="text-center py-20 px-6">
              <p className="text-5xl mb-4">🏙️</p>
              <p className="text-gray-400 text-sm">No venues in {activeCity} yet.<br />Check back soon!</p>
            </div>
          ) : (
            venues.map((venue, index) => {
              const photos = getPhotos(venue);
              const CategoryIcon = getCategoryIcon(venue.category);
              const isLiked = likedIds.has(venue.id);
              const isSaved = savedIds.has(venue.id);

              return (
                <motion.div
                  key={venue.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="border-b border-white/5"
                >
                  {/* Post Header */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-9 h-9 rounded-full bg-[#1A1A21] border border-[#F59E0B]/30 flex items-center justify-center flex-shrink-0">
                      <CategoryIcon size={16} className="text-[#F59E0B]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-tight truncate">{venue.name}</p>
                      <p className="text-[11px] text-gray-400 flex items-center gap-1">
                        <MapPin size={10} /> {venue.address}
                      </p>
                    </div>
                    <MoreHorizontal size={20} className="text-gray-500" />
                  </div>

                  {/* Post Image */}
                  <button
                    className="relative w-full aspect-square bg-[#1A1A21] overflow-hidden block"
                    onClick={() => setSelectedVenue(venue)}
                  >
                    {photos[0] ? (
                      <img src={photos[0]} alt={venue.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <CategoryIcon size={72} className="text-[#F59E0B]/15" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5">
                      <CategoryIcon size={11} className="text-[#F59E0B]" />
                      <span className="text-[11px] font-semibold text-[#F59E0B]">{venue.category}</span>
                    </div>
                    <div className="absolute top-3 right-3 bg-[#F59E0B] rounded-full px-3 py-1">
                      <span className="text-[11px] font-bold text-black">{venue.price_range}</span>
                    </div>
                  </button>

                  {/* Action Row */}
                  <div className="flex items-center gap-4 px-4 pt-3 pb-1">
                    <button
                      onClick={() => toggleLike(venue.id)}
                      className={`transition-transform active:scale-110 ${isLiked ? 'text-red-500' : 'text-white'}`}
                    >
                      <Heart size={24} fill={isLiked ? 'currentColor' : 'none'} />
                    </button>
                    <button onClick={() => setSelectedVenue(venue)} className="text-white">
                      <MessageCircle size={24} />
                    </button>
                    <button
                      onClick={() => { setSelectedVenue(venue); setShowEventModal(true); }}
                      className="text-white"
                    >
                      <Share2 size={22} />
                    </button>
                    <button
                      onClick={() => toggleSave(venue.id)}
                      className={`ml-auto transition-transform active:scale-110 ${isSaved ? 'text-[#F59E0B]' : 'text-white'}`}
                    >
                      <Bookmark size={22} fill={isSaved ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  {/* Caption */}
                  <div className="px-4 pb-1 text-sm leading-relaxed">
                    <span className="font-bold">{venue.name} </span>
                    <span className="text-[#F59E0B] text-xs">#{venue.category.replace(' ', '')} </span>
                    <span className="text-gray-300">{venue.description}</span>
                  </div>

                  {/* Info chips */}
                  <div className="flex gap-2 px-4 pb-3 flex-wrap">
                    <span className="flex items-center gap-1 bg-white/5 rounded-full px-3 py-1 text-[11px] text-gray-400">
                      <Clock size={10} /> {venue.opening_hours}
                    </span>
                    <span className="flex items-center gap-1 bg-white/5 rounded-full px-3 py-1 text-[11px] text-gray-400">
                      <MapPin size={10} /> {activeCity}
                    </span>
                  </div>

                  {/* CTA */}
                  <div className="px-4 pb-4">
                    <button
                      onClick={() => { setSelectedVenue(venue); setShowEventModal(true); }}
                      className="w-full bg-[#F59E0B] text-black font-bold text-sm py-3 rounded-xl hover:bg-[#F59E0B]/90 transition-colors"
                    >
                      Create Event Here →
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Sidebar */}
      <Sidebar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        onNavigate={(page) => navigate(`/${page}`)}
      />

      {/* ── Venue Detail Sheet ── */}
      {selectedVenue && !showEventModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center"
          onClick={() => setSelectedVenue(null)}
        >
          <div
            className="w-full max-w-[468px] bg-[#1A1A21] rounded-t-3xl max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative">
              {(() => {
                const photos = getPhotos(selectedVenue);
                return photos[0]
                  ? <img src={photos[0]} alt={selectedVenue.name} className="w-full h-52 object-cover rounded-t-3xl" />
                  : <div className="w-full h-52 bg-[#F59E0B]/10 flex items-center justify-center rounded-t-3xl">
                      {React.createElement(getCategoryIcon(selectedVenue.category), { size: 64, className: 'text-[#F59E0B]/30' })}
                    </div>;
              })()}
              <button onClick={() => setSelectedVenue(null)} className="absolute top-4 right-4 bg-black/50 rounded-full p-2">
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <span className="text-[#F59E0B] text-xs font-semibold uppercase tracking-wider">{selectedVenue.category}</span>
              <h2 className="text-xl font-bold mt-1 mb-2">{selectedVenue.name}</h2>
              <p className="text-gray-400 text-sm mb-4">{selectedVenue.description}</p>
              <div className="space-y-2.5 mb-5">
                <div className="flex items-center gap-2 text-gray-400 text-sm"><MapPin size={14} className="text-[#F59E0B]" />{selectedVenue.address}, {selectedVenue.city}</div>
                <div className="flex items-center gap-2 text-gray-400 text-sm"><Clock size={14} className="text-[#F59E0B]" />{selectedVenue.opening_hours}</div>
                {selectedVenue.phone && <div className="flex items-center gap-2 text-gray-400 text-sm"><Phone size={14} className="text-[#F59E0B]" />{selectedVenue.phone}</div>}
              </div>
              <div className="mb-5">
                <span className="text-[#F59E0B] font-bold text-lg">{selectedVenue.price_range}</span>
              </div>
              <button
                onClick={() => setShowEventModal(true)}
                className="w-full bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-black font-bold py-3.5 rounded-xl transition-colors"
              >
                Create Event at this Venue →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Event + WhatsApp Modal ── */}
      {showEventModal && selectedVenue && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end justify-center">
          <div className="w-full max-w-[468px] bg-[#1A1A21] rounded-t-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold">Create Event</h2>
                  <p className="text-[#F59E0B] text-sm">{selectedVenue.name}</p>
                </div>
                <button
                  onClick={() => { setShowEventModal(false); setSelectedVenue(null); }}
                  className="bg-white/5 rounded-full p-2"
                >
                  <X size={18} />
                </button>
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

              <div className="mt-5 bg-[#25D366]/10 border border-[#25D366]/20 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-2 font-medium">WhatsApp Message Preview</p>
                <p className="text-sm text-gray-300 whitespace-pre-line">
                  {`Hey ${companionName || 'there'}! 👋\n\nI'd love to hang out with you at *${selectedVenue.name}* on Junto!\n\n📍 ${selectedVenue.address}\n📅 ${eventDate || 'TBD'} at ${eventTime || 'TBD'}\n💰 ${selectedVenue.price_range}${eventNote ? `\n\n${eventNote}` : ''}\n\nAll payments at the venue only.`}
                </p>
              </div>

              <button
                onClick={handleWhatsAppShare}
                className="mt-4 w-full bg-[#25D366] hover:bg-[#25D366]/90 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Send size={18} /> Share on WhatsApp
              </button>

              <p className="text-center text-xs text-gray-500 mt-3">
                All payments happen at the venue only. Never send money in advance.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
