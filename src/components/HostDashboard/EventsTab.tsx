import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, Eye } from 'lucide-react';
import EventCard from './EventCard';
import CreateEventModal from './CreateEventModal';
import { HostedEvent } from '../../types/hostDashboard';
import * as API from '../../services/api';

interface EventsTabProps {
  isLightMode?: boolean;
}

const EventsTab: React.FC<EventsTabProps> = ({ isLightMode = false }) => {
  const [events, setEvents] = useState<HostedEvent[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'full' | 'completed'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHostEvents = async () => {
      try {
        setLoading(true);
        const userId = API.getUserId();
        if (userId) {
          const response = await API.getHostEvents(userId);
          const apiEvents = response.events.map((event: any): HostedEvent => ({
            id: event.id,
            title: event.title,
            image: 'https://via.placeholder.com/300x200?text=' + encodeURIComponent(event.title),
            description: event.description || '',
            date: new Date(event.event_date),
            location: event.location_city || 'Unknown',
            maxGuests: event.max_guests || 0,
            confirmedGuests: 0,
            pendingApplications: 0,
            price: event.guest_fee || 0,
            status: event.status === 'active' ? 'active' : event.status === 'completed' ? 'completed' : 'active',
            createdAt: new Date(event.created_at),
            audience: 'mixed',
            hostRating: 4.8
          }));
          setEvents(apiEvents);
        } else {
          setEvents([]);
        }
      } catch (error) {
        console.error('Failed to fetch host events:', error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHostEvents();
  }, []);

  const filteredEvents = filterStatus === 'all' 
    ? events 
    : events.filter(e => e.status === filterStatus);

  const activeEvents = events.filter(e => e.status === 'active' || e.status === 'full').length;
  const totalRevenue = events.reduce((sum, e) => sum + ((e.price || 0) * e.confirmedGuests), 0);

  const handleDeleteEvent = (eventId: string) => {
    setEvents(events.filter(e => e.id !== eventId));
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
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {[
          { label: 'Active Events', value: activeEvents, color: 'text-blue-500' },
          { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, color: 'text-green-500' },
          { label: 'Total Hosted', value: events.length, color: 'text-purple-500' }
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

      {/* Filter Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="flex gap-2 flex-wrap"
      >
        {(['all', 'active', 'full', 'completed'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-full font-semibold transition-all ${
              filterStatus === status
                ? 'bg-red-500 text-white'
                : isLightMode
                  ? 'bg-white/50 text-[#241b10] hover:bg-white/80'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </motion.div>

      {/* Events List */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <motion.div key={event.id} variants={itemVariants}>
              <EventCard event={event} isLightMode={isLightMode} onDelete={handleDeleteEvent} />
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className={mutedClass}>No {filterStatus !== 'all' ? filterStatus : ''} events</p>
          </div>
        )}
      </motion.div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <CreateEventModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} isLightMode={isLightMode} />
      )}
    </div>
  );
};

export default EventsTab;
