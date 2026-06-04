import React, { useEffect, useMemo, useState } from 'react';
import * as API from '../services/api';

type EventRatingSummary = {
  average_rating: number;
  rating_count: number;
};

interface EventReviewPanelProps {
  eventId: string;
  userId?: string | null;
  canReview: boolean;
  onSubmitted?: () => void;
}

export function EventReviewPanel({
  eventId,
  userId,
  canReview,
  onSubmitted,
}: EventReviewPanelProps) {
  const [reviews, setReviews] = useState<API.EventReview[]>([]);
  const [summary, setSummary] = useState<EventRatingSummary>({ average_rating: 0, rating_count: 0 });
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const averageLabel = useMemo(() => {
    if (!summary.rating_count) {
      return '0.0';
    }

    return Number(summary.average_rating || 0).toFixed(1);
  }, [summary.average_rating, summary.rating_count]);

  useEffect(() => {
    let cancelled = false;

    const loadReviews = async () => {
      setLoading(true);
      try {
        const [reviewResponse, ratingResponse] = await Promise.all([
          API.getEventReviews(eventId),
          API.getEventRating(eventId),
        ]);

        if (cancelled) return;

        setReviews(Array.isArray(reviewResponse?.reviews) ? reviewResponse.reviews : []);
        setSummary({
          average_rating: Number(ratingResponse?.average_rating || 0),
          rating_count: Number(ratingResponse?.rating_count || 0),
        });
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load event reviews:', error);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadReviews();

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const handleSubmit = async () => {
    if (!userId || !canReview) {
      return;
    }

    if (rating < 1 || rating > 5) {
      setMessage('Please choose a rating from 1 to 5 stars.');
      return;
    }

    setSaving(true);
    setMessage('');
    try {
      await API.rateEvent(userId, eventId, rating, comment.trim() || undefined);
      const [reviewResponse, ratingResponse] = await Promise.all([
        API.getEventReviews(eventId),
        API.getEventRating(eventId),
      ]);

      setReviews(Array.isArray(reviewResponse?.reviews) ? reviewResponse.reviews : []);
      setSummary({
        average_rating: Number(ratingResponse?.average_rating || 0),
        rating_count: Number(ratingResponse?.rating_count || 0),
      });
      setRating(0);
      setComment('');
      setMessage('Your review was saved.');
      onSubmitted?.();
    } catch (error: any) {
      setMessage(error?.message || 'Failed to save your review.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-white/5 bg-white/5 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Event Reviews</h3>
          <p className="text-xs text-gray-400">
            {summary.rating_count > 0 ? `Based on ${summary.rating_count} review${summary.rating_count === 1 ? '' : 's'}` : 'No reviews yet'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-[#FBBF24]">{averageLabel}</p>
          <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500">out of 5</p>
        </div>
      </div>

      {canReview ? (
        <div className="space-y-3 rounded-2xl border border-[#F59E0B]/20 bg-[#F59E0B]/10 p-4">
          <div>
            <p className="text-sm font-semibold text-white">Add your review</p>
            <p className="text-xs text-gray-300">Share what the event was like now that it has ended.</p>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[#FBBF24]">
              Rating
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-2xl transition ${star <= rating ? 'text-[#FBBF24]' : 'text-white/30 hover:text-white/60'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell people what the event was really like..."
            className="min-h-28 w-full rounded-2xl border border-white/10 bg-[#0F0F13] px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition focus:border-[#F59E0B]/50"
          />

          {message && <p className="text-sm text-amber-200">{message}</p>}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || loading || rating === 0}
            className="rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#FB923C] px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving review...' : 'Submit review'}
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
          Reviews open after the event ends, and only attendees can leave one.
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-gray-400">Loading reviews...</p>
        ) : reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.id} className="rounded-2xl border border-white/5 bg-[#101014] p-4">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{review.author}</p>
                  <p className="text-xs text-gray-500">{review.time}</p>
                </div>
                <span className="text-sm text-[#FBBF24]">{'⭐'.repeat(review.rating)}</span>
              </div>
              {review.text ? <p className="text-sm leading-relaxed text-gray-300">{review.text}</p> : null}
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-white/5 bg-[#101014] p-4 text-sm text-gray-400">
            No event reviews yet.
          </div>
        )}
      </div>
    </div>
  );
}

export default EventReviewPanel;
