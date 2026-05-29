import React, { useState, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TopHeader } from '../components/TopHeader';
import { useAppContext } from '../context/AppContext';
import {
  Calendar,
  Users,
  CheckCircle2,
  Edit3,
  Eye,
  Image as ImageIcon,
  Check,
  X,
  Clock,
  Trash2,
  Menu,
  Plus,
  Bell,
  MapPin,
  AlertCircle,
  Loader2
} from 'lucide-react';
import * as API from '../services/api';
import { compressImageDataUrl } from '../utils/imageCompression';

interface MyRequestsProps {
  onNavigate?: (page: string) => void;
  setActiveNav?: (nav: string) => void;
  onCloseSidebar?: () => void;
}

interface InterestedPerson {
  id: string;
  eventId?: string;
  name: string;
  avatar: string;
  joinedAt: string;
  joinedAtRaw?: string;
  message?: string;
  status: 'interested' | 'accepted' | 'declined';
  userId?: string;
  applicationId?: string;
  backendId?: string;
  profileId?: string;
  bio?: string;
  location?: string;
  reliabilityScore?: number;
}

interface HostedEvent {
  id: string;
  title: string;
  event_date: string;
  event_time: string;
  location_city: string;
  description: string;
  max_guests: number;
  current_guests_count: number;
  status: string;
  host_id: string;
  display_name: string;
  cover_photo_url?: string;
  coverImage?: string;
  applications: InterestedPerson[];
}

const fallbackCoverImage = 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800';
const deletedEventsKey = 'junto-deleted-events';
const eventApplicationsKey = 'junto-event-applications';

interface DeletedEventTombstone {
  id: string;
  host_id: string;
  title: string;
  event_date: string;
  event_time: string;
  location_city: string;
}

type NoticeTone = 'success' | 'error';

function parseEventDateTime(eventDate?: string, eventTime?: string) {
  if (!eventDate) return null;

  const normalizedDate = eventDate.includes('T') ? eventDate.split('T')[0] : eventDate;
  const normalizedTime = eventTime || '23:59';
  const [year, month, day] = normalizedDate.split('-').map(Number);
  const [hour, minute] = normalizedTime.split(':').map(Number);

  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day, hour || 0, minute || 0, 0, 0);
}

function isEventExpired(eventDate?: string, eventTime?: string, status?: string) {
  if (status === 'cancelled') return true;
  if (status === 'completed') return true;

  const eventDateTime = parseEventDateTime(eventDate, eventTime);
  if (!eventDateTime) return false;

  return eventDateTime.getTime() < Date.now();
}

function formatDateForInput(eventDate?: string) {
  if (!eventDate) return '';
  return eventDate.includes('T') ? eventDate.split('T')[0] : eventDate;
}

function normalizeEventSignature(event: {
  host_id?: string;
  title?: string;
  event_date?: string;
  event_time?: string;
  location_city?: string;
}) {
  return [
    (event.host_id || '').trim().toLowerCase(),
    (event.title || '').trim().toLowerCase(),
    formatDateForInput(event.event_date || '').trim(),
    (event.event_time || '').trim(),
    (event.location_city || '').trim().toLowerCase(),
  ].join('|');
}

function isBenignEventResponse(message?: string) {
  if (!message) return false;
  return /404|not found|success|ok|deleted|updated/i.test(message);
}

function getNoticeTone(message?: string): NoticeTone {
  return isBenignEventResponse(message) ? 'success' : 'error';
}

function formatRelativeTime(dateString?: string) {
  if (!dateString) return 'just now';

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return 'just now';
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function normalizeApplicationStatus(status?: string): 'interested' | 'accepted' | 'declined' {
  if (status === 'accepted') return 'accepted';
  if (status === 'declined' || status === 'rejected') return 'declined';
  return 'interested';
}

function readStoredEventApplications() {
  try {
    const raw = localStorage.getItem(eventApplicationsKey);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredEventApplications(applications: any[]) {
  localStorage.setItem(eventApplicationsKey, JSON.stringify(applications));
}

function mapApplicationToPerson(application: any): InterestedPerson {
  const rawJoinedAt = application.created_at || application.joinedAt || application.applied_at || new Date().toISOString();
  const applicationId = String(application.id || application.application_id || application.backend_id || `${application.event_id}-${application.user_id}-${rawJoinedAt}`);

  return {
    id: applicationId,
    eventId: application.event_id ? String(application.event_id) : undefined,
    applicationId: String(application.id || application.application_id || ''),
    backendId: application.backend_id ? String(application.backend_id) : undefined,
    name: application.user_name || application.name || 'Guest',
    avatar: application.user_avatar || '👤',
    joinedAt: formatRelativeTime(rawJoinedAt),
    joinedAtRaw: rawJoinedAt,
    message: application.message || application.note || '',
    status: normalizeApplicationStatus(application.status),
    userId: application.user_id ? String(application.user_id) : undefined,
    profileId: application.profile_id ? String(application.profile_id) : undefined,
    bio: application.bio || '',
    location: application.location || '',
    reliabilityScore: Number(application.reliability_score || application.reliabilityScore || 90),
  };
}

function mergeApplicationLists(primary: InterestedPerson[], secondary: InterestedPerson[]) {
  const merged = new Map<string, InterestedPerson>();

  [...primary, ...secondary].forEach((application) => {
    const key = application.userId
      ? `${application.eventId || 'event'}-${application.userId}-${application.message || ''}`
      : application.applicationId || application.backendId || application.id;

    merged.set(String(key), application);
  });

  return Array.from(merged.values()).sort((a, b) => {
    const aTime = a.joinedAtRaw ? new Date(a.joinedAtRaw).getTime() : 0;
    const bTime = b.joinedAtRaw ? new Date(b.joinedAtRaw).getTime() : 0;
    return bTime - aTime;
  });
}

function readDeletedEventTombstones(): DeletedEventTombstone[] {
  try {
    const deletedRaw = localStorage.getItem(deletedEventsKey);
    if (!deletedRaw) return [];

    const parsed = JSON.parse(deletedRaw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((entry: any) => {
        if (typeof entry === 'string' || typeof entry === 'number') {
          return {
            id: String(entry),
            host_id: '',
            title: '',
            event_date: '',
            event_time: '',
            location_city: '',
          };
        }

        return {
          id: String(entry?.id || ''),
          host_id: String(entry?.host_id || ''),
          title: String(entry?.title || ''),
          event_date: String(entry?.event_date || ''),
          event_time: String(entry?.event_time || ''),
          location_city: String(entry?.location_city || ''),
        };
      })
      .filter((entry) => entry.id || normalizeEventSignature(entry) !== '|||');
  } catch {
    return [];
  }
}

function isDeletedEvent(event: any, tombstones: DeletedEventTombstone[]) {
  const eventSignature = normalizeEventSignature(event);
  return tombstones.some((tombstone) => {
    const tombstoneSignature = normalizeEventSignature(tombstone);
    return (
      (tombstone.id && String(tombstone.id) === String(event.id)) ||
      (tombstoneSignature !== '|||' && tombstoneSignature === eventSignature)
    );
  });
}

function mapHostedEvent(event: any, applications: InterestedPerson[] = []): HostedEvent {
  const expired = isEventExpired(event.event_date, event.event_time, event.status);
  return {
    id: event.id,
    title: event.title || 'Untitled event',
    event_date: formatDateForInput(event.event_date),
    event_time: event.event_time || '18:00',
    location_city: event.location_city || 'Unknown',
    description: event.description || '',
    max_guests: Number(event.max_guests || 0),
    current_guests_count: Number(event.current_guests_count || 0),
    status: expired ? 'completed' : (event.status || 'active'),
    host_id: event.host_id || '',
    display_name: event.display_name || 'You',
    cover_photo_url: event.cover_photo_url || event.coverImage || fallbackCoverImage,
    coverImage: event.cover_photo_url || event.coverImage || fallbackCoverImage,
    applications,
  };
}

interface EditEventModalProps {
  event: HostedEvent | null;
  isOpen: boolean;
  isSaving: boolean;
  error: string;
  onClose: () => void;
  onSave: (formData: {
    title: string;
    description: string;
    event_date: string;
    event_time: string;
    location_city: string;
    max_guests: number;
    cover_photo_url: string;
  }) => Promise<void>;
}

function EditEventModalForm({
  event,
  isOpen,
  isSaving,
  error,
  onClose,
  onSave,
}: EditEventModalProps) {
  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [eventDate, setEventDate] = useState(event?.event_date || '');
  const [eventTime, setEventTime] = useState(event?.event_time || '');
  const [locationCity, setLocationCity] = useState(event?.location_city || '');
  const [maxGuests, setMaxGuests] = useState(String(event?.max_guests || 0));
  const [imagePreview, setImagePreview] = useState(event?.cover_photo_url || event?.coverImage || '');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (!event) return;

    setTitle(event.title || '');
    setDescription(event.description || '');
    setEventDate(event.event_date || '');
    setEventTime(event.event_time || '');
    setLocationCity(event.location_city || '');
    setMaxGuests(String(event.max_guests || 0));
    setImagePreview(event.cover_photo_url || event.coverImage || '');
    setLocalError('');
  }, [event]);

  const handleEditImageUpload = (file: File | null) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setLocalError('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      setImagePreview(String(readerEvent.target?.result || ''));
      setLocalError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (submitEvent: React.FormEvent) => {
    submitEvent.preventDefault();
    setLocalError('');

    if (!title.trim() || !eventDate || !eventTime || !locationCity.trim()) {
      setLocalError('Please fill in title, date, time, and location');
      return;
    }

    const compressedImage = await compressImageDataUrl(imagePreview || '');

    await onSave({
      title: title.trim(),
      description: description.trim(),
      event_date: eventDate,
      event_time: eventTime,
      location_city: locationCity.trim(),
      max_guests: Number(maxGuests) || 0,
      cover_photo_url: compressedImage || '',
    });
  };

  if (!isOpen || !event) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[75] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#111115] p-5 shadow-2xl shadow-black/40 sm:p-6"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Edit event</h3>
            <p className="text-sm text-gray-400">Update the details, image, and date from here.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300 transition hover:bg-white/10"
          >
            Close
          </button>
        </div>

        {(error || localError) && (
          <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error || localError}
          </div>
        )}

        <div className="mt-5 flex-1 overflow-y-auto pr-1 grid gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-[#0F0F13] px-4 py-3 text-white outline-none transition focus:border-[#F59E0B]/50"
              placeholder="Event title"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-white/10 bg-[#0F0F13] px-4 py-3 text-white outline-none transition focus:border-[#F59E0B]/50"
              placeholder="Tell guests what to expect"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">Date</label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#0F0F13] px-4 py-3 text-white outline-none transition focus:border-[#F59E0B]/50"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">Time</label>
              <input
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#0F0F13] px-4 py-3 text-white outline-none transition focus:border-[#F59E0B]/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">Location</label>
              <input
                value={locationCity}
                onChange={(e) => setLocationCity(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#0F0F13] px-4 py-3 text-white outline-none transition focus:border-[#F59E0B]/50"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">Max Guests</label>
              <input
                type="number"
                min="1"
                value={maxGuests}
                onChange={(e) => setMaxGuests(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#0F0F13] px-4 py-3 text-white outline-none transition focus:border-[#F59E0B]/50"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Cover image URL</label>
            <input
              value={imagePreview}
              onChange={(e) => setImagePreview(e.target.value)}
              className="mb-3 w-full rounded-2xl border border-white/10 bg-[#0F0F13] px-4 py-3 text-white outline-none transition focus:border-[#F59E0B]/50"
              placeholder="Paste image URL or upload a new image"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleEditImageUpload(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-400 file:mr-4 file:rounded-full file:border-0 file:bg-[#F59E0B] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#F59E0B]/90"
            />
            {imagePreview && (
              <div className="mt-3 overflow-hidden rounded-2xl border border-white/10">
                <img src={imagePreview} alt="Cover preview" className="h-48 w-full object-cover" />
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 flex shrink-0 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 font-semibold text-white transition hover:bg-white/10"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="w-full rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#FB923C] py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-70"
          >
            {isSaving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

export function MyRequests({ onNavigate, setActiveNav, onCloseSidebar }: MyRequestsProps) {
  const navigate = useNavigate();
  const { setSelectedUser } = useAppContext();
  const [activeTab, setActiveTab] = useState('Active');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showInterestedModal, setShowInterestedModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'most-interested'>('recent');
  const [hostedEvents, setHostedEvents] = useState<HostedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMessage, setShowMessage] = useState('');
  const [showMessageTone, setShowMessageTone] = useState<NoticeTone>('success');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<HostedEvent | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [editImagePreview, setEditImagePreview] = useState('');
  const tabs = ['Active', 'Past', 'Drafts'];

  // Get current user ID from localStorage
  const getCurrentUserId = () => {
    const userStr = localStorage.getItem('userId');
    return userStr ? userStr.replace(/"/g, '') : null;
  };

  const openPersonProfile = (person: InterestedPerson) => {
    // Navigate to public host profile instead of full profile
    if (setSelectedUser && onNavigate) {
      onNavigate('public-profile');
      // Pass the hostId through context/state
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('publicHostId', person.userId || person.profileId || person.id);
      }
    }
  };

  const showNotice = (message: string, tone: NoticeTone = getNoticeTone(message), duration = 2000) => {
    setShowMessage(message);
    setShowMessageTone(tone);
    setTimeout(() => {
      setShowMessage('');
      setShowMessageTone('success');
    }, duration);
  };

  // Fetch user's hosted events
  useEffect(() => {
    const fetchHostedEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const userId = getCurrentUserId();
        
        if (!userId) {
          setError('Please log in to view your requests');
          setLoading(false);
          return;
        }

        // Fetch events hosted by current user
        const eventsResponse = await API.getHostEvents(userId);
        const events = eventsResponse.events || [];

        // Fetch applications for each event
        const eventsWithApps = await Promise.all(
          events.map(async (event: any) => {
            try {
              const appsResponse = await API.getEventApplications(event.id);
              return mapHostedEvent(event, (appsResponse.applications || []).map(mapApplicationToPerson));
            } catch (err) {
              return mapHostedEvent(event, []);
            }
          })
        );

        const localApplications = readStoredEventApplications().map(mapApplicationToPerson);

        const eventsWithMergedApps = eventsWithApps.map((event) => ({
          ...event,
          applications: mergeApplicationLists(
            event.applications || [],
            localApplications.filter((application) => String(application.eventId || '') === String(event.id))
          ),
        }));

        try {
          const deletedEvents = readDeletedEventTombstones();
          setHostedEvents(eventsWithMergedApps.filter((event) => !isDeletedEvent(event, deletedEvents)));
        } catch {
          setHostedEvents(eventsWithMergedApps);
        }
      } catch (err: any) {
        console.error('Failed to fetch hosted events:', err);
        setError(err.message || 'Failed to load your events');
      } finally {
        setLoading(false);
      }
    };

    fetchHostedEvents();
  }, []);

  const updateApplicationStatusLocal = (eventId: string, applicationKey: string, nextStatus: 'accepted' | 'declined') => {
    setHostedEvents((current) =>
      current.map((event) =>
        event.id === eventId
          ? {
              ...event,
              applications: event.applications.map((person) =>
                String(person.id) === String(applicationKey) ||
                String(person.applicationId || '') === String(applicationKey) ||
                String(person.backendId || '') === String(applicationKey)
                  ? { ...person, status: nextStatus }
                  : person
              ),
            }
          : event
      )
    );

    try {
      const storedApplications = readStoredEventApplications();
      const nextStoredApplications = storedApplications.map((application: any) => {
        const matchesEvent = String(application.event_id || '') === String(eventId);
        const matchesApplication =
          String(application.id || application.application_id || application.backend_id || '') === String(applicationKey);

        if (!matchesEvent || !matchesApplication) {
          return application;
        }

        return {
          ...application,
          status: nextStatus === 'accepted' ? 'accepted' : 'declined',
        };
      });

      writeStoredEventApplications(nextStoredApplications);
    } catch (storageError) {
      console.error('Failed to persist application status locally:', storageError);
    }
  };

  const handleApplicationDecision = async (
    eventId: string,
    person: InterestedPerson,
    nextStatus: 'accepted' | 'declined'
  ) => {
    updateApplicationStatusLocal(eventId, person.id, nextStatus);

    const backendId = person.backendId || person.applicationId;
    if (backendId) {
      try {
        await API.updateApplicationStatus(backendId, nextStatus === 'accepted' ? 'accepted' : 'rejected');
      } catch (error) {
        console.error('Failed to update application status on the backend:', error);
      }
    }

    showNotice(nextStatus === 'accepted' ? 'Application accepted! 🎉' : 'Application declined', 'success');
  };

  const removeEventFromLocalState = (eventId: string) => {
    let removedEvent: HostedEvent | undefined;
    setHostedEvents((current) => {
      removedEvent = current.find((event) => event.id === eventId);
      return current.filter((event) => event.id !== eventId);
    });

    try {
      const storedEventsRaw = localStorage.getItem('junto-created-events');
      const storedEvents = storedEventsRaw ? JSON.parse(storedEventsRaw) : [];
      if (Array.isArray(storedEvents)) {
        const nextStoredEvents = storedEvents.filter((event: any) => {
          if (String(event.id) === String(eventId)) {
            return false;
          }

          if (!removedEvent) {
            return true;
          }

          return normalizeEventSignature(event) !== normalizeEventSignature(removedEvent);
        });
        localStorage.setItem('junto-created-events', JSON.stringify(nextStoredEvents));
      }
    } catch (storageError) {
      console.error('Failed to remove deleted event from local storage:', storageError);
    }

    try {
      const deletedEvents = readDeletedEventTombstones();
      const nextDeletedEvents = [...deletedEvents];
      const tombstone = removedEvent
        ? {
            id: String(eventId),
            host_id: String(removedEvent.host_id || ''),
            title: removedEvent.title || '',
            event_date: removedEvent.event_date || '',
            event_time: removedEvent.event_time || '',
            location_city: removedEvent.location_city || '',
          }
        : {
            id: String(eventId),
            host_id: '',
            title: '',
            event_date: '',
            event_time: '',
            location_city: '',
          };

      if (!nextDeletedEvents.some((entry) => entry.id === tombstone.id || normalizeEventSignature(entry) === normalizeEventSignature(tombstone))) {
        nextDeletedEvents.push(tombstone);
      }
      localStorage.setItem(deletedEventsKey, JSON.stringify(nextDeletedEvents));
    } catch (deletedStorageError) {
      console.error('Failed to store deleted event tombstone:', deletedStorageError);
    }

    if (selectedEventId === eventId) {
      setSelectedEventId(null);
      setShowInterestedModal(false);
    }

    if (editingEvent?.id === eventId) {
      closeEditModal();
    }
  };

  const syncUpdatedEventLocally = (eventId: string, updatedFields: Record<string, any>) => {
    setHostedEvents((previous) =>
      previous.map((event) =>
        event.id === eventId
          ? {
              ...event,
              ...mapHostedEvent({ ...event, ...updatedFields, id: eventId }, event.applications),
            }
          : event
      )
    );

    try {
      const storedEventsRaw = localStorage.getItem('junto-created-events');
      const storedEvents = storedEventsRaw ? JSON.parse(storedEventsRaw) : [];
      const nextStoredEvents = Array.isArray(storedEvents) ? [...storedEvents] : [];
      const existingIndex = nextStoredEvents.findIndex((event: any) => String(event.id) === String(eventId));
      const nextStoredEvent = {
        ...(existingIndex >= 0 ? nextStoredEvents[existingIndex] : {}),
        ...updatedFields,
        id: eventId,
        title: updatedFields.title,
        description: updatedFields.description,
        date: updatedFields.event_date,
        event_date: updatedFields.event_date,
        event_time: updatedFields.event_time,
        location_city: updatedFields.location_city,
        max_guests: updatedFields.max_guests,
        coverImage: updatedFields.cover_photo_url || fallbackCoverImage,
        cover_photo_url: updatedFields.cover_photo_url || undefined,
        status: updatedFields.status,
      };

      if (existingIndex >= 0) {
        nextStoredEvents[existingIndex] = nextStoredEvent;
      } else {
        nextStoredEvents.unshift(nextStoredEvent);
      }

      localStorage.setItem('junto-created-events', JSON.stringify(nextStoredEvents));
    } catch (storageError) {
      console.error('Failed to update stored event:', storageError);
    }
  };

  const handleWithdrawEvent = async (eventId: string) => {
    try {
      await API.deleteEvent(eventId);
      removeEventFromLocalState(eventId);
      showNotice('Event deleted', 'success');
    } catch (err) {
      console.error('Failed to delete event:', err);
      const message = err instanceof Error ? err.message : 'Could not delete event';
      if (isBenignEventResponse(message)) {
        removeEventFromLocalState(eventId);
        showNotice('Event deleted', 'success');
      } else {
        showNotice(message || 'Could not delete event', 'error');
      }
    }
  };

  const activeRequests = hostedEvents.filter((event) => !isEventExpired(event.event_date, event.event_time, event.status));
  const pastRequests = hostedEvents.filter((event) => isEventExpired(event.event_date, event.event_time, event.status));

  const sortedRequests = [...activeRequests].sort((a, b) => {
    if (sortBy === 'most-interested') {
      return (b.applications?.length || 0) - (a.applications?.length || 0);
    }
    return 0; // recent is default order
  });

  const openInterestedModal = (eventId: string) => {
    setSelectedEventId(eventId);
    setShowInterestedModal(true);
  };

  const selectedEvent = selectedEventId ? hostedEvents.find(e => e.id === selectedEventId) : null;

  const openEditModal = (event: HostedEvent) => {
    setEditingEvent(event);
    setEditImagePreview(event.cover_photo_url || event.coverImage || '');
    setEditError('');
  };

  const closeEditModal = () => {
    setEditingEvent(null);
    setEditImagePreview('');
    setEditError('');
    setEditSaving(false);
  };

  const handleEditImageUpload = (file: File | null) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setEditError('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setEditImagePreview(String(event.target?.result || ''));
      setEditError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEdit = async (formData: {
    title: string;
    description: string;
    event_date: string;
    event_time: string;
    location_city: string;
    max_guests: number;
    cover_photo_url: string;
  }) => {
    if (!editingEvent) return;

    setEditSaving(true);
    setEditError('');

    const normalizedStatus = isEventExpired(formData.event_date, formData.event_time) ? 'completed' : 'active';
    const payload = {
      title: formData.title,
      description: formData.description,
      location_city: formData.location_city,
      event_date: formData.event_date,
      event_time: formData.event_time,
      max_guests: formData.max_guests,
      cover_photo_url: formData.cover_photo_url || undefined,
      status: normalizedStatus,
    };

    try {
      const updatedEvent = await API.updateEvent(editingEvent.id, payload);

      setHostedEvents((previous) =>
        previous.map((event) =>
          event.id === editingEvent.id
            ? {
                ...event,
                ...mapHostedEvent({ ...event, ...updatedEvent, ...payload }, event.applications),
              }
            : event
        )
      );

      try {
        const storedEventsRaw = localStorage.getItem('junto-created-events');
        const storedEvents = storedEventsRaw ? JSON.parse(storedEventsRaw) : [];
        const nextStoredEvents = Array.isArray(storedEvents) ? [...storedEvents] : [];
        const existingIndex = nextStoredEvents.findIndex((event: any) => String(event.id) === String(editingEvent.id));
        const nextStoredEvent = {
          ...(existingIndex >= 0 ? nextStoredEvents[existingIndex] : {}),
          ...payload,
          id: editingEvent.id,
          title: payload.title,
          description: payload.description,
          date: payload.event_date,
          event_date: payload.event_date,
          event_time: payload.event_time,
          location_city: payload.location_city,
          max_guests: payload.max_guests,
          coverImage: payload.cover_photo_url || fallbackCoverImage,
          cover_photo_url: payload.cover_photo_url || undefined,
          status: normalizedStatus,
        };

        if (existingIndex >= 0) {
          nextStoredEvents[existingIndex] = nextStoredEvent;
        } else {
          nextStoredEvents.unshift(nextStoredEvent);
        }

        localStorage.setItem('junto-created-events', JSON.stringify(nextStoredEvents));
      } catch (storageError) {
        console.error('Failed to update stored event:', storageError);
      }

      showNotice('Event updated successfully', 'success');
      closeEditModal();
    } catch (err: any) {
      console.error('Failed to update event:', err);
      const message = err?.message || 'Failed to update your event';

      if (isBenignEventResponse(message)) {
        syncUpdatedEventLocally(editingEvent.id, {
          ...payload,
          title: payload.title,
          description: payload.description,
          date: payload.event_date,
          event_date: payload.event_date,
          event_time: payload.event_time,
          location_city: payload.location_city,
          max_guests: payload.max_guests,
          coverImage: payload.cover_photo_url || fallbackCoverImage,
          cover_photo_url: payload.cover_photo_url || undefined,
          status: normalizedStatus,
        });
        showNotice('Event updated successfully', 'success');
        closeEditModal();
      } else {
        setEditError(message);
      }
    } finally {
      setEditSaving(false);
    }
  };

  const InterestedModal = () => {
    if (!showInterestedModal || !selectedEvent) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-[#1A1A21] border border-white/10 rounded-3xl max-w-md w-full max-h-[80vh] flex flex-col"
        >
        <div className="flex items-center justify-between p-6 border-b border-white/5">
            <div>
              <h3 className="text-xl font-semibold text-white">{selectedEvent.applications?.length || 0} requests</h3>
              <p className="text-sm text-gray-400 mt-1">{selectedEvent.title}</p>
            </div>
            <button
              onClick={() => setShowInterestedModal(false)}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {selectedEvent.applications && selectedEvent.applications.length > 0 ? (
              selectedEvent.applications.map((person) => (
                <div key={person.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="text-3xl flex-shrink-0 cursor-pointer hover:opacity-75 transition-opacity" onClick={() => {
                      setShowInterestedModal(false);
                      openPersonProfile(person);
                    }}>
                      {person.avatar || '👤'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p 
                        className="font-semibold text-white truncate cursor-pointer hover:text-[#F59E0B] transition-colors"
                        onClick={() => {
                          setShowInterestedModal(false);
                          openPersonProfile(person);
                        }}>
                        {person.name}
                      </p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        <Clock size={12} /> {person.joinedAt}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap ${
                      person.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                      person.status === 'declined' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {person.status}
                    </span>
                  </div>
                  {person.message && (
                    <p className="text-sm text-gray-300 mb-3 italic">"{person.message}"</p>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => openPersonProfile(person)} className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#F59E0B]/20 hover:bg-[#F59E0B]/30 text-[#FBBF24] rounded-xl text-sm font-medium transition-colors">
                      <Eye size={14} /> View profile
                    </button>
                    {person.status === 'interested' && (
                      <>
                        <button
                          onClick={() => handleApplicationDecision(selectedEvent.id, person, 'accepted')}
                          className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl text-sm font-medium transition-colors">
                          <Check size={14} /> Accept
                        </button>
                        <button
                          onClick={() => handleApplicationDecision(selectedEvent.id, person, 'declined')}
                          className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl text-sm font-medium transition-colors">
                          <X size={14} /> Decline
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Users size={32} className="mx-auto mb-3 opacity-50" />
                <p>No requests yet</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    );
  };

  const EditEventModal = () => {
    const [title, setTitle] = useState(editingEvent?.title || '');
    const [description, setDescription] = useState(editingEvent?.description || '');
    const [eventDate, setEventDate] = useState(editingEvent?.event_date || '');
    const [eventTime, setEventTime] = useState(editingEvent?.event_time || '');
    const [locationCity, setLocationCity] = useState(editingEvent?.location_city || '');
    const [maxGuests, setMaxGuests] = useState(String(editingEvent?.max_guests || 0));

    useEffect(() => {
      setTitle(editingEvent?.title || '');
      setDescription(editingEvent?.description || '');
      setEventDate(editingEvent?.event_date || '');
      setEventTime(editingEvent?.event_time || '');
      setLocationCity(editingEvent?.location_city || '');
      setMaxGuests(String(editingEvent?.max_guests || 0));
      setEditImagePreview(editingEvent?.cover_photo_url || editingEvent?.coverImage || '');
      setEditError('');
    }, [editingEvent]);

    if (!editingEvent) return null;

    const handleSubmit = async (event: React.FormEvent) => {
      event.preventDefault();
      if (!title.trim() || !eventDate || !eventTime || !locationCity.trim()) {
        setEditError('Please fill in title, date, time, and location');
        return;
      }

      await handleSaveEdit({
        title: title.trim(),
        description: description.trim(),
        event_date: eventDate,
        event_time: eventTime,
        location_city: locationCity.trim(),
        max_guests: Number(maxGuests) || 0,
        cover_photo_url: editImagePreview || '',
      });
    };

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 12 }}
          className="bg-[#1A1A21] border border-white/10 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <div>
              <h3 className="text-xl font-semibold text-white">Edit Event</h3>
              <p className="text-sm text-gray-400 mt-1">Update details, date, and cover image.</p>
            </div>
            <button
              onClick={closeEditModal}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {editError && (
              <div
                className={`rounded-2xl px-4 py-3 text-sm ${
                  getNoticeTone(editError) === 'success'
                    ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
                    : 'border border-red-500/20 bg-red-500/10 text-red-300'
                }`}
              >
                {editError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#F59E0B]/50"
                  placeholder="Event title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#F59E0B]/50"
                  placeholder="Tell guests what to expect"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#F59E0B]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Time</label>
                  <input
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#F59E0B]/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                  <input
                    value={locationCity}
                    onChange={(e) => setLocationCity(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#F59E0B]/50"
                    placeholder="City or venue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Max Guests</label>
                  <input
                    type="number"
                    min={1}
                    value={maxGuests}
                    onChange={(e) => setMaxGuests(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#F59E0B]/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Cover Image</label>
                {editImagePreview ? (
                  <div className="relative mb-3 overflow-hidden rounded-2xl border border-white/10">
                    <img
                      src={editImagePreview}
                      alt="Event cover preview"
                      className="h-52 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setEditImagePreview('')}
                      className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="mb-3 rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-gray-400">
                    Upload a new event image or paste an image URL below.
                  </div>
                )}

                <input
                  type="text"
                  value={editImagePreview}
                  onChange={(e) => setEditImagePreview(e.target.value)}
                  className="mb-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#F59E0B]/50"
                  placeholder="Image URL or data URL"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleEditImageUpload(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-400 file:mr-4 file:rounded-full file:border-0 file:bg-[#F59E0B] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#F59E0B]/90"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={closeEditModal}
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-gray-300 hover:bg-white/10"
                disabled={editSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editSaving}
                className="flex-1 rounded-2xl bg-[#F59E0B] px-4 py-3 text-sm font-semibold text-white hover:bg-[#F59E0B]/90 disabled:opacity-70"
              >
                {editSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#0F0F13]">
      {showMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-6 right-6 rounded-2xl px-6 py-3 font-medium shadow-lg z-50 ${
            showMessageTone === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-200'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {showMessageTone === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-400" />
            ) : (
              <AlertCircle size={18} className="text-rose-400" />
            )}
            <span>{showMessage}</span>
          </div>
        </motion.div>
      )}
      
      <main className="flex-1 ml-0 md:ml-0 lg:ml-0 overflow-auto">
        <div className="p-6 md:p-8 max-w-6xl mx-auto">
          <motion.div
            initial={{
              opacity: 0,
              y: 10
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            transition={{
              duration: 0.3
            }}>
            


            {/* Header */}
            <div className="mb-10">
              <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 tracking-tight">
                Your <span className="italic text-gradient font-normal">vibes.</span>
              </h2>
              <p className="text-gray-400 text-lg">
                Track who's tagging along with your plans.
              </p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              <div className="bg-[#1A1A21] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#F59E0B]/10 flex items-center justify-center">
                  <Calendar className="text-[#F59E0B]" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Active events</p>
                  <p className="text-xl font-bold text-white">{activeRequests.length}</p>
                </div>
              </div>
              <div className="bg-[#1A1A21] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#4ECDC4]/10 flex items-center justify-center">
                  <Users className="text-[#4ECDC4]" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total interested</p>
                  <p className="text-xl font-bold text-white">{activeRequests.reduce((sum, e) => sum + (e.applications?.length || 0), 0)}</p>
                </div>
              </div>
              <div className="bg-[#1A1A21] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#FB7185]/10 flex items-center justify-center">
                  <CheckCircle2 className="text-[#FB7185]" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Completed hangouts</p>
                  <p className="text-xl font-bold text-white">{pastRequests.length}</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-6 border-b border-white/5 mb-8">
              {tabs.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-4 text-sm font-medium transition-colors relative ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
                    
                    {tab}
                    {isActive &&
                    <motion.div
                      layoutId="myRequestsTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F59E0B]"
                      initial={false}
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 30
                      }} />

                    }
                  </button>);

              })}
            </div>

            {/* Sorting Controls */}
            {activeTab === 'Active' && (
              <div className="mb-8 flex gap-3">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'recent' | 'most-interested')}
                  className="bg-[#1A1A21] border border-white/5 rounded-full px-4 py-2 text-sm text-gray-400 focus:outline-none focus:border-[#F59E0B]/50 transition-colors"
                >
                  <option value="recent">Most recent</option>
                  <option value="most-interested">Most interested</option>
                </select>
              </div>
            )}

            {/* Tab Content */}
            <div className="pb-20">
              {loading && (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="animate-spin text-[#F59E0B]" size={32} />
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 mb-6">
                  <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
                  <p className="text-red-400">{error}</p>
                </div>
              )}

              {activeTab === 'Active' && !loading && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {sortedRequests.length > 0 ? (
                    sortedRequests.map((req) => (
                      <div
                        key={req.id}
                        className="bg-[#1A1A21] border border-white/5 rounded-3xl overflow-hidden group hover:border-white/10 transition-colors flex flex-col"
                      >
                        <div
                          className="h-36 w-full relative overflow-hidden bg-cover bg-center"
                          style={{
                            backgroundImage: `linear-gradient(to top, rgba(26,26,33,0.95), rgba(26,26,33,0.2)), url(${req.cover_photo_url || req.coverImage || fallbackCoverImage})`,
                          }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Calendar className="text-white/20" size={48} />
                          </div>
                        </div>
                        <div className="p-6 flex flex-col flex-1 relative z-10 -mt-6">
                          <div className="flex justify-between items-start mb-2 gap-3">
                            <h3 className="text-xl font-semibold text-white leading-tight">
                              {req.title}
                            </h3>
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                req.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                              }`}
                            >
                              {req.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                            <Calendar size={14} />
                            {req.event_date} {req.event_time && `· ${req.event_time}`}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mb-6">
                            <MapPin size={12} /> {req.location_city}
                          </div>

                          <div className="flex items-center justify-between mb-6 mt-auto">
                            <div className="flex items-center gap-2">
                              <div className="flex -space-x-2">
                                {(req.applications || []).slice(0, 3).map((app, i) => (
                                  <div
                                    key={i}
                                    className="w-8 h-8 rounded-full border-2 border-[#1A1A21] bg-gradient-to-br from-[#F59E0B] to-[#4ECDC4] flex items-center justify-center text-[10px] font-bold text-white"
                                  >
                                    {app.name?.charAt(0).toUpperCase() || '?'}
                                  </div>
                                ))}
                              </div>
                              <span className="text-sm text-gray-300 font-medium ml-2">
                                <span className="text-white">
                                  {req.applications?.length || 0}
                                </span>{' '}
                                interested
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => openInterestedModal(req.id)}
                              className="flex-1 py-3 rounded-2xl bg-[#F59E0B] text-white font-semibold text-sm transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
                            >
                              <Eye size={16} /> View interested
                            </button>
                            <button
                              onClick={() => openEditModal(req)}
                              className="p-3 rounded-2xl bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                              title="Edit event"
                            >
                              <Edit3 size={18} />
                            </button>
                            <button
                              onClick={() => handleWithdrawEvent(req.id)}
                              className="p-3 rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                              title="Withdraw event"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center col-span-full">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                        <ImageIcon className="text-gray-500" size={24} />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        No active hangouts
                      </h3>
                      <p className="text-gray-400 max-w-sm">
                        Create your first event to see people interested in joining!
                      </p>
                    </div>
                  )}
              </div>
            )}

            {activeTab === 'Past' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {pastRequests.length > 0 ? (
                  pastRequests.map((req) => (
                    <div
                      key={req.id}
                      className="bg-[#1A1A21] border border-white/5 rounded-3xl overflow-hidden group hover:border-white/10 transition-colors flex flex-col opacity-90"
                    >
                      <div
                        className="h-36 w-full relative overflow-hidden bg-cover bg-center grayscale-[15%]"
                        style={{
                          backgroundImage: `linear-gradient(to top, rgba(26,26,33,0.96), rgba(26,26,33,0.25)), url(${req.cover_photo_url || req.coverImage || fallbackCoverImage})`,
                        }}
                      />
                      <div className="p-6 flex flex-col flex-1 relative z-10 -mt-6">
                        <div className="flex justify-between items-start mb-2 gap-3">
                          <h3 className="text-xl font-semibold text-white leading-tight">
                            {req.title}
                          </h3>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-500/20 text-gray-300">
                            expired
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                          <Calendar size={14} />
                          {req.event_date} {req.event_time && `· ${req.event_time}`}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-6">
                          <MapPin size={12} /> {req.location_city}
                        </div>
                        <p className="text-sm text-gray-400 mb-6">
                          This event is no longer visible on Discover, but you can update the date, time, or image and republish it here.
                        </p>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => openEditModal(req)}
                            className="flex-1 py-3 rounded-2xl bg-[#F59E0B] text-white font-semibold text-sm transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
                          >
                            <Edit3 size={16} /> Edit and republish
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center col-span-full">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                      <ImageIcon className="text-gray-500" size={24} />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      No past hangouts yet 👀
                    </h3>
                    <p className="text-gray-400 max-w-sm">
                      When an event expires, it will move here and you can bring it back by changing the date.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Drafts' &&
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <Edit3 className="text-gray-500" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  No drafts saved ✏️
                </h3>
                <p className="text-gray-400 max-w-sm">
                  Start creating a post and save it for later if you're not ready to
                  publish.
                </p>
              </div>
            }
            </div>

            <InterestedModal />
            <EditEventModalForm
              event={editingEvent}
              isOpen={Boolean(editingEvent)}
              isSaving={editSaving}
              error={editError}
              onClose={closeEditModal}
              onSave={handleSaveEdit}
            />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
