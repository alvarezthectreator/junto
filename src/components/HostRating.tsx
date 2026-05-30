import React, { useState, useEffect } from 'react';
import { rateHost, getHostRatings, deleteHostRating } from '../services/api';

interface HostRatingProps {
  hostId: string;
  eventId: string;
  userId: string;
  onRatingSubmitted?: () => void;
}

export const HostRatingComponent: React.FC<HostRatingProps> = ({ hostId, eventId, userId, onRatingSubmitted }) => {
  const [ratings, setRatings] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [myRating, setMyRating] = useState<number>(0);
  const [myReview, setMyReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadRatings();
  }, [hostId]);

  const loadRatings = async () => {
    try {
      const response = await getHostRatings(hostId);
      setRatings(response.ratings);
      setSummary(response.summary);
    } catch (error) {
      console.error('Failed to load ratings:', error);
    }
  };

  const handleSubmitRating = async () => {
    if (myRating === 0) {
      alert('Please select a rating');
      return;
    }

    setLoading(true);
    try {
      await rateHost(userId, hostId, eventId, myRating, myReview);
      setMyRating(0);
      setMyReview('');
      setShowForm(false);
      loadRatings();
      onRatingSubmitted?.();
    } catch (error) {
      console.error('Failed to submit rating:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Rating Summary */}
      {summary && (
        <div className="bg-white/10 rounded-lg p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl font-bold text-white">{summary.average_rating.toFixed(1)}</span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={star <= Math.round(summary.average_rating) ? 'text-yellow-400' : 'text-gray-600'}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-sm text-gray-400">({summary.total_ratings} reviews)</span>
          </div>
        </div>
      )}

      {/* Rating Form */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 rounded px-4 py-2 text-sm font-semibold text-white transition"
        >
          ⭐ Rate This Host
        </button>
      ) : (
        <div className="bg-white/10 rounded-lg p-4 border border-white/10 space-y-3">
          <div>
            <label className="text-sm font-semibold text-gray-300">Rating</label>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setMyRating(star)}
                  className={`text-2xl transition ${
                    star <= myRating ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-300'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-300">Your Review (Optional)</label>
            <textarea
              value={myReview}
              onChange={(e) => setMyReview(e.target.value)}
              placeholder="Share your experience..."
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-500 mt-2"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSubmitRating}
              disabled={loading || myRating === 0}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded px-3 py-2 text-sm font-semibold text-white transition"
            >
              {loading ? 'Submitting...' : 'Submit Rating'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 bg-gray-600 hover:bg-gray-700 rounded px-3 py-2 text-sm font-semibold text-white transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {ratings.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {ratings.map((rating) => (
            <div key={rating.id} className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{rating.reviewer_name || 'Anonymous'}</span>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <span key={i}>{i < rating.rating ? '★' : '☆'}</span>
                    ))}
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(rating.created_at).toLocaleDateString()}
                </span>
              </div>
              {rating.review && <p className="text-sm text-gray-300">{rating.review}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
