import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Users, Star, Calendar } from 'lucide-react';

interface StatsTabProps {
  isLightMode?: boolean;
}

const StatsTab: React.FC<StatsTabProps> = ({ isLightMode = false }) => {
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

  // Mock data
  const stats = {
    totalEventsHosted: 12,
    totalRevenue: 2100,
    earningsThisMonth: 450,
    pendingPayouts: 200,
    averageRating: 4.8,
    reviewCount: 24,
    responseRate: 98,
    repeatGuestRate: 60,
    lastPayout: new Date('2026-05-20'),
    guestAttendanceRate: 95
  };

  const monthlyEarnings = [
    { month: 'Mar', earnings: 350 },
    { month: 'Apr', earnings: 520 },
    { month: 'May', earnings: 450 }
  ];

  const topEvents = [
    { title: 'Rooftop Dinner', revenue: 810, guests: 18 },
    { title: 'Wine Tasting', revenue: 1200, guests: 30 },
    { title: 'Jazz Concert', revenue: 875, guests: 45 }
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {[
          { 
            icon: Calendar, 
            label: 'Total Events', 
            value: stats.totalEventsHosted, 
            color: 'text-blue-500' 
          },
          { 
            icon: DollarSign, 
            label: 'Total Revenue', 
            value: `$${stats.totalRevenue}`, 
            color: 'text-green-500' 
          },
          { 
            icon: DollarSign, 
            label: 'This Month', 
            value: `$${stats.earningsThisMonth}`, 
            color: 'text-purple-500' 
          },
          { 
            icon: Star, 
            label: 'Average Rating', 
            value: `${stats.averageRating}/5`, 
            color: 'text-yellow-500' 
          },
          { 
            icon: Users, 
            label: 'Attendance Rate', 
            value: `${stats.guestAttendanceRate}%`, 
            color: 'text-pink-500' 
          },
          { 
            icon: TrendingUp, 
            label: 'Repeat Guest Rate', 
            value: `${stats.repeatGuestRate}%`, 
            color: 'text-cyan-500' 
          }
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              variants={itemVariants}
              className={`p-6 rounded-lg ${surfaceClass}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className={mutedClass}>{stat.label}</p>
                  <p className={`text-3xl font-bold ${stat.color} mt-2`}>
                    {stat.value}
                  </p>
                </div>
                <Icon className={`w-8 h-8 ${stat.color} opacity-50`} />
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Secondary Stats */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {[
          { label: 'Response Rate', value: `${stats.responseRate}%` },
          { label: 'Pending Payout', value: `$${stats.pendingPayouts}` }
        ].map((stat, i) => (
          <motion.div
            key={i}
            variants={itemVariants}
            className={`p-6 rounded-lg ${surfaceClass}`}
          >
            <p className={mutedClass}>{stat.label}</p>
            <p className="text-3xl font-bold text-red-500 mt-2">{stat.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Top Events */}
      <motion.div
        variants={itemVariants}
        className={`p-6 rounded-lg ${surfaceClass}`}
      >
        <h3 className="text-xl font-bold mb-4">Top Events</h3>
        <div className="space-y-3">
          {topEvents.map((event, i) => (
            <div key={i} className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div>
                <p className="font-semibold">{event.title}</p>
                <p className={`text-sm ${mutedClass}`}>{event.guests} guests</p>
              </div>
              <p className="text-lg font-bold text-green-500">${event.revenue}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Monthly Earnings */}
      <motion.div
        variants={itemVariants}
        className={`p-6 rounded-lg ${surfaceClass}`}
      >
        <h3 className="text-xl font-bold mb-4">Monthly Earnings</h3>
        <div className="space-y-4">
          {monthlyEarnings.map((item, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-12 text-right font-semibold">{item.month}</div>
              <div className="flex-1 h-8 bg-gray-800 rounded-lg overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.earnings / 1200) * 100}%` }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="h-full bg-gradient-to-r from-red-500 to-purple-600"
                />
              </div>
              <div className="w-16 text-right text-green-500 font-semibold">${item.earnings}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Last Payout */}
      <motion.div
        variants={itemVariants}
        className={`p-6 rounded-lg ${surfaceClass}`}
      >
        <p className={mutedClass}>Last Payout</p>
        <p className="text-xl font-semibold mt-2">
          {stats.lastPayout.toLocaleDateString()}
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="mt-4 w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
        >
          View Payment History
        </motion.button>
      </motion.div>
    </div>
  );
};

export default StatsTab;
