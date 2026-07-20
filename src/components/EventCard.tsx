import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { isEventExpired, getRemainingCapacity, getCapacityPercentage } from '../utils/eventUtils';
import { resolveMediaUrl } from '../utils/avatar';
import { WhatsAppShareButton } from './WhatsAppShareButton';

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
  onCardClick?: () => void;
  onSaveChange?: (saved: boolean) => void;
  userAvatar?: string;
  eventTime?: string;
  maxCapacity?: number;
  currentAttendees?: number;
  status?: string;
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
  onCardClick,
  onSaveChange,
  userAvatar,
  eventTime = '',
  maxCapacity,
  currentAttendees = 0,
  status = 'active',
  location = ''
}: EventCardProps) {
  const topLine = (status !== 'expired' && userName && actionText)
    ? `${userName} wantuu have ${actionText}`
    : '';
  const lowerNarration = (status !== 'expired' && description)
    ? `Narration: ${description}`
    : '';
  
  // Check if event is expired
  const eventExpired = isEventExpired(date, eventTime) || status === 'expired';
  const isAtCapacity = maxCapacity ? currentAttendees >= maxCapacity : false;
  const remainingCapacity = maxCapacity ? getRemainingCapacity(currentAttendees, maxCapacity) : 0;
  const capacityPercentage = maxCapacity ? getCapacityPercentage(currentAttendees, maxCapacity) : 0;

  useEffect(() => {
    // placeholder for future side-effects
  }, [eventId, currentUserId]);

  // Sharing is handled by the WhatsAppShareButton component below

  const resolvedCoverImage = resolveMediaUrl(coverImage);
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
        y: eventExpired ? 0 : -4
      }}
      onClick={() => {
        if (!eventExpired) {
          onCardClick?.();
        }
      }}
      role={onCardClick ? 'button' : undefined}
      tabIndex={onCardClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onCardClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          if (!eventExpired) {
            onCardClick();
          }
        }
      }}
      className={`bg-[#1A1A21] rounded-3xl border transition-colors relative overflow-hidden flex flex-col h-full group ${
        eventExpired 
          ? 'opacity-60 border-white/5 hover:border-white/5' 
          : 'border-white/5 hover:border-white/10'
      }`}>
      
      {/* Top Accent Stripe */}
      <div className={`absolute top-0 left-0 w-full h-1 z-20 ${eventExpired ? 'bg-gray-500' : accentColor}`} />

      {/* Expired Badge */}
      {eventExpired && (
        <div className="absolute top-3 right-3 z-30 bg-red-500/90 text-white px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
          <AlertCircle size={14} />
          Expired
        </div>
      )}

      {/* Capacity Badge */}
      {isAtCapacity && !eventExpired && (
        <div className="absolute top-3 right-3 z-30 bg-amber-500/90 text-white px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
          <AlertCircle size={14} />
          Full
        </div>
      )}

      {/* Cover Image */}
      {resolvedCoverImage &&
      <div className={`w-full h-36 sm:h-44 md:h-56 relative overflow-hidden ${eventExpired ? 'bg-gray-900' : 'bg-[#0F0F13]'}`}>
          <img
          src={resolvedCoverImage}
          alt={actionText}
          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${eventExpired ? 'opacity-40' : ''}`} />
        
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A21] via-transparent to-transparent opacity-90"></div>
        </div>
      }

      <div
        className={`p-3 sm:p-4 md:p-6 flex flex-col flex-1 relative z-10 ${resolvedCoverImage ? 'pt-2 sm:pt-3 md:pt-4' : ''}`}>
        
        {/* Header */}
        <div 
          className="flex items-start gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-3 md:mb-4 cursor-pointer group/header transition-opacity hover:opacity-80"
          onClick={(event) => {
            event.stopPropagation();
            if (onCardClick) {
              onCardClick();
              return;
            }
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

        {/* Top narration line */}
        {topLine && (
          <p className="mb-2 text-sm text-gray-300 sm:text-base">
            <span className="font-semibold text-white">{topLine}</span>
          </p>
        )}

        {/* Location (replaces old narration/description area) */}
        <div className="flex items-center gap-2 text-sm text-gray-300 mb-3 sm:mb-4">
          <span className="text-amber-300">📍</span>
          <span className="line-clamp-1">{location || description || 'Nearby'}</span>
        </div>

        {/* Tags */}
        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-3 mb-3 sm:mb-4 md:mb-6 w-full">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1 bg-white/5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-xs text-gray-300 whitespace-nowrap">
              <Calendar size={12} className="text-gray-400" />
              <span className="line-clamp-1">{date}</span>
            </div>
            {eventTime && (
              <div className="flex items-center gap-1 bg-white/5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-xs text-gray-300 whitespace-nowrap">
                <Clock size={12} className="text-gray-400" />
                <span className="line-clamp-1">{eventTime}</span>
              </div>
            )}
            <div
              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-xs font-medium ${audienceColor} whitespace-nowrap`}>
              
              {audience}
            </div>
          </div>
        </div>

        {/* Lower narration line */}
        {lowerNarration && (
          <p className="mb-3 text-sm leading-relaxed text-gray-300 sm:mb-4 md:mb-6">
            {lowerNarration}
          </p>
        )}

        {/* Capacity Bar (if max capacity is set) */}
        {maxCapacity && (
          <div className="mb-3 sm:mb-4 md:mb-6">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] sm:text-xs text-gray-400 font-medium">
                Capacity
              </span>
              <span className={`text-[9px] sm:text-xs font-semibold ${
                isAtCapacity ? 'text-red-400' : 'text-emerald-400'
              }`}>
                {isAtCapacity ? 'Full' : `${remainingCapacity} spot${remainingCapacity !== 1 ? 's' : ''} left`}
              </span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isAtCapacity ? 'bg-red-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, capacityPercentage)}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3 mt-auto w-full">
          <button
            onClick={(event) => {
              event.stopPropagation();
              onInterested?.();
            }}
            disabled={eventExpired || isAtCapacity}
            className={`flex-1 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl md:rounded-2xl font-semibold text-xs sm:text-sm transition-all duration-200 ${
              eventExpired 
                ? 'bg-gray-600 text-gray-300 cursor-not-allowed opacity-50'
                : isAtCapacity
                ? 'bg-red-600/50 text-red-100 cursor-not-allowed opacity-75'
                : 'bg-gradient-to-r from-[#F59E0B] via-[#FB923C] to-[#FCD34D] text-white hover:opacity-90 shadow-[0_8px_24px_rgba(245,158,11,0.25)]'
            }`}>
            
            {eventExpired ? 'Expired' : isAtCapacity ? 'Full' : onInterested ? 'Interested' : 'View event →'}
          </button>
          <WhatsAppShareButton
            type="event"
            data={{
              eventTitle: `${userName} — ${actionText}`,
              eventDate: date,
              eventTime: eventTime,
              eventLocation: location || description || '',
              eventDescription: description,
              hostName: userName,
              interestedCount: interestedCount,
              eventLink: eventId ? `${window.location.origin}/event/${eventId}` : undefined,
            }}
            variant="icon"
            size="md"
            className="p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl md:rounded-2xl bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          />
        </div>
      </div>
    </motion.div>);

}
