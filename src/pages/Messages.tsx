import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCheck,
  Clock3,
  Image as ImageIcon,
  Mic,
  Paperclip,
  PhoneCall,
  PhoneIncoming,
  PhoneMissed,
  PhoneOutgoing,
  Phone,
  Plus,
  Search,
  Send,
  Smile,
  Trash2,
  Video,
  Bell,
  X,
} from 'lucide-react';
import { CallModal } from '../components/CallModal';
import {
  ConversationRecord,
  MessageRecord,
  MessageStatus,
  MessageStore,
  createDefaultMessageStore,
  flushScheduledMessages,
  formatMessageClock,
  getMessageStoreKey,
  isConversationExpired,
  purgeExpiredConversations,
  readMessageStore,
  removeMessage,
  updateConversation,
  upsertMessage,
  writeMessageStore,
} from '../utils/messageStore';
import * as API from '../services/api';
import { resolveMediaUrl } from '../utils/avatar';
import type { WebRTCSignal } from '../hooks/useWebRTC';
import { RealtimeSocket } from '../services/realtimeSocket';

type SchedulePreset = 'now' | '5m' | '1h' | 'tomorrow';

interface MessagesProps {
  currentUser?: any;
  onNavigate?: (page: string) => void;
}

const scheduleLabels: Record<SchedulePreset, string> = {
  now: 'Send now',
  '5m': 'Send in 5 min',
  '1h': 'Send in 1 hr',
  tomorrow: 'Send tomorrow',
};

function getScheduleTime(preset: SchedulePreset): string | undefined {
  if (preset === 'now') return undefined;
  const next = new Date();
  if (preset === '5m') next.setMinutes(next.getMinutes() + 5);
  else if (preset === '1h') next.setHours(next.getHours() + 1);
  else next.setDate(next.getDate() + 1);
  return next.toISOString();
}

function summarizeMessage(message?: MessageRecord) {
  if (!message) return '';
  const text = coerceMessageText(message.text);
  if (message.status === 'scheduled') return '⏳ Scheduled message';
  if (message.type === 'image') return '📷 Photo';
  if (message.type === 'video') return '🎥 Video';
  if (message.type === 'voice') return `🎤 Voice note${message.duration ? ` · ${message.duration}` : ''}`;
  if (message.type === 'event_request') {
    const payload = parseEventRequestMessage(text);
    return payload?.title ? `Event request: ${payload.title}` : 'Event request';
  }
  if (message.type === 'system') return text || 'System message';
  return text;
}

function coerceMessageText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value && typeof value === 'object') {
    const candidate = value as { text?: unknown; message?: unknown; content?: unknown };
    if (typeof candidate.text === 'string' || typeof candidate.text === 'number' || typeof candidate.text === 'boolean') {
      return String(candidate.text);
    }
    if (typeof candidate.message === 'string' || typeof candidate.message === 'number' || typeof candidate.message === 'boolean') {
      return String(candidate.message);
    }
    if (typeof candidate.content === 'string' || typeof candidate.content === 'number' || typeof candidate.content === 'boolean') {
      return String(candidate.content);
    }
    try {
      return JSON.stringify(value);
    } catch {
      return '';
    }
  }
  return '';
}

type ParsedWebRTCSignal = WebRTCSignal & {
  __webrtc_signal__?: boolean;
  reason?: 'missed' | 'completed' | 'declined';
};

function parseWebRTCSignal(content?: string): ParsedWebRTCSignal | null {
  if (!content) return null;

  try {
    const parsed = JSON.parse(content) as ParsedWebRTCSignal;
    return parsed?.__webrtc_signal__ ? parsed : null;
  } catch {
    return null;
  }
}

type ParsedEventRequest = {
  __event_request__?: boolean;
  title?: string;
  date?: string;
  location?: string;
  note?: string;
  senderName?: string;
  recipientName?: string;
  createdAt?: string;
};

function parseEventRequestMessage(content?: string): ParsedEventRequest | null {
  if (!content) return null;

  try {
    const parsed = JSON.parse(content) as ParsedEventRequest;
    return parsed?.__event_request__ ? parsed : null;
  } catch {
    return null;
  }
}

function getCallModeLabel(mode?: 'audio' | 'video') {
  return mode === 'video' ? 'video call' : 'voice call';
}

type CallSummary = {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  tone: 'neutral' | 'success' | 'warning' | 'danger';
};

function getCallSummaryTone(text?: string): CallSummary['tone'] {
  if (!text) return 'neutral';
  if (text.includes('missed') || text.includes('declined')) return 'warning';
  if (text.includes('completed') || text.includes('answered')) return 'success';
  return 'neutral';
}

function getCallSummaryIcon(text?: string): CallSummary['icon'] {
  if (!text) return PhoneCall;
  if (text.includes('missed') || text.includes('declined')) return PhoneMissed;
  if (text.includes('Incoming')) return PhoneIncoming;
  if (text.includes('Outgoing')) return PhoneOutgoing;
  return PhoneCall;
}

function summarizeWebRTCSignal(
  signal: ParsedWebRTCSignal,
  currentUserId?: string,
  previousSignals: ParsedWebRTCSignal[] = []
): string {
  const callLabel = getCallModeLabel(signal.mode);
  const isMine = Boolean(currentUserId && String(signal.from || '') === String(currentUserId));

  if (signal.type === 'offer') {
    return isMine
      ? `Outgoing ${callLabel}`
      : `Incoming ${callLabel}`;
  }

  if (signal.type === 'answer') {
    return `${signal.mode === 'video' ? 'Video' : 'Voice'} call answered`;
  }

  if (signal.type === 'hang-up') {
    const explicitReason = signal.reason || (signal.payload && typeof signal.payload === 'object' ? signal.payload.reason : undefined);
    const answeredEarlier = previousSignals.some((entry) => entry.type === 'answer');
    const inferredReason = explicitReason || (answeredEarlier ? 'completed' : 'missed');

    if (inferredReason === 'completed') {
      return `${callLabel} completed`;
    }

    if (inferredReason === 'declined') {
      return `${callLabel} declined`;
    }

    return `${callLabel} missed`;
  }

  if (signal.type === 'ice-candidate') {
    return callLabel;
  }

  return callLabel;
}

function StatusDots() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 rounded-full bg-white/40 animate-pulse" />
      <span className="h-1.5 w-1.5 rounded-full bg-white/60 animate-pulse [animation-delay:120ms]" />
      <span className="h-1.5 w-1.5 rounded-full bg-white/40 animate-pulse [animation-delay:240ms]" />
    </span>
  );
}

function hashToConversationId(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash) + 1000;
}

function buildConversationColor(value: string) {
  const colors = ['bg-[#4ECDC4]', 'bg-[#38BDF8]', 'bg-[#FB7185]', 'bg-[#F59E0B]', 'bg-[#FF8E72]', 'bg-[#FF6B6B]'];
  return colors[Math.abs(hashToConversationId(value)) % colors.length];
}

function friendlyName(...candidates: Array<string | null | undefined>) {
  for (const candidate of candidates) {
    const value = String(candidate || '').trim();
    if (!value) continue;
    const stripped = value.replace(/[_-]+/g, ' ').replace(/\d+$/g, '').trim();
    if (!stripped) continue;
    if (stripped.includes(' ')) {
      return stripped.replace(/\s+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
    }
    return stripped.charAt(0).toUpperCase() + stripped.slice(1);
  }
  return 'Chat';
}

function resolvePeerId(conversation: ConversationRecord | undefined, targetUser: any, currentUserId?: string) {
  if (targetUser?.id) return String(targetUser.id);
  if (conversation?.peerUserId) return String(conversation.peerUserId);
  return currentUserId || '';
}

function resolveConversationKey(conversation: any, fallback: string) {
  const peerId = String(conversation?.other_user_id || conversation?.peerUserId || '');
  if (peerId) return hashToConversationId(peerId);
  const conversationId = String(conversation?.id || '');
  if (conversationId) return hashToConversationId(conversationId);
  return hashToConversationId(fallback);
}

function mergeMessageThreads(baseMessages: MessageRecord[], incomingMessages: MessageRecord[]): MessageRecord[] {
  const seen = new Set<string>();
  const merged: MessageRecord[] = [];
  for (const message of [...baseMessages, ...incomingMessages]) {
    const dedupeKey = `${message.id}|${message.createdAt}|${coerceMessageText(message.text)}|${message.from || ''}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    merged.push(message);
  }
  return merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

function formatDateDivider(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (msgDay.getTime() === today.getTime()) return 'Today';
  if (msgDay.getTime() === yesterday.getTime()) return 'Yesterday';

  return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}

function isSameDay(isoA: string, isoB: string): boolean {
  const a = new Date(isoA);
  const b = new Date(isoB);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function Messages({ currentUser: currentUserProp, onNavigate = () => {} }: MessagesProps) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [targetUser, setTargetUser] = useState<any>(null);
  const [store, setStore] = useState<MessageStore>(() => createDefaultMessageStore());
  const [isReady, setIsReady] = useState(false);
  const [activeConversation, setActiveConversation] = useState(store.activeConversationId ?? 1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'hangout'>('all');
  const [composeText, setComposeText] = useState('');
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const [callMode, setCallMode] = useState<'audio' | 'video' | null>(null);
  const [incomingSignal, setIncomingSignal] = useState<WebRTCSignal | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordStartedAt, setRecordStartedAt] = useState<number | null>(null);
  const [eventRequestViewer, setEventRequestViewer] = useState<ParsedEventRequest | null>(null);
  const [dismissedRequestIds, setDismissedRequestIds] = useState<string[]>([]);
  const [emojiBurst, setEmojiBurst] = useState('');
  const [schedulePreset, setSchedulePreset] = useState<SchedulePreset>('now');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [store.threads, activeConversation]);

  function handleStartCall(type: 'audio' | 'video') {
    setCallMode(type);
    setIncomingSignal(null);
  }

  function handleEndCall() {
    setCallMode(null);
    setIncomingSignal(null);
  }

  useEffect(() => {
    try {
      const storedUser = currentUserProp || API.getStoredCurrentUser();
      const resolvedUser = typeof storedUser === 'string' ? JSON.parse(storedUser) : storedUser;
      setCurrentUser(resolvedUser);

      const scopedUserId = String(resolvedUser?.id || API.getUserId() || '');
      const hydrated = writeMessageStore(
        purgeExpiredConversations(flushScheduledMessages(readMessageStore(scopedUserId || null))),
        scopedUserId || null
      );
      setStore(hydrated);
      setActiveConversation(hydrated.activeConversationId ?? hydrated.conversations[0]?.id ?? 1);
    } catch {
      setCurrentUser(null);
      const hydrated = writeMessageStore(
        purgeExpiredConversations(flushScheduledMessages(readMessageStore(null))),
        null
      );
      setStore(hydrated);
      setActiveConversation(hydrated.activeConversationId ?? hydrated.conversations[0]?.id ?? 1);
    }

    if (!currentUserProp && !API.getStoredCurrentUser()) {
      void API.verifySession()
        .then((session) => {
          if (!session?.user) return;
          setCurrentUser(session.user);
          const scopedUserId = String(session.user.id || API.getUserId() || '');
          const hydrated = writeMessageStore(
            purgeExpiredConversations(flushScheduledMessages(readMessageStore(scopedUserId || null))),
            scopedUserId || null
          );
          setStore(hydrated);
          setActiveConversation(hydrated.activeConversationId ?? hydrated.conversations[0]?.id ?? 1);
        })
        .catch((error) => console.error('Failed to restore message session:', error));
    }

    try {
      const targetRaw = window.sessionStorage.getItem('junto-message-target');
      setTargetUser(targetRaw ? JSON.parse(targetRaw) : null);
      window.sessionStorage.removeItem('junto-message-target');
    } catch {
      setTargetUser(null);
    }

    setIsReady(true);
  }, [currentUserProp]);

  useEffect(() => {
    if (!isReady || !currentUser?.id) return;

    let cancelled = false;
    let socket: RealtimeSocket | null = null;

    const syncBackendConversations = async () => {
      try {
        const response = await API.getConversations(currentUser.id);
        if (cancelled || !Array.isArray(response)) return;

        const backendConversations = await Promise.all(
          response.map(async (conversation: any) => {
            const conversationId = resolveConversationKey(conversation, String(conversation.id));
            const otherName = friendlyName(conversation.display_name, conversation.name, conversation.username, 'Chat');
            const otherInitial = otherName.trim().charAt(0).toUpperCase() || 'C';
            const threadResponse = await API.getConversation(String(conversation.id)).catch(() => ({ messages: [] }));
            const backendMessages = Array.isArray((threadResponse as any)?.messages) ? (threadResponse as any).messages : [];

            for (const msg of backendMessages) {
              const parsed = parseWebRTCSignal(msg.content);
              if (
                parsed?.__webrtc_signal__ &&
                parsed.type === 'offer' &&
                String(parsed.to || '') === String(currentUser.id) &&
                String(parsed.from || '') !== String(currentUser.id) &&
                !callMode
              ) {
                setCallMode(parsed.mode === 'video' ? 'video' : 'audio');
                setIncomingSignal(parsed);
              }
            }

            const parsedSignals = backendMessages.map((message: any) => parseWebRTCSignal(message.content));

            const mappedMessages: MessageRecord[] = backendMessages.map((message: any, index: number) => {
              const signal = parsedSignals[index];
              const previousSignals = parsedSignals.slice(0, index).filter(Boolean) as ParsedWebRTCSignal[];
              const parsedEventRequest = parseEventRequestMessage(String(message.content || ''));
              const senderIsCurrent = String(message.sender_id) === String(currentUser.id);
              const senderName = friendlyName(
                message.sender_display_name,
                message.sender_name,
                senderIsCurrent ? currentUser.display_name || currentUser.username || currentUser.name : otherName
              );

              if (signal) {
                return {
                  id: String(message.id),
                  from: senderName,
                  mine: senderIsCurrent,
                  type: 'system',
                  text: summarizeWebRTCSignal(signal, String(currentUser.id), previousSignals),
                  time: new Date(message.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  status: message.is_read ? 'read' : 'delivered',
                  createdAt: message.created_at || new Date().toISOString(),
                  deliveredAt: message.created_at || undefined,
                  readAt: message.read_at || undefined,
                };
              }

              return {
                id: String(message.id),
                from: senderName,
                mine: senderIsCurrent,
                type: parsedEventRequest ? 'event_request' : ((message.message_type || 'text') as MessageRecord['type']),
                text: message.content || '',
                url: message.media_url || undefined,
                time: new Date(message.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: message.is_read ? 'read' : 'delivered',
                createdAt: message.created_at || new Date().toISOString(),
                deliveredAt: message.created_at || undefined,
                readAt: message.read_at || undefined,
              };
            });

            return {
              conversationId,
              conversation: {
                id: conversationId,
                backendConversationId: String(conversation.id),
                peerUserId: String(conversation.other_user_id || ''),
                name: otherName,
                initial: otherInitial,
                color: buildConversationColor(String(conversation.other_user_id || conversation.id)),
                context: mappedMessages.length ? summarizeMessage(mappedMessages[mappedMessages.length - 1]) : 'Direct message',
                routeLabel: 'Direct chat',
                time: 'Now',
                unread: false,
                hangout: 'Direct message',
                eventId: conversation.event_id,
              } as ConversationRecord,
              messages: mappedMessages,
            };
          })
        );

        if (cancelled || backendConversations.length === 0) return;

        setStore((current) => {
          const nextConversations = [...current.conversations];
          const nextThreads = { ...current.threads };

          backendConversations.forEach(({ conversationId, conversation, messages }) => {
            const existingIndex = nextConversations.findIndex((item) => item.id === conversationId);
            if (existingIndex >= 0) {
              nextConversations[existingIndex] = { ...nextConversations[existingIndex], ...conversation };
            } else {
              nextConversations.unshift(conversation);
            }
            if (messages.length > 0) {
              nextThreads[conversationId] = messages;
            } else if (!nextThreads[conversationId]) {
              nextThreads[conversationId] = [];
            }
          });

          const sortedConversations = [...nextConversations].sort((a, b) => {
            const aThread = nextThreads[a.id] ?? [];
            const bThread = nextThreads[b.id] ?? [];
            const aLast = aThread[aThread.length - 1]?.createdAt ?? '';
            const bLast = bThread[bThread.length - 1]?.createdAt ?? '';
            return bLast.localeCompare(aLast);
          });

          return writeMessageStore({
            ...current,
            conversations: sortedConversations,
            threads: nextThreads,
            activeConversationId:
              sortedConversations.find((c) => c.id === activeConversation)?.id ??
              sortedConversations[0]?.id ??
              current.activeConversationId ??
              1,
          }, currentUser?.id);
        });
      } catch (error) {
        console.error('Failed to sync backend conversations:', error);
      }
    };

    void syncBackendConversations();
    const pollInterval = window.setInterval(() => void syncBackendConversations(), 5000);
    socket = new RealtimeSocket({
      onMessageCreated: () => void syncBackendConversations(),
      onConversationUpdated: () => void syncBackendConversations(),
      onConnectionOpen: () => console.log('Messages realtime connected'),
      onError: (error) => console.warn('Messages realtime error:', error),
    });
    return () => {
      cancelled = true;
      window.clearInterval(pollInterval);
      socket?.close();
    };
  }, [currentUser?.id, isReady]);

  useEffect(() => {
    if (!targetUser) return;

    const conversationId = hashToConversationId(String(targetUser.id || targetUser.profile_id || targetUser.name || 'chat'));
    const displayName = friendlyName(targetUser.display_name, targetUser.name, targetUser.username, 'Chat');
    const initial = displayName.trim().charAt(0).toUpperCase() || 'C';

    setStore((current) => {
      const existing = current.conversations.find((conversation) => conversation.id === conversationId);
      const nextConversation = existing || {
        id: conversationId,
        peerUserId: String(targetUser.id || ''),
        name: displayName,
        initial,
        color: buildConversationColor(String(targetUser.id || displayName)),
        context: 'Direct message',
        routeLabel: 'New chat',
        time: 'Now',
        unread: false,
        hangout: targetUser.city || 'Direct message',
      };

      return writeMessageStore(
        {
          ...current,
          conversations: existing
            ? current.conversations.map((c) => c.id === conversationId ? nextConversation : c)
            : [nextConversation, ...current.conversations],
          threads: current.threads[conversationId]
            ? current.threads
            : { ...current.threads, [conversationId]: [] },
          activeConversationId: conversationId,
        },
        currentUser?.id
      );
    });

    setActiveConversation(conversationId);
  }, [targetUser, currentUser?.id]);

  useEffect(() => {
    if (!isReady) return;
    writeMessageStore({ ...store, activeConversationId: activeConversation }, currentUser?.id);
  }, [activeConversation, isReady, store, currentUser?.id]);

  useEffect(() => {
    if (!isReady) return;
    const interval = window.setInterval(() => {
      setStore((current) => {
        const next = purgeExpiredConversations(flushScheduledMessages(current));
        return next === current ? current : next;
      });
    }, 15000);
    return () => window.clearInterval(interval);
  }, [isReady]);

  useEffect(() => {
    if (!isReady) return;
    const handleStorage = (event: StorageEvent) => {
      const scopedKey = getMessageStoreKey(currentUser?.id);
      if (event.key && event.key !== scopedKey) return;
      setStore(readMessageStore(currentUser?.id));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [isReady, currentUser?.id]);

  useEffect(() => {
    if (!store.conversations.some((c) => c.id === activeConversation)) {
      setActiveConversation(store.conversations[0]?.id ?? 1);
    }
  }, [activeConversation, store.conversations]);

  const activeConversationData: ConversationRecord | undefined = useMemo(() => {
    return store.conversations.find((c) => c.id === activeConversation) ?? store.conversations[0];
  }, [activeConversation, store.conversations]);

  const activeConversationLabel = friendlyName(activeConversationData?.name, activeConversationData?.context, 'Chat');
  const activeMessages = store.threads[activeConversation] ?? [];

  const filteredConversations = useMemo(() => {
    return store.conversations.filter((conversation) => {
      const conversationThread = store.threads[conversation.id] ?? [];
      const lastMessage = conversationThread[conversationThread.length - 1];
      const haystack = [conversation.name, conversation.context, conversation.hangout, summarizeMessage(lastMessage)]
        .join(' ')
        .toLowerCase();
      const matchesSearch = !search || haystack.includes(search.toLowerCase());
      const matchesFilter =
        filter === 'all' ||
        (filter === 'unread' && conversation.unread) ||
        (filter === 'hangout' && !!conversation.hangout);
      return matchesSearch && matchesFilter;
    });
  }, [filter, search, store.conversations, store.threads]);

  const activeLastMessage = activeMessages[activeMessages.length - 1];
  const replyHint = activeConversationData?.typing
    ? `${activeConversationLabel} is typing…`
    : 'Tap to send a reply';

  const activeConversationExpired = activeConversationData ? isConversationExpired(activeConversationData) : false;
  const deletionWindowHours = activeConversationData?.deleteAfterHours ?? 24;

  const deletionDeadlineLabel = useMemo(() => {
    if (!activeConversationData?.eventEndsAt) return null;
    const eventEnd = new Date(activeConversationData.eventEndsAt);
    const deleteAt = new Date(eventEnd.getTime() + deletionWindowHours * 60 * 60 * 1000);
    return deleteAt.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }, [activeConversationData, deletionWindowHours]);

  const updateStore = (updater: (current: MessageStore) => MessageStore) => {
    setStore((current) => updater(current));
  };

  const markConversationRead = (conversationId: number) => {
    updateStore((current) => updateConversation(current, conversationId, { unread: false, time: 'Just now' }));
  };

  const handleSelectConversation = (conversationId: number) => {
    setActiveConversation(conversationId);
    markConversationRead(conversationId);
    setMobileShowChat(true);

    const conversation = store.conversations.find((item) => item.id === conversationId);
    if (conversation?.backendConversationId) {
      void (async () => {
        try {
          const backendConversationId = conversation.backendConversationId ?? String(conversation.id);
          const response = await API.getConversation(backendConversationId);
          const backendMessages = Array.isArray(response?.messages) ? response.messages : [];
          const parsedSignals = backendMessages.map((message: any) => parseWebRTCSignal(message.content));
          const normalizedMessages: MessageRecord[] = backendMessages.map((message: any, index: number) => {
            const signal = parsedSignals[index];
            const previousSignals = parsedSignals.slice(0, index).filter(Boolean) as ParsedWebRTCSignal[];
            const parsedEventRequest = parseEventRequestMessage(String(message.content || ''));
            const senderIsCurrent = String(message.sender_id) === String(currentUser?.id);
            const senderName = friendlyName(
              message.sender_display_name,
              message.sender_name,
              senderIsCurrent
                ? currentUser?.display_name || currentUser?.username || currentUser?.name
                : conversation.name
            );

            if (signal) {
              return {
                id: String(message.id),
                from: senderName,
                mine: senderIsCurrent,
                type: 'system',
                text: summarizeWebRTCSignal(signal, String(currentUser?.id), previousSignals),
                url: undefined,
                time: new Date(message.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: message.is_read ? 'read' : 'delivered',
                createdAt: message.created_at || new Date().toISOString(),
                deliveredAt: message.created_at || undefined,
                readAt: message.read_at || undefined,
              };
            }

            return {
              id: String(message.id),
              from: senderName,
              mine: senderIsCurrent,
              type: parsedEventRequest ? 'event_request' : ((message.message_type || 'text') as MessageRecord['type']),
              text: message.content || '',
              url: message.media_url || undefined,
              time: new Date(message.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: message.is_read ? 'read' : 'delivered',
              createdAt: message.created_at || new Date().toISOString(),
              deliveredAt: message.created_at || undefined,
              readAt: message.read_at || undefined,
            };
          });

          if (!normalizedMessages.length) return;

          setStore((current) => {
            const currentThread = current.threads[conversationId] ?? [];
            const nextThread = mergeMessageThreads(currentThread, normalizedMessages);
            return writeMessageStore(
              {
                ...current,
                threads: { ...current.threads, [conversationId]: nextThread },
                conversations: [
                  {
                    ...current.conversations.find((item) => item.id === conversationId)!,
                    context: summarizeMessage(nextThread[nextThread.length - 1]) || '',
                    time: 'Just now',
                    unread: false,
                  },
                  ...current.conversations.filter((item) => item.id !== conversationId),
                ],
              },
              currentUser?.id
            );
          });

          await API.markMessagesAsRead(backendConversationId).catch((error) => {
            console.error('Failed to mark conversation as read:', error);
          });
        } catch (error) {
          console.error('Failed to refresh conversation thread:', error);
        }
      })();
    }
  };

  const handleSend = () => {
    const value = composeText.trim();
    if (!value || !activeConversationData) return;

    const scheduledFor = getScheduleTime(schedulePreset);
    const status: MessageStatus = scheduledFor ? 'scheduled' : 'read';
    const now = new Date().toISOString();
    const senderName = friendlyName(currentUser?.display_name, currentUser?.username, currentUser?.name, 'You');
    const message: MessageRecord = {
      id: `${activeConversation}-${Date.now()}`,
      from: senderName,
      mine: true,
      type: 'text',
      text: value,
      time: scheduledFor ? scheduleLabels[schedulePreset] : formatMessageClock(),
      status,
      createdAt: now,
      scheduledFor,
      deliveredAt: scheduledFor ? undefined : now,
      readAt: scheduledFor ? undefined : now,
    };

    updateStore((current) => {
      const next = updateConversation(upsertMessage(current, activeConversation, message), activeConversation, {
        unread: false,
        time: scheduledFor ? scheduleLabels[schedulePreset] : 'Just now',
      });
      return {
        ...next,
        conversations: [
          next.conversations.find((c) => c.id === activeConversation)!,
          ...next.conversations.filter((c) => c.id !== activeConversation),
        ],
      };
    });

    const targetRecipientId = resolvePeerId(activeConversationData, targetUser, currentUser?.id);
    if (currentUser?.id && targetRecipientId && targetRecipientId !== currentUser.id) {
      void API.sendMessage(null, targetRecipientId, value, 'text').catch((error) => {
        console.error('Failed to send backend message:', error);
      });
    }

    setComposeText('');
    setSchedulePreset('now');
    setEmojiBurst(scheduledFor ? `Queued for ${scheduleLabels[schedulePreset]}` : 'Sent');
    window.setTimeout(() => setEmojiBurst(''), 1500);
  };

  const handleAttachment = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeConversationData) return;

    const url = URL.createObjectURL(file);
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');
    const messageType: MessageRecord['type'] = isImage ? 'image' : isVideo ? 'video' : 'voice';
    const now = new Date().toISOString();
    const senderName = friendlyName(currentUser?.display_name, currentUser?.username, currentUser?.name, 'You');

    updateStore((current) =>
      updateConversation(
        upsertMessage(current, activeConversation, {
          id: `${activeConversation}-${Date.now()}`,
          from: senderName,
          mine: true,
          type: messageType,
          url,
          duration: isAudio ? '0:18' : undefined,
          text: isImage ? undefined : file.name,
          time: formatMessageClock(),
          status: 'delivered',
          createdAt: now,
          deliveredAt: now,
          readAt: now,
        }),
        activeConversation,
        { unread: false, time: 'Just now' }
      )
    );

    const targetRecipientId = resolvePeerId(activeConversationData, targetUser, currentUser?.id);
    if (currentUser?.id && targetRecipientId && targetRecipientId !== currentUser.id) {
      void API.sendMessage(null, targetRecipientId, file.name, messageType).catch((error) => {
        console.error('Failed to send backend attachment message:', error);
      });
    }

    event.target.value = '';
    setEmojiBurst('Attachment sent');
    window.setTimeout(() => setEmojiBurst(''), 1500);
  };

  const handleSendVoice = () => {
    if (!activeConversationData) return;

    if (!isRecording) {
      setIsRecording(true);
      setRecordStartedAt(Date.now());
      return;
    }

    const startedAt = recordStartedAt ?? Date.now();
    const durationSeconds = Math.max(3, Math.round((Date.now() - startedAt) / 1000));
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = String(durationSeconds % 60).padStart(2, '0');
    const now = new Date().toISOString();
    const senderName = friendlyName(currentUser?.display_name, currentUser?.username, currentUser?.name, 'You');

    updateStore((current) =>
      updateConversation(
        upsertMessage(current, activeConversation, {
          id: `${activeConversation}-${Date.now()}`,
          from: senderName,
          mine: true,
          type: 'voice',
          duration: `${minutes}:${seconds}`,
          text: 'Voice note',
          time: formatMessageClock(),
          status: 'delivered',
          createdAt: now,
          deliveredAt: now,
          readAt: now,
        }),
        activeConversation,
        { unread: false, time: 'Just now' }
      )
    );

    const targetRecipientId = resolvePeerId(activeConversationData, targetUser, currentUser?.id);
    if (currentUser?.id && targetRecipientId && targetRecipientId !== currentUser.id) {
      void API.sendMessage(null, targetRecipientId, 'Voice note', 'voice').catch((error) => {
        console.error('Failed to send backend voice message:', error);
      });
    }

    setIsRecording(false);
    setRecordStartedAt(null);
    setEmojiBurst('Voice note sent');
    window.setTimeout(() => setEmojiBurst(''), 1500);
  };

  const handleDeleteMessage = (messageId: string) => {
    updateStore((current) => removeMessage(current, activeConversation, messageId));
  };

  const hasConversation = Boolean(store.conversations.length);

  const messagesWithDividers = useMemo(() => {
    type DividerItem = { type: 'divider'; label: string; key: string };
    type MessageItem = { type: 'message'; message: MessageRecord };
    const items: Array<DividerItem | MessageItem> = [];

    activeMessages.forEach((message, index) => {
      const prev = activeMessages[index - 1];
      const needsDivider = !prev || !isSameDay(prev.createdAt, message.createdAt);
      if (needsDivider) {
        items.push({
          type: 'divider',
          label: formatDateDivider(message.createdAt),
          key: `divider-${message.createdAt}`,
        });
      }
      items.push({ type: 'message', message });
    });

    return items;
  }, [activeMessages]);

  return (
    <>
      {/* Full-screen call modal */}
      {callMode && activeConversationData?.backendConversationId && currentUser?.id && activeConversationData?.peerUserId && (
        <CallModal
          type={callMode}
          name={activeConversationLabel}
          localUserId={String(currentUser.id)}
          remoteUserId={String(activeConversationData.peerUserId)}
          conversationId={String(activeConversationData.backendConversationId)}
          incomingSignal={incomingSignal}
          onClose={handleEndCall}
        />
      )}

      <div className="mb-4 flex items-center justify-between gap-4 md:mb-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/myhost')}
            className="flex items-center gap-2 rounded-full bg-[#F59E0B] px-3 py-2 text-sm font-semibold text-black transition-colors hover:bg-[#F59E0B]/90 md:px-4"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Create</span>
          </button>
          <button
            onClick={() => navigate('/notifications')}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
            title="View notifications"
          >
            <Bell size={18} />
          </button>
        </div>
      </div>

      {eventRequestViewer && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 px-4 py-6">
          <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#11131A] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#FBBF24]">Event request</p>
                <h3 className="mt-1 text-xl font-black text-white">{eventRequestViewer.title || 'Mini hangout invite'}</h3>
              </div>
              <button
                type="button"
                onClick={() => setEventRequestViewer(null)}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
                aria-label="Close event request"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm text-gray-300">
              <p><span className="text-gray-500">From:</span> {eventRequestViewer.senderName || 'Someone'}</p>
              <p><span className="text-gray-500">Date:</span> {eventRequestViewer.date || 'TBD'}</p>
              <p><span className="text-gray-500">Location:</span> {eventRequestViewer.location || 'TBD'}</p>
              {eventRequestViewer.note ? <p><span className="text-gray-500">Note:</span> {eventRequestViewer.note}</p> : null}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEventRequestViewer(null)}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:bg-white/10"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setEventRequestViewer(null);
                  navigate('/myhost');
                }}
                className="rounded-full bg-[#FBBF24] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#F59E0B]"
              >
                Create event
              </button>
            </div>
          </div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex h-auto flex-col gap-4 md:h-[calc(100vh-140px)] md:flex-row md:gap-6"
      >
        {/* Conversation list */}
        <div className={`${mobileShowChat ? 'hidden md:flex' : 'flex'} w-full shrink-0 flex-col overflow-hidden rounded-3xl border border-white/5 bg-[#1A1A21] md:w-[340px]`}>
          <div className="border-b border-white/5 p-5">
            <div className="mb-3">
              <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search conversations..."
                  className="w-full rounded-full border border-white/5 bg-[#0F0F13] py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-gray-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {(['all', 'unread', 'hangout'] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    filter === key
                      ? 'bg-[#F59E0B] text-white'
                      : 'border border-white/5 bg-[#0F0F13] text-gray-400 hover:text-white'
                  }`}
                >
                  {key === 'all' ? 'All' : key === 'unread' ? 'Unread' : 'Active hangouts'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {filteredConversations.map((chat) => {
              const conversationThread = store.threads[chat.id] ?? [];
              const lastMessage = conversationThread[conversationThread.length - 1];
              const preview = summarizeMessage(lastMessage) || chat.context;

              return (
                <button
                  key={chat.id}
                  onClick={() => handleSelectConversation(chat.id)}
                  className={`flex w-full items-start gap-3 border-b border-white/5 p-4 text-left transition-colors last:border-0 ${
                    activeConversation === chat.id ? 'bg-white/5' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-serif text-gray-900 shadow-sm ${chat.color}`}>
                      {chat.initial}
                    </div>
                    {chat.unread && <div className="absolute right-0 top-0 h-3 w-3 rounded-full border-2 border-[#1A1A21] bg-[#F59E0B]" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-baseline justify-between">
                      <h4 className={`truncate text-sm ${chat.unread ? 'font-semibold text-white' : 'font-medium text-gray-200'}`}>
                        {friendlyName(chat.name)}
                      </h4>
                      <span className="ml-2 shrink-0 text-[10px] text-gray-500">{chat.time}</span>
                    </div>
                    <p className={`mb-1.5 truncate text-xs ${chat.unread ? 'font-medium text-gray-300' : 'text-gray-500'}`}>
                      {preview}
                    </p>
                    <span className="inline-block max-w-full truncate rounded bg-[#0F0F13] px-2 py-0.5 text-[10px] text-gray-400">
                      {chat.context}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat panel */}
        <div className={`${mobileShowChat ? 'flex' : 'hidden md:flex'} min-h-[420px] flex-1 flex-col overflow-hidden rounded-3xl border border-white/5 bg-[#1A1A21]`}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] p-5">
            <div className="flex min-w-0 items-center gap-3">
              {/* Back button — mobile only */}
              <button
                onClick={() => setMobileShowChat(false)}
                className="md:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Back to conversations"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${activeConversationData?.color} font-serif text-lg text-gray-900 shadow-sm`}>
                {activeConversationData?.initial}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-semibold text-white">{activeConversationLabel}</h3>
                </div>
                <p className="truncate text-xs text-gray-400">
                  {activeConversationData?.routeLabel} · {activeConversationData?.hangout}
                </p>
                {activeConversationData?.eventEndsAt && (
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    {activeConversationExpired
                      ? `Messages removed after the event ends + ${deletionWindowHours}h grace period`
                      : `Messages auto-delete ${deletionWindowHours}h after the event${deletionDeadlineLabel ? `, around ${deletionDeadlineLabel}` : ''}`}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleStartCall('audio')}
                className="rounded-full border border-white/10 bg-white/5 p-2.5 text-gray-300 transition hover:bg-white/10 hover:text-white"
                aria-label="Start audio call"
              >
                <Phone size={17} />
              </button>
              <button
                onClick={() => handleStartCall('video')}
                className="rounded-full border border-white/10 bg-white/5 p-2.5 text-gray-300 transition hover:bg-white/10 hover:text-white"
                aria-label="Start video call"
              >
                <Video size={17} />
              </button>
              <button
                onClick={() => onNavigate('profile')}
                className="rounded-full bg-white/5 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-white/10"
              >
                View profile
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6">
            {!hasConversation && (
              <div className="mb-4 rounded-3xl border border-white/5 bg-white/[0.03] p-6 text-center text-sm text-gray-400">
                Your inbox is empty. Open Nearby and tap Message on a person to start a real conversation.
              </div>
            )}

            <div className="flex flex-col gap-1">
              {activeMessages.length === 0 && (
                <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6 text-center text-sm text-gray-400">
                  This thread has no active messages.
                </div>
              )}

              {messagesWithDividers.map((item) => {
                // Date divider
                if (item.type === 'divider') {
                  return (
                    <div key={item.key} className="flex items-center gap-3 py-4">
                      <div className="h-px flex-1 bg-white/5" />
                      <span className="rounded-full bg-[#0F0F13] px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-gray-500">
                        {item.label}
                      </span>
                      <div className="h-px flex-1 bg-white/5" />
                    </div>
                  );
                }

                // Message bubble
                const { message } = item;
                const isMine = !!message.mine;
                const messageAuthor = isMine
                  ? friendlyName(currentUser?.display_name, currentUser?.username, currentUser?.name, 'You')
                  : friendlyName(message.from, activeConversationData?.name, 'Sender');
                const messageText = coerceMessageText(message.text);
                const parsedEventRequest = parseEventRequestMessage(messageText);
                const callTone = message.type === 'system' ? getCallSummaryTone(messageText) : 'neutral';
                const CallIcon = message.type === 'system' ? getCallSummaryIcon(messageText) : undefined;
                const isCallSummary = message.type === 'system' && /call/i.test(messageText);

                return (
                  <div
                    key={message.id}
                    className={`flex w-full mb-3 ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex flex-col max-w-[85%] ${isMine ? 'items-end' : 'items-start'}`}>
                      {/* Author name */}
                      {message.type !== 'system' && (
                        <div className={`mb-1 px-1 text-[11px] font-medium uppercase tracking-[0.18em] ${isMine ? 'text-gray-400 text-right' : 'text-[#FBBF24]'}`}>
                          {messageAuthor}
                        </div>
                      )}

                      {/* Bubble */}
                      <div
                        className={`group relative overflow-hidden rounded-2xl px-4 py-3 text-sm ${
                          message.type === 'system'
                            ? 'border border-white/10 bg-white/5 text-center text-gray-200'
                            : isMine
                            ? 'rounded-tr-sm border border-[#F59E0B]/30 bg-[#F59E0B]/15 text-white'
                            : 'rounded-tl-sm bg-[#0F0F13] text-gray-200'
                        }`}
                      >
                        {message.type === 'event_request' && parsedEventRequest && !dismissedRequestIds.includes(message.id) && (
                          <div className="space-y-3">
                            <div className="rounded-2xl border border-[#FBBF24]/25 bg-[#FBBF24]/10 p-3">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#FBBF24]">Event request</p>
                              <p className="mt-2 text-sm font-semibold text-white">{parsedEventRequest.title || 'Mini hangout invite'}</p>
                              <p className="mt-1 text-xs text-gray-300">{parsedEventRequest.senderName || 'Someone'} wants to create an event with you.</p>
                              <div className="mt-3 space-y-1 text-xs text-gray-300">
                                <p>{parsedEventRequest.date ? `Date: ${parsedEventRequest.date}` : 'Date: TBD'}</p>
                                <p>{parsedEventRequest.location ? `Location: ${parsedEventRequest.location}` : 'Location: TBD'}</p>
                                {parsedEventRequest.note ? <p>Note: {parsedEventRequest.note}</p> : null}
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => setEventRequestViewer(parsedEventRequest)}
                                className="rounded-full bg-[#FBBF24] px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-[#F59E0B]"
                              >
                                View event
                              </button>
                              <button
                                type="button"
                                onClick={() => setDismissedRequestIds((current) => current.includes(message.id) ? current : [...current, message.id])}
                                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-gray-200 transition hover:bg-white/10"
                              >
                                X
                              </button>
                            </div>
                          </div>
                        )}

                        {message.type === 'text' && <p className="whitespace-pre-wrap leading-6">{messageText}</p>}

                        {message.type === 'image' && (
                          <div className="space-y-2">
                            {message.url && <img src={resolveMediaUrl(message.url)} alt={messageText || 'Attachment'} className="max-w-full rounded-xl object-cover" />}
                            {messageText && <p className="text-xs text-gray-300">{messageText}</p>}
                          </div>
                        )}

                        {message.type === 'video' && (
                          <div className="space-y-2">
                            {message.url && (
                              <video controls className="max-w-full rounded-xl">
                                <source src={resolveMediaUrl(message.url)} />
                              </video>
                            )}
                            <p className="text-xs text-gray-300">{messageText || 'Video attachment'}</p>
                          </div>
                        )}

                        {message.type === 'voice' && (
                          <div className="flex items-center gap-3">
                            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white">
                              <Mic size={16} />
                            </button>
                            <div className="min-w-0">
                              <p className="font-medium text-white">{messageText || 'Voice note'}</p>
                              <p className="text-[11px] text-gray-300">{message.duration || '0:12'}</p>
                            </div>
                          </div>
                        )}

                        {message.type === 'system' && (
                          <div className={`flex items-center justify-center gap-2 ${isCallSummary ? 'text-sm font-semibold text-white' : 'text-xs uppercase tracking-[0.18em] text-gray-400'}`}>
                            {CallIcon && <CallIcon className={`h-4 w-4 ${callTone === 'success' ? 'text-emerald-400' : callTone === 'warning' ? 'text-amber-400' : callTone === 'danger' ? 'text-rose-400' : 'text-gray-300'}`} />}
                            <span>{messageText || 'System message'}</span>
                          </div>
                        )}

                        {isMine && (
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            className="absolute right-2 top-2 rounded-full bg-black/30 p-1 text-white/70 opacity-0 transition group-hover:opacity-100 hover:text-white"
                            aria-label="Delete message"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>

                      {/* Timestamp + status */}
                      <div className={`mt-1 flex items-center gap-2 text-[10px] text-gray-500 ${isMine ? 'justify-end' : ''}`}>
                        <span>{message.time}</span>
                        {isMine && (
                          <span className="inline-flex items-center gap-1 text-gray-400">
                            {message.status === 'scheduled' ? (
                              <>
                                <Clock3 size={11} className="text-gray-400" />
                                Scheduled
                              </>
                            ) : message.status === 'read' ? (
                              <>
                                <CheckCheck size={11} className="text-[#F59E0B]" />
                                Read
                              </>
                            ) : (
                              <>
                                <CheckCheck size={11} />
                                Delivered
                              </>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Typing indicator */}
            <div className="mt-5 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F59E0B]/15 text-[#FBBF24]">
                  <StatusDots />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{replyHint}</p>
                </div>
              </div>
            </div>

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>

          {/* Compose bar */}
          <div className="border-t border-white/5 bg-white/[0.02] p-4">
            {emojiBurst && (
              <div className="mb-3 rounded-full border border-[#F59E0B]/20 bg-[#F59E0B]/10 px-4 py-2 text-xs font-medium text-[#FBBF24]">
                {emojiBurst}
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*,video/*,audio/*" className="hidden" onChange={handleAttachment} />
            <div className="rounded-3xl border border-white/5 bg-[#0F0F13] p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <label className="text-[11px] uppercase tracking-[0.2em] text-gray-500">Delivery</label>
                <select
                  value={schedulePreset}
                  onChange={(event) => setSchedulePreset(event.target.value as SchedulePreset)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white outline-none"
                >
                  {Object.entries(scheduleLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end gap-2 rounded-full border border-white/5 bg-[#0A0A0E] p-1.5 pr-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-full p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                  aria-label="Attach file"
                >
                  <Paperclip size={18} />
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-full p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                  aria-label="Add image"
                >
                  <ImageIcon size={18} />
                </button>
                <input
                  type="text"
                  value={composeText}
                  onChange={(event) => setComposeText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={isRecording ? 'Recording voice note...' : 'Type a message...'}
                  className="flex-1 bg-transparent px-2 text-sm text-white placeholder:text-gray-500 focus:outline-none"
                />
                <button
                  onClick={() => setComposeText((current) => `${current}${current ? ' ' : ''}✨`)}
                  className="rounded-full p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                  aria-label="Add emoji"
                >
                  <Smile size={18} />
                </button>
                <button
                  onClick={handleSendVoice}
                  className={`rounded-full p-2 transition-colors ${
                    isRecording
                      ? 'bg-red-500 text-white hover:bg-red-400'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                  aria-label="Record voice note"
                >
                  <Mic size={18} />
                </button>
                <button
                  onClick={handleSend}
                  className="ml-1 rounded-full bg-[#F59E0B] p-2 text-white transition-opacity hover:opacity-90"
                >
                  <Send size={16} className="ml-0.5" />
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
                <span>{activeLastMessage ? `Last message at ${activeLastMessage.time}` : 'No messages yet'}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
