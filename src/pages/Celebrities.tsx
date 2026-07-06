import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Clock, ArrowLeft } from 'lucide-react';
import { getCelebrities } from '../services/api';

interface Celebrity {
  id: string;
  name: string;
  category: string;
  bio: string;
  photo_url: string;
  outing_types: string;
  base_price: number;
  currency: string;
}

const CATEGORIES = ['All', 'Music', 'Comedy', 'Sports', 'Film', 'Media', 'Fashion'];

export function Celebrities() {
  const navigate = useNavigate();
  const [celebrities, setCelebrities] = useState<Celebrity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    async function load() {
      try {
        const data = await getCelebrities(activeCategory === 'All' ? undefined : activeCategory);
        setCelebrities(data.celebrities || []);
      } catch (e) {
        setCelebrities([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [activeCategory]);

  return (
    <div className="min-h-screen bg-[#0F0F13] text-white pb-24">
      {/* Hero */}
      <div className="relative px-4 pt-8 pb-10 bg-gradient-to-b from-[#1a1008] to-[#0F0F13]">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft size={18} /> Back
        </button>
        <h1 className="text-3xl font-bold mb-1">
          Book a <span className="text-[#F59E0B]">Celebrity</span>
        </h1>
        <p className="text-gray-400 text-sm">Go on an outing with your favourite Nigerian stars</p>
      </div>

      {/* Category Filter */}
      <div className="px-4 mb-6 flex gap-2 overflow-x-auto no-scrollbar">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => { setActiveCategory(cat); setLoading(true); }}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-[#F59E0B] text-black'
                : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="px-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-white/5 animate-pulse h-56" />
            ))}
          </div>
        ) : celebrities.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🌟</p>
            <p className="text-gray-400 text-sm">Too coming soon</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {celebrities.map(celeb => {
              const outingTypes = (() => { try { return JSON.parse(celeb.outing_types); } catch { return []; } })();
              return (
                <div
                  key={celeb.id}
                  onClick={() => navigate(`/celebrities/${celeb.id}`)}
                  className="rounded-2xl bg-[#1A1A21] border border-white/5 overflow-hidden cursor-pointer hover:border-[#F59E0B]/30 transition-all"
                >
                  {/* Photo */}
                  <div className="h-36 bg-gradient-to-br from-[#F59E0B]/20 to-[#FB923C]/10 flex items-center justify-center">
                    {celeb.photo_url
                      ? <img src={celeb.photo_url} alt={celeb.name} className="w-full h-full object-cover" />
                      : <span className="text-4xl">🌟</span>
                    }
                  </div>
                  {/* Info */}
                  <div className="p-3">
                    <p className="font-semibold text-sm truncate">{celeb.name}</p>
                    <p className="text-xs text-[#F59E0B] mb-2">{celeb.category}</p>
                    {outingTypes.length > 0 && (
                      <div className="flex gap-1 flex-wrap mb-2">
                        {outingTypes.slice(0, 2).map((t: string) => (
                          <span key={t} className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-gray-400">{t}</span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-300 font-medium">
                      From {celeb.currency} {celeb.base_price.toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
