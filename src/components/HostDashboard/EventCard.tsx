import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, Users, DollarSign, MapPin, Calendar } from 'lucide-react';
import { HostedEvent } from '../../types/hostDashboard';
import * as API from '../../services/api';

interface EventCardProps {
  event: HostedEvent;
  isLightMode?: boolean;
  onDelete?: (eventId: string) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, isLightMode = false, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await API.deleteEvent(event.id);
      onDelete?.(event.id);
    } catch (error) {
      console.error('Failed to delete event:', error);
      alert('Failed to delete event. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };
  const surfaceClass = isLightMode ? 'bg-white/80 border-black/10' : 'bg-gray-900 bg-opacity-50 border-gray-800';
  const mutedClass = isLightMode ? 'text-[#7a674f]' : 'text-gray-400';
  const lineClass = isLightMode ? 'border-black/10' : 'border-gray-800';

  const statusColors = {
    active: 'bg-blue-500/20 text-blue-400',
    full: 'bg-amber-500/20 text-amber-400',
    completed: 'bg-green-500/20 text-green-400',
    cancelled: 'bg-red-500/20 text-red-400',
    draft: 'bg-gray-500/20 text-gray-400'
  };

  const cardVariants = {
    hover: { y: -4, transition: { duration: 0.2 } }
  };

  return (
    <motion.div
      variants={cardVariants}
      whileHover="hover"
      className={`rounded-lg overflow-hidden ${surfaceClass} border transition-all`}
    >
      {/* Image */}
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-red-500 to-purple-600">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover opacity-70"
        />
        <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${statusColors[event.status]}`}>
          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="font-bold text-lg line-clamp-2">{event.title}</h3>

        {/* Details Grid */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span>{event.date.toLocaleDateString()} at {event.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span>{event.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 flex-shrink-0" />
            <span>{event.confirmedGuests}/{event.maxGuests} guests • {event.pendingApplications} pending</span>
          </div>
          {event.price && (
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 flex-shrink-0" />
              <span>${event.price} per person</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className={`w-full h-2 rounded-full overflow-hidden ${isLightMode ? 'bg-black/10' : 'bg-gray-700'}`}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(event.confirmedGuests / event.maxGuests) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-red-500 to-purple-600"
          />
        </div>

        {/* Rating */}
        {event.hostRating && (
          <div className={`flex items-center gap-2 text-sm ${mutedClass}`}>
            <span>⭐ {event.hostRating}/5</span>
          </div>
        )}

        {/* Actions */}
        <div className={`flex gap-2 pt-2 border-t ${lineClass}`}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
            className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`rounded-lg p-6 max-w-sm ${isLightMode ? 'bg-white' : 'bg-gray-800'}`}
            >
              <h3 className="text-lg font-bold mb-4">Delete Event?</h3>
              <p className={`mb-6 ${mutedClass}`}>
                Are you sure you want to delete "{event.title}"? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                    isLightMode
                      ? 'bg-gray-200 hover:bg-gray-300 text-black'
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  } disabled:opacity-50`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 rounded-lg font-semibold bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default EventCard;
