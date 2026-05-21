# My Requests / Applications Page Implementation Guide

**Status:** 🟡 Partial (30% → needs 70% more)  
**Priority:** High  
**File:** `src/pages/MyRequests.tsx`  
**Related Components:** Application card, status badge, message flow

---

## 📋 Current State vs. Missing Features

### ✅ Already Implemented (30%)
- Page structure
- Layout placeholder
- Responsive design

### ❌ Missing Features (70%)
- [ ] Application list UI
- [ ] Status badges (pending, accepted, declined)
- [ ] Event details in requests
- [ ] Accept/decline message flow
- [ ] Sort/filter options
- [ ] Empty state
- [ ] Application timeline
- [ ] Withdrawal functionality
- [ ] Host response messages

---

## 🎯 Core Features to Build

### 1. Application List UI

**Application Card Layout:**
```
┌────────────────────────────────────┐
│ [Event Image] │ Title              │ [Status]
│               │ Host: John         │ PENDING
│ 100x100px     │ May 25 @ 8:00 PM   │
│               │ 📍 San Francisco   │
│               │ ★★★★★ 4.8/5       │
├────────────────────────────────────┤
│ Status Timeline:                   │
│ 📝 Applied 2 days ago              │
│ ⏳ Waiting for host response...    │
├────────────────────────────────────┤
│ [View Event] [Withdraw]            │
└────────────────────────────────────┘
```

**Data Structure:**
```typescript
interface Application {
  id: string;
  eventId: string;
  eventTitle: string;
  eventImage: string;
  eventDate: Date;
  eventLocation: string;
  hostName: string;
  hostAvatar: string;
  hostRating: number;
  status: 'pending' | 'accepted' | 'declined' | 'withdrawn';
  appliedAt: Date;
  respondedAt?: Date;
  hostMessage?: string;
  canWithdraw: boolean;
}
```

---

### 2. Status Badges with Colors

**Status Types:**

| Status | Color | Icon | Meaning |
|--------|-------|------|---------|
| PENDING | Yellow/Amber | ⏳ | Waiting for host |
| ACCEPTED | Green | ✓ | You're going! |
| DECLINED | Red | ✗ | Host declined |
| WITHDRAWN | Gray | ↩️ | You withdrew |

**Badge Component:**
```typescript
const statusConfig = {
  pending: {
    color: 'bg-amber-100',
    textColor: 'text-amber-800',
    icon: '⏳',
    label: 'Pending'
  },
  accepted: {
    color: 'bg-green-100',
    textColor: 'text-green-800',
    icon: '✓',
    label: 'Accepted'
  },
  declined: {
    color: 'bg-red-100',
    textColor: 'text-red-800',
    icon: '✗',
    label: 'Declined'
  },
  withdrawn: {
    color: 'bg-gray-100',
    textColor: 'text-gray-800',
    icon: '↩️',
    label: 'Withdrawn'
  }
};

<div className={`${config.color} ${config.textColor} px-3 py-1 rounded-full text-sm font-semibold`}>
  {config.icon} {config.label}
</div>
```

---

### 3. Sort & Filter Options

**Filter Bar:**
```
All Applications ▼ | Pending (3) | Accepted (2) | Declined (1)
```

**Dropdown Menu:**
- All (8)
- Pending (3)
- Accepted (2)
- Declined (1)
- Withdrawn (2)

**Sort Options:**
- Newest first
- Oldest first
- Event date (soonest)
- Event date (latest)
- Host rating (highest)

---

### 4. Empty State

**When no applications:**
```
┌────────────────────────────┐
│                            │
│     No Applications 📝    │
│                            │
│  You haven't applied for   │
│  any events yet.           │
│                            │
│  [Browse Events]           │
│                            │
└────────────────────────────┘
```

---

### 5. Application Timeline

**Per Application:**
```
Timeline Steps:
📝 Applied 2 days ago
  "Interested in your rooftop dinner"
  
⏳ Waiting for response...
  (Shows estimated response time or "1-2 days typically")
```

**States:**
- Applied
- Host viewed
- Host is typing...
- Host responded
- Accepted/Declined

---

### 6. Accept/Decline Message Flow

**When Application Declined:**
```
┌──────────────────────────────┐
│ ✗ Application Declined       │
├──────────────────────────────┤
│ Reason (if provided):        │
│ "We've already reached       │
│ our capacity for this event" │
├──────────────────────────────┤
│ Host Message:                │
│ "Thanks for your interest!   │
│ Hopefully next time!"        │
├──────────────────────────────┤
│ [View Host Profile]          │
│ [Message Host]               │
│ [Reapply] (if available)     │
└──────────────────────────────┘
```

**When Application Accepted:**
```
┌──────────────────────────────┐
│ ✓ You're Going! 🎉          │
├──────────────────────────────┤
│ Host Accepted:               │
│ "Can't wait to meet you!"    │
├──────────────────────────────┤
│ 📅 May 25, 8:00 PM          │
│ 📍 123 Main St               │
│ 👥 20 guests attending       │
├──────────────────────────────┤
│ [Add to Calendar]            │
│ [Message Host]               │
│ [View Other Guests]          │
│ [Cancel Attendance]          │
└──────────────────────────────┘
```

---

### 7. Withdrawal Functionality

**When Withdrawing:**
```
Modal:
┌────────────────────────────────┐
│ Withdraw Application?          │
│                                │
│ Are you sure you want to       │
│ withdraw from this event?      │
│                                │
│ [Keep] [Withdraw]              │
└────────────────────────────────┘
```

**After Withdrawal:**
```
Status changes to "Withdrawn"
Card becomes gray/disabled looking
Option to "Reapply" appears (if event not started)
```

---

### 8. Reapply After Decline

**Button appears when:**
- Application was declined
- Event date hasn't passed yet

**Action:**
- Same application flow as before
- Shows previous application info
- New application note: "This is my second application"

---

## 📱 Full Page Layout

**Mobile:**
```
┌────────────────────────────┐
│ My Requests (8)            │
├────────────────────────────┤
│ [All ▼] [Pending] [✓]     │
├────────────────────────────┤
│ ┌──────────────────────────┐
│ │ [Img] Event Title  [⏳]  │
│ │       Host Name          │
│ │       Date & Location    │
│ │ [View] [Withdraw]        │
│ └──────────────────────────┘
│
│ ┌──────────────────────────┐
│ │ [Img] Event Title  [✓]   │
│ │       Host Name          │
│ │       Date & Location    │
│ │ [View] [Cancel]          │
│ └──────────────────────────┘
│
│ [More applications...]
└────────────────────────────┘
```

**Desktop:**
```
┌─────────────────────────────────────────────────┐
│ My Requests (8)                                 │
├─────────────────────────────────────────────────┤
│ Filter: [All ▼] [Pending (3)] [✓ (2)] [✗ (1)] │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ [Img] │ Event Title        │ Date       │[⏳] │
│ │       │ Host Name          │ Location   │    │
│ │       │ Rating ★★★★★      │ 20 guests  │    │
│ │       │ [View] [Withdraw]  │            │    │
│ └─────────────────────────────────────────────┘ │
│ [More applications...]
└─────────────────────────────────────────────────┘
```

---

## 💾 Mock Data

```typescript
const mockApplications: Application[] = [
  {
    id: 'app_1',
    eventId: 'event_1',
    eventTitle: 'Rooftop Dinner Party',
    eventImage: 'https://...',
    eventDate: new Date('2026-05-25T20:00:00'),
    eventLocation: 'San Francisco',
    hostName: 'Sarah Johnson',
    hostAvatar: '👩‍🦰',
    hostRating: 4.8,
    status: 'pending',
    appliedAt: new Date(Date.now() - 2 * 24 * 60 * 60000), // 2 days ago
    respondedAt: undefined,
    hostMessage: undefined,
    canWithdraw: true
  },
  {
    id: 'app_2',
    eventId: 'event_2',
    eventTitle: 'Wine Tasting Night',
    eventImage: 'https://...',
    eventDate: new Date('2026-05-28T19:00:00'),
    eventLocation: 'Oakland',
    hostName: 'Mike Chen',
    hostAvatar: '👨‍💼',
    hostRating: 4.9,
    status: 'accepted',
    appliedAt: new Date(Date.now() - 5 * 24 * 60 * 60000), // 5 days ago
    respondedAt: new Date(Date.now() - 4 * 24 * 60 * 60000),
    hostMessage: 'Great! Looking forward to meeting you!',
    canWithdraw: true
  },
  {
    id: 'app_3',
    eventId: 'event_3',
    eventTitle: 'Jazz Concert',
    eventImage: 'https://...',
    eventDate: new Date('2026-05-22T19:00:00'), // Past event
    eventLocation: 'Berkeley',
    hostName: 'Alex Lopez',
    hostAvatar: '👨',
    hostRating: 4.7,
    status: 'declined',
    appliedAt: new Date(Date.now() - 10 * 24 * 60 * 60000),
    respondedAt: new Date(Date.now() - 8 * 24 * 60 * 60000),
    hostMessage: 'Thanks for your interest! We reached capacity.',
    canWithdraw: false
  }
];
```

---

## 🎨 Animation Specs

1. **Card entrance:** Fade in + slide up (staggered)
2. **Status badge:** Pulse animation for pending
3. **Filter change:** Cross-fade between lists
4. **Withdrawal modal:** Scale in from center
5. **Acceptance confirmation:** Bounce + celebrate

---

## 🔄 State Management

```typescript
const [applications, setApplications] = useState<Application[]>([]);
const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'declined' | 'withdrawn'>('all');
const [sort, setSort] = useState<'newest' | 'oldest' | 'soonest'>('newest');
const [loading, setLoading] = useState(true);

const filteredApplications = applications.filter(app => {
  if (filter === 'all') return true;
  return app.status === filter;
});

const sortedApplications = filteredApplications.sort((a, b) => {
  switch (sort) {
    case 'newest':
      return b.appliedAt.getTime() - a.appliedAt.getTime();
    case 'oldest':
      return a.appliedAt.getTime() - b.appliedAt.getTime();
    case 'soonest':
      return a.eventDate.getTime() - b.eventDate.getTime();
  }
});
```

---

## 📊 Implementation Checklist

- [ ] Create application card component
- [ ] Implement status badges with colors
- [ ] Add filter/sort functionality
- [ ] Create empty state
- [ ] Build decline/accept modals
- [ ] Implement withdrawal flow
- [ ] Add reapply option
- [ ] Create timeline display
- [ ] Add animations
- [ ] Responsive layout
- [ ] Mock data integration
- [ ] Backend API integration
- [ ] Loading skeleton
- [ ] Error handling

---

**Next Step:** Build the application card component and list view.
