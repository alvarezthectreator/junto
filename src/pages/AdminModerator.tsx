import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Flag,
  Users,
  BarChart3,
  Shield,
  TrendingUp,
  ChevronRight,
  Eye,
  CheckCircle2,
  Clock,
  Zap,
} from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import {
  getUserId,
} from '../services/api';

interface HighRiskUser {
  user_id: string;
  display_name: string;
  profile_id: string;
  risk_score: number;
  risk_level: string;
  behavior_score: number;
  identity_score: number;
  flags_count: number;
  last_updated: string;
}

interface AccountFlag {
  id: string;
  flag_type: string;
  severity: string;
  description: string;
  action_taken: string;
  reviewed: boolean;
  created_at: string;
}

interface AdminModeratorProps {
  onNavigate?: (page: string) => void;
  setActiveNav?: (nav: string) => void;
  onCloseSidebar?: () => void;
}

export function AdminModerator({
  onNavigate = () => {},
  setActiveNav = () => {},
  onCloseSidebar = () => {},
}: AdminModeratorProps) {
  const userId = getUserId();
  const [activeTab, setActiveTab] = useState<'overview' | 'high-risk' | 'flags' | 'activities' | 'logs'>('overview');
  const [highRiskUsers, setHighRiskUsers] = useState<HighRiskUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_flagged: 0,
    high_risk_count: 0,
    pending_reviews: 0,
    resolved_this_week: 0,
  });

  useEffect(() => {
    setActiveNav('Admin');
  }, [setActiveNav]);

  useEffect(() => {
    fetchHighRiskUsers();
    loadStats();
  }, []);

  const fetchHighRiskUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/fraud?threshold=60&limit=20`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('junto-session-token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHighRiskUsers(data.high_risk_users || []);
      }
    } catch (error) {
      console.error('Error fetching high-risk users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = () => {
    // Mock stats - in production would fetch from backend
    setStats({
      total_flagged: 12,
      high_risk_count: 5,
      pending_reviews: 8,
      resolved_this_week: 3,
    });
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      default:
        return 'bg-green-500/20 text-green-400 border-green-500/50';
    }
  };

  const getRiskLevelBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return <AlertTriangle className="w-4 h-4" />;
      case 'HIGH':
        return <TrendingUp className="w-4 h-4" />;
      case 'MEDIUM':
        return <Clock className="w-4 h-4" />;
      default:
        return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white pb-24">
      <div className="pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-8 h-8 text-red-400" />
              <h1 className="text-4xl font-bold">Admin Moderation</h1>
            </div>
            <p className="text-gray-400">Fraud detection and account management</p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          >
            {[
              { label: 'High Risk Users', value: stats.high_risk_count, icon: AlertTriangle, color: 'from-red-500 to-red-600' },
              { label: 'Total Flagged', value: stats.total_flagged, icon: Flag, color: 'from-orange-500 to-orange-600' },
              { label: 'Pending Review', value: stats.pending_reviews, icon: Clock, color: 'from-yellow-500 to-yellow-600' },
              { label: 'Resolved (7d)', value: stats.resolved_this_week, icon: CheckCircle2, color: 'from-green-500 to-green-600' },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={i}
                  whileHover={{ y: -4 }}
                  className={`bg-gradient-to-br ${stat.color} bg-opacity-10 border border-gray-700 rounded-lg p-6`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                      <p className="text-3xl font-bold">{stat.value}</p>
                    </div>
                    <Icon className="w-8 h-8 opacity-50" />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-900/50 border border-gray-700 rounded-lg p-6 mb-6"
          >
            <div className="flex gap-2 border-b border-gray-700 mb-6">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'high-risk', label: 'High Risk Users', icon: AlertTriangle },
                { id: 'flags', label: 'Account Flags', icon: Flag },
                { id: 'activities', label: 'Suspicious Activities', icon: Zap },
                { id: 'logs', label: 'Audit Logs', icon: Eye },
              ].map((tab: any) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div>
              {activeTab === 'overview' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <h3 className="text-lg font-semibold mb-4">Fraud Detection Dashboard</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-gray-700">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-400" />
                        Risk Assessment
                      </h4>
                      <p className="text-sm text-gray-400 mb-2">
                        The system automatically calculates risk scores based on user behavior:
                      </p>
                      <ul className="text-sm space-y-1 text-gray-400">
                        <li>• Rapid event creation or cancellations</li>
                        <li>• Multiple no-shows or negative ratings</li>
                        <li>• Report count and blocked user count</li>
                        <li>• Profile verification status</li>
                      </ul>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-gray-700">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-400" />
                        Risk Levels
                      </h4>
                      <div className="text-sm space-y-2 text-gray-400">
                        <div>🔴 <span className="font-semibold">CRITICAL</span>: Risk score ≥ 90</div>
                        <div>🟠 <span className="font-semibold">HIGH</span>: Risk score 80-89</div>
                        <div>🟡 <span className="font-semibold">MEDIUM</span>: Risk score 60-79</div>
                        <div>🟢 <span className="font-semibold">LOW</span>: Risk score &lt; 60</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'high-risk' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {loading ? (
                    <div className="text-center py-8 text-gray-400">Loading high-risk users...</div>
                  ) : highRiskUsers.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">No high-risk users detected</div>
                  ) : (
                    <div className="space-y-3">
                      {highRiskUsers.map(user => (
                        <motion.div
                          key={user.user_id}
                          whileHover={{ x: 4 }}
                          className="bg-slate-800/50 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-all cursor-pointer flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <h4 className="font-semibold flex items-center gap-2">
                              {user.display_name}
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold border inline-flex items-center gap-1 ${getRiskLevelColor(user.risk_level)}`}>
                                {getRiskLevelBadge(user.risk_level)}
                                {user.risk_level}
                              </span>
                            </h4>
                            <p className="text-sm text-gray-400 mt-1">
                              Risk Score: {user.risk_score} | Behavior: {user.behavior_score} | Identity: {user.identity_score} | Flags: {user.flags_count}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-600" />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'flags' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="text-center py-8 text-gray-400">
                    <Flag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    Account flags management coming soon
                  </div>
                </motion.div>
              )}

              {activeTab === 'activities' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="text-center py-8 text-gray-400">
                    <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    Suspicious activities monitoring coming soon
                  </div>
                </motion.div>
              )}

              {activeTab === 'logs' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="text-center py-8 text-gray-400">
                    <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    Audit logs coming soon
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
      <Sidebar onNavigate={onNavigate} activeNav="Admin" onCloseSidebar={onCloseSidebar} />
    </div>
  );
}
