import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, Eye } from 'lucide-react';
import EventCard from './EventCard';
import CreateEventModal from './CreateEventModal';
import { HostedEvent } from '../../types/hostDashboard';

interface EventsTabProps {
  isLightMode?: boolean;
}

const mockEvents: HostedEvent[] = [
  {
    id: 'event_1',
    title: 'Rooftop Dinner Party',
    image: 'https://via.placeholder.com/300x200?text=Rooftop+Dinner',
    description: 'Exclusive dinner with city views',
    date: new Date('2026-05-25T20:00:00'),
    location: 'San Francisco',
    maxGuests: 20,
    confirmedGuests: 18,
    pendingApplications: 3,
    price: 45,
    status: 'active',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60000),
    audience: 'mixed',
    hostRating: 4.8
  },
  {
    id: 'event_2',
    title: 'Wine Tasting Night',
    image: 'https://via.placeholder.com/300x200?text=Wine+Tasting',
    description: 'Explore premium wines',
    date: new Date('2026-05-28T19:00:00'),
    location: 'Oakland',
    maxGuests: 30,
    confirmedGuests: 30,
    pendingApplications: 0,
    price: 60,
    status: 'full',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60000),
    audience: 'mixed',
    hostRating: 4.9
  },
  {
    id: 'event_3',
    title: 'Jazz Concert Evening',
    image: 'https://via.placeholder.com/300x200?text=Jazz+Concert',
    description: 'Live jazz performance',
    date: new Date('2026-05-10T19:30:00'),
    location: 'Berkeley',
    maxGuests: 50,
    confirmedGuests: 45,
    pendingApplications: 0,
    price: 35,
    status: 'completed',
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60000),
    audience: 'mixed',
    hostRating: 4.7
  }
];

const EventsTab: React.FC<EventsTabProps> = ({ isLightMode = false }) => {
  const [events, setEvents] = useState<HostedEvent[]>(mockEvents);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'full' | 'completed'>('all');

  const filteredEvents = filterStatus === 'all' 
    ? events 
    : events.filter(e => e.status === filterStatus);

  const activeEvents = events.filter(e => e.status === 'active' || e.status === 'full').length;
  const totalRevenue = events.reduce((sum, e) => sum + ((e.price || 0) * e.confirmedGuests), 0);

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
              <EventCard event={event} isLightMode={isLightMode} />
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
