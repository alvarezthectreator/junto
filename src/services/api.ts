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
  bio?: string;
  profile_photo?: string;
  profile_photos?: string[];
  interests?: string[];
  location?: string;
  travel_mode_enabled?: boolean;
  travel_destination_city?: string;
}

export interface Event {
  id: string;
  host_id: string;
  display_name?: string;
  title: string;
  description?: string;
  location_city: string;
  event_date: string;
  event_time: string;
  cover_photo_url?: string;
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
  return apiCall(`/users/${userId}`);
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
  return apiCall(`/users/${userId}/profile`);
}

export async function updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<UserProfile> {
  return apiCall(`/users/${userId}/profile`, 'PUT', profile);
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

export async function blockUser(userId: string, blockedUserId: string): Promise<any> {
  return apiCall(`/safety/${userId}/block`, 'POST', { blocked_user_id: blockedUserId });
}

export async function reportUser(
  userId: string,
  reportedUserId: string,
  reportType: string,
  description?: string
): Promise<any> {
  return apiCall(`/safety/${userId}/report/${reportedUserId}`, 'POST', {
    report_type: reportType,
    description,
  });
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

// ==================== HEALTH CHECK ====================

export async function healthCheck(): Promise<any> {
  return apiCall('/health', 'GET');
}
