// Types for Host Dashboard features
export interface HostedEvent {
  id: string;
  title: string;
  image: string;
  description: string;
  date: Date;
  location: string;
  maxGuests: number;
  confirmedGuests: number;
  pendingApplications: number;
  price?: number;
  status: 'draft' | 'active' | 'full' | 'cancelled' | 'completed';
  createdAt: Date;
  audience?: 'mixed' | 'men' | 'women';
  hostRating?: number;
}

export interface EventApplication {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userRating: number;
  eventAttendance: number;
  appliedAt: Date;
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
}

export interface EventGuest {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  eventId: string;
  status: 'confirmed' | 'maybe' | 'no-show';
  checkedIn: boolean;
  joinedAt: Date;
  rating?: number;
}

export interface HostMetrics {
  totalEventsHosted: number;
  totalRevenue: number;
  averageRating: number;
  guestAttendanceRate: number;
  repeatGuestRate: number;
}

export interface HostStats {
  metrics: HostMetrics;
  earnings: {
    thisMonth: number;
    total: number;
    pending: number;
    lastPayout?: Date;
  };
  profile: {
    rating: number;
    reviewCount: number;
    responseRate: number;
    verified: boolean;
  };
}
