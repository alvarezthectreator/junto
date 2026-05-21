# My Host / Host Dashboard Implementation Guide

**Status:** 🟡 Partial (40% → needs 60% more)  
**Priority:** High  
**File:** `src/pages/HostDashboard.tsx`  
**Related Components:** Event manager, application reviewer, guest list

---

## 📋 Current State vs. Missing Features

### ✅ Already Implemented (40%)
- Page structure
- Tab layout (Events, Applications, Guests)
- Basic styling

### ❌ Missing Features (60%)
- [ ] Host's created events list
- [ ] Application management (review/accept/decline)
- [ ] Guest list for events
- [ ] Event edit/delete
- [ ] Create event button
- [ ] Event performance metrics
- [ ] Financial summary
- [ ] Host rating & reviews
- [ ] Event calendar
- [ ] Messaging to applicants

---

## 🎯 Core Features to Build

### 1. Events Tab - Hosted Events List

**List View:**
```
┌─────────────────────────────────┐
│ Events (3)      [+ Create]      │
├─────────────────────────────────┤
│                                 │
│ ┌────────────────────────────┐  │
│ │ [Event Img]  Title        │  │
│ │              May 25, 8PM   │  │
│ │              Status: ACTIVE│  │
│ │              12/20 guests  │  │
│ │              [Edit][Delete]│  │
│ └────────────────────────────┘  │
│                                 │
│ ┌────────────────────────────┐  │
│ │ [Event Img]  Title        │  │
│ │              May 28, 7PM   │  │
│ │              Status: FULL   │  │
│ │              20/20 guests  │  │
│ │              [Edit][Delete]│  │
│ └────────────────────────────┘  │
│                                 │
│ [Past Events] (archived)        │
└─────────────────────────────────┘
```

**Event Card Features:**
- Event image thumbnail
- Title & date/time
- Status badge (ACTIVE, FULL, PAST, DRAFT)
- Guest count (x/max)
- Quick actions (Edit, Delete, View Applications)

**Data Structure:**
```typescript
interface HostedEvent {
  id: string;
  title: string;
  image: string;
  description: string;
  date: Date;
  location: string;
  maxGuests: number;
  confirmedGuests: number;
  pendingApplications: number;
  price?: number;
  status: 'draft' | 'active' | 'full' | 'cancelled' | 'completed';
  createdAt: Date;
}
```

---

### 2. Applications Tab - Review & Manage

**Applications View:**
```
┌────────────────────────────────────┐
│ Pending Applications (5)            │
├────────────────────────────────────┤
│                                    │
│ Event: Rooftop Dinner              │
│ ┌──────────────────────────────┐   │
│ │ [Avatar] Sarah Johnson       │   │
│ │ ⭐ No prior events           │   │
│ │ Applied: 2 days ago          │   │
│ │ [Message] [Accept] [Decline] │   │
│ └──────────────────────────────┘   │
│                                    │
│ ┌──────────────────────────────┐   │
│ │ [Avatar] Mike Chen           │   │
│ │ ⭐ Attended 3 events         │   │
│ │ Applied: 1 day ago           │   │
│ │ [Message] [Accept] [Decline] │   │
│ └──────────────────────────────┘   │
│                                    │
└────────────────────────────────────┘
```

**Applicant Card:**
- User avatar & name
- Track record (# events attended)
- User rating (if available)
- Time applied
- Quick action buttons

**Actions:**
- **Message:** Open message composer
- **Accept:** Add to guest list
- **Decline:** Reject with optional message

**Decline Modal:**
```
┌─────────────────────────────────┐
│ Decline Application?            │
├─────────────────────────────────┤
│ Reason (optional):              │
│ [Textarea for message]          │
│                                 │
│ [ ] Send message to applicant   │
│                                 │
│ [Cancel] [Decline]              │
└─────────────────────────────────┘
```

---

### 3. Guests Tab - Attendee Management

**Guest List:**
```
┌────────────────────────────────────┐
│ Rooftop Dinner (20 attending)      │
├────────────────────────────────────┤
│                                    │
│ Confirmed (18):                    │
│ ┌──────────────────────────────┐   │
│ │ [Avatar] Sarah Johnson  ✓    │   │
│ │ Joined 3 days ago            │   │
│ │ [Message] [Remove]           │   │
│ └──────────────────────────────┘   │
│                                    │
│ Maybe (2):                         │
│ ┌──────────────────────────────┐   │
│ │ [Avatar] Jessica Park        │   │
│ │ Unsure about attendance      │   │
│ │ [Message] [Remove]           │   │
│ └──────────────────────────────┘   │
│                                    │
└────────────────────────────────────┘
```

**Guest Features:**
- Filter by status (Confirmed, Maybe, No-show)
- Export guest list
- Check-in functionality (✓)
- Remove guest option
- Message to all guests

---

### 4. Event Management - Create/Edit

**Create Event Button:**
```
Modal/Page Form:

Event Title: [____________]
Description: [________________]
Date: [_____] Time: [_____]
Location: [_______________]
Max Guests: [____]
Price: $[____] (optional)
Photos: [Upload Images]

[Save Draft] [Publish]
```

**Edit Event:**
- Modify all event details
- Change guest capacity
- Reschedule date/time
- Update description
- Change price

---

### 5. Event Performance Metrics

**Overview Card:**
```
┌─────────────────────────────────┐
│ Event Performance               │
├─────────────────────────────────┤
│ Total Events Hosted: 12         │
│ Total Revenue: $1,250           │
│ Average Rating: 4.8/5 ⭐       │
│ Guest Attendance Rate: 95%      │
│ Repeat Guest Rate: 60%          │
│                                 │
│ [View Detailed Analytics]       │
└─────────────────────────────────┘
```

**Per Event Metrics:**
- Applications received
- Acceptance rate
- Actual attendance vs. confirmed
- Revenue generated
- Average guest rating

---

### 6. Financial Summary

**Dashboard Card:**
```
┌─────────────────────────────────┐
│ Earnings                        │
├─────────────────────────────────┤
│ This Month: $450                │
│ Total Earned: $2,100            │
│                                 │
│ Pending Payouts: $200           │
│ Last Payout: May 20, 2026       │
│                                 │
│ [View Payment History]          │
│ [Set Up Payout]                 │
└─────────────────────────────────┘
```

---

### 7. Host Rating & Reviews

**Host Profile Card:**
```
┌─────────────────────────────────┐
│ Your Host Profile               │
├─────────────────────────────────┤
│ Rating: ⭐⭐⭐⭐⭐ 4.8/5       │
│ (Based on 24 reviews)           │
│                                 │
│ Response Rate: 98%              │
│ Events Hosted: 12               │
│ Verified Member                 │
│                                 │
│ Recent Review:                  │
│ "Amazing host, great event!"    │
│ - Sarah J.                      │
│                                 │
│ [View All Reviews]              │
└─────────────────────────────────┘
```

---

## 📱 Tab Navigation Layout

**Mobile:**
```
┌─────────────────────────────┐
│ Host Dashboard              │
├─────────────────────────────┤
│ [Events] [Apps] [Guests]    │
├─────────────────────────────┤
│ [Tab content here]          │
└─────────────────────────────┘
```

**Desktop:**
```
┌──────────────────────────────────────────┐
│ Host Dashboard                           │
├──────────────────────────────────────────┤
│ [Events] [Applications] [Guests] [Stats] │
├──────────────────────────────────────────┤
│                                          │
│ [Tab content takes full width]           │
│                                          │
└──────────────────────────────────────────┘
```

---

## 💾 Mock Data

```typescript
const mockHostedEvents: HostedEvent[] = [
  {
    id: 'hosted_1',
    title: 'Rooftop Dinner Party',
    image: 'https://...',
    description: 'Exclusive dinner with city views...',
    date: new Date('2026-05-25T20:00:00'),
    location: 'San Francisco',
    maxGuests: 20,
    confirmedGuests: 18,
    pendingApplications: 3,
    price: 45,
    status: 'active',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60000)
  },
  {
    id: 'hosted_2',
    title: 'Wine Tasting Night',
    image: 'https://...',
    description: 'Explore premium wines with friends...',
    date: new Date('2026-05-28T19:00:00'),
    location: 'Oakland',
    maxGuests: 30,
    confirmedGuests: 30,
    pendingApplications: 0,
    price: 60,
    status: 'full',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60000)
  }
];

const mockApplications = [
  {
    id: 'app_1',
    eventId: 'hosted_1',
    userId: 'user_2',
    userName: 'Sarah Johnson',
    userAvatar: '👩‍🦰',
    userRating: 4.5,
    eventAttendance: 0,
    appliedAt: new Date(Date.now() - 2 * 24 * 60 * 60000),
    status: 'pending'
  }
];

const mockGuests = [
  {
    id: 'guest_1',
    userId: 'user_2',
    userName: 'Sarah Johnson',
    userAvatar: '👩‍🦰',
    eventId: 'hosted_1',
    status: 'confirmed',
    checkedIn: true,
    joinedAt: new Date(Date.now() - 3 * 24 * 60 * 60000)
  }
];
```

---

## 🎨 Animation Specs

1. **Tab switching:** Fade + slide animation
2. **Guest list:** Staggered entrance
3. **Create button:** Pulse on idle
4. **Metrics:** Number count-up animation

---

## 📊 Implementation Checklist

- [ ] Create Events tab with list
- [ ] Implement Applications tab
- [ ] Build Guests tab
- [ ] Add Create Event form/modal
- [ ] Implement Edit Event
- [ ] Add performance metrics dashboard
- [ ] Create financial summary
- [ ] Add host profile section
- [ ] Implement messaging to applicants
- [ ] Add guest check-in feature
- [ ] Create analytics view
- [ ] Add animations
- [ ] Responsive design
- [ ] Backend integration

---

**Next Step:** Build the Events list tab first with create/edit modals.
