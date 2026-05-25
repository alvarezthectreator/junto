import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, FileText, Users, TrendingUp, Menu, X, Bell } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import EventsTab from '../components/HostDashboard/EventsTab';
import ApplicationsTab from '../components/HostDashboard/ApplicationsTab';
import GuestsTab from '../components/HostDashboard/GuestsTab';
import StatsTab from '../components/HostDashboard/StatsTab';

type TabType = 'events' | 'applications' | 'guests' | 'stats';

interface HostDashboardProps {
  onNavigate?: (page: string) => void;
  setActiveNav?: (nav: string) => void;
  onCloseSidebar?: () => void;
  isLightMode?: boolean;
}

export const HostDashboard: React.FC<HostDashboardProps> = ({ 
  onNavigate = () => {}, 
  setActiveNav = () => {},
  onCloseSidebar = () => {},
  isLightMode = false 
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('events');


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
    <div className="flex min-h-screen bg-[#0F0F13]">
      <Sidebar activeNav="Host Dashboard" setActiveNav={setActiveNav} onNavigate={onNavigate} onCloseSidebar={onCloseSidebar} />
      
      <main className="flex-1 ml-64 md:ml-64 lg:ml-64 overflow-auto">
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            {/* Header with Navigation */}
            <div className="flex items-center justify-between gap-4 mb-6 md:mb-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                aria-label="Toggle menu"
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <button
                onClick={() => onNavigate?.('notifications')}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors md:hidden"
                title="View notifications"
              >
                <Bell size={18} />
              </button>
            </div>

            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Host Dashboard
              </h1>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white px-4 py-2 rounded-full font-semibold transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Create Event</span>
              </motion.button>
            </div>
            <p className="text-gray-400">
              Manage your events, applications, and guest lists
            </p>
          </motion.div>

          {/* Tab Navigation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-8 border-b border-white/10"
          >
            <div className="flex gap-1 md:gap-4 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 font-semibold transition-all relative whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-[#F59E0B]'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F59E0B]"
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
      </main>
    </div>
  );
};

export default HostDashboard;
