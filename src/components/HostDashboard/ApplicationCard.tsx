import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, MessageSquare, Star } from 'lucide-react';
import { EventApplication } from '../../types/hostDashboard';

interface ApplicationCardProps {
  application: EventApplication;
  isLightMode?: boolean;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({ application, isLightMode = false }) => {
  const surfaceClass = isLightMode ? 'bg-white/80 border-black/10' : 'bg-gray-900 bg-opacity-50 border-gray-800';
  const mutedClass = isLightMode ? 'text-[#7a674f]' : 'text-gray-400';
  const lineClass = isLightMode ? 'border-black/10' : 'border-gray-800';

  const statusColors = {
    pending: 'bg-amber-500/20 text-amber-400',
    accepted: 'bg-green-500/20 text-green-400',
    declined: 'bg-red-500/20 text-red-400'
  };

  const cardVariants = {
    hover: { x: 4, transition: { duration: 0.2 } }
  };

  return (
    <motion.div
      variants={cardVariants}
      whileHover="hover"
      className={`rounded-lg p-4 ${surfaceClass} border transition-all`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* User Info */}
        <div className="flex items-center gap-3 flex-1">
          <div className="text-3xl flex-shrink-0">{application.userAvatar}</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{application.userName}</h3>
            <div className="flex items-center gap-2 text-sm mt-1">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span>{application.userRating}/5</span>
              </div>
              <span className={mutedClass}>•</span>
              <span className={mutedClass}>{application.eventAttendance} events attended</span>
            </div>
            <p className={`text-xs ${mutedClass} mt-1`}>
              Applied {Math.floor((Date.now() - application.appliedAt.getTime()) / (1000 * 60 * 60))}h ago
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusColors[application.status]}`}>
          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
        </div>
      </div>

      {/* Actions - shown for pending applications */}
      {application.status === 'pending' && (
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
            className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <Check className="w-4 h-4" />
            Accept
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <X className="w-4 h-4" />
            Decline
          </motion.button>
        </div>
      )}

      {/* View profile button for accepted */}
      {application.status === 'accepted' && (
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
            className="flex-1 px-3 py-2 border border-blue-500 text-blue-500 rounded-lg text-sm font-semibold transition-colors hover:bg-blue-500/10"
          >
            View Profile
          </motion.button>
        </div>
      )}
    </motion.div>
  );
};

export default ApplicationCard;
