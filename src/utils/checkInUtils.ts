/**
 * GPS Check-In Utility
 * Handles geolocation requests and proximity verification for event check-ins
 */

export interface CheckInResult {
  success: boolean;
  message: string;
  userLocation?: { latitude: number; longitude: number };
  distance?: number;
  checkedInAt?: string;
}

export interface EventCheckIn {
  id: string;
  event_id: string;
  user_id: string;
  checked_in_at: string;
  user_location_lat: number;
  user_location_lon: number;
  event_location_lat: number;
  event_location_lon: number;
  distance_from_event: number;
}

/**
 * Request user's geolocation with fallback
 */
export async function getUserLocation(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    // Request high accuracy location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        reject(new Error(`Unable to get location: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Haversine formula to calculate distance between two coordinates
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if user is within proximity of event (default 500m)
 */
export async function checkInAtEvent(
  eventLatitude: number,
  eventLongitude: number,
  proximityRadiusKm: number = 0.5
): Promise<CheckInResult> {
  try {
    const userLocation = await getUserLocation();
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      eventLatitude,
      eventLongitude
    );

    if (distance <= proximityRadiusKm) {
      return {
        success: true,
        message: `Successfully checked in! You are ${(distance * 1000).toFixed(0)}m away from the event.`,
        userLocation,
        distance,
        checkedInAt: new Date().toISOString(),
      };
    } else {
      return {
        success: false,
        message: `You are ${(distance * 1000).toFixed(0)}m away from the event. You need to be within ${proximityRadiusKm * 1000}m to check in.`,
        userLocation,
        distance,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Unable to verify location: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Format location permission request message
 */
export function getLocationPermissionMessage(): string {
  return `To check in at this event, we need to verify your location.
Your exact location will only be used to verify proximity to the event
and will not be stored or shared with other users.`;
}

/**
 * Check if location services are available and enabled
 */
export function isLocationAvailable(): boolean {
  return 'geolocation' in navigator;
}
