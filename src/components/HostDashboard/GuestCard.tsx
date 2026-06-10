import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, UserX, CheckCircle, Star } from 'lucide-react';
import { EventGuest } from '../../types/hostDashboard';
import { getAvatarImageFromProfilePhotos, getAvatarInitial, isAvatarImageSource, resolveMediaUrl } from '../../utils/avatar';

interface GuestCardProps {
  guest: EventGuest;
  isLightMode?: boolean;
}

const GuestCard: React.FC<GuestCardProps> = ({ guest, isLightMode = false }) => {
  const surfaceClass = isLightMode ? 'bg-white/80 border-black/10' : 'bg-gray-900 bg-opacity-50 border-gray-800';
  const mutedClass = isLightMode ? 'text-[#7a674f]' : 'text-gray-400';
  const lineClass = isLightMode ? 'border-black/10' : 'border-gray-800';

  const statusColors = {
    confirmed: 'bg-green-500/20 text-green-400',
    maybe: 'bg-amber-500/20 text-amber-400',
    'no-show': 'bg-red-500/20 text-red-400'
  };

  const cardVariants = {
    hover: { x: 4, transition: { duration: 0.2 } }
  };

  const avatarImage = getAvatarImageFromProfilePhotos((guest as any).profile_photos) || resolveMediaUrl(guest.userAvatar);
  const avatarInitial = getAvatarInitial(guest.userName);

  return (
    <motion.div
      variants={cardVariants}
      whileHover="hover"
      className={`rounded-lg p-4 ${surfaceClass} border transition-all`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Guest Info */}
        <div className="flex items-center gap-3 flex-1">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#F59E0B] to-[#FB923C] text-sm font-semibold text-white">
            {isAvatarImageSource(avatarImage) ? (
              <img src={avatarImage} alt={guest.userName} className="h-full w-full object-cover" />
            ) : (
              <span>{avatarInitial}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{guest.userName}</h3>
              {guest.checkedIn && (
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 text-sm mt-1">
              {guest.rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{guest.rating}/5</span>
                </div>
              )}
              {guest.rating && <span className={mutedClass}>•</span>}
              <span className={mutedClass}>Joined {Math.floor((Date.now() - guest.joinedAt.getTime()) / (1000 * 60 * 60))}h ago</span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusColors[guest.status]}`}>
          {guest.status.charAt(0).toUpperCase() + guest.status.slice(1)}
        </div>
      </div>

      {/* Actions */}
      <div className={`flex gap-2 mt-4 pt-4 border-t ${lineClass}`}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          Message
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          <UserX className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default GuestCard;
