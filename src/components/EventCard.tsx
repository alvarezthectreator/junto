import React from 'react';
import { Calendar, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
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
  coverImage
}: EventCardProps) {
  const avatarColors = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500'];

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
        duration: 0.4,
        delay: index * 0.1,
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
      <div className="w-full h-32 sm:h-36 md:h-40 relative overflow-hidden bg-[#0F0F13]">
          <img
          src={coverImage}
          alt={actionText}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A21] via-transparent to-transparent opacity-90"></div>
        </div>
      }

      <div
        className={`p-4 sm:p-5 md:p-6 flex flex-col flex-1 relative z-10 ${coverImage ? 'pt-3 sm:pt-4' : ''}`}>
        
        {/* Header */}
        <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-base sm:text-lg md:text-xl font-serif text-white shadow-sm shrink-0 ${accentColor}`}>
            
            {userInitial}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg text-white line-clamp-2">
              <span className="font-semibold">{userName}</span> <span className="hidden xs:inline">wants to</span>
            </h3>
            <p className="text-sm sm:text-lg font-serif italic text-gradient flex items-center gap-1 line-clamp-1">
              {actionText} <span className="text-base sm:text-lg">{emoji}</span>
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-gray-300 mb-4 sm:mb-6 leading-relaxed flex-1 line-clamp-2 sm:line-clamp-3">
          {description}
        </p>

        {/* Tags */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-white/5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs text-gray-300 whitespace-nowrap">
              <Calendar size={12} className="sm:w-4 sm:h-4 text-gray-400" />
              <span className="line-clamp-1">{date}</span>
            </div>
            <div
              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium ${audienceColor} whitespace-nowrap`}>
              
              {audience}
            </div>
          </div>

          {/* Interested Count Visualization */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex -space-x-1.5 sm:-space-x-2">
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
            <span className="text-[10px] sm:text-xs text-gray-500 font-medium whitespace-nowrap">
              {interestedCount} int.
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3 mt-auto">
          <button
            className={`flex-1 py-2.5 sm:py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-semibold text-xs sm:text-sm transition-opacity hover:opacity-90 shadow-sm ${accentColor} ${accentColor.includes('text-gray-900') ? 'text-gray-900' : 'text-white'}`}>
            
            I'm Interested →
          </button>
          <button className="p-2.5 sm:p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors">
            <MessageCircle size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </motion.div>);

}