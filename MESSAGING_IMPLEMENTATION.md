# Messaging System Implementation Guide

**Status:** ❌ Not Started (0% Complete)  
**Priority:** High  
**Estimated Complexity:** High (Real-time, Data Management, UI)  
**Files to Create:** 
- `src/pages/Messages.tsx`
- `src/components/MessageThread.tsx`
- `src/components/ConversationList.tsx`
- `src/components/MessageInput.tsx`
- `src/utils/messageUtils.ts`
- `src/contexts/MessageContext.tsx` (optional, for state management)

---

## 📋 Overview

The Messaging System allows users to communicate with event hosts and other guests. It includes:
- **Conversation List** - View all active conversations
- **Message Thread** - Full conversation view with message history
- **Real-time Updates** - Live message delivery
- **Read Status** - Track read/unread messages
- **Typing Indicators** - Show when others are typing
- **Message Notifications** - Alert for new messages

---

## 🎯 Key Features to Implement

### 1. Conversation List View
**Page:** `/messages`

**Components:**
- Header with "Messages" title
- Search/filter conversations
- Conversation cards showing:
  - User avatar & name
  - Last message preview (truncated)
  - Timestamp of last message
  - Unread indicator (badge with count)
  - Online status indicator (green dot)
- Empty state message
- Load more/pagination

**Interactions:**
- Click to open conversation
- Search by user name
- Filter (all, unread only)
- Swipe to delete (mobile)
- Long-press for options

**Data Structure:**
```typescript
interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar: string;
  participantOnline: boolean;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  updatedAt: Date;
  isPinned: boolean;
}
```

---

### 2. Message Thread View
**Component:** `MessageThread.tsx`

**Layout:**
```
┌─────────────────────────────┐
│ ◄ User Name    ⊙⊙⊙ (online)│
├─────────────────────────────┤
│                             │
│ [Message from other user]   │
│                             │
│                [My message] │
│                             │
│  [Typing indicator...]      │
│                             │
├─────────────────────────────┤
│ [Message input box]   [Send]│
└─────────────────────────────┘
```

**Features:**
- Message list with scroll to bottom on new message
- Message bubble styling:
  - Sent messages: Right-aligned, accent color
  - Received messages: Left-aligned, gray background
  - Read receipt: Single/double checkmark
  - Timestamp: Show on hover or tap
  - Sender avatar: Show for received messages
- Typing indicator animation
- Date separators ("Today", "Yesterday", "May 20")
- Load more messages (pagination)
- Back button to conversation list

**Data Structure:**
```typescript
interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: Date;
  isRead: boolean;
  readAt?: Date;
  type: 'text' | 'system'; // system = "User joined" etc
}
```

---

### 3. Message Input Component
**Component:** `MessageInput.tsx`

**Features:**
- Text input field with placeholder "Type a message..."
- Send button (paper plane icon)
- Character count (optional: for limits)
- Auto-focus on open
- Enter to send (desktop) / Touch send button (mobile)
- Emoji picker (optional)
- Attach media button (optional, for phase 2)
- Auto-expand textarea as user types

**Interactions:**
- Disable send button when input is empty
- Show loading state while sending
- Clear input after successful send
- Optimistic UI update

---

### 4. Typing Indicator
**Animation:** Framer Motion dots animation

```typescript
// Show for 3 seconds or until message arrives
const typingVariants = {
  initial: { y: 0, opacity: 0.6 },
  animate: {
    y: [-4, 4, -4],
    opacity: [0.6, 1, 0.6],
    transition: { 
      duration: 1.2, 
      repeat: Infinity,
      repeatDelay: 0.2
    }
  }
}
```

**UI:**
- Three animated dots
- Shows "User is typing..."
- Appears above message input
- Disappears after inactivity

---

### 5. Unread Badge
**Styling:**
- Circular badge on conversation card
- Red/accent color background
- White text (number of unread)
- Position: top-right of avatar
- Size: 20px x 20px (small)

**Example:**
```
┌──────────────────────────┐
│ [Avatar] ●(3)            │
│ John Smith               │
│ "Sure, see you then!"    │
│ 2:45 PM                  │
└──────────────────────────┘
```

---

## 🛠️ Implementation Steps

### Phase 1: Basic Structure
1. Create conversation list page (`Messages.tsx`)
2. Create message thread component
3. Create message input component
4. Set up mock data for testing
5. Implement navigation between pages

### Phase 2: Styling & Animations
1. Style message bubbles
2. Add read receipt indicators
3. Create typing animation
4. Add fade-in animations for messages
5. Stagger animation for conversation list

### Phase 3: Functionality
1. Implement send message
2. Add read status tracking
3. Implement typing indicators
4. Add unread badge logic
5. Implement search/filter

### Phase 4: Polish & Features
1. Add infinite scroll for messages
2. Add date separators
3. Implement emoji picker (optional)
4. Add sound notifications (optional)
5. Add message timestamps on hover

---

## 📱 Responsive Behavior

**Mobile (< 768px):**
- Full-screen message thread
- Bottom-fixed input
- No sidebar visible
- Swipe back gesture

**Tablet (768px - 1024px):**
- Split view: conversation list + thread
- Narrow conversation list (30%)
- Message thread takes 70%

**Desktop (> 1024px):**
- Split view with proper spacing
- Conversation list: ~300px wide
- Message thread: takes remaining space
- Hover effects on conversations

---

## 🎨 Color & Styling

**Message Bubbles:**
- **Sent:** Accent color (from tailwind config)
- **Received:** Gray-100 (light gray background)
- **Text:** Dark gray (received), white (sent)
- **Border radius:** 16px (medium)

**Conversation Cards:**
- **Background:** White / Dark mode: Dark gray
- **Hover:** Light gray background
- **Active:** Accent color tint
- **Unread:** Bold text + unread badge

**Timestamps:**
- **Size:** 12px (small)
- **Color:** Gray-500
- **Position:** Below message (hover to show)

---

## ⌨️ Keyboard Shortcuts

- **Enter:** Send message (desktop)
- **Shift+Enter:** New line
- **Esc:** Close message thread / Go back
- **Cmd/Ctrl+K:** Search conversations (optional)

---

## 🔄 Data Flow

```
┌─────────────────────────────────────┐
│ User Types Message                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Click Send / Press Enter            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Optimistic UI Update (show message) │
│ Send to Backend                     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Backend Confirms                    │
│ Update Read Status                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Broadcast to Other User             │
│ Update Last Message in Conversation │
└─────────────────────────────────────┘
```

---

## 💾 Mock Data Example

```typescript
const mockConversations: Conversation[] = [
  {
    id: 'conv_1',
    participantId: 'user_2',
    participantName: 'Sarah Johnson',
    participantAvatar: '👩‍🦰',
    participantOnline: true,
    lastMessage: 'Sounds good! See you at 8pm',
    lastMessageTime: new Date(Date.now() - 5 * 60000), // 5 min ago
    unreadCount: 2,
    updatedAt: new Date(Date.now() - 5 * 60000),
    isPinned: false
  },
  {
    id: 'conv_2',
    participantId: 'user_3',
    participantName: 'Mike Chen',
    participantAvatar: '👨‍💼',
    participantOnline: false,
    lastMessage: 'Thanks for the event invite!',
    lastMessageTime: new Date(Date.now() - 2 * 60 * 60000), // 2 hours ago
    unreadCount: 0,
    updatedAt: new Date(Date.now() - 2 * 60 * 60000),
    isPinned: true
  }
];

const mockMessages: Message[] = [
  {
    id: 'msg_1',
    conversationId: 'conv_1',
    senderId: 'user_2',
    senderName: 'Sarah Johnson',
    senderAvatar: '👩‍🦰',
    text: 'Hi! Are you hosting the rooftop dinner on the 25th?',
    timestamp: new Date(Date.now() - 30 * 60000),
    isRead: true,
    readAt: new Date(Date.now() - 29 * 60000),
    type: 'text'
  },
  {
    id: 'msg_2',
    conversationId: 'conv_1',
    senderId: 'current_user',
    senderName: 'You',
    senderAvatar: '👨',
    text: 'Yes! It starts at 8pm. Limited to 20 guests.',
    timestamp: new Date(Date.now() - 28 * 60000),
    isRead: true,
    readAt: new Date(Date.now() - 27 * 60000),
    type: 'text'
  },
  {
    id: 'msg_3',
    conversationId: 'conv_1',
    senderId: 'user_2',
    senderName: 'Sarah Johnson',
    senderAvatar: '👩‍🦰',
    text: 'Sounds good! See you at 8pm',
    timestamp: new Date(Date.now() - 5 * 60000),
    isRead: false,
    type: 'text'
  }
];
```

---

## 🎯 User Flow

### Scenario 1: User Reads Messages
```
1. User clicks "Messages" in sidebar
2. Conversation list loads
3. User sees unread badge (3) on Sarah's conversation
4. User clicks on Sarah's conversation
5. Message thread opens with full history
6. Unread messages are marked as read
7. Unread badge disappears from conversation list
8. User can scroll up to see older messages
```

### Scenario 2: User Sends Message
```
1. User is in message thread
2. Types message in input field
3. Presses Enter or clicks Send button
4. Message appears immediately in thread (optimistic)
5. Send button shows loading state
6. Backend confirms delivery
7. Read receipt updates
8. Conversation moves to top of list
```

### Scenario 3: User Gets New Message (Real-time)
```
1. User is browsing other pages
2. New message arrives from Sarah
3. Toast notification appears at bottom
4. Unread badge appears on conversation
5. User clicks notification to jump to thread
6. Message is marked as read
```

---

## ✨ Animation Requirements

1. **Message Entrance:**
   - Fade in + slide up
   - Duration: 0.3s
   - Staggered if multiple messages

2. **Typing Indicator:**
   - Three dots bouncing
   - Duration: 1.2s loop
   - Repeats until user stops typing

3. **Conversation List:**
   - Stagger animation on load
   - Hover lift effect (scale + shadow)
   - Slide out on delete (swipe)

4. **Read Receipts:**
   - Checkmark animation (draw)
   - Double checkmark (both visible)

5. **Unread Badge:**
   - Pulse animation when new message arrives
   - Duration: 0.6s

---

## 🚀 Future Enhancements

1. **Voice Messages** - Record and send audio
2. **Image Sharing** - Upload and share photos
3. **Emoji Reactions** - React to messages with emojis
4. **Message Pinning** - Pin important messages
5. **Group Chats** - Multiple participants
6. **Message Search** - Search within conversations
7. **Read Receipts** - "Seen at 2:45 PM"
8. **Forwarding** - Forward messages to other users
9. **Message Editing** - Edit sent messages
10. **Call Integration** - Voice/video calls

---

## 📊 Testing Checklist

- [ ] Messages send and receive correctly
- [ ] Unread badge displays correctly
- [ ] Read status updates on view
- [ ] Typing indicator shows/hides
- [ ] Conversations sort by last message time
- [ ] Mobile responsive layout works
- [ ] Infinite scroll loads older messages
- [ ] Search filters conversations
- [ ] Date separators show correctly
- [ ] Timestamps display in local timezone
- [ ] Animations perform smoothly (60fps)
- [ ] Empty state shows when no conversations

---

**Next Step:** Begin with Phase 1 implementation - create the page structure and mock data components.
