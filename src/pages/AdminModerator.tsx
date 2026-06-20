import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Flag,
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
  getDeploymentOpsReport,
  getHighRiskUsers,
  getFraudEnforcementSummary,
  runFraudEnforcement,
  type DeploymentOpsReport,
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
  const [activeTab, setActiveTab] = useState<'overview' | 'high-risk' | 'flags' | 'activities' | 'logs' | 'ops'>('overview');
  const [highRiskUsers, setHighRiskUsers] = useState<HighRiskUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [enforcementSummary, setEnforcementSummary] = useState({
    no_shows_last_30_days: 0,
    report_clusters_last_7_days: 0,
    verification_reviews_last_14_days: 0,
    reliability_penalties_last_30_days: 0,
    account_flags_last_30_days: 0,
    high_risk_users: 0,
  });
  const [enforcementRunning, setEnforcementRunning] = useState(false);
  const [deploymentReport, setDeploymentReport] = useState<DeploymentOpsReport | null>(null);
  const [deploymentLoading, setDeploymentLoading] = useState(true);
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
    fetchEnforcementSummary();
    fetchDeploymentOpsReport();
  }, []);

  const fetchHighRiskUsers = async () => {
    try {
      setLoading(true);
      const data = await getHighRiskUsers(60, 20);
      setHighRiskUsers(data.high_risk_users || []);
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

  const fetchEnforcementSummary = async () => {
    try {
      const data = await getFraudEnforcementSummary();
      if (data?.summary) {
        setEnforcementSummary(data.summary);
      }
    } catch (error) {
      console.error('Error fetching enforcement summary:', error);
    }
  };

  const fetchDeploymentOpsReport = async () => {
    try {
      setDeploymentLoading(true);
      const report = await getDeploymentOpsReport();
      setDeploymentReport(report);
    } catch (error) {
      console.error('Error fetching deployment ops report:', error);
    } finally {
      setDeploymentLoading(false);
    }
  };

  const handleRunEnforcement = async () => {
    try {
      setEnforcementRunning(true);
      await runFraudEnforcement();
      await Promise.all([fetchHighRiskUsers(), fetchEnforcementSummary()]);
    } catch (error) {
      console.error('Error running fraud enforcement:', error);
    } finally {
      setEnforcementRunning(false);
    }
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
                { id: 'ops', label: 'Deployment & Secrets', icon: Shield },
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
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleRunEnforcement}
                      disabled={enforcementRunning}
                      className="inline-flex items-center gap-2 rounded-lg bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-300 border border-red-500/30 hover:bg-red-500/20 disabled:opacity-50"
                    >
                      <Shield className="w-4 h-4" />
                      {enforcementRunning ? 'Running sweep...' : 'Run enforcement sweep'}
                    </button>
                    <button
                      onClick={fetchEnforcementSummary}
                      className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm font-semibold text-gray-200 border border-gray-700 hover:bg-white/10"
                    >
                      <Eye className="w-4 h-4" />
                      Refresh summary
                    </button>
                  </div>
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
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-gray-700">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-emerald-400" />
                        Enforcement Summary
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-lg bg-white/5 p-3">
                          <p className="text-gray-400 text-xs uppercase tracking-[0.18em]">No-shows</p>
                          <p className="mt-1 text-lg font-semibold">{enforcementSummary.no_shows_last_30_days}</p>
                        </div>
                        <div className="rounded-lg bg-white/5 p-3">
                          <p className="text-gray-400 text-xs uppercase tracking-[0.18em]">Report clusters</p>
                          <p className="mt-1 text-lg font-semibold">{enforcementSummary.report_clusters_last_7_days}</p>
                        </div>
                        <div className="rounded-lg bg-white/5 p-3">
                          <p className="text-gray-400 text-xs uppercase tracking-[0.18em]">Verification</p>
                          <p className="mt-1 text-lg font-semibold">{enforcementSummary.verification_reviews_last_14_days}</p>
                        </div>
                        <div className="rounded-lg bg-white/5 p-3">
                          <p className="text-gray-400 text-xs uppercase tracking-[0.18em]">High risk</p>
                          <p className="mt-1 text-lg font-semibold">{enforcementSummary.high_risk_users}</p>
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-gray-500">
                        Automated sweeps also track {enforcementSummary.reliability_penalties_last_30_days} reliability penalties and {enforcementSummary.account_flags_last_30_days} account flags in the last 30 days.
                      </p>
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

              {activeTab === 'ops' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">Deployment readiness and secret coverage</h3>
                      <p className="mt-1 text-sm text-gray-400">
                        This report is fetched by the admin dashboard and shows deployment, monitoring, and secret-management coverage without exposing raw secret values.
                      </p>
                    </div>
                    <button
                      onClick={fetchDeploymentOpsReport}
                      className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm font-semibold text-gray-200 border border-gray-700 hover:bg-white/10"
                    >
                      <Eye className="w-4 h-4" />
                      Refresh ops report
                    </button>
                  </div>

                  {deploymentLoading ? (
                    <div className="text-center py-8 text-gray-400">Loading deployment ops report...</div>
                  ) : deploymentReport ? (
                    <>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        {[
                          { label: 'Ready', value: deploymentReport.summary.ok, color: 'from-emerald-500 to-emerald-600' },
                          { label: 'Warnings', value: deploymentReport.summary.warning, color: 'from-amber-500 to-amber-600' },
                          { label: 'Missing', value: deploymentReport.summary.missing, color: 'from-rose-500 to-rose-600' },
                          { label: 'Pending', value: deploymentReport.summary.pending, color: 'from-sky-500 to-sky-600' },
                        ].map((item) => (
                          <div key={item.label} className={`rounded-lg border border-gray-700 bg-gradient-to-br ${item.color} bg-opacity-10 p-4`}>
                            <p className="text-gray-400 text-xs uppercase tracking-[0.18em]">{item.label}</p>
                            <p className="mt-1 text-3xl font-bold">{item.value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="grid gap-4 lg:grid-cols-2">
                        <div className="rounded-lg border border-gray-700 bg-slate-800/50 p-4">
                          <h4 className="mb-3 flex items-center gap-2 font-semibold">
                            <Shield className="w-4 h-4 text-blue-400" />
                            Secret and config checks
                          </h4>
                          <div className="space-y-3">
                            {deploymentReport.checks.map((check) => (
                              <div key={check.key} className="rounded-lg border border-white/5 bg-white/5 p-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-medium text-white">{check.label}</p>
                                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500">{check.category}</p>
                                  </div>
                                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                                    check.status === 'ok'
                                      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                                      : check.status === 'warning'
                                      ? 'border-amber-500/20 bg-amber-500/10 text-amber-300'
                                      : check.status === 'pending'
                                      ? 'border-sky-500/20 bg-sky-500/10 text-sky-300'
                                      : 'border-rose-500/20 bg-rose-500/10 text-rose-300'
                                  }`}>
                                    {check.status}
                                  </span>
                                </div>
                                <p className="mt-2 text-sm text-gray-300">{check.value}</p>
                                {check.note && <p className="mt-1 text-xs leading-5 text-gray-500">{check.note}</p>}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="rounded-lg border border-gray-700 bg-slate-800/50 p-4">
                            <h4 className="mb-3 flex items-center gap-2 font-semibold">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              Rollout posture
                            </h4>
                            <div className="space-y-2 text-sm text-gray-300">
                              <p>Source: {deploymentReport.source}</p>
                              <p>Environment: {deploymentReport.environment}</p>
                              <p>Release: {deploymentReport.release.version}</p>
                              <p>Build SHA: {deploymentReport.release.buildSha}</p>
                              <p>Channel: {deploymentReport.release.channel}</p>
                              <p>Rollback target: {deploymentReport.release.rollbackTarget}</p>
                              <p>Overall: {deploymentReport.summary.overall}</p>
                              <p>Generated: {new Date(deploymentReport.generated_at).toLocaleString()}</p>
                            </div>
                          </div>

                          <div className="rounded-lg border border-gray-700 bg-slate-800/50 p-4">
                            <h4 className="mb-3 flex items-center gap-2 font-semibold">
                              <Zap className="w-4 h-4 text-violet-400" />
                              Recommendations
                            </h4>
                            <ul className="space-y-2 text-sm text-gray-300">
                              {deploymentReport.recommendations.map((recommendation) => (
                                <li key={recommendation} className="flex gap-2">
                                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                                  <span>{recommendation}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="rounded-lg border border-gray-700 bg-slate-800/50 p-4">
                            <h4 className="mb-3 flex items-center gap-2 font-semibold">
                              <Clock className="w-4 h-4 text-sky-400" />
                              OS badge support
                            </h4>
                            <p className="text-sm text-gray-300">{deploymentReport.badge_support.note}</p>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-400">No deployment report available.</div>
                  )}
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
