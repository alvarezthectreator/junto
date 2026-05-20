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
      <div className="w-full h-40 relative overflow-hidden bg-[#0F0F13]">
          <img
          src={coverImage}
          alt={actionText}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A21] via-transparent to-transparent opacity-90"></div>
        </div>
      }

      <div
        className={`p-6 flex flex-col flex-1 relative z-10 ${coverImage ? 'pt-2' : ''}`}>
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-serif text-white shadow-sm shrink-0 ${accentColor}`}>
            
            {userInitial}
          </div>
          <div>
            <h3 className="text-lg text-white">
              <span className="font-semibold">{userName}</span> wants to
            </h3>
            <p className="text-lg font-serif italic text-gradient flex items-center gap-2">
              {actionText} <span>{emoji}</span>
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-300 text-sm mb-6 leading-relaxed flex-1">
          {description}
        </p>

        {/* Tags */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full text-xs text-gray-300">
              <Calendar size={14} className="text-gray-400" />
              {date}
            </div>
            <div
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${audienceColor}`}>
              
              {audience}
            </div>
          </div>

          {/* Interested Count Visualization */}
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {Array.from({
                length: displayAvatars
              }).map((_, i) =>
              <div
                key={i}
                className={`w-6 h-6 rounded-full border-2 border-[#1A1A21] ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-[8px] font-bold text-white`}>
                
                  {String.fromCharCode(65 + i)}
                </div>
              )}
            </div>
            <span className="text-xs text-gray-500 font-medium">
              {interestedCount} interested
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-auto">
          <button
            className={`flex-1 py-3.5 rounded-2xl font-semibold text-sm transition-opacity hover:opacity-90 shadow-sm ${accentColor} ${accentColor.includes('text-gray-900') ? 'text-gray-900' : 'text-white'}`}>
            
            I'm Interested →
          </button>
          <button className="p-3.5 rounded-2xl bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors">
            <MessageCircle size={20} />
          </button>
        </div>
      </div>
    </motion.div>);

}