import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, FileText, Users, TrendingUp } from 'lucide-react';
import EventsTab from '../components/HostDashboard/EventsTab';
import ApplicationsTab from '../components/HostDashboard/ApplicationsTab';
import GuestsTab from '../components/HostDashboard/GuestsTab';
import StatsTab from '../components/HostDashboard/StatsTab';

type TabType = 'events' | 'applications' | 'guests' | 'stats';

interface HostDashboardProps {
  onNavigate?: (page: string) => void;
  isLightMode?: boolean;
}

export const HostDashboard: React.FC<HostDashboardProps> = ({ onNavigate = () => {}, isLightMode = false }) => {
  const [activeTab, setActiveTab] = useState<TabType>('events');
  const pageClass = isLightMode ? 'bg-[#f7f3ea] text-[#241b10]' : 'bg-[#0F0F13] text-white';

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'events', label: 'Events', icon: <Calendar className="w-5 h-5" /> },
    { id: 'applications', label: 'Applications', icon: <FileText className="w-5 h-5" /> },
    { id: 'guests', label: 'Guests', icon: <Users className="w-5 h-5" /> },
    { id: 'stats', label: 'Analytics', icon: <TrendingUp className="w-5 h-5" /> },
  ];

  const tabVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0, 
      y: -10,
      transition: { duration: 0.2 }
    }
  };

  return (
    <div className={`min-h-screen ${pageClass} py-6 px-4 md:px-8`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-2">
          <h1 className={`text-3xl md:text-4xl font-bold ${isLightMode ? 'text-[#241b10]' : 'text-white'}`}>
            Host Dashboard
          </h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full font-semibold transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Create Event</span>
          </motion.button>
        </div>
        <p className={isLightMode ? 'text-[#7a674f]' : 'text-gray-400'}>
          Manage your events, applications, and guest lists
        </p>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className={`mb-8 border-b ${isLightMode ? 'border-black/10' : 'border-gray-800'}`}
      >
        <div className="flex gap-1 md:gap-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-semibold transition-all relative whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-red-500'
                  : isLightMode 
                    ? 'text-[#7a674f] hover:text-[#241b10]'
                    : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          variants={tabVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {activeTab === 'events' && <EventsTab isLightMode={isLightMode} />}
          {activeTab === 'applications' && <ApplicationsTab isLightMode={isLightMode} />}
          {activeTab === 'guests' && <GuestsTab isLightMode={isLightMode} />}
          {activeTab === 'stats' && <StatsTab isLightMode={isLightMode} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default HostDashboard;
