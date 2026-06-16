const MESSAGE_STORE_KEY = 'junto-message-store-v2';
const MESSAGE_STORE_EVENT = 'junto-message-store-updated';
const DEFAULT_MESSAGE_RETENTION_HOURS = 24;

export type MessageType = 'text' | 'image' | 'video' | 'voice' | 'system';
export type MessageStatus = 'scheduled' | 'sent' | 'delivered' | 'read';

export type MessageRecord = {
  id: string;
  from: string;
  mine?: boolean;
  type: MessageType;
  text?: string;
  url?: string;
  duration?: string;
  time: string;
  status?: MessageStatus;
  createdAt: string;
  scheduledFor?: string;
  deliveredAt?: string;
  readAt?: string;
};

export type ConversationRecord = {
  id: number;
  backendConversationId?: string;
  peerUserId?: string;
  name: string;
  initial: string;
  color: string;
  context: string;
  routeLabel: string;
  time: string;
  unread: boolean;
  typing?: boolean;
  hangout: string;
  isGroup?: boolean;
  participantCount?: number;
  eventId?: string;
  eventTitle?: string;
  eventEndsAt?: string;
  deleteAfterHours?: number;
};

export type MessageStore = {
  conversations: ConversationRecord[];
  threads: Record<number, MessageRecord[]>;
  activeConversationId?: number;
  updatedAt: string;
};

const baseConversations: ConversationRecord[] = [];

const baseThreads: Record<number, MessageRecord[]> = {};

const legacySampleNames = new Set([
  'ada',
  'tunde',
  'zara',
  'oge',
  'chidi',
  'brunch crew',
]);

function isLegacySampleConversation(conversation: ConversationRecord): boolean {
  if (conversation.peerUserId) {
    return false;
  }

  const haystack = [
    conversation.name,
    conversation.context,
    conversation.routeLabel,
    conversation.hangout,
    conversation.eventTitle,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (legacySampleNames.has((conversation.name || '').trim().toLowerCase())) {
    return true;
  }

  return (
    haystack.includes('beach day') ||
    haystack.includes('hit the gym') ||
    haystack.includes('try sushi') ||
    haystack.includes('weekend catch-up') ||
    haystack.includes('go clubbing') ||
    haystack.includes('watch a movie') ||
    haystack.includes('planning hangout') ||
    haystack.includes('morning session') ||
    haystack.includes('dinner plans') ||
    haystack.includes('group plan') ||
    haystack.includes('night out') ||
    haystack.includes('cinema plan')
  );
}

function cloneConversations(conversations: ConversationRecord[] = baseConversations): ConversationRecord[] {
  return conversations.map((conversation) => ({ ...conversation }));
}

function cloneThreads(threads: Record<number, MessageRecord[]> = baseThreads): Record<number, MessageRecord[]> {
  return Object.fromEntries(
    Object.entries(threads).map(([conversationId, messages]) => [
      Number(conversationId),
      messages.map((message) => ({ ...message })),
    ])
  );
}

function notifyStoreUpdate() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(MESSAGE_STORE_EVENT));
}

export function getMessageStoreKey(scopeUserId?: string | null): string {
  return scopeUserId ? `${MESSAGE_STORE_KEY}:${scopeUserId}` : MESSAGE_STORE_KEY;
}

function nowIso(now = Date.now()) {
  return new Date(now).toISOString();
}

function formatClock(now = Date.now()) {
  return new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function readMessageStore(scopeUserId?: string | null): MessageStore {
  if (typeof window === 'undefined') {
    return createDefaultMessageStore();
  }

  try {
    const scopedKey = getMessageStoreKey(scopeUserId);
    const raw = window.localStorage.getItem(scopedKey);
    const legacyRaw = raw ? null : window.localStorage.getItem(MESSAGE_STORE_KEY);
    const storeRaw = raw || legacyRaw;
    if (!storeRaw) {
      return createDefaultMessageStore();
    }

    const parsed = JSON.parse(storeRaw);
    const conversations = Array.isArray(parsed?.conversations) ? parsed.conversations : baseConversations;
    const threads = parsed?.threads && typeof parsed.threads === 'object' ? parsed.threads : baseThreads;
    const cleanedConversations = conversations.filter((conversation) => !isLegacySampleConversation(conversation));
    const normalizedStore: MessageStore = {
      conversations: cloneConversations(cleanedConversations),
      threads: cloneThreads(threads),
      activeConversationId: Number.isFinite(Number(parsed?.activeConversationId))
        && cleanedConversations.some((conversation) => conversation.id === Number(parsed.activeConversationId))
        ? Number(parsed.activeConversationId)
        : cleanedConversations[0]?.id ?? 1,
      updatedAt: typeof parsed?.updatedAt === 'string' ? parsed.updatedAt : nowIso(),
    };

    if (!raw && legacyRaw && scopeUserId) {
      window.localStorage.setItem(scopedKey, JSON.stringify(normalizedStore));
      window.localStorage.removeItem(MESSAGE_STORE_KEY);
    }

    return normalizedStore;
  } catch {
    return createDefaultMessageStore();
  }
}

export function createDefaultMessageStore(): MessageStore {
  return {
    conversations: [],
    threads: {},
    activeConversationId: 1,
    updatedAt: nowIso(),
  };
}

export function writeMessageStore(store: MessageStore, scopeUserId?: string | null): MessageStore {
  const normalized = normalizeMessageStore(store);

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(getMessageStoreKey(scopeUserId), JSON.stringify(normalized));
    notifyStoreUpdate();
  }

  return normalized;
}

export function normalizeMessageStore(store: MessageStore): MessageStore {
  const conversations = cloneConversations(
    (store.conversations.length ? store.conversations : baseConversations).filter((conversation) => !isLegacySampleConversation(conversation))
  );
  const threads = cloneThreads(store.threads && Object.keys(store.threads).length ? store.threads : baseThreads);
  const knownConversationIds = new Set(conversations.map((conversation) => conversation.id));

  const nextThreads = Object.fromEntries(
    Object.entries(threads).filter(([conversationId]) => knownConversationIds.has(Number(conversationId)))
  );

  return {
    conversations,
    threads: nextThreads,
    activeConversationId: knownConversationIds.has(Number(store.activeConversationId))
      ? Number(store.activeConversationId)
      : conversations[0]?.id ?? 1,
    updatedAt: nowIso(),
  };
}

export function isConversationExpired(conversation: ConversationRecord, now = Date.now()): boolean {
  if (!conversation.eventEndsAt) return false;

  const eventEnd = new Date(conversation.eventEndsAt).getTime();
  if (!Number.isFinite(eventEnd)) return false;

  const graceHours = conversation.deleteAfterHours ?? DEFAULT_MESSAGE_RETENTION_HOURS;
  const deletionDeadline = eventEnd + graceHours * 60 * 60 * 1000;
  return now >= deletionDeadline;
}

export function purgeExpiredConversations(store: MessageStore, now = Date.now()): MessageStore {
  const expiredIds = store.conversations
    .filter((conversation) => isConversationExpired(conversation, now))
    .map((conversation) => conversation.id);

  if (!expiredIds.length) {
    return store;
  }

  const expiredIdSet = new Set(expiredIds);
  const conversations = store.conversations.filter((conversation) => !expiredIdSet.has(conversation.id));
  const threads = Object.fromEntries(
    Object.entries(store.threads).filter(([conversationId]) => !expiredIdSet.has(Number(conversationId)))
  );

  return {
    conversations,
    threads,
    activeConversationId: conversations.find((conversation) => conversation.id === store.activeConversationId)?.id
      ?? conversations[0]?.id
      ?? 1,
    updatedAt: nowIso(now),
  };
}

export function flushScheduledMessages(store: MessageStore, now = Date.now()): MessageStore {
  let changed = false;

  const threads = Object.fromEntries(
    Object.entries(store.threads).map(([conversationId, messages]) => {
      const nextMessages = messages.map((message) => {
        if (message.status !== 'scheduled' || !message.scheduledFor) {
          return message;
        }

        const scheduledAt = new Date(message.scheduledFor).getTime();
        if (!Number.isFinite(scheduledAt) || scheduledAt > now) {
          return message;
        }

        changed = true;
        return {
          ...message,
          status: 'delivered' as const,
          time: formatClock(now),
          deliveredAt: nowIso(now),
        };
      });

      return [Number(conversationId), nextMessages];
    })
  );

  if (!changed) {
    return store;
  }

  return {
    ...store,
    threads,
    updatedAt: nowIso(now),
  };
}

export function upsertMessage(
  store: MessageStore,
  conversationId: number,
  message: MessageRecord
): MessageStore {
  const existing = store.threads[conversationId] ?? [];
  const nextThreads = {
    ...store.threads,
    [conversationId]: [...existing, { ...message }],
  };

  return {
    ...store,
    threads: nextThreads,
    updatedAt: nowIso(),
  };
}

export function removeMessage(store: MessageStore, conversationId: number, messageId: string): MessageStore {
  const existing = store.threads[conversationId] ?? [];
  const nextThreads = {
    ...store.threads,
    [conversationId]: existing.filter((message) => message.id !== messageId),
  };

  return {
    ...store,
    threads: nextThreads,
    updatedAt: nowIso(),
  };
}

export function updateConversation(store: MessageStore, conversationId: number, updates: Partial<ConversationRecord>): MessageStore {
  return {
    ...store,
    conversations: store.conversations.map((conversation) =>
      conversation.id === conversationId ? { ...conversation, ...updates } : conversation
    ),
    updatedAt: nowIso(),
  };
}

export function scheduleMessageDelivery(
  store: MessageStore,
  conversationId: number,
  draft: Omit<MessageRecord, 'status' | 'time' | 'createdAt'> & { scheduledFor?: string }
): MessageStore {
  const nextMessage: MessageRecord = {
    ...draft,
    status: draft.scheduledFor ? 'scheduled' : 'delivered',
    time: draft.scheduledFor ? 'Scheduled' : formatClock(),
    createdAt: nowIso(),
    deliveredAt: draft.scheduledFor ? undefined : nowIso(),
  };

  return upsertMessage(store, conversationId, nextMessage);
}

export function messageStoreEventName(): string {
  return MESSAGE_STORE_EVENT;
}

export function formatMessageClock(now = Date.now()): string {
  return formatClock(now);
}
