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

const baseConversations: ConversationRecord[] = [
  {
    id: 1,
    name: 'Oge',
    initial: 'O',
    color: 'bg-[#4ECDC4]',
    context: 'Beach day 🌊',
    routeLabel: 'Planning hangout',
    time: '2m',
    unread: true,
    typing: true,
    hangout: 'Bar Beach, Lagos',
    eventId: 'beach-day',
    eventTitle: 'Beach day',
    eventEndsAt: '2026-06-14T18:00:00.000Z',
    deleteAfterHours: DEFAULT_MESSAGE_RETENTION_HOURS,
  },
  {
    id: 2,
    name: 'Tunde',
    initial: 'T',
    color: 'bg-[#38BDF8]',
    context: 'Hit the gym 💪',
    routeLabel: 'Morning session',
    time: '1h',
    unread: false,
    hangout: 'Smart Fitness, Ikoyi',
    eventId: 'gym-session',
    eventTitle: 'Gym session',
    eventEndsAt: '2026-06-12T08:00:00.000Z',
    deleteAfterHours: DEFAULT_MESSAGE_RETENTION_HOURS,
  },
  {
    id: 3,
    name: 'Zara',
    initial: 'Z',
    color: 'bg-[#FB7185]',
    context: 'Try sushi 🍣',
    routeLabel: 'Dinner plans',
    time: 'Yesterday',
    unread: false,
    hangout: 'Izanagi, VI',
    eventId: 'sushi-night',
    eventTitle: 'Sushi night',
    eventEndsAt: '2026-06-13T20:30:00.000Z',
    deleteAfterHours: DEFAULT_MESSAGE_RETENTION_HOURS,
  },
  {
    id: 4,
    name: 'Brunch Crew',
    initial: 'G',
    color: 'bg-[#F59E0B]',
    context: 'Weekend catch-up ☕',
    routeLabel: 'Group plan',
    time: 'Yesterday',
    unread: false,
    hangout: 'Cactus, Lekki',
    isGroup: true,
    participantCount: 4,
    eventId: 'brunch-crew',
    eventTitle: 'Brunch crew',
    eventEndsAt: '2026-06-16T11:00:00.000Z',
    deleteAfterHours: DEFAULT_MESSAGE_RETENTION_HOURS,
  },
  {
    id: 5,
    name: 'Chidi',
    initial: 'C',
    color: 'bg-[#FF8E72]',
    context: 'Go clubbing 🪩',
    routeLabel: 'Night out',
    time: 'Mon',
    unread: false,
    hangout: 'Quilox, VI',
    eventId: 'night-out',
    eventTitle: 'Night out',
    eventEndsAt: '2026-06-18T01:00:00.000Z',
    deleteAfterHours: DEFAULT_MESSAGE_RETENTION_HOURS,
  },
  {
    id: 6,
    name: 'Ada',
    initial: 'A',
    color: 'bg-[#FF6B6B]',
    context: 'Watch a movie 🎬',
    routeLabel: 'Cinema plan',
    time: 'Sun',
    unread: false,
    hangout: 'Silverbird Cinema, VI',
    eventId: 'movie-night',
    eventTitle: 'Movie night',
    eventEndsAt: '2026-06-11T22:30:00.000Z',
    deleteAfterHours: DEFAULT_MESSAGE_RETENTION_HOURS,
  },
];

const baseThreads: Record<number, MessageRecord[]> = {
  1: [
    {
      id: '1-1',
      from: 'Oge',
      type: 'text',
      text: 'Hey! Thanks for showing interest in the beach day.',
      time: '10:42 AM',
      createdAt: '2026-06-09T10:42:00.000Z',
    },
    {
      id: '1-2',
      from: 'Oge',
      type: 'text',
      text: 'Are you coming from the island or mainland?',
      time: '10:42 AM',
      createdAt: '2026-06-09T10:42:30.000Z',
    },
    {
      id: '1-3',
      from: 'You',
      mine: true,
      type: 'text',
      text: "I'm already on the island and can meet you by 3.",
      time: '10:45 AM',
      status: 'read',
      createdAt: '2026-06-09T10:45:00.000Z',
      deliveredAt: '2026-06-09T10:45:05.000Z',
      readAt: '2026-06-09T10:45:18.000Z',
    },
    {
      id: '1-4',
      from: 'Oge',
      type: 'text',
      text: "Perfect! We're meeting at the main entrance.",
      time: '10:48 AM',
      createdAt: '2026-06-09T10:48:00.000Z',
    },
  ],
  2: [
    {
      id: '2-1',
      from: 'Tunde',
      type: 'text',
      text: 'Are we still on for tomorrow morning?',
      time: 'Yesterday',
      createdAt: '2026-06-08T09:00:00.000Z',
    },
    {
      id: '2-2',
      from: 'You',
      mine: true,
      type: 'voice',
      duration: '0:12',
      text: 'Voice note',
      time: 'Yesterday',
      status: 'delivered',
      createdAt: '2026-06-08T09:06:00.000Z',
      deliveredAt: '2026-06-08T09:06:04.000Z',
    },
  ],
  3: [
    {
      id: '3-1',
      from: 'Zara',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&q=80',
      time: 'Yesterday',
      createdAt: '2026-06-08T13:30:00.000Z',
    },
    {
      id: '3-2',
      from: 'You',
      mine: true,
      type: 'text',
      text: 'I love that place too.',
      time: 'Yesterday',
      status: 'read',
      createdAt: '2026-06-08T13:38:00.000Z',
      deliveredAt: '2026-06-08T13:38:04.000Z',
      readAt: '2026-06-08T13:39:10.000Z',
    },
  ],
  4: [
    {
      id: '4-1',
      from: 'Kemi',
      type: 'text',
      text: 'Can I bring a plus one?',
      time: 'Mon',
      createdAt: '2026-06-07T14:00:00.000Z',
    },
    {
      id: '4-2',
      from: 'Bola',
      type: 'system',
      text: 'Bola joined the group chat',
      time: 'Mon',
      createdAt: '2026-06-07T14:05:00.000Z',
    },
    {
      id: '4-3',
      from: 'You',
      mine: true,
      type: 'text',
      text: 'Yep, bring them along. We will just add one more chair.',
      time: 'Mon',
      status: 'read',
      createdAt: '2026-06-07T14:08:00.000Z',
      deliveredAt: '2026-06-07T14:08:04.000Z',
      readAt: '2026-06-07T14:10:00.000Z',
    },
  ],
  5: [
    {
      id: '5-1',
      from: 'Chidi',
      type: 'video',
      url: 'https://images.unsplash.com/photo-1571266028243-d220bc1c8d1f?w=800&q=80',
      text: 'Short venue clip',
      time: 'Mon',
      createdAt: '2026-06-07T20:10:00.000Z',
    },
  ],
  6: [
    {
      id: '6-1',
      from: 'Ada',
      type: 'text',
      text: 'Got the tickets!',
      time: 'Sun',
      createdAt: '2026-06-06T17:20:00.000Z',
    },
  ],
};

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

function nowIso(now = Date.now()) {
  return new Date(now).toISOString();
}

function formatClock(now = Date.now()) {
  return new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function readMessageStore(): MessageStore {
  if (typeof window === 'undefined') {
    return createDefaultMessageStore();
  }

  try {
    const raw = window.localStorage.getItem(MESSAGE_STORE_KEY);
    if (!raw) {
      return createDefaultMessageStore();
    }

    const parsed = JSON.parse(raw);
    const conversations = Array.isArray(parsed?.conversations) ? parsed.conversations : baseConversations;
    const threads = parsed?.threads && typeof parsed.threads === 'object' ? parsed.threads : baseThreads;

    return {
      conversations: cloneConversations(conversations),
      threads: cloneThreads(threads),
      activeConversationId: Number.isFinite(Number(parsed?.activeConversationId))
        ? Number(parsed.activeConversationId)
        : 1,
      updatedAt: typeof parsed?.updatedAt === 'string' ? parsed.updatedAt : nowIso(),
    };
  } catch {
    return createDefaultMessageStore();
  }
}

export function createDefaultMessageStore(): MessageStore {
  return {
    conversations: cloneConversations(),
    threads: cloneThreads(),
    activeConversationId: 1,
    updatedAt: nowIso(),
  };
}

export function writeMessageStore(store: MessageStore): MessageStore {
  const normalized = normalizeMessageStore(store);

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(MESSAGE_STORE_KEY, JSON.stringify(normalized));
    notifyStoreUpdate();
  }

  return normalized;
}

export function normalizeMessageStore(store: MessageStore): MessageStore {
  const conversations = cloneConversations(store.conversations.length ? store.conversations : baseConversations);
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

