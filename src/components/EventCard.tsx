import React, { useState, useEffect } from 'react';
import { Calendar, MessageCircle, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import * as API from '../services/api';

interface EventCardProps {
  userInitial: string;
  userName: string;
  actionText: string;
  emoji: string;
  description: string;
  date: string;
  audience: string;
  interestedCount: number;
  accentColor: string;
  audienceColor: string;
  index: number;
  coverImage?: string;
  isVerified?: boolean;
  reliabilityScore?: number;
  averageRating?: number;
  reviewCount?: number;
  eventId?: string;
  currentUserId?: string;
  onInterested?: () => void;
  onOpenUser?: (user: any) => void;
  userAvatar?: string;
}

export function EventCard({
  userInitial,
  userName,
  actionText,
  emoji,
  description,
  date,
  audience,
  interestedCount,
  accentColor,
  audienceColor,
  index,
  coverImage,
  isVerified = false,
  reliabilityScore = 0,
  averageRating = 0,
  reviewCount = 0,
  eventId,
  currentUserId,
  onInterested,
  onOpenUser,
  userAvatar
}: EventCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Check if event is already saved
    if (eventId && currentUserId) {
      checkIfSaved();
    }
  }, [eventId, currentUserId]);

  const checkIfSaved = async () => {
    try {
      if (!eventId || !currentUserId) return;
      const result = await API.checkEventSaved(currentUserId, eventId);
      setIsSaved(result.saved);
    } catch (error) {
      console.error('Failed to check if event is saved:', error);
    }
  };

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!eventId || !currentUserId || isSaving) return;

    setIsSaving(true);
    try {
      if (isSaved) {
        await API.unsaveEvent(currentUserId, eventId);
        setIsSaved(false);
      } else {
        await API.saveEvent(currentUserId, eventId);
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Failed to toggle save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const avatarColors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500'
  ];

  const displayAvatars = Math.min(interestedCount, 3);
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      transition={{
        duration: 0.8,
        delay: index * 0.15,
        ease: 'easeOut'
      }}
      whileHover={{
        y: -4
      }}
      className="bg-[#1A1A21] rounded-3xl border border-white/5 hover:border-white/10 transition-colors relative overflow-hidden flex flex-col h-full group">
      
      {/* Top Accent Stripe */}
      <div className={`absolute top-0 left-0 w-full h-1 z-20 ${accentColor}`} />

      {/* Cover Image */}
      {coverImage &&
      <div className="w-full h-28 sm:h-32 md:h-40 relative overflow-hidden bg-[#0F0F13]">
          <img
          src={coverImage}
          alt={actionText}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A21] via-transparent to-transparent opacity-90"></div>
        </div>
      }

      <div
        className={`p-3 sm:p-4 md:p-6 flex flex-col flex-1 relative z-10 ${coverImage ? 'pt-2 sm:pt-3 md:pt-4' : ''}`}>
        
        {/* Header */}
        <div 
          className="flex items-start gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-3 md:mb-4 cursor-pointer group/header transition-opacity hover:opacity-80"
          onClick={() => {
            if (onOpenUser) {
              onOpenUser({
                id: userName,
                name: userName,
                avatar: userAvatar || userInitial,
                reliabilityScore: reliabilityScore,
                isVerified: isVerified,
              });
            }
          }}>
          <div
            className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-sm sm:text-base md:text-lg font-serif text-white shadow-sm shrink-0 ${accentColor}`}>
            
            {userInitial}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base md:text-lg text-white line-clamp-2">
              <span className="font-semibold">{userName}</span> <span className="hidden xs:inline">wants to</span>
            </h3>
            <p className="text-xs sm:text-base md:text-lg font-serif italic text-gradient flex items-center gap-1 line-clamp-1">
              {actionText} <span className="text-sm sm:text-base md:text-lg">{emoji}</span>
            </p>
            <div className="mt-1.5 sm:mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-xs font-semibold ${
                  isVerified
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-white/5 text-gray-400 border border-white/10'
                }`}
              >
                {isVerified ? '✓ Verified' : 'Unverified'}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#F59E0B]/20 bg-[#F59E0B]/10 px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-xs font-semibold text-[#FBBF24]">
                🟢 {reliabilityScore}%
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-xs font-semibold text-gray-300">
                ⭐ {averageRating.toFixed(1)} ({reviewCount})
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-gray-300 mb-3 sm:mb-4 md:mb-6 leading-relaxed flex-1 line-clamp-2 sm:line-clamp-3">
          {description}
        </p>

        {/* Tags */}
        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-3 mb-3 sm:mb-4 md:mb-6 w-full">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1 bg-white/5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-xs text-gray-300 whitespace-nowrap">
              <Calendar size={12} className="text-gray-400" />
              <span className="line-clamp-1">{date}</span>
            </div>
            <div
              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-xs font-medium ${audienceColor} whitespace-nowrap`}>
              
              {audience}
            </div>
          </div>

          {/* Interested Count Visualization */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <div className="flex -space-x-1 sm:-space-x-1.5">
              {Array.from({
                length: displayAvatars
              }).map((_, i) =>
              <div
                key={i}
                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-[#1A1A21] ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-[6px] sm:text-[8px] font-bold text-white`}>
                
                  {String.fromCharCode(65 + i)}
                </div>
              )}
            </div>
            <span className="text-[9px] sm:text-xs text-gray-400 font-medium">
              {interestedCount} interested
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3 mt-auto w-full">
          <button
            onClick={onInterested}
            className={`flex-1 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl md:rounded-2xl font-semibold text-xs sm:text-sm transition-opacity hover:opacity-90 shadow-sm ${accentColor || 'bg-[#F59E0B]'} ${accentColor?.includes('text-gray-900') ? 'text-gray-900' : 'text-white'}`}>
            
            View event →
          </button>
          <button 
            onClick={handleSaveToggle}
            disabled={isSaving}
            className={`p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl md:rounded-2xl transition-colors ${
              isSaved 
                ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' 
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}>
            <Heart size={16} className={`sm:w-4 sm:h-4 md:w-5 md:h-5 ${isSaved ? 'fill-current' : ''}`} />
          </button>
          <button className="p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl md:rounded-2xl bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors">
            <MessageCircle size={16} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </div>
    </motion.div>);

}
