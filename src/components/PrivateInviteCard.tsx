import React, { useState } from 'react';
import { acceptPrivateInvite, declinePrivateInvite } from '../services/api';

interface PrivateInviteCardProps {
  invite: any;
  onResponded?: () => void;
}

export const PrivateInviteCard: React.FC<PrivateInviteCardProps> = ({ invite, onResponded }) => {
  const [loading, setLoading] = useState(false);
  const [responded, setResponded] = useState(false);
  const [response, setResponse] = useState<'accepted' | 'declined' | null>(null);

  const handleAccept = async () => {
    setLoading(true);
    try {
      await acceptPrivateInvite(invite.id, invite.user_id);
      setResponse('accepted');
      setResponded(true);
      onResponded?.();
    } catch (error) {
      console.error('Failed to accept invite:', error);
      alert('Failed to accept invite');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    setLoading(true);
    try {
      await declinePrivateInvite(invite.id, invite.user_id);
      setResponse('declined');
      setResponded(true);
      onResponded?.();
    } catch (error) {
      console.error('Failed to decline invite:', error);
      alert('Failed to decline invite');
    } finally {
      setLoading(false);
    }
  };

  if (responded) {
    return (
      <div
        className={`rounded-lg p-4 border ${
          response === 'accepted'
            ? 'bg-green-900/20 border-green-500/30'
            : 'bg-red-900/20 border-red-500/30'
        }`}
      >
        <div className="text-center">
          <div className="text-2xl mb-2">{response === 'accepted' ? '✅' : '❌'}</div>
          <p className="text-sm text-gray-300">
            You {response === 'accepted' ? 'accepted' : 'declined'} {invite.host_name}'s invite
          </p>
          <p className="text-xs text-gray-500 mt-1">{invite.event_title}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 rounded-lg p-4 border border-white/10 space-y-3">
      <div>
        <p className="text-sm text-gray-400">Invited by</p>
        <p className="font-semibold text-white">{invite.host_name}</p>
      </div>

      <div>
        <p className="text-sm text-gray-400">Event</p>
        <p className="font-semibold text-white">{invite.event_title}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-xs text-gray-500">Date</p>
          <p className="text-sm text-white">{new Date(invite.event_date).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Time</p>
          <p className="text-sm text-white">{invite.event_time}</p>
        </div>
      </div>

      {invite.personal_note && (
        <div>
          <p className="text-xs text-gray-500">Message from {invite.host_name}</p>
          <p className="text-sm text-gray-300 italic">"{invite.personal_note}"</p>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button
          onClick={handleAccept}
          disabled={loading}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded px-3 py-2 text-sm font-semibold text-white transition"
        >
          ✅ Accept
        </button>
        <button
          onClick={handleDecline}
          disabled={loading}
          className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded px-3 py-2 text-sm font-semibold text-white transition"
        >
          ❌ Decline
        </button>
      </div>
    </div>
  );
};
