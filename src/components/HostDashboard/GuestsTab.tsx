import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, MessageSquare, UserX, CheckCircle } from 'lucide-react';
import GuestCard from './GuestCard';
import { EventGuest } from '../../types/hostDashboard';
import * as API from '../../services/api';

interface GuestsTabProps {
  isLightMode?: boolean;
}

const mockGuests: EventGuest[] = [
  {
    id: 'guest_1',
    userId: 'user_1',
    userName: 'Sarah Johnson',
    userAvatar: '👩‍🦰',
    eventId: 'event_1',
    status: 'confirmed',
    checkedIn: true,
    joinedAt: new Date(Date.now() - 3 * 24 * 60 * 60000),
    rating: 5
  },
  {
    id: 'guest_2',
    userId: 'user_2',
    userName: 'Mike Chen',
    userAvatar: '👨‍💼',
    eventId: 'event_1',
    status: 'confirmed',
    checkedIn: false,
    joinedAt: new Date(Date.now() - 2 * 24 * 60 * 60000),
    rating: undefined
  },
  {
    id: 'guest_3',
    userId: 'user_3',
    userName: 'Jessica Park',
    userAvatar: '👩',
    eventId: 'event_1',
    status: 'maybe',
    checkedIn: false,
    joinedAt: new Date(Date.now() - 1 * 24 * 60 * 60000)
  }
];

const GuestsTab: React.FC<GuestsTabProps> = ({ isLightMode = false }) => {
  const [guests, setGuests] = useState<EventGuest[]>(mockGuests);
  const [selectedEvent, setSelectedEvent] = useState('event_1');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGuests = async () => {
      try {
        setLoading(true);
        const userId = API.getUserId();
        if (userId) {
          const response = await API.getHostEvents(userId);
          if (response.events.length > 0) {
            setSelectedEvent(response.events[0].id);
          }
          // In a real app, we'd fetch actual guests from accepted applications
          // For now, we'll use mock data as a fallback
          setGuests(mockGuests);
        } else {
          setGuests(mockGuests);
        }
      } catch (error) {
        console.error('Failed to fetch guests:', error);
        setGuests(mockGuests);
      } finally {
        setLoading(false);
      }
    };

    fetchGuests();
  }, []);

  const filteredGuests = guests.filter(g => g.eventId === selectedEvent);
  
  const stats = {
    confirmed: filteredGuests.filter(g => g.status === 'confirmed').length,
    maybe: filteredGuests.filter(g => g.status === 'maybe').length,
    checkedIn: filteredGuests.filter(g => g.checkedIn).length
  };

  const surfaceClass = isLightMode ? 'bg-white/80 border-black/10' : 'bg-gray-900 bg-opacity-50 border-gray-800';
  const mutedClass = isLightMode ? 'text-[#7a674f]' : 'text-gray-400';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        {[
          { label: 'Total Guests', value: filteredGuests.length, color: 'text-blue-500' },
          { label: 'Confirmed', value: stats.confirmed, color: 'text-green-500' },
          { label: 'Maybe', value: stats.maybe, color: 'text-amber-500' },
          { label: 'Checked In', value: stats.checkedIn, color: 'text-purple-500' }
        ].map((stat, i) => (
          <motion.div
            key={i}
            variants={itemVariants}
            className={`p-4 rounded-lg ${surfaceClass}`}
          >
            <p className={mutedClass}>{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color} mt-2`}>{stat.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Export Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
      >
        <Download className="w-5 h-5" />
        Export Guest List
      </motion.button>

      {/* Guests List */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        {/* Confirmed Guests */}
        {filteredGuests.filter(g => g.status === 'confirmed').length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 text-green-400">Confirmed ({stats.confirmed})</h3>
            <div className="space-y-2">
              {filteredGuests
                .filter(g => g.status === 'confirmed')
                .map((guest) => (
                  <motion.div key={guest.id} variants={itemVariants}>
                    <GuestCard guest={guest} isLightMode={isLightMode} />
                  </motion.div>
                ))}
            </div>
          </div>
        )}

        {/* Maybe Guests */}
        {filteredGuests.filter(g => g.status === 'maybe').length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 text-amber-400">Maybe ({stats.maybe})</h3>
            <div className="space-y-2">
              {filteredGuests
                .filter(g => g.status === 'maybe')
                .map((guest) => (
                  <motion.div key={guest.id} variants={itemVariants}>
                    <GuestCard guest={guest} isLightMode={isLightMode} />
                  </motion.div>
                ))}
            </div>
          </div>
        )}

        {filteredGuests.length === 0 && (
          <div className="text-center py-12">
            <p className={mutedClass}>No guests yet</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default GuestsTab;
