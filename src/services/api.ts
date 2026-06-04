// Junto API Service
// Handles all backend API communication

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const SESSION_ACTIVITY_KEY = 'junto-last-activity';

// Session token storage
let sessionToken: string | null = null;

// Type definitions
export interface User {
  id: string;
  username?: string;
  display_name?: string;
  phone_number?: string;
  profile_id: string;
  referred_by_user_id?: string | null;
  created_at?: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  display_name?: string;
  full_name?: string;
  bio?: string;
  profile_photo?: string;
  profile_photos?: string[];
  interests?: string[];
  city?: string;
  occupation?: string;
  gender?: string;
  location?: string;
  travel_mode_enabled?: boolean;
  travel_destination_city?: string;
  intro_video_url?: string;
  date_of_birth?: string;
  reliability_score?: number;
  reliabilityScore?: number;
  trust_score?: number;
  profile_completion_score?: number;
  profile_completion_percent?: number;
  phone_verified?: boolean;
  email_verified?: boolean;
  verification_status?: string;
}

export interface Event {
  id: string;
  host_id: string;
  display_name?: string;
  title: string;
  description?: string;
  event_type?: string;
  location_city: string;
  event_date: string;
  event_time: string;
  cover_photo_url?: string;
  is_squad_event?: boolean;
  max_guests?: number;
  billing_tier: number;
  host_fee: number;
  guest_fee: number;
  created_at: string;
  status?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  message_type: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message_id?: string;
  last_message_at?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: 'starter' | 'social' | 'premium' | 'elite';
  billing_cycle: 'monthly' | 'annual';
  status: 'active' | 'cancelled' | 'past_due';
  provider: string;
  amount: number;
  currency: string;
  started_at: string;
  current_period_end?: string | null;
  canceled_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Utility function for API calls
async function apiCall(
  endpoint: string,
  method: string = 'GET',
  body?: any
): Promise<any> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (sessionToken) {
    headers['Authorization'] = `Bearer ${sessionToken}`;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const responseText = await response.text();

    if (!response.ok) {
      if (!responseText) {
        throw new Error(`API Error: ${response.status}`);
      }

      let message = responseText;
      try {
        const error = JSON.parse(responseText);
        message = error.message || error.error || message;
      } catch {
        // Keep the raw response text if it isn't JSON.
      }

      throw new Error(message || `API Error: ${response.status}`);
    }

    if (!responseText) {
      return {};
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return JSON.parse(responseText);
    }

    return responseText;
  } catch (error) {
    console.error(`API Error (${method} ${endpoint}):`, error);
    throw error;
  }
}

function parseMaybeJsonArray(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    return value.map(String);
  }

  if (typeof value !== 'string' || !value.trim()) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map(String);
    }
  } catch {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return undefined;
}

function normalizeUserProfile(profile: any): UserProfile {
  if (!profile || typeof profile !== 'object') {
    return profile;
  }

  return {
    ...profile,
    name: profile.name || profile.display_name || profile.full_name || '',
    interests: parseMaybeJsonArray(profile.interests) || profile.interests,
    profile_photos: parseMaybeJsonArray(profile.profile_photos) || profile.profile_photos,
  };
}

// ==================== AUTH ====================

export async function login(username: string, password: string): Promise<{ session_token: string; user: User }> {
  const response = await apiCall('/auth/login', 'POST', { username, password });
  sessionToken = response.session_token;
  localStorage.setItem('sessionToken', response.session_token);
  localStorage.setItem('userId', response.user.id);
  return response;
}

export async function signup(
  username: string,
  fullName: string,
  password: string,
  referralCode?: string
): Promise<{ session_token: string; user: User }> {
  const response = await apiCall('/auth/signup', 'POST', { username, fullName, password, referralCode });
  sessionToken = response.session_token;
  localStorage.setItem('sessionToken', response.session_token);
  localStorage.setItem('userId', response.user.id);
  return response;
}

export async function verifySession(): Promise<{ valid: boolean; user: User }> {
  return apiCall('/auth/verify');
}

export function logout(): void {
  sessionToken = null;
  localStorage.removeItem('sessionToken');
  localStorage.removeItem('userId');
  localStorage.removeItem(SESSION_ACTIVITY_KEY);
}

export function getSessionToken(): string | null {
  if (!sessionToken) {
    sessionToken = localStorage.getItem('sessionToken');
  }
  return sessionToken;
}

export function getUserId(): string | null {
  return localStorage.getItem('userId');
}

export function markSessionActivity(): void {
  localStorage.setItem(SESSION_ACTIVITY_KEY, String(Date.now()));
}

export function getLastSessionActivity(): number {
  return Number(localStorage.getItem(SESSION_ACTIVITY_KEY) || 0);
}

// ==================== USERS ====================

export async function getUserById(userId: string): Promise<User> {
  const response = await apiCall(`/users/${userId}`);
  return response.user || response;
}

export async function deleteUserAccount(userId: string): Promise<{ success: boolean; message?: string }> {
  return apiCall(`/users/${userId}`, 'DELETE');
}

export async function exportUserAccountData(userId: string): Promise<any> {
  return apiCall(`/users/${userId}/export`);
}

export async function getReferralInfo(userId: string): Promise<{
  referral: {
    code: string;
    link: string;
    referral_count: number;
    referred_users: Array<{ id: string; username?: string; display_name?: string; profile_id: string; created_at?: string }>;
  };
}> {
  return apiCall(`/users/${userId}/referral`);
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const response = await apiCall(`/users/${userId}/profile`);
  return normalizeUserProfile(response.profile || response.user || response);
}

export async function updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<UserProfile> {
  const response = await apiCall(`/users/${userId}/profile`, 'PUT', profile);
  return normalizeUserProfile(response.profile || (await getUserProfile(userId)));
}

export async function searchUsers(query: string): Promise<User[]> {
  return apiCall(`/users/search?q=${encodeURIComponent(query)}`);
}

export async function getTravelModeUsers(city: string): Promise<User[]> {
  return apiCall(`/users/travel-mode?city=${encodeURIComponent(city)}`);
}

// ==================== EVENTS ====================

export async function getEvents(filters?: { city?: string; date?: string }): Promise<{ events: Event[] }> {
  let endpoint = '/events';
  const params = new URLSearchParams();
  if (filters?.city) params.append('city', filters.city);
  if (filters?.date) params.append('date', filters.date);
  if (params.toString()) endpoint += `?${params.toString()}`;
  return apiCall(endpoint);
}

export async function getEventById(eventId: string): Promise<Event> {
  return apiCall(`/events/${eventId}`);
}

export async function createEvent(event: Partial<Event>): Promise<{ event: Event; message?: string }> {
  return apiCall('/events', 'POST', event);
}

export async function updateEvent(eventId: string, updates: Partial<Event>): Promise<Event> {
  return apiCall(`/events/${eventId}`, 'PUT', updates);
}

export async function deleteEvent(eventId: string): Promise<void> {
  return apiCall(`/events/${eventId}`, 'DELETE');
}

export async function getHostEvents(hostId: string): Promise<{ events: Event[] }> {
  return apiCall(`/events/host/${hostId}`);
}

// ==================== APPLICATIONS ====================

export async function applyToEvent(
  userId: string,
  eventId: string,
  message?: string
): Promise<any> {
  return apiCall('/applications', 'POST', {
    user_id: userId,
    event_id: eventId,
    message,
  });
}

export async function getEventApplications(eventId: string): Promise<any[]> {
  return apiCall(`/applications/event/${eventId}`);
}

export async function getUserApplications(userId: string): Promise<{ applications: any[] }> {
  return apiCall(`/applications/user/${userId}`);
}

export async function updateApplicationStatus(
  applicationId: string,
  status: 'accepted' | 'rejected'
): Promise<any> {
  return apiCall(`/applications/${applicationId}/status`, 'PUT', { status });
}

export async function withdrawApplication(applicationId: string): Promise<void> {
  return apiCall(`/applications/${applicationId}`, 'DELETE');
}

export async function getEventCapacityInfo(eventId: string): Promise<any> {
  return apiCall(`/applications/event/${eventId}/capacity`);
}

// ==================== MESSAGES ====================

export async function sendMessage(
  conversationId: string | null,
  recipientId: string,
  content: string,
  messageType: string = 'text'
): Promise<Message> {
  return apiCall('/messages', 'POST', {
    conversation_id: conversationId,
    recipient_id: recipientId,
    content,
    message_type: messageType,
  });
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  return apiCall(`/messages/conversations/${userId}`);
}

export async function getConversation(
  conversationId: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ conversation: Conversation; messages: Message[] }> {
  return apiCall(`/messages/conversations/${conversationId}?limit=${limit}&offset=${offset}`);
}

export async function markMessagesAsRead(conversationId: string): Promise<void> {
  return apiCall(`/messages/${conversationId}/read`, 'PUT');
}

// ==================== NEARBY ====================

export async function getNearbyUsers(userId: string, latitude: number, longitude: number): Promise<{ nearby_users: User[] }> {
  return apiCall(`/nearby/${userId}?lat=${latitude}&lon=${longitude}`);
}

export async function swipeUser(
  userId: string,
  swipedUserId: string,
  direction: 'left' | 'right'
): Promise<any> {
  return apiCall('/nearby/swipe', 'POST', {
    user_id: userId,
    swiped_user_id: swipedUserId,
    direction,
  });
}

export async function getMatches(userId: string): Promise<User[]> {
  return apiCall(`/nearby/matches/${userId}`);
}

// ==================== SAFETY ====================

export async function addTrustedContact(
  userId: string,
  contactName: string,
  contactPhone: string,
  isPrimary: boolean = false
): Promise<any> {
  return apiCall(`/safety/${userId}/trusted-contacts`, 'POST', {
    contact_name: contactName,
    contact_phone: contactPhone,
    is_primary: isPrimary,
  });
}

export async function getTrustedContacts(userId: string): Promise<any[]> {
  return apiCall(`/safety/${userId}/trusted-contacts`);
}

export async function updateTrustedContact(contactId: string, updates: any): Promise<any> {
  return apiCall(`/safety/trusted-contacts/${contactId}`, 'PUT', updates);
}

export async function deleteTrustedContact(contactId: string): Promise<void> {
  return apiCall(`/safety/trusted-contacts/${contactId}`, 'DELETE');
}

export async function triggerSOS(userId: string, message?: string): Promise<any> {
  return apiCall(`/safety/${userId}/sos`, 'POST', { message });
}

// ==================== NOTIFICATIONS ====================

export async function getNotifications(userId: string): Promise<Notification[]> {
  return apiCall(`/notifications/${userId}`);
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  return apiCall(`/notifications/${notificationId}/read`, 'PUT');
}

export async function deleteNotification(notificationId: string): Promise<void> {
  return apiCall(`/notifications/${notificationId}`, 'DELETE');
}

// ==================== SUBSCRIPTIONS ====================

export async function getSubscription(userId: string): Promise<{ subscription: Subscription | null }> {
  return apiCall(`/subscriptions/${userId}`);
}

export async function activateSubscription(userId: string, planId: Subscription['plan_id'], billingCycle: Subscription['billing_cycle']): Promise<{ subscription: Subscription; message?: string }> {
  return apiCall('/subscriptions/activate', 'POST', {
    user_id: userId,
    plan_id: planId,
    billing_cycle: billingCycle,
  });
}

export async function cancelSubscription(userId: string): Promise<{ subscription: Subscription; message?: string }> {
  return apiCall(`/subscriptions/${userId}/cancel`, 'PUT');
}

// ==================== EVENT SAVES/WISHLIST ====================

export async function saveEvent(userId: string, eventId: string): Promise<{ message: string; saved: any }> {
  return apiCall('/events/save', 'POST', { userId, eventId });
}

export async function unsaveEvent(userId: string, eventId: string): Promise<{ message: string }> {
  return apiCall('/events/save', 'DELETE', { userId, eventId });
}

export async function getSavedEvents(userId: string, limit: number = 20, offset: number = 0): Promise<{ events: Event[] }> {
  return apiCall(`/events/user/${userId}/saved?limit=${limit}&offset=${offset}`);
}

export async function checkEventSaved(userId: string, eventId: string): Promise<{ saved: boolean }> {
  return apiCall(`/events/${eventId}/saved/${userId}`);
}

// ==================== EVENT RATINGS ====================

export async function rateEvent(userId: string, eventId: string, rating: number, comment?: string): Promise<{ message: string; rating: any }> {
  return apiCall('/events/rate', 'POST', { userId, eventId, rating, comment });
}

export async function getEventRating(eventId: string): Promise<{ average_rating: number; rating_count: number }> {
  return apiCall(`/events/${eventId}/rating`);
}

// ==================== USER PROFILE UPDATES ====================

export async function updateTravelDestination(userId: string, travelDestinationCity: string): Promise<{ success: boolean; message: string }> {
  return apiCall(`/users/${userId}/profile`, 'PUT', { travel_destination_city: travelDestinationCity });
}

// ==================== HEALTH CHECK ====================

export async function healthCheck(): Promise<any> {
  return apiCall('/health', 'GET');
}

// ==================== SEARCH & FILTER ====================

export async function searchEvents(
  keyword?: string,
  category?: string,
  billingTier?: number,
  city?: string,
  minDate?: string,
  maxDate?: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ events: Event[]; total: number }> {
  const params = new URLSearchParams();
  if (keyword) params.append('keyword', keyword);
  if (category) params.append('category', category);
  if (billingTier) params.append('billingTier', String(billingTier));
  if (city) params.append('city', city);
  if (minDate) params.append('minDate', minDate);
  if (maxDate) params.append('maxDate', maxDate);
  params.append('limit', String(limit));
  params.append('offset', String(offset));

  return apiCall(`/search/search?${params.toString()}`);
}

export async function getEventCategories(): Promise<{ categories: Array<{ value: string; label: string; icon: string }> }> {
  return apiCall('/search/categories');
}

// ==================== REPORT & BLOCK ====================

export async function reportUser(
  reporterId: string,
  reportedUserId: string,
  reportType: string,
  description?: string
): Promise<{ report_id: string; status: string; message: string }> {
  return apiCall('/reports/report', 'POST', { reporter_id: reporterId, reported_user_id: reportedUserId, report_type: reportType, description });
}

export async function blockUser(
  blockerId: string,
  blockedUserId: string,
  reason?: string
): Promise<{ block_id: string; message: string }> {
  return apiCall('/reports/block', 'POST', { blocker_id: blockerId, blocked_user_id: blockedUserId, reason });
}

export async function unblockUser(blockerId: string, blockedUserId: string): Promise<{ message: string }> {
  return apiCall('/reports/unblock', 'POST', { blocker_id: blockerId, blocked_user_id: blockedUserId });
}

export async function getBlockedUsers(userId: string): Promise<{ blocked_users: User[] }> {
  return apiCall(`/reports/${userId}/blocked`);
}

export async function checkUserBlocked(blockerId: string, blockedUserId: string): Promise<{ is_blocked: boolean }> {
  return apiCall(`/reports/check-blocked?blocker_id=${blockerId}&blocked_user_id=${blockedUserId}`);
}

// ==================== HOST RATINGS & REVIEWS ====================

export async function rateHost(
  ratedByUserId: string,
  hostId: string,
  eventId: string,
  rating: number,
  review?: string
): Promise<{ rating_id: string; message: string; host_rating: { average: number; total_ratings: number } }> {
  return apiCall('/ratings/', 'POST', { rated_by_user_id: ratedByUserId, host_id: hostId, event_id: eventId, rating, review });
}

export async function getHostRatings(hostId: string, limit: number = 20, offset: number = 0): Promise<{ ratings: any[]; summary: { average_rating: number; total_ratings: number } }> {
  return apiCall(`/ratings/${hostId}?limit=${limit}&offset=${offset}`);
}

export async function getUserHostRating(userId: string, hostId: string): Promise<{ rating: any | null }> {
  return apiCall(`/ratings/user-rating?user_id=${userId}&host_id=${hostId}`);
}

export async function deleteHostRating(ratingId: string, userId: string): Promise<{ message: string }> {
  return apiCall('/ratings/', 'DELETE', { rating_id: ratingId, user_id: userId });
}

// ==================== ACCEPT/DECLINE INVITES ====================

export async function acceptPrivateInvite(
  applicationId: string,
  userId: string
): Promise<{ message: string; status: string }> {
  return apiCall('/invites/accept', 'POST', { application_id: applicationId, user_id: userId });
}

export async function declinePrivateInvite(
  applicationId: string,
  userId: string
): Promise<{ message: string; status: string }> {
  return apiCall('/invites/decline', 'POST', { application_id: applicationId, user_id: userId });
}

export async function getPendingInvites(userId: string): Promise<{ invites: any[] }> {
  return apiCall(`/invites/${userId}/pending`);
}

// ==================== PUSH NOTIFICATIONS ====================

export async function subscribeToPush(userId: string, subscription: PushSubscription): Promise<{ message: string; subscription_id: string }> {
  return apiCall('/notifications/push/subscribe', 'POST', { user_id: userId, subscription });
}

export async function unsubscribeFromPush(userId: string, subscription: PushSubscription): Promise<{ message: string }> {
  return apiCall('/notifications/push/unsubscribe', 'POST', { user_id: userId, subscription });
}

export async function getPushSubscriptions(userId: string): Promise<{ subscriptions: any[] }> {
  return apiCall(`/notifications/push/${userId}/subscriptions`);
}

// Helper to register for push notifications
export async function registerForPushNotifications(userId: string): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push notifications not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.VITE_PUBLIC_KEY || ''
    });

    await subscribeToPush(userId, subscription);
    return true;
  } catch (error) {
    console.error('Push registration failed:', error);
    return false;
  }
}

// ==================== SQUADS ====================

export async function createSquad(name: string, description?: string, isPublic?: boolean, maxMembers?: number): Promise<any> {
  return apiCall('/squads', 'POST', {
    name,
    description,
    isPublic,
    maxMembers
  });
}

export async function getUserSquads(userId: string): Promise<any[]> {
  const response = await apiCall(`/squads/user/${userId}`);
  return response || [];
}

export async function getSquadDetails(squadId: string): Promise<any> {
  return apiCall(`/squads/${squadId}`);
}

export async function inviteUsersToSquad(squadId: string, userIds: string[]): Promise<any> {
  return apiCall(`/squads/${squadId}/invite`, 'POST', { userIds });
}

export async function acceptSquadInvite(inviteId: string): Promise<any> {
  return apiCall(`/squads/invite/${inviteId}/accept`, 'PUT');
}

export async function declineSquadInvite(inviteId: string): Promise<any> {
  return apiCall(`/squads/invite/${inviteId}/decline`, 'PUT');
}

export async function removeSquadMember(squadId: string, userId: string): Promise<any> {
  return apiCall(`/squads/${squadId}/members/${userId}`, 'DELETE');
}

export async function deleteSquad(squadId: string): Promise<any> {
  return apiCall(`/squads/${squadId}`, 'DELETE');
}

// ==================== CHECK-INS ====================

export async function checkIntoEvent(
  eventId: string,
  userLocationLat: number,
  userLocationLon: number,
  eventLocationLat?: number,
  eventLocationLon?: number,
  distanceFromEvent?: number
): Promise<any> {
  return apiCall('/check-ins', 'POST', {
    eventId,
    userLocationLat,
    userLocationLon,
    eventLocationLat,
    eventLocationLon,
    distanceFromEvent,
  });
}

export async function getUserCheckIns(userId: string): Promise<any[]> {
  const response = await apiCall(`/check-ins/user/${userId}`);
  return response || [];
}

export async function getEventCheckIns(eventId: string): Promise<any> {
  return apiCall(`/check-ins/event/${eventId}`);
}

export async function hasCheckedIn(eventId: string, userId: string): Promise<any> {
  return apiCall(`/check-ins/event/${eventId}/user/${userId}`);
}

// ==================== NOTIFICATION PREFERENCES ====================

export async function getNotificationPreferences(userId: string): Promise<any> {
  return apiCall(`/notification-preferences/${userId}`);
}

export async function updateNotificationPreferences(userId: string, preferences: any): Promise<any> {
  return apiCall(`/notification-preferences/${userId}`, 'PUT', preferences);
}

export async function resetNotificationPreferences(userId: string): Promise<any> {
  return apiCall(`/notification-preferences/${userId}/reset`, 'POST');
}

// ==================== FRAUD DETECTION ====================

export async function getUserFraudStatus(userId: string): Promise<any> {
  return apiCall(`/fraud/${userId}/status`);
}

export async function calculateUserRiskScore(userId: string): Promise<any> {
  return apiCall(`/fraud/${userId}/calculate-risk`, 'POST');
}

export async function createFraudFlag(userId: string, flagType: string, severity: string, description: string): Promise<any> {
  return apiCall(`/fraud/${userId}/flags`, 'POST', { flagType, severity, description });
}

export async function getAccountFlags(userId: string, reviewed?: boolean): Promise<any> {
  const query = reviewed !== undefined ? `?reviewed=${reviewed}` : '';
  return apiCall(`/fraud/${userId}/flags${query}`);
}

export async function reviewAccountFlag(flagId: string, reviewedBy: string, actionTaken: string, notes: string): Promise<any> {
  return apiCall(`/fraud/flags/${flagId}`, 'PUT', { reviewedBy, actionTaken, notes });
}

export async function getSuspiciousActivities(userId: string, resolved?: boolean): Promise<any> {
  const query = resolved !== undefined ? `?resolved=${resolved}` : '';
  return apiCall(`/fraud/${userId}/suspicious-activities${query}`);
}

export async function resolveSuspiciousActivity(activityId: string, resolution_reason: string): Promise<any> {
  return apiCall(`/fraud/activities/${activityId}/resolve`, 'PUT', { resolution_reason });
}

export async function getFraudLogs(userId: string, eventType?: string): Promise<any> {
  const query = eventType ? `?eventType=${eventType}` : '';
  return apiCall(`/fraud/${userId}/logs${query}`);
}

export async function getHighRiskUsers(threshold: number = 80, limit: number = 20): Promise<any> {
  return apiCall(`/fraud?threshold=${threshold}&limit=${limit}`);
}

// ==================== FOLLOW-UP MANAGEMENT ====================

export async function getEventFollowups(eventId: string): Promise<any> {
  return apiCall(`/followups/event/${eventId}`);
}

export async function respondToFollowup(eventId: string, userId: string, responseType: string): Promise<any> {
  return apiCall(`/followups/event/${eventId}/user/${userId}/respond`, 'POST', { response_type: responseType });
}

export async function getHostFollowupAnalytics(hostId: string): Promise<any> {
  return apiCall(`/followups/host/${hostId}/analytics`);
}

export async function getUserFollowups(userId: string): Promise<any> {
  return apiCall(`/followups/user/${userId}`);
}

export async function resendFollowup(eventId: string, userIds: string[]): Promise<any> {
  return apiCall(`/followups/${eventId}/resend`, 'POST', { userIds });
}

// ==================== OTP AUTHENTICATION ====================

export async function requestOTP(email: string): Promise<any> {
  return apiCall(`/auth/request-otp`, 'POST', { email });
}

export async function verifyOTP(email: string, code: string): Promise<any> {
  return apiCall(`/auth/verify-otp`, 'POST', { email, code });
}

export async function resendOTP(email: string): Promise<any> {
  return apiCall(`/auth/otp/resend`, 'POST', { email });
}

export async function getOTPExpiry(email: string): Promise<any> {
  return apiCall(`/auth/otp/expiry?email=${encodeURIComponent(email)}`);
}
