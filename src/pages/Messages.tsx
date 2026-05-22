import React, { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCheck,
  Image as ImageIcon,
  Mic,
  Paperclip,
  Phone,
  Search,
  Send,
  Smile,
  Trash2,
  Video,
} from 'lucide-react';

type MessageType = 'text' | 'image' | 'video' | 'voice' | 'system';

type Message = {
  id: string;
  from: string;
  mine?: boolean;
  type: MessageType;
  text?: string;
  url?: string;
  duration?: string;
  time: string;
  status?: 'sent' | 'delivered' | 'read';
};

type Conversation = {
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
};

const initialThreads: Record<number, Message[]> = {
  1: [
    {
      id: '1-1',
      from: 'Oge',
      type: 'text',
      text: 'Hey! Thanks for showing interest in the beach day.',
      time: '10:42 AM',
    },
    {
      id: '1-2',
      from: 'Oge',
      type: 'text',
      text: 'Are you coming from the island or mainland?',
      time: '10:42 AM',
    },
    {
      id: '1-3',
      from: 'You',
      mine: true,
      type: 'text',
      text: "I'm already on the island and can meet you by 3.",
      time: '10:45 AM',
      status: 'read',
    },
    {
      id: '1-4',
      from: 'Oge',
      type: 'text',
      text: "Perfect! We're meeting at the main entrance.",
      time: '10:48 AM',
    },
  ],
  2: [
    {
      id: '2-1',
      from: 'Tunde',
      type: 'text',
      text: 'Are we still on for tomorrow morning?',
      time: 'Yesterday',
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
    },
  ],
  3: [
    {
      id: '3-1',
      from: 'Zara',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&q=80',
      time: 'Yesterday',
    },
    {
      id: '3-2',
      from: 'You',
      mine: true,
      type: 'text',
      text: 'I love that place too.',
      time: 'Yesterday',
      status: 'read',
    },
  ],
  4: [
    {
      id: '4-1',
      from: 'Kemi',
      type: 'text',
      text: 'Can I bring a plus one?',
      time: 'Mon',
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
    },
  ],
  6: [
    {
      id: '6-1',
      from: 'Ada',
      type: 'text',
      text: 'Got the tickets!',
      time: 'Sun',
    },
  ],
};

const conversations: Conversation[] = [
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
  },
  {
    id: 4,
    name: 'Kemi',
    initial: 'K',
    color: 'bg-[#F59E0B]',
    context: 'Grab brunch ☕',
    routeLabel: 'Weekend catch-up',
    time: 'Yesterday',
    unread: false,
    hangout: 'Hard Rock Cafe, Lekki',
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
  },
];

function timeNow() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function summarizeMessage(message?: Message) {
  if (!message) {
    return '';
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

function CallModal({
  type,
  name,
  onClose,
}: {
  type: 'audio' | 'video';
  name: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#111115] p-5 shadow-2xl shadow-black/40">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#F59E0B] to-[#FB923C] text-3xl shadow-lg shadow-[#F59E0B]/20">
            {type === 'video' ? '📹' : '📞'}
          </div>
          <h3 className="text-xl font-semibold text-white">{type === 'video' ? 'Video call' : 'Audio call'}</h3>
          <p className="mt-2 text-sm text-gray-400">Calling {name} in demo mode</p>
        </div>

        <div className="mt-5 rounded-2xl border border-white/5 bg-white/5 p-4">
          <div className="flex items-center justify-between text-sm text-gray-300">
            <span>Connection</span>
            <span className="text-[#FBBF24]">Stable</span>
          </div>
          <div className="mt-3 flex items-center justify-center gap-2">
            <StatusDots />
            <span className="text-xs uppercase tracking-[0.2em] text-gray-500">Connecting</span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <button className="rounded-2xl border border-white/10 bg-white/5 py-3 text-sm text-white transition hover:bg-white/10">
            Mute
          </button>
          <button className="rounded-2xl border border-white/10 bg-white/5 py-3 text-sm text-white transition hover:bg-white/10">
            Camera
          </button>
          <button onClick={onClose} className="rounded-2xl bg-red-500 py-3 text-sm font-semibold text-white transition hover:bg-red-400">
            End
          </button>
        </div>
      </div>
    </div>
  );
}

export function Messages() {
  const [activeConversation, setActiveConversation] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'hangout'>('all');
  const [composeText, setComposeText] = useState('');
  const [threads, setThreads] = useState<Record<number, Message[]>>(initialThreads);
  const [callMode, setCallMode] = useState<'audio' | 'video' | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordStartedAt, setRecordStartedAt] = useState<number | null>(null);
  const [emojiBurst, setEmojiBurst] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const activeConversationData = conversations.find((conversation) => conversation.id === activeConversation) ?? conversations[0];
  const activeMessages = threads[activeConversation] ?? [];

  const filteredConversations = useMemo(() => {
    return conversations.filter((conversation) => {
      const conversationThread = threads[conversation.id] ?? [];
      const lastMessage = conversationThread[conversationThread.length - 1];
      const haystack = [
        conversation.name,
        conversation.context,
        conversation.hangout,
        summarizeMessage(lastMessage),
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch = !search || haystack.includes(search.toLowerCase());
      const matchesFilter =
        filter === 'all' ||
        (filter === 'unread' && conversation.unread) ||
        (filter === 'hangout' && !!conversation.hangout);

      return matchesSearch && matchesFilter;
    });
  }, [filter, search, threads]);

  const pushMessage = (conversationId: number, message: Message) => {
    setThreads((current) => ({
      ...current,
      [conversationId]: [...(current[conversationId] ?? []), message],
    }));
  };

  const handleSend = () => {
    const value = composeText.trim();
    if (!value) {
      return;
    }

    pushMessage(activeConversation, {
      id: `${activeConversation}-${Date.now()}`,
      from: 'You',
      mine: true,
      type: 'text',
      text: value,
      time: timeNow(),
      status: 'read',
    });
    setComposeText('');
    setEmojiBurst('Sent');
    window.setTimeout(() => setEmojiBurst(''), 1500);
  };

  const handleAttachment = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const url = URL.createObjectURL(file);
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');
    const messageType: MessageType = isImage ? 'image' : isVideo ? 'video' : 'voice';

    pushMessage(activeConversation, {
      id: `${activeConversation}-${Date.now()}`,
      from: 'You',
      mine: true,
      type: messageType,
      url,
      duration: isAudio ? '0:18' : undefined,
      text: isImage ? undefined : file.name,
      time: timeNow(),
      status: 'delivered',
    });

    event.target.value = '';
    setEmojiBurst('Attachment sent');
    window.setTimeout(() => setEmojiBurst(''), 1500);
  };

  const handleSendVoice = () => {
    if (!isRecording) {
      setIsRecording(true);
      setRecordStartedAt(Date.now());
      return;
    }

    const startedAt = recordStartedAt ?? Date.now();
    const durationSeconds = Math.max(3, Math.round((Date.now() - startedAt) / 1000));
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = String(durationSeconds % 60).padStart(2, '0');

    pushMessage(activeConversation, {
      id: `${activeConversation}-${Date.now()}`,
      from: 'You',
      mine: true,
      type: 'voice',
      duration: `${minutes}:${seconds}`,
      text: 'Voice note',
      time: timeNow(),
      status: 'delivered',
    });

    setIsRecording(false);
    setRecordStartedAt(null);
    setEmojiBurst('Voice note sent');
    window.setTimeout(() => setEmojiBurst(''), 1500);
  };

  const handleDeleteMessage = (messageId: string) => {
    setThreads((current) => ({
      ...current,
      [activeConversation]: (current[activeConversation] ?? []).filter((message) => message.id !== messageId),
    }));
  };

  const activeLastMessage = activeMessages[activeMessages.length - 1];
  const replyHint = activeConversationData.typing ? `${activeConversationData.name} is typing...` : 'Tap to send a reply';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex h-auto flex-col gap-4 lg:h-[calc(100vh-140px)] lg:flex-row lg:gap-6"
    >
      <div className="w-full shrink-0 overflow-hidden rounded-3xl border border-white/5 bg-[#1A1A21] flex flex-col lg:w-[340px]">
        <div className="border-b border-white/5 p-5">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search messages..."
              className="w-full rounded-full border border-white/5 bg-[#0F0F13] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 transition-colors focus:border-[#F59E0B]/50 focus:outline-none"
            />
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
            const lastMessage = threads[chat.id]?.[threads[chat.id].length - 1];
            const preview = summarizeMessage(lastMessage) || chat.context;

            return (
              <button
                key={chat.id}
                onClick={() => setActiveConversation(chat.id)}
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
                    <h4 className={`truncate text-sm ${chat.unread ? 'font-semibold text-white' : 'font-medium text-gray-200'}`}>{chat.name}</h4>
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

      <div className="flex min-h-[420px] flex-1 flex-col overflow-hidden rounded-3xl border border-white/5 bg-[#1A1A21]">
        <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] p-5">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${activeConversationData.color} text-gray-900 font-serif text-lg shadow-sm`}>
              {activeConversationData.initial}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-white">{activeConversationData.name}</h3>
              <p className="truncate text-xs text-gray-400">
                {activeConversationData.routeLabel} · {activeConversationData.hangout}
              </p>
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
            <button className="rounded-full bg-white/5 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-white/10">
              View request
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4 text-center">
            <span className="rounded-full bg-[#0F0F13] px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-gray-500">
              Today
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {activeMessages.map((message) => {
              const isMine = !!message.mine;

              return (
                <div key={message.id} className={`flex max-w-[85%] flex-col ${isMine ? 'self-end items-end' : 'items-start'}`}>
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
                        {message.status === 'read' ? <CheckCheck size={11} className="text-[#F59E0B]" /> : <CheckCheck size={11} />}
                        {message.status === 'read' ? 'Read' : 'Delivered'}
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
                <p className="text-xs text-gray-400">Read receipts, photos, videos, and voice notes are all supported in demo mode.</p>
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
          <div className="flex items-end gap-2 rounded-full border border-white/5 bg-[#0F0F13] p-1.5 pr-2">
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
              onChange={(e) => setComposeText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
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
              className={`rounded-full p-2 transition-colors ${isRecording ? 'bg-red-500 text-white hover:bg-red-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              aria-label="Record voice note"
            >
              <Mic size={18} />
            </button>
            <button onClick={handleSend} className="ml-1 rounded-full bg-[#F59E0B] p-2 text-white transition-opacity hover:opacity-90">
              <Send size={16} className="ml-0.5" />
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
            <span>Tap mic to start/stop a voice note demo.</span>
            <span>{activeLastMessage ? `Last message at ${activeLastMessage.time}` : 'No messages yet'}</span>
          </div>
        </div>
      </div>

      {callMode && <CallModal type={callMode} name={activeConversationData.name} onClose={() => setCallMode(null)} />}
    </motion.div>
  );
}
