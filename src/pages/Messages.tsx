import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { motion } from 'framer-motion';
import {
  CheckCheck,
  Clock3,
  Image as ImageIcon,
  Mic,
  Paperclip,
  Phone,
  Plus,
  Search,
  Send,
  Smile,
  Trash2,
  Video,
  Bell,
} from 'lucide-react';
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
import { CallModal } from '../components/CallModal';
import type { WebRTCSignal } from '../hooks/useWebRTC';

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
  if (preset === 'now') {
    return undefined;
  }

  const next = new Date();
  if (preset === '5m') {
    next.setMinutes(next.getMinutes() + 5);
  } else if (preset === '1h') {
    next.setHours(next.getHours() + 1);
  } else {
    next.setDate(next.getDate() + 1);
  }

  return next.toISOString();
}

function summarizeMessage(message?: MessageRecord) {
  if (!message) {
    return '';
  }

  if (message.status === 'scheduled') {
    return '⏳ Scheduled message';
  }

  if (message.type === 'image') {
    return '📷 Photo';
  }

  if (message.type === 'video') {
    return '🎥 Video';
  }

  if (message.type === 'voice') {
    return `🎤 Voice note${message.duration ? ` · ${message.duration}` : ''}`;
  }

  if (message.type === 'system') {
    return message.text || 'System message';
  }

  return message.text || '';
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

    const stripped = value
      .replace(/[_-]+/g, ' ')
      .replace(/\d+$/g, '')
      .trim();

    if (!stripped) continue;

    if (stripped.includes(' ')) {
      return stripped.replace(/\s+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
    }

    return stripped.charAt(0).toUpperCase() + stripped.slice(1);
  }

  return 'Chat';
}

function resolvePeerId(conversation: ConversationRecord | undefined, targetUser: any, currentUserId?: string) {
  if (targetUser?.id) {
    return String(targetUser.id);
  }

  if (conversation?.peerUserId) {
    return String(conversation.peerUserId);
  }

  return currentUserId || '';
}

function resolveConversationKey(conversation: any, fallback: string) {
  const peerId = String(conversation?.other_user_id || conversation?.peerUserId || '');
  if (peerId) {
    return hashToConversationId(peerId);
  }

  const conversationId = String(conversation?.id || '');
  if (conversationId) {
    return hashToConversationId(conversationId);
  }

  return hashToConversationId(fallback);
}

function mergeMessageThreads(baseMessages: MessageRecord[], incomingMessages: MessageRecord[]): MessageRecord[] {
  const seen = new Set<string>();
  const merged: MessageRecord[] = [];

  for (const message of [...baseMessages, ...incomingMessages]) {
    const dedupeKey = `${message.id}|${message.createdAt}|${message.text || ''}|${message.from || ''}`;
    if (seen.has(dedupeKey)) {
      continue;
    }
    seen.add(dedupeKey);
    merged.push(message);
  }

  return merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

function isSameUser(valueA?: string | null, valueB?: string | null) {
  return Boolean(valueA && valueB && String(valueA).trim().toLowerCase() === String(valueB).trim().toLowerCase());
}

function isCurrentUserConversation(conversation: ConversationRecord, currentUser: any) {
  const currentUserId = String(currentUser?.id || '');
  const currentUserName = String(currentUser?.name || currentUser?.display_name || currentUser?.username || currentUser?.email || '');

  return (
    (conversation.peerUserId && currentUserId && String(conversation.peerUserId) === currentUserId) ||
    isSameUser(conversation.name, currentUserName) ||
    isSameUser(conversation.context, 'Direct message') && isSameUser(conversation.name, currentUser?.email)
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
  const [callMode, setCallMode] = useState<'audio' | 'video' | null>(null);
  const [incomingSignal, setIncomingSignal] = useState<WebRTCSignal | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordStartedAt, setRecordStartedAt] = useState<number | null>(null);
  const [emojiBurst, setEmojiBurst] = useState('');
  const [schedulePreset, setSchedulePreset] = useState<SchedulePreset>('now');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
          if (!session?.user) {
            return;
          }

          setCurrentUser(session.user);
          const scopedUserId = String(session.user.id || API.getUserId() || '');
          const hydrated = writeMessageStore(
            purgeExpiredConversations(flushScheduledMessages(readMessageStore(scopedUserId || null))),
            scopedUserId || null
          );
          setStore(hydrated);
          setActiveConversation(hydrated.activeConversationId ?? hydrated.conversations[0]?.id ?? 1);
        })
        .catch((error) => {
          console.error('Failed to restore message session:', error);
        });
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
    if (!isReady || !currentUser?.id) {
      return;
    }

    let cancelled = false;

    const syncBackendConversations = async () => {
      try {
        const response = await API.getConversations(currentUser.id);
        if (cancelled || !Array.isArray(response)) {
          return;
        }

        const backendConversations = await Promise.all(
          response.map(async (conversation: any) => {
            const conversationId = resolveConversationKey(conversation, String(conversation.id));
            const otherName = friendlyName(conversation.display_name, conversation.name, conversation.username, 'Chat');
            const otherInitial = otherName.trim().charAt(0).toUpperCase() || 'C';
            const threadResponse = await API.getConversation(String(conversation.id)).catch(() => ({ messages: [] }));
            const backendMessages = Array.isArray((threadResponse as any)?.messages) ? (threadResponse as any).messages : [];
            for (const msg of backendMessages) {
  try {
    const parsed = JSON.parse(msg.content || '{}');
    if (parsed.__webrtc_signal__ && parsed.type === 'offer' && !callMode) {
      setCallMode(parsed.mode === 'video' ? 'video' : 'audio');
      setIncomingSignal(parsed);
    }
  } catch { /* not a signal */ }
}
            const mappedMessages: MessageRecord[] = backendMessages.map((message: any) => ({
              id: String(message.id),
              from: friendlyName(
                message.sender_display_name,
                message.sender_name,
                String(message.sender_id) === String(currentUser.id)
                  ? currentUser.display_name || currentUser.username || currentUser.name
                  : otherName
              ),
              mine: String(message.sender_id) === String(currentUser.id),
              type: (message.message_type || 'text') as MessageRecord['type'],
              text: message.content || '',
              url: message.media_url || undefined,
              time: new Date(message.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: message.is_read ? 'read' : 'delivered',
              createdAt: message.created_at || new Date().toISOString(),
              deliveredAt: message.created_at || undefined,
              readAt: message.read_at || undefined,
            }));

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

        const filteredBackendConversations = backendConversations.filter(({ conversation }) => {
          return true;
        });

        if (cancelled || filteredBackendConversations.length === 0) {
          return;
        }

        setStore((current) => {
          const nextConversations = [...current.conversations];
          const nextThreads = { ...current.threads };

          filteredBackendConversations.forEach(({ conversationId, conversation, messages }) => {
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

          const nextVisibleConversations = nextConversations;

          const unsortedConversations = nextVisibleConversations.length ? nextVisibleConversations : nextConversations;

const sortedConversations = [...unsortedConversations].sort((a, b) => {
const aThread = current.threads[a.id] ?? [];
const bThread = current.threads[b.id] ?? [];
const aLast = aThread[aThread.length - 1]?.createdAt ?? '';
const bLast = bThread[bThread.length - 1]?.createdAt ?? '';
  return bLast.localeCompare(aLast);
});

const nextStore = writeMessageStore({
  ...current,
  conversations: sortedConversations,
  threads: nextThreads,
  activeConversationId: sortedConversations.find((c) => c.id === activeConversation)?.id
    ?? sortedConversations[0]?.id
    ?? current.activeConversationId
    ?? 1,
}, currentUser?.id);

return nextStore;
        });
      } catch (error) {
        console.error('Failed to sync backend conversations:', error);
      }
    };

  void syncBackendConversations();

// Poll every 5 seconds for new messages
const pollInterval = window.setInterval(() => {
  void syncBackendConversations();
}, 5000);

return () => {
  cancelled = true;
  window.clearInterval(pollInterval);
};
  }, [currentUser?.id, isReady]);

  useEffect(() => {
    if (!targetUser) {
      return;
    }

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

      const nextStore = {
        ...current,
        conversations: existing
          ? current.conversations.map((conversation) => conversation.id === conversationId ? nextConversation : conversation)
          : [nextConversation, ...current.conversations],
        threads: current.threads[conversationId] ? current.threads : { ...current.threads, [conversationId]: current.threads[conversationId] || [] },
        activeConversationId: conversationId,
      };

      const normalized = writeMessageStore(
        {
          ...nextStore,
          conversations: nextStore.conversations.filter((conversation) =>
            String(conversation.peerUserId || '') === String(targetUser?.id || targetUser?.profile_id || '') ||
            isSameUser(conversation.name, displayName)
          ),
        },
        currentUser?.id
      );
      return normalized;
    });

    setActiveConversation(conversationId);
  }, [targetUser, currentUser?.id]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    writeMessageStore({
      ...store,
      activeConversationId: activeConversation,
    }, currentUser?.id);
  }, [activeConversation, isReady, store, currentUser?.id]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const interval = window.setInterval(() => {
      setStore((current) => {
        const next = purgeExpiredConversations(flushScheduledMessages(current));
        return next === current ? current : next;
      });
    }, 15000);

    return () => window.clearInterval(interval);
  }, [isReady]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      const scopedKey = getMessageStoreKey(currentUser?.id);
      if (event.key && event.key !== scopedKey) {
        return;
      }

      setStore(readMessageStore(currentUser?.id));
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [isReady, currentUser?.id]);

  useEffect(() => {
    if (!store.conversations.some((conversation) => conversation.id === activeConversation)) {
      setActiveConversation(store.conversations[0]?.id ?? 1);
    }
  }, [activeConversation, store.conversations]);

  const activeConversationData: ConversationRecord | undefined = useMemo(() => {
    return store.conversations.find((conversation) => conversation.id === activeConversation) ?? store.conversations[0];
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
    ? `${activeConversationLabel} is typing...`
    : 'Tap to send a reply';

  const activeConversationExpired = activeConversationData ? isConversationExpired(activeConversationData) : false;
  const deletionWindowHours = activeConversationData?.deleteAfterHours ?? 24;
  const deletionDeadlineLabel = useMemo(() => {
    if (!activeConversationData?.eventEndsAt) {
      return null;
    }

    const eventEnd = new Date(activeConversationData.eventEndsAt);
    const deleteAt = new Date(eventEnd.getTime() + deletionWindowHours * 60 * 60 * 1000);
    return deleteAt.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }, [activeConversationData, deletionWindowHours]);

  const updateStore = (updater: (current: MessageStore) => MessageStore) => {
    setStore((current) => {
      const next = updater(current);
      return next;
    });
  };

  const markConversationRead = (conversationId: number) => {
    updateStore((current) =>
      updateConversation(current, conversationId, {
        unread: false,
        time: 'Just now',
      })
    );
  };

  const handleSelectConversation = (conversationId: number) => {
    setActiveConversation(conversationId);
    markConversationRead(conversationId);

    const conversation = store.conversations.find((item) => item.id === conversationId);
    if (conversation?.backendConversationId) {
      void (async () => {
        try {
          const response = await API.getConversation(conversation.backendConversationId);
          const backendMessages = Array.isArray(response?.messages) ? response.messages : [];
          const normalizedMessages: MessageRecord[] = backendMessages.map((message: any) => ({
            id: String(message.id),
            from: friendlyName(
              message.sender_display_name,
              message.sender_name,
              String(message.sender_id) === String(currentUser?.id)
                ? currentUser?.display_name || currentUser?.username || currentUser?.name
                : conversation.name
            ),
            mine: String(message.sender_id) === String(currentUser?.id),
            type: (message.message_type || 'text') as MessageRecord['type'],
            text: message.content || '',
            url: message.media_url || undefined,
            time: new Date(message.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: message.is_read ? 'read' : 'delivered',
            createdAt: message.created_at || new Date().toISOString(),
            deliveredAt: message.created_at || undefined,
            readAt: message.read_at || undefined,
          }));

          if (!normalizedMessages.length) {
            return;
          }

          setStore((current) => {
            const currentThread = current.threads[conversationId] ?? [];
            const nextThread = mergeMessageThreads(currentThread, normalizedMessages);
            return writeMessageStore(
              {
                ...current,
                threads: {
                  ...current.threads,
                  [conversationId]: nextThread,
                },
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

          await API.markMessagesAsRead(conversation.backendConversationId).catch((error) => {
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
    if (!value || !activeConversationData) {
      return;
    }

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
    if (!file || !activeConversationData) {
      return;
    }

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
        {
          unread: false,
          time: 'Just now',
        }
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
    if (!activeConversationData) {
      return;
    }

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
        {
          unread: false,
          time: 'Just now',
        }
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

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-4 md:mb-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/myhost')}
            className="flex items-center gap-2 rounded-full bg-[#F59E0B] px-3 py-2 text-sm font-semibold text-black transition-colors hover:bg-[#F59E0B]/90 md:px-4"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Post</span>
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

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex h-auto flex-col gap-4 lg:h-[calc(100vh-140px)] lg:flex-row lg:gap-6"
      >
        <div className="flex w-full shrink-0 flex-col overflow-hidden rounded-3xl border border-white/5 bg-[#1A1A21] lg:w-[340px]">
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
              {[
                ['all', 'All'],
                ['unread', 'Unread'],
                ['hangout', 'Active hangouts'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as 'all' | 'unread' | 'hangout')}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    filter === key
                      ? 'bg-[#F59E0B] text-white'
                      : 'border border-white/5 bg-[#0F0F13] text-gray-400 hover:text-white'
                  }`}
                >
                  {label}
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
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-serif text-gray-900 shadow-sm ${chat.color}`}
                    >
                      {chat.initial}
                    </div>
                    {chat.isGroup && (
                      <div className="absolute -bottom-1 -right-1 rounded-full border border-[#1A1A21] bg-[#0F0F13] px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] text-gray-300">
                        grp
                      </div>
                    )}
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
                    <div className="flex items-center gap-2">
                      <span className="inline-block max-w-full truncate rounded bg-[#0F0F13] px-2 py-0.5 text-[10px] text-gray-400">
                        {chat.context}
                      </span>
                      {chat.isGroup && (
                        <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-gray-400">
                          {chat.participantCount || 0} people
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex min-h-[420px] flex-1 flex-col overflow-hidden rounded-3xl border border-white/5 bg-[#1A1A21]">
          <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] p-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${activeConversationData?.color} font-serif text-lg text-gray-900 shadow-sm`}>
                {activeConversationData?.initial}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-semibold text-white">{activeConversationLabel}</h3>
                  {activeConversationData?.isGroup && (
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-gray-300">
                      Group
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-gray-400">
                  {activeConversationData?.routeLabel} · {activeConversationData?.hangout}
                </p>
                {activeConversationData?.eventEndsAt && (
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    {activeConversationExpired
                      ? `Messages removed after the event ends + ${deletionWindowHours}h grace period`
                      : `Messages auto-delete ${deletionWindowHours}h after the event ends${deletionDeadlineLabel ? `, around ${deletionDeadlineLabel}` : ''}`}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCallMode('audio')}
                className="rounded-full border border-white/10 bg-white/5 p-2.5 text-gray-300 transition hover:bg-white/10 hover:text-white"
                aria-label="Start audio call"
              >
                <Phone size={17} />
              </button>
              <button
                onClick={() => setCallMode('video')}
                className="rounded-full border border-white/10 bg-white/5 p-2.5 text-gray-300 transition hover:bg-white/10 hover:text-white"
                aria-label="Start video call"
              >
                <Video size={17} />
              </button>
            <button onClick={() => onNavigate('profile')} className="rounded-full bg-white/5 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-white/10">
              View profile
            </button>
          </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {!hasConversation && (
              <div className="mb-4 rounded-3xl border border-white/5 bg-white/[0.03] p-6 text-center text-sm text-gray-400">
                Your inbox is empty. Open Nearby and tap Message on a person to start a real conversation.
              </div>
            )}
            <div className="mb-4 text-center">
              <span className="rounded-full bg-[#0F0F13] px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-gray-500">
                Today
              </span>
            </div>

            <div className="flex flex-col gap-4">
              {activeMessages.length === 0 && (
                <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6 text-center text-sm text-gray-400">
                  This thread has no active messages.
                </div>
              )}

              {activeMessages.map((message) => {
                const isMine = !!message.mine;
                const messageAuthor = isMine
                  ? friendlyName(currentUser?.display_name, currentUser?.username, currentUser?.name, 'You')
                  : friendlyName(message.from, activeConversationData?.name, 'Sender');

                return (
                  <div key={message.id} className={`flex max-w-[85%] flex-col ${isMine ? 'self-end items-end' : 'items-start'}`}>
                    <div className={`mb-1 px-1 text-[11px] font-medium uppercase tracking-[0.18em] ${isMine ? 'text-gray-400 text-right' : 'text-[#FBBF24]'}`}>
                      {messageAuthor}
                    </div>
                    <div
                      className={`group relative overflow-hidden rounded-2xl px-4 py-3 text-sm ${
                        isMine
                          ? 'rounded-tr-sm border border-[#F59E0B]/30 bg-[#F59E0B]/15 text-white'
                          : 'rounded-tl-sm bg-[#0F0F13] text-gray-200'
                      }`}
                    >
                      {message.type === 'text' && <p className="whitespace-pre-wrap leading-6">{message.text}</p>}

                      {message.type === 'image' && (
                        <div className="space-y-2">
                          {message.url && <img src={message.url} alt={message.text || 'Attachment'} className="max-w-full rounded-xl object-cover" />}
                          {message.text && <p className="text-xs text-gray-300">{message.text}</p>}
                        </div>
                      )}

                      {message.type === 'video' && (
                        <div className="space-y-2">
                          {message.url && (
                            <video controls className="max-w-full rounded-xl">
                              <source src={message.url} />
                            </video>
                          )}
                          <p className="text-xs text-gray-300">{message.text || 'Video attachment'}</p>
                        </div>
                      )}

                      {message.type === 'voice' && (
                        <div className="flex items-center gap-3">
                          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white">
                            <Mic size={16} />
                          </button>
                          <div className="min-w-0">
                            <p className="font-medium text-white">{message.text || 'Voice note'}</p>
                            <p className="text-[11px] text-gray-300">{message.duration || '0:12'}</p>
                          </div>
                        </div>
                      )}

                      {message.type === 'system' && <p className="text-xs uppercase tracking-[0.18em] text-gray-400">{message.text}</p>}

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
                );
              })}
            </div>

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
          </div>

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
                    <option key={value} value={value}>
                      {label}
                    </option>
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
                    isRecording ? 'bg-red-500 text-white hover:bg-red-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                  aria-label="Record voice note"
                >
                  <Mic size={18} />
                </button>
                <button onClick={handleSend} className="ml-1 rounded-full bg-[#F59E0B] p-2 text-white transition-opacity hover:opacity-90">
                  <Send size={16} className="ml-0.5" />
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
                <span>{activeLastMessage ? `Last message at ${activeLastMessage.time}` : 'No messages yet'}</span>
              </div>
            </div>
          </div>
        </div>

        {callMode && (
  <CallModal
    type={callMode}
    name={activeConversationLabel || 'this chat'}
    localUserId={String(currentUser?.id || '')}
    remoteUserId={String(activeConversationData?.peerUserId || '')}
    incomingSignal={incomingSignal}
    onClose={() => {
      setCallMode(null);
      setIncomingSignal(null);
    }}
  />
)}
      </motion.div>
    </>
  );
}
