/**
 * Event utility functions for capacity, expiry, and check-in features
 */

/**
 * Check if an event has expired based on its date and time
 */
export function isEventExpired(eventDate: string, eventTime?: string): boolean {
  try {
    const now = new Date();
    const eventDateTime = eventTime 
      ? new Date(`${eventDate}T${eventTime}`)
      : new Date(eventDate);
    
    return eventDateTime < now;
  } catch (error) {
    return false;
  }
}

/**
 * Get days until event starts (negative if expired)
 */
export function getDaysUntilEvent(eventDate: string): number {
  try {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const date = new Date(eventDate);
    date.setHours(0, 0, 0, 0);
    
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  } catch (error) {
    return -1;
  }
}

/**
 * Get expiry message for event
 */
export function getEventExpiryMessage(eventDate: string, eventTime?: string): string | null {
  if (isEventExpired(eventDate, eventTime)) {
    return "This event has expired";
  }
  
  const daysLeft = getDaysUntilEvent(eventDate);
  if (daysLeft === 0) return "Happening today";
  if (daysLeft === 1) return "Tomorrow";
  if (daysLeft > 1 && daysLeft <= 7) return `${daysLeft} days away`;
  
  return null;
}

/**
 * Check if event is at or over capacity
 */
export function isEventAtCapacity(currentAttendees: number, maxCapacity: number): boolean {
  return currentAttendees >= maxCapacity;
}

/**
 * Get remaining capacity
 */
export function getRemainingCapacity(currentAttendees: number, maxCapacity: number): number {
  return Math.max(0, maxCapacity - currentAttendees);
}

/**
 * Get capacity percentage for progress bar
 */
export function getCapacityPercentage(currentAttendees: number, maxCapacity: number): number {
  if (maxCapacity <= 0) return 0;
  return Math.min(100, (currentAttendees / maxCapacity) * 100);
}

/**
 * Check if user can apply to event
 */
export function canApplyToEvent(
  isEventExpired: boolean,
  isAtCapacity: boolean,
  currentApplicationStatus: string
): { canApply: boolean; reason?: string } {
  if (isEventExpired) {
    return { canApply: false, reason: "This event has expired and is no longer accepting applications" };
  }
  
  if (isAtCapacity) {
    return { canApply: false, reason: "This event is at full capacity" };
  }
  
  if (currentApplicationStatus === 'accepted' || currentApplicationStatus === 'pending') {
    return { canApply: false, reason: "You have already applied to this event" };
  }
  
  return { canApply: true };
}

/**
 * Calculate cancellation deadline (hours before event)
 */
export function getCancellationDeadline(eventDate: string, eventTime: string, hoursAllowed: number): Date {
  const eventDateTime = new Date(`${eventDate}T${eventTime}`);
  return new Date(eventDateTime.getTime() - hoursAllowed * 60 * 60 * 1000);
}

/**
 * Check if cancellation is still allowed
 */
export function canCancelEvent(eventDate: string, eventTime: string, hoursAllowed: number = 24): boolean {
  const deadline = getCancellationDeadline(eventDate, eventTime, hoursAllowed);
  return new Date() < deadline;
}

/**
 * Get GPS distance in km using haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format distance for display
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m away`;
  }
  if (km < 10) {
    return `${km.toFixed(1)}km away`;
  }
  return `${Math.round(km)}km away`;
}

/**
 * Check if user is within event radius (for check-in)
 */
export function isUserNearEvent(
  userLat: number,
  userLon: number,
  eventLat: number,
  eventLon: number,
  radiusKm: number = 0.5 // Default 500m radius for check-in
): boolean {
  const distance = calculateDistance(userLat, userLon, eventLat, eventLon);
  return distance <= radiusKm;
}

/**
 * Validate cancellation policy
 */
export type CancellationPolicy = 'strict' | 'moderate' | 'flexible';

export function getCancellationPolicyDetails(policy: CancellationPolicy): {
  hoursAllowed: number;
  refundPercentage: number;
  label: string;
  description: string;
} {
  switch (policy) {
    case 'strict':
      return {
        hoursAllowed: 48,
        refundPercentage: 0,
        label: 'Strict',
        description: 'No refunds. Cancellations allowed until 48 hours before event.'
      };
    case 'moderate':
      return {
        hoursAllowed: 24,
        refundPercentage: 50,
        label: 'Moderate',
        description: '50% refund. Cancellations allowed until 24 hours before event.'
      };
    case 'flexible':
      return {
        hoursAllowed: 12,
        refundPercentage: 100,
        label: 'Flexible',
        description: 'Full refund. Cancellations allowed until 12 hours before event.'
      };
  }
}

/**
 * Check if travel mode is enabled for user
 */
export function isTravelModeActive(
  travelModeEnabled: boolean,
  travelDestination?: string
): boolean {
  return travelModeEnabled && !!travelDestination;
}

/**
 * Get event location for filtering (travel mode aware)
 */
export function getEventLocationCity(location: string): string {
  // Extract city name from location string like "Lagos, Nigeria"
  const parts = location.split(',');
  return parts[0]?.trim() || location;
}
