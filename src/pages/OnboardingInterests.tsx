import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check } from 'lucide-react';
import * as API from '../services/api';

const INTERESTS = [
  'Music',
  'Food',
  'Travel',
  'Fitness',
  'Movies',
  'Photography',
  'Art',
  'Books',
  'Gaming',
  'Nightlife',
  'Comedy',
  'Wellness',
];

const INTEREST_EMOJIS: Record<string, string> = {
  Music: '🎵',
  Food: '🍜',
  Travel: '✈️',
  Fitness: '💪',
  Movies: '🎬',
  Photography: '📸',
  Art: '🎨',
  Books: '📚',
  Gaming: '🎮',
  Nightlife: '🌃',
  Comedy: '😂',
  Wellness: '🧘',
};

function getInterestEmoji(interest: string) {
  return INTEREST_EMOJIS[interest] || '✨';
}

function getCurrentUserId(currentUser: any) {
  return currentUser?.id || API.getUserId() || '';
}

export function OnboardingInterests({
  currentUser,
  onBack,
  onComplete,
}: {
  currentUser?: any;
  onBack?: () => void;
  onComplete?: () => void;
}) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const userId = useMemo(() => getCurrentUserId(currentUser), [currentUser]);

  const toggleInterest = (interest: string) => {
    setError('');
    setSelected((current) => {
      if (current.includes(interest)) {
        return current.filter((item) => item !== interest);
      }

      if (current.length >= 3) {
        return current;
      }

      return [...current, interest];
    });
  };

  const handleNext = async () => {
    if (selected.length !== 3) {
      setError('Please pick exactly 3 interests.');
      return;
    }

    if (!userId) {
      setError('We could not find your account. Please sign in again.');
      return;
    }

    setLoading(true);
    try {
      await API.updateUserProfile(userId, { interests: selected });
      const storedRaw = localStorage.getItem('currentUser');
      if (storedRaw) {
        const stored = JSON.parse(storedRaw);
        localStorage.setItem(
          'currentUser',
          JSON.stringify({
            ...stored,
            interests: selected,
          })
        );
      }

      onComplete?.();
    } catch (err: any) {
      setError(err.message || 'Failed to save your interests.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0F13] via-[#17171f] to-[#0B0B0E] text-white px-4 py-6">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center">
        <button
          onClick={onBack || (() => navigate('/signup-otp'))}
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
              Step 1 of 2
            </p>
            <h1 className="text-3xl font-bold sm:text-4xl">Choose 3 interests</h1>
            <p className="mt-3 max-w-2xl text-sm text-gray-400 sm:text-base">
              Pick the things you actually want to see first. We’ll use these to personalize your Discover feed.
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {INTERESTS.map((interest) => {
              const active = selected.includes(interest);
              return (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                    active
                      ? 'border-orange-400/40 bg-orange-500/15 text-white shadow-[0_0_0_1px_rgba(251,146,60,0.25)]'
                      : 'border-white/10 bg-white/[0.03] text-gray-300 hover:border-white/20 hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold sm:text-base">{getInterestEmoji(interest)} {interest}</span>
                    {active && <Check size={16} className="text-orange-300" />}
                  </div>
                </button>
              );
            })}
          </div>

          {error && <p className="mb-4 text-sm text-red-300">{error}</p>}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-400">
              {selected.length}/3 selected
            </p>
            <button
              onClick={handleNext}
              disabled={loading || selected.length !== 3}
              className="rounded-full bg-gradient-to-r from-[#FCD34D] to-[#F59E0B] px-6 py-3 text-sm font-bold text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
