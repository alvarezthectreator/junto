// Junto API Service
// Handles all backend API communication

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Session token storage
let sessionToken: string | null = null;

// Type definitions
export interface User {
  id: string;
  phone_number: string;
  profile_id: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  bio?: string;
  profile_photo?: string;
  interests?: string[];
  travel_mode_enabled?: boolean;
  travel_destination_city?: string;
}

export interface Event {
  id: string;
  host_id: string;
  title: string;
  description?: string;
  location_city: string;
  event_date: string;
  event_time: string;
  max_guests?: number;
  billing_tier: number;
  host_fee: number;
  guest_fee: number;
  created_at: string;
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

// Utility function for API calls
async function apiCall(
  endpoint: string,
  method = 'GET',
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

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error (${method} ${endpoint}):`, error);
    throw error;
  }
}

// ==================== AUTH ====================

export async function login(phoneNumber: string): Promise<{ session_token: string; user: User }> {
  const response = await apiCall('/auth/login', 'POST', { phone_number: phoneNumber });
  sessionToken = response.session_token;
  localStorage.setItem('sessionToken', response.session_token);
  localStorage.setItem('userId', response.user.id);
  return response;
}

export async function verifySession(): Promise<{ valid: boolean }> {
  return apiCall('/auth/verify');
}

export function logout(): void {
  sessionToken = null;
  localStorage.removeItem('sessionToken');
  localStorage.removeItem('userId');
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

// ==================== USERS ====================

export async function getUserById(userId: string): Promise<{ user: User }> {
  return apiCall(`/users/${userId}`);
}

export async function getUserProfile(userId: string): Promise<{ profile: UserProfile }> {
  return apiCall(`/users/${userId}`);
}

export async function updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<{ success: boolean; message: string }> {
  return apiCall(`/users/${userId}`, 'PUT', profile);
}

export async function searchUsers(city?: string): Promise<{ users: User[] }> {
  const query = city ? `?city=${encodeURIComponent(city)}` : '';
  return apiCall(`/users/search${query}`);
}

export async function getTravelModeUsers(city: string): Promise<User[]> {
  return apiCall(`/users/travel-mode?city=${encodeURIComponent(city)}`);
}

// ==================== EVENTS ====================

export async function getEvents(filters?: { city?: string; tier?: number; date?: string; limit?: number; offset?: number }): Promise<{ events: Event[] }> {
  let endpoint = '/events';
  const params = new URLSearchParams();
  if (filters?.city) params.append('city', filters.city);
  if (filters?.tier) params.append('tier', filters.tier.toString());
  if (filters?.date) params.append('date', filters.date);
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.offset) params.append('offset', filters.offset.toString());
  if (params.toString()) endpoint += `?${params.toString()}`;
  return apiCall(endpoint);
}

export async function getEventById(eventId: string): Promise<{ event: Event }> {
  return apiCall(`/events/${eventId}`);
}

export async function createEvent(event: Partial<Event>): Promise<{ event: { id: string }; message: string }> {
  return apiCall('/events', 'POST', event);
}

export async function updateEvent(eventId: string, updates: Partial<Event>): Promise<{ message: string }> {
  return apiCall(`/events/${eventId}`, 'PUT', updates);
}

export async function deleteEvent(eventId: string): Promise<{ success: boolean; message: string }> {
  return apiCall(`/events/${eventId}`, 'DELETE');
}

export async function getHostEvents(hostId: string): Promise<{ events: Event[] }> {
  return apiCall(`/events/host/${hostId}`);
}

// ==================== APPLICATIONS ====================

export async function applyToEvent(
  userId: string,
  eventId: string,
  personal_note?: string
): Promise<{ application: { id: string }; message: string }> {
  return apiCall('/applications', 'POST', {
    user_id: userId,
    event_id: eventId,
    personal_note,
  });
}

export async function getEventApplications(eventId: string): Promise<{ applications: any[] }> {
  return apiCall(`/applications/event/${eventId}`);
}

export async function getUserApplications(userId: string): Promise<{ applications: any[] }> {
  return apiCall(`/applications/user/${userId}`);
}

export async function updateApplicationStatus(
  applicationId: string,
  status: 'accepted' | 'rejected' | 'pending'
): Promise<{ application: any; message: string }> {
  return apiCall(`/applications/${applicationId}`, 'PATCH', { status });
}

// ==================== MESSAGES ====================

export async function sendMessage(
  conversationId: string | null,
  recipientId: string,
  content: string,
  messageType = 'text'
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
  limit = 50,
  offset = 0
): Promise<{ conversation: Conversation; messages: Message[] }> {
  return apiCall(`/messages/conversations/${conversationId}?limit=${limit}&offset=${offset}`);
}

export async function markMessagesAsRead(conversationId: string): Promise<void> {
  return apiCall(`/messages/${conversationId}/read`, 'PUT');
}

// ==================== NEARBY ====================

export async function getNearbyUsers(userId: string, latitude: number, longitude: number): Promise<User[]> {
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
  isPrimary = false
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

// ==================== HEALTH CHECK ====================

export async function healthCheck(): Promise<any> {
  return apiCall('/health', 'GET');
}
