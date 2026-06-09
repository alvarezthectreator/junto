import React, { useState } from 'react';
import { blockUser, reportUser, uploadMedia } from '../services/api';
import {
  appendSafetyReportCase,
  upsertBlockedUserRecord,
  type SafetyEvidenceAttachment,
} from '../utils/localActivity';

const safetyActionsKey = 'junto-safety-actions';

function readStoredSafetyActions() {
  try {
    const raw = localStorage.getItem(safetyActionsKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredSafetyActions(actions: any[]) {
  localStorage.setItem(safetyActionsKey, JSON.stringify(actions));
  window.dispatchEvent(new CustomEvent('junto-safety-updated'));
}

function appendSafetyAction(action: any) {
  const nextActions = [action, ...readStoredSafetyActions()].slice(0, 20);
  writeStoredSafetyActions(nextActions);
}

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
  const [evidenceFiles, setEvidenceFiles] = useState<SafetyEvidenceAttachment[]>([]);
  const [loading, setLoading] = useState(false);

  const handleEvidenceChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const nextEvidence: SafetyEvidenceAttachment[] = [];

    for (const file of files.slice(0, 3)) {
      if (file.size > 4 * 1024 * 1024) {
        alert(`${file.name} is too large. Please keep evidence files under 4MB.`);
        continue;
      }

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Failed to read evidence file'));
        reader.readAsDataURL(file);
      });

      const attachment: SafetyEvidenceAttachment = {
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl,
        previewUrl: file.type.startsWith('image/') ? dataUrl : undefined,
      };

      try {
        const uploaded = await uploadMedia(dataUrl, {
          fileName: file.name,
          mimeType: file.type,
          folder: 'reports',
        });
        attachment.remoteUrl = uploaded.url;
      } catch (uploadError) {
        console.error('Failed to upload report evidence:', uploadError);
      }

      nextEvidence.push(attachment);
    }

    setEvidenceFiles((current) => [...current, ...nextEvidence].slice(0, 3));
    event.target.value = '';
  };

  const removeEvidence = (index: number) => {
    setEvidenceFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSubmitReport = async () => {
    if (!description.trim()) {
      alert('Please provide a description');
      return;
    }

    setLoading(true);
    try {
      const evidenceUrls = evidenceFiles
        .map((file) => file.remoteUrl || file.dataUrl)
        .filter(Boolean) as string[];

      await reportUser(userId, targetUserId, reportType, description, evidenceUrls);
      appendSafetyReportCase({
        id: `report-${Date.now()}`,
        reporterUserId: userId,
        targetUserId,
        targetUserName,
        reportType,
        description,
        evidence: evidenceFiles,
        status: 'submitted',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      appendSafetyAction({
        id: `report-${Date.now()}`,
        action: 'report',
        targetUserId,
        targetUserName,
        reportType,
        description,
        evidence: evidenceFiles,
        status: 'submitted',
        createdAt: new Date().toISOString(),
      });
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
      upsertBlockedUserRecord({
        id: targetUserId,
        name: targetUserName,
        reason: reason.trim(),
        blockedAt: new Date().toISOString(),
      });
      appendSafetyAction({
        id: `block-${Date.now()}`,
        action: 'block',
        targetUserId,
        targetUserName,
        reason: reason.trim(),
        status: 'saved',
        createdAt: new Date().toISOString(),
      });
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
                placeholder="Tell us what happened and why this needs review..."
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-500 mt-2"
                rows={4}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-300">Evidence upload</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                multiple
                onChange={handleEvidenceChange}
                className="mt-2 block w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300 file:mr-4 file:rounded-full file:border-0 file:bg-yellow-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black"
              />
              <p className="mt-2 text-xs text-gray-500">Screenshots or PDF evidence help the review queue move faster.</p>
            </div>

            {evidenceFiles.length > 0 && (
              <div className="space-y-2 rounded border border-white/10 bg-white/5 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Attached evidence</p>
                {evidenceFiles.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-3 rounded bg-black/20 px-3 py-2 text-xs text-gray-300">
                    <div>
                      <p className="font-semibold text-white">{file.name}</p>
                      <p>{Math.round(file.size / 1024)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEvidence(index)}
                      className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-300 transition hover:bg-white/10"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

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
