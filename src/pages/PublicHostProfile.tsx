import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Flag, UserX, Check, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import * as API from '../services/api';
import { Sidebar } from '../components/Sidebar';

interface HostData {
  id: string;
  name: string;
  avatar: string;
  reliabilityScore: number;
  isVerified: boolean;
  averageRating?: number;
  eventsHosted?: number;
}

interface PublicHostProfileProps {
  hostId: string;
  onNavigate?: (page: string) => void;
  setActiveNav?: (nav: string) => void;
}

export function PublicHostProfile({ hostId, onNavigate, setActiveNav }: PublicHostProfileProps) {
  const { currentUser } = useAppContext();
  const [host, setHost] = useState<HostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState('inappropriate_behavior');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    const loadHostData = async () => {
      try {
        setLoading(true);
        if (!hostId) {
          onNavigate?.('main');
          return;
        }

        const userData = await API.getUserProfile(hostId);
        setHost({
          id: hostId,
          name: userData.full_name || userData.display_name || 'Unknown',
          avatar: userData.avatar || '👤',
          reliabilityScore: userData.reliabilityScore || 85,
          isVerified: userData.is_verified || false,
          averageRating: userData.averageRating || 4.5,
          eventsHosted: userData.eventsHosted || 0,
        });
      } catch (error) {
        console.error('Failed to load host profile:', error);
        showToast('Failed to load profile', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadHostData();
  }, [hostId, onNavigate]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleBlock = async () => {
    if (!currentUser?.id || !hostId) return;

    try {
      setIsSubmitting(true);
      await API.blockUser(currentUser.id, hostId);
      setIsBlocked(true);
      showToast('User blocked successfully', 'success');
      setTimeout(() => onNavigate?.('main'), 2000);
    } catch (error) {
      console.error('Failed to block user:', error);
      showToast('Failed to block user', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id || !hostId) return;

    if (!reportDescription.trim()) {
      showToast('Please provide details for your report', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await API.reportUser(currentUser.id, hostId, reportType, reportDescription);
      showToast('Report submitted successfully', 'success');
      setShowReportModal(false);
      setReportDescription('');
    } catch (error) {
      console.error('Failed to submit report:', error);
      showToast('Failed to submit report', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0D]">
        <Sidebar />
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 size={32} className="animate-spin text-[#F59E0B]" />
        </div>
      </div>
    );
  }

  if (!host) {
    return (
      <div className="min-h-screen bg-[#0A0A0D]">
        <Sidebar />
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <p className="text-gray-400">Host profile not found</p>
          <button
            onClick={() => onNavigate?.('main')}
            className="text-[#F59E0B] hover:text-[#FBBF24] transition-colors"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0D]">
      <Sidebar />
      <div className="max-w-2xl mx-auto p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => onNavigate?.('main')}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">Host Profile</h1>
        </div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-8 mb-6"
        >
          {/* Avatar */}
          <div className="flex justify-center mb-6">
            <div className="text-6xl">{host.avatar}</div>
          </div>

          {/* Host Info */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">{host.name}</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {/* Verified Badge */}
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  host.isVerified
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                    : 'border-white/10 bg-white/5 text-gray-400'
                }`}
              >
                {host.isVerified ? '✓ Verified' : 'Unverified'}
              </span>

              {/* Reliability Score */}
              <span className="inline-flex items-center gap-1 rounded-full border border-[#F59E0B]/20 bg-[#F59E0B]/10 px-3 py-1.5 text-xs font-semibold text-[#FBBF24]">
                🟢 {host.reliabilityScore}% Reliable
              </span>

              {/* Rating */}
              {host.averageRating && (
                <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-400">
                  ⭐ {host.averageRating.toFixed(1)} Rating
                </span>
              )}
            </div>

            {/* Events Hosted */}
            {host.eventsHosted !== undefined && (
              <p className="text-sm text-gray-400 mt-3">
                {host.eventsHosted} events hosted
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {isBlocked ? (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-center text-sm text-red-400">
                ✓ This user is blocked
              </div>
            ) : (
              <>
                <button
                  onClick={() => setShowReportModal(true)}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-xl transition-colors font-medium"
                >
                  <Flag size={18} />
                  Report User
                </button>
                <button
                  onClick={handleBlock}
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors font-medium disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Blocking...
                    </>
                  ) : (
                    <>
                      <UserX size={18} />
                      Block User
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </motion.div>

        {/* Report Modal */}
        {showReportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowReportModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-2xl bg-[#111115] border border-white/10 p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-bold mb-4">Report {host.name}</h3>

              <form onSubmit={handleReport} className="space-y-4">
                {/* Report Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Report Type
                  </label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50"
                  >
                    <option value="inappropriate_behavior">Inappropriate Behavior</option>
                    <option value="harassment">Harassment</option>
                    <option value="spam">Spam</option>
                    <option value="scam">Scam/Fraud</option>
                    <option value="safety_concern">Safety Concern</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Details
                  </label>
                  <textarea
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Please describe what happened..."
                    rows={4}
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50 resize-none"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Flag size={16} />
                        Submit Report
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Toast */}
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-4 right-4 rounded-lg px-4 py-3 flex items-center gap-2 ${
              toast.type === 'success'
                ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/20 border border-red-500/30 text-red-300'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
