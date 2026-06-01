import { type EventAttendee, type EventDetailData, type EventReview } from '../pages/EventDetail';

export interface DiscoverEventSeed {
  id: string;
  userInitial: string;
  userName: string;
  actionText: string;
  emoji: string;
  description: string;
  date: string;
  audience: string;
  interestedCount: number;
  isVerified: boolean;
  reliabilityScore: number;
  averageRating: number;
  reviewCount: number;
  accentColor: string;
  audienceColor: string;
  coverImage: string;
  coords: [number, number];
  attendees?: EventAttendee[];
  reviews?: EventReview[];
  calendar?: {
    start: string;
    end: string;
    timezone?: string;
  };
}

const sharedAttendees: EventAttendee[] = [
  { id: 'guest-1', name: 'Ada M.', avatar: '👩‍🦰', paymentStatus: 'host_covers', joinedAt: new Date(Date.now() - 2 * 24 * 60 * 60000), status: 'confirmed', isHostCover: true },
  { id: 'guest-2', name: 'Oge K.', avatar: '👨‍🦱', paymentStatus: 'paid', joinedAt: new Date(Date.now() - 1.5 * 24 * 60 * 60000), status: 'confirmed' },
  { id: 'guest-3', name: 'Zara P.', avatar: '👩', paymentStatus: 'pending', joinedAt: new Date(Date.now() - 1 * 24 * 60 * 60000), status: 'maybe' },
];

const sharedReviews: EventReview[] = [
  { author: 'Sarah M.', rating: 5, text: 'Smooth planning and great vibes.', time: '2 days ago' },
  { author: 'John D.', rating: 5, text: 'Loved the energy, would join again.', time: '1 week ago' },
];

export const discoverEvents: DiscoverEventSeed[] = [];

export function getDiscoverEventById(id: string | number | undefined | null) {
  if (id === undefined || id === null) {
    return undefined;
  }

  const normalizedId = String(id);
  return discoverEvents.find((event) => event.id === normalizedId);
}

export function toEventDetail(event: DiscoverEventSeed, index: number): EventDetailData {
  return {
    id: event.id || String(index + 1),
    title: `${event.userName}'s ${event.actionText}`,
    host: {
      name: event.userName,
      avatar: event.userInitial,
      reliabilityScore: event.reliabilityScore,
      isVerified: event.isVerified,
      reviews: event.reviewCount,
      averageRating: event.averageRating,
    },
    category: 'Social',
    date: event.date,
    time: 'TBD',
    location: event.description.split('.')[0] || 'Lagos',
    description: event.description,
    billingTier: 'HOST_ALL',
    genderFilter: event.audience,
    interested: event.interestedCount,
    spots: `${Math.max(1, 10 - event.interestedCount)} left`,
    totalSpots: Math.max(10, event.interestedCount + 3),
    currentAttendees: Math.max(1, event.interestedCount),
    estimatedCost: '₦2,500',
    duration: '2-3 hours',
    ageRestriction: '18+',
    rules: ['Be respectful to everyone', 'Be on time', 'Message before you arrive'],
    media: {
      venue: [event.coverImage],
      host: [event.userInitial],
    },
    coords: event.coords,
  };
}
