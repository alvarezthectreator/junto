import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import GuestCard from './GuestCard';
import { EventGuest } from '../../types/hostDashboard';
import * as API from '../../services/api';
import { getAvatarImageFromProfilePhotos, getAvatarInitial } from '../../utils/avatar';

interface GuestsTabProps {
  isLightMode?: boolean;
}

const GuestsTab: React.FC<GuestsTabProps> = ({ isLightMode = false }) => {
  const [guests, setGuests] = useState<EventGuest[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGuests = async () => {
      try {
        setLoading(true);
        const userId = API.getUserId();
        if (userId) {
          const eventsResponse = await API.getHostEvents(userId);
          const hostEvents = eventsResponse.events || [];
          const eventId = selectedEvent || hostEvents[0]?.id || '';

          if (hostEvents.length > 0 && !selectedEvent) {
            setSelectedEvent(hostEvents[0].id);
          }

          if (!eventId) {
            setGuests([]);
            return;
          }

          const [applicationsResponse, checkInsResponse] = await Promise.all([
            API.getEventApplications(eventId),
            API.getEventCheckIns(eventId),
          ]);

          const acceptedApplications = (applicationsResponse || []).filter((application: any) => application.status === 'accepted');
          const checkIns = Array.isArray(checkInsResponse) ? checkInsResponse : [];

          const nextGuests: EventGuest[] = acceptedApplications.map((application: any) => {
            const matchingCheckIn = checkIns.find((checkIn: any) => checkIn.user_id === application.user_id);
            return {
              id: application.id,
              userId: application.user_id,
              userName: application.display_name || application.profile_id || 'Guest',
              userAvatar: getAvatarImageFromProfilePhotos(application.profile_photos) || application.user_avatar || getAvatarInitial(application.display_name || application.profile_id || 'G'),
              eventId: application.event_id,
              status: matchingCheckIn ? 'confirmed' : 'maybe',
              checkedIn: Boolean(matchingCheckIn),
              joinedAt: new Date(application.created_at || Date.now()),
              rating: undefined,
            };
          });

          setGuests(nextGuests);
        } else {
          setGuests([]);
        }
      } catch (error) {
        console.error('Failed to fetch guests:', error);
        setGuests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGuests();
  }, [selectedEvent]);

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
