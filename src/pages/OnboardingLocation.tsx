import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check } from 'lucide-react';
import * as API from '../services/api';

const LOCATIONS = [
  'Lagos',
  'Abuja',
  'Port Harcourt',
  'Ibadan',
  'Kano',
  'Enugu',
  'Accra',
  'Nairobi',
];

const LOCATION_FLAGS: Record<string, string> = {
  Lagos: '🇳🇬',
  Abuja: '🇳🇬',
  'Port Harcourt': '🇳🇬',
  Ibadan: '🇳🇬',
  Kano: '🇳🇬',
  Enugu: '🇳🇬',
  Accra: '🇬🇭',
  Nairobi: '🇰🇪',
};

function getLocationFlag(location: string) {
  return LOCATION_FLAGS[location] || '📍';
}

function getCurrentUserId(currentUser: any) {
  return currentUser?.id || API.getUserId() || '';
}

export function OnboardingLocation({
  currentUser,
  onBack,
  onComplete,
}: {
  currentUser?: any;
  onBack?: () => void;
  onComplete?: () => void;
}) {
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState('Lagos');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const userId = useMemo(() => getCurrentUserId(currentUser), [currentUser]);

  const handleFinish = async () => {
    if (!userId) {
      setError('We could not find your account. Please sign in again.');
      return;
    }

    setLoading(true);
    try {
      await API.updateUserProfile(userId, {
        city: selectedLocation,
        travel_destination_city: selectedLocation,
      });

      const storedRaw = sessionStorage.getItem('junto-current-user');
      if (storedRaw) {
        const stored = JSON.parse(storedRaw);
        sessionStorage.setItem('junto-current-user', JSON.stringify({
          ...stored,
          city: selectedLocation,
          location: selectedLocation,
        }));
      }

      onComplete?.();
    } catch (err: any) {
      setError(err.message || 'Failed to save your location.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0F13] via-[#17171f] to-[#0B0B0E] text-white px-4 py-6">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center">
        <button
          onClick={onBack || (() => navigate('/onboarding/interests'))}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-orange-400 hover:text-orange-300"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-8"
        >
          <div className="mb-8">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-orange-300/80">
              Step 2 of 2
            </p>
            <h1 className="text-3xl font-bold sm:text-4xl">Choose your location</h1>
            <p className="mt-3 max-w-2xl text-sm text-gray-400 sm:text-base">
              Set your home city so we can tailor local events and the right recommendations.
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {LOCATIONS.map((location) => {
              const active = selectedLocation === location;
              return (
                <button
                  key={location}
                  onClick={() => setSelectedLocation(location)}
                  className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                    active
                      ? 'border-orange-400/40 bg-orange-500/15 text-white shadow-[0_0_0_1px_rgba(251,146,60,0.25)]'
                      : 'border-white/10 bg-white/[0.03] text-gray-300 hover:border-white/20 hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold sm:text-base">{getLocationFlag(location)} {location}</span>
                    {active && <Check size={16} className="text-orange-300" />}
                  </div>
                </button>
              );
            })}
          </div>

          {error && <p className="mb-4 text-sm text-red-300">{error}</p>}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-400">
              Selected: {selectedLocation}
            </p>
            <button
              onClick={handleFinish}
              disabled={loading}
              className="rounded-full bg-gradient-to-r from-[#FCD34D] to-[#F59E0B] px-6 py-3 text-sm font-bold text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Finishing...' : 'Finish and enter Discover'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
