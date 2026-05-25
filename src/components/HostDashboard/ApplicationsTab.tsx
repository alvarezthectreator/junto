import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, MessageSquare } from 'lucide-react';
import ApplicationCard from './ApplicationCard';
import { EventApplication } from '../../types/hostDashboard';
import * as API from '../../services/api';

interface ApplicationsTabProps {
  isLightMode?: boolean;
}

const mockApplications: EventApplication[] = [
  {
    id: 'app_1',
    eventId: 'event_1',
    userId: 'user_1',
    userName: 'Sarah Johnson',
    userAvatar: '👩‍🦰',
    userRating: 4.8,
    eventAttendance: 5,
    appliedAt: new Date(Date.now() - 2 * 24 * 60 * 60000),
    status: 'pending'
  },
  {
    id: 'app_2',
    eventId: 'event_1',
    userId: 'user_2',
    userName: 'Mike Chen',
    userAvatar: '👨‍💼',
    userRating: 4.5,
    eventAttendance: 3,
    appliedAt: new Date(Date.now() - 1 * 24 * 60 * 60000),
    status: 'pending'
  },
  {
    id: 'app_3',
    eventId: 'event_1',
    userId: 'user_3',
    userName: 'Jessica Park',
    userAvatar: '👩',
    userRating: 4.9,
    eventAttendance: 8,
    appliedAt: new Date(Date.now() - 0.5 * 24 * 60 * 60000),
    status: 'accepted'
  }
];

const ApplicationsTab: React.FC<ApplicationsTabProps> = ({ isLightMode = false }) => {
  const [applications, setApplications] = useState<EventApplication[]>(mockApplications);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const userId = API.getUserId();
        if (userId) {
          const response = await API.getUserApplications(userId);
          const apiApps = response.applications.map((app: any): EventApplication => ({
            id: app.id,
            eventId: app.event_id,
            userId: app.user_id,
            userName: app.user_id || 'Unknown',
            userAvatar: '👤',
            userRating: 4.5,
            eventAttendance: 0,
            appliedAt: new Date(app.created_at),
            status: app.status || 'pending'
          }));
          setApplications(apiApps.length > 0 ? apiApps : mockApplications);
        } else {
          setApplications(mockApplications);
        }
      } catch (error) {
        console.error('Failed to fetch applications:', error);
        setApplications(mockApplications);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const filteredApplications = filterStatus === 'all'
    ? applications
    : applications.filter(a => a.status === filterStatus);

  const stats = {
    pending: applications.filter(a => a.status === 'pending').length,
    accepted: applications.filter(a => a.status === 'accepted').length,
    declined: applications.filter(a => a.status === 'declined').length
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
          { label: 'All Applications', value: applications.length, color: 'text-blue-500' },
          { label: 'Pending', value: stats.pending, color: 'text-amber-500' },
          { label: 'Accepted', value: stats.accepted, color: 'text-green-500' },
          { label: 'Declined', value: stats.declined, color: 'text-red-500' }
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
        {(['all', 'pending', 'accepted', 'declined'] as const).map((status) => (
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
            {status !== 'all' && ` (${stats[status as keyof typeof stats]})`}
          </button>
        ))}
      </motion.div>

      {/* Applications List */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        {filteredApplications.length > 0 ? (
          filteredApplications.map((application) => (
            <motion.div key={application.id} variants={itemVariants}>
              <ApplicationCard application={application} isLightMode={isLightMode} />
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12">
            <p className={mutedClass}>No {filterStatus !== 'all' ? filterStatus : ''} applications</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ApplicationsTab;
