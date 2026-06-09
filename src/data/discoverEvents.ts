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
  locationCity?: string;
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

export const discoverEvents: DiscoverEventSeed[] = [
  {
    id: 'ada-movie-night',
    userInitial: 'A',
    userName: 'Ada',
    actionText: 'watch a movie',
    emoji: '🎬',
    description: 'Silverbird Cinema, VI. Catching the new Marvel drop!',
    date: 'today, 6pm',
    audience: 'Open to all',
    interestedCount: 3,
    isVerified: true,
    reliabilityScore: 96,
    averageRating: 5,
    reviewCount: 18,
    accentColor: 'bg-[#F59E0B]',
    audienceColor: 'bg-emerald-500/10 text-emerald-400',
    coverImage: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=900',
    coords: [3.4219, 6.4281],
    locationCity: 'Lagos',
    attendees: sharedAttendees,
    reviews: sharedReviews,
  },
  {
    id: 'oge-beach-day',
    userInitial: 'O',
    userName: 'Oge',
    actionText: 'go to the beach',
    emoji: '🌊',
    description: 'Bar Beach, Lagos. Vibes only, no drama.',
    date: 'Monday, 3pm',
    audience: 'Males only',
    interestedCount: 7,
    isVerified: true,
    reliabilityScore: 92,
    averageRating: 5,
    reviewCount: 11,
    accentColor: 'bg-[#4ECDC4]',
    audienceColor: 'bg-sky-500/10 text-sky-300',
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900',
    coords: [3.4214, 6.4131],
    locationCity: 'Lagos',
    attendees: sharedAttendees,
    reviews: sharedReviews,
  },
  {
    id: 'kemi-brunch',
    userInitial: 'K',
    userName: 'Kemi',
    actionText: 'grab brunch',
    emoji: '☕',
    description: 'Hard Rock Cafe, Lekki. Sunday vibes!',
    date: 'Sat, 11am',
    audience: 'Females only',
    interestedCount: 5,
    isVerified: true,
    reliabilityScore: 94,
    averageRating: 5,
    reviewCount: 9,
    accentColor: 'bg-[#FB923C]',
    audienceColor: 'bg-pink-500/10 text-pink-300',
    coverImage: 'https://images.unsplash.com/photo-1533777324565-a040eb52facd?w=900',
    coords: [3.4736, 6.4474],
    locationCity: 'Lagos',
    attendees: sharedAttendees,
    reviews: sharedReviews,
  },
  {
    id: 'tunde-gym',
    userInitial: 'T',
    userName: 'Tunde',
    actionText: 'hit the gym',
    emoji: '💪',
    description: 'Smart Fitness, Ikoyi. Push day energy.',
    date: 'Tue, 7am',
    audience: 'Open to all',
    interestedCount: 2,
    isVerified: true,
    reliabilityScore: 89,
    averageRating: 4.9,
    reviewCount: 7,
    accentColor: 'bg-[#38BDF8]',
    audienceColor: 'bg-cyan-500/10 text-cyan-300',
    coverImage: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900',
    coords: [3.4333, 6.45],
    locationCity: 'Lagos',
    attendees: sharedAttendees,
    reviews: sharedReviews,
  },
  {
    id: 'zara-sushi',
    userInitial: 'Z',
    userName: 'Zara',
    actionText: 'try sushi',
    emoji: '🍣',
    description: 'Izanagi, VI. New rolls on the menu!',
    date: 'Fri, 8pm',
    audience: 'Open to all',
    interestedCount: 12,
    isVerified: true,
    reliabilityScore: 97,
    averageRating: 5,
    reviewCount: 24,
    accentColor: 'bg-[#FB7185]',
    audienceColor: 'bg-rose-500/10 text-rose-300',
    coverImage: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=900',
    coords: [3.4106, 6.4281],
    locationCity: 'Lagos',
    attendees: sharedAttendees,
    reviews: sharedReviews,
  },
  {
    id: 'chidi-club-night',
    userInitial: 'C',
    userName: 'Chidi',
    actionText: 'go clubbing',
    emoji: '🪩',
    description: 'Quilox, VI. Saturday night turn up.',
    date: 'Sat, 11pm',
    audience: 'Males only',
    interestedCount: 9,
    isVerified: true,
    reliabilityScore: 91,
    averageRating: 4.8,
    reviewCount: 15,
    accentColor: 'bg-[#FF8E72]',
    audienceColor: 'bg-violet-500/10 text-violet-300',
    coverImage: 'https://images.unsplash.com/photo-1571266028243-d220bc1c8d1f?w=900',
    coords: [3.4197, 6.425],
    locationCity: 'Lagos',
    attendees: sharedAttendees,
    reviews: sharedReviews,
  },
];

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
