import React, { useState } from 'react';
import { reportUser, blockUser } from '../services/api';

interface ReportBlockModalProps {
  userId: string;
  targetUserId: string;
  targetUserName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ReportBlockModal: React.FC<ReportBlockModalProps> = ({
  userId,
  targetUserId,
  targetUserName,
  onClose,
  onSuccess
}) => {
  const [action, setAction] = useState<'report' | 'block' | null>(null);
  const [reportType, setReportType] = useState('inappropriate');
  const [description, setDescription] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitReport = async () => {
    if (!description.trim()) {
      alert('Please provide a description');
      return;
    }

    setLoading(true);
    try {
      await reportUser(userId, targetUserId, reportType, description);
      alert('Report submitted. Our team will review it soon.');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to submit report:', error);
      alert('Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitBlock = async () => {
    setLoading(true);
    try {
      await blockUser(userId, targetUserId, reason);
      alert(`${targetUserName} has been blocked.`);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to block user:', error);
      alert('Failed to block user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1A1A1E] rounded-lg p-6 max-w-sm w-full border border-white/10 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Safety Actions</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        {action === null ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-400">What would you like to do?</p>
            <button
              onClick={() => setAction('report')}
              className="w-full bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-600/30 rounded px-4 py-3 text-left transition"
            >
              <div className="font-semibold text-yellow-300">🚩 Report User</div>
              <div className="text-xs text-gray-400">Alert our safety team</div>
            </button>
            <button
              onClick={() => setAction('block')}
              className="w-full bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 rounded px-4 py-3 text-left transition"
            >
              <div className="font-semibold text-red-300">🚫 Block User</div>
              <div className="text-xs text-gray-400">Stop seeing them in Junto</div>
            </button>
          </div>
        ) : action === 'report' ? (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-gray-300">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white mt-2"
              >
                <option value="inappropriate">Inappropriate behavior</option>
                <option value="fraud">Fraud/Scam</option>
                <option value="harassment">Harassment</option>
                <option value="hate_speech">Hate speech</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-300">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us what happened..."
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-500 mt-2"
                rows={4}
              />
            </div>

            <p className="text-xs text-gray-500">Your report is anonymous and confidential.</p>

            <div className="flex gap-2">
              <button
                onClick={() => setAction(null)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 rounded px-3 py-2 text-sm font-semibold text-white transition"
              >
                Back
              </button>
              <button
                onClick={handleSubmitReport}
                disabled={loading}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 rounded px-3 py-2 text-sm font-semibold text-white transition"
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-300">
              Blocking {targetUserName} means you won't see them in recommendations or search results.
            </p>

            <div>
              <label className="text-sm font-semibold text-gray-300">Reason (Optional)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why are you blocking this user?"
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-500 mt-2"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setAction(null)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 rounded px-3 py-2 text-sm font-semibold text-white transition"
              >
                Back
              </button>
              <button
                onClick={handleSubmitBlock}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded px-3 py-2 text-sm font-semibold text-white transition"
              >
                {loading ? 'Blocking...' : 'Block User'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
