# Event Detail Page Implementation Guide

**Status:** 🟡 Partial (60% → needs 40% more)  
**Priority:** High  
**File:** `src/pages/EventDetail.tsx`  
**Related Components:** Event detail modal, map preview

---

## 📋 Current State vs. Missing Features

### ✅ Already Implemented (60%)
- Full event details layout
- Large cover image
- Host profile section
- Event description
- Date/time/location display
- Audience info
- Interest count & avatars
- Responsive design
- Back button navigation

### ❌ Missing Features (40%)
- [ ] Apply/Interested button functionality
- [ ] Map preview of location
- [ ] Actual dynamic data loading (from params)
- [ ] Share functionality
- [ ] Guest list (accepted attendees)
- [ ] Event reviews/ratings
- [ ] Host contact/message CTA
- [ ] Decline/cancel attendance
- [ ] Add to calendar

---

## 🎯 Missing Features to Build

### 1. Apply/Interested Button Functionality

**Current State:** Button exists but doesn't do anything

**What to Add:**
```typescript
// State management
const [status, setStatus] = useState<'none' | 'interested' | 'applied' | 'accepted' | 'declined'>('none');
const [isLoading, setIsLoading] = useState(false);

// Button behavior
const handleApplyClick = async () => {
  setIsLoading(true);
  try {
    // Send to backend
    await applyForEvent(eventId);
    setStatus('applied');
    // Show success toast
  } catch (error) {
    // Show error toast
  } finally {
    setIsLoading(false);
  }
};
```

**Button States:**
- `none`: "Interested" button (outline style)
- `interested`: "Mark Interested" (disabled, gray)
- `applied`: "Cancel Application" (destructive style)
- `accepted`: "✓ Accepted" (success style, disabled)
- `declined`: "✗ Declined" (gray, disabled)

---

### 2. Map Preview of Location

**Component:** Embed map showing event location

**Implementation:**
```typescript
// Use Leaflet or MapLibre (already in dependencies)
<MapContainer center={[lat, lng]} zoom={15} style={{ height: "300px", width: "100%" }}>
  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
  <Marker position={[lat, lng]}>
    <Popup>{eventLocation}</Popup>
  </Marker>
</MapContainer>
```

**Features:**
- Show event location on map
- Marker with event title
- Zoom level: 15 (street level)
- Responsive container
- Click to open full map

---

### 3. Dynamic Data Loading

**Current Issue:** Static mock data in component

**What to Add:**
```typescript
// Load from route params
const { id } = useParams<{ id: string }>();
const [event, setEvent] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadEvent = async () => {
    try {
      const data = await fetchEventById(id);
      setEvent(data);
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };
  loadEvent();
}, [id]);

if (loading) return <EventDetailSkeleton />;
if (!event) return <ErrorState />;
```

---

### 4. Share Functionality

**Button/Icon:** Share icon (top-right area)

**Options:**
- Share link (copy to clipboard)
- Share to social media (Facebook, Instagram, Twitter)
- Share via message
- Generate unique referral link

**Implementation:**
```typescript
const handleShare = async () => {
  if (navigator.share) {
    // Mobile native share
    navigator.share({
      title: event.title,
      text: `Check out: ${event.title}`,
      url: window.location.href
    });
  } else {
    // Fallback: copy link modal
    copyToClipboard(window.location.href);
    showToast("Link copied!");
  }
};
```

---

### 5. Guest List / Attendees

**Section:** Below event description

**Features:**
- "Attending (12)" heading
- Avatar stack of attendees (show 6, +6 more)
- Click to expand full list
- Shows attendee names & join time
- Current user highlighted

**Data:**
```typescript
interface Attendee {
  id: string;
  name: string;
  avatar: string;
  joinedAt: Date;
  status: 'confirmed' | 'maybe' | 'going';
}
```

---

### 6. Host Contact / Message CTA

**New Button:** "Message Host" or "Contact Host"

**Action:**
- Opens message composer
- Pre-fills host ID
- Or navigates to Messages page with host selected

**Position:** Next to Apply button

---

### 7. Decline / Cancel Attendance

**When Status is "accepted":**
- Show additional "Cancel Attendance" button
- Confirmation modal before canceling
- Updates status back to "none"

---

### 8. Add to Calendar

**Icon/Button:** Calendar icon

**Action:**
```typescript
const handleAddToCalendar = () => {
  const eventData = {
    title: event.title,
    description: event.description,
    startTime: event.startTime,
    endTime: event.endTime,
    location: event.location
  };
  
  // Generate .ics file or open calendar app
  const icsContent = generateICS(eventData);
  downloadFile(icsContent, `${event.title}.ics`);
};
```

---

## 📱 Responsive Layout

```
MOBILE:
┌──────────────────────┐
│ ◄ Event Title        │
├──────────────────────┤
│ [Hero Image]         │
├──────────────────────┤
│ ★★★★★ (4.5/5)       │
│ Host Name            │
│ @hostusername       │
├──────────────────────┤
│ Description text...  │
├──────────────────────┤
│ 📍 Location          │
│ 📅 May 25, 8:00 PM   │
│ 👥 12 attending      │
├──────────────────────┤
│ [Map Preview]        │
├──────────────────────┤
│ Attending (12)       │
│ [Avatar] [Avatar]... │
├──────────────────────┤
│ [Interested Button]  │
│ [Message Button]     │
├──────────────────────┤
│ [Share] [Calendar]   │
└──────────────────────┘

DESKTOP:
┌────────────────────────────────────────┐
│ ◄ Back        Title        Share [↗]   │
├────────────────────────────────────────┤
│ [Hero Image (wide)]                    │
├──────────────────┬──────────────────────┤
│ Event Details    │ Host Info           │
│                  │ ★★★★★ (4.5)        │
│ 📍 Location      │ Host Name           │
│ 📅 May 25 8PM    │ @username           │
│ 👥 12 attending  │ [Message Button]    │
│                  │                     │
│ Description...   │ [Interested Button] │
│                  │ [Calendar Button]   │
├──────────────────┴──────────────────────┤
│ [Map Preview - Full Width]              │
├─────────────────────────────────────────┤
│ Attending (12)                          │
│ [Avatars...]                            │
└─────────────────────────────────────────┘
```

---

## 🎨 New Sections to Add

### Rating Section
```typescript
interface EventRating {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number; // 1-5
  comment: string;
  createdAt: Date;
}

// Display:
<div className="border-t pt-6">
  <h3 className="text-lg font-semibold mb-4">Reviews (23)</h3>
  {ratings.map(rating => (
    <div key={rating.id} className="mb-4 pb-4 border-b">
      <div className="flex items-center gap-3">
        <img src={rating.userAvatar} className="w-10 h-10 rounded-full" />
        <div>
          <p className="font-semibold">{rating.userName}</p>
          <StarRating value={rating.rating} readonly />
        </div>
      </div>
      <p className="mt-2 text-gray-700">{rating.comment}</p>
    </div>
  ))}
</div>
```

---

## 💾 Mock Data Update

```typescript
const mockEventDetail = {
  id: 'event_1',
  title: 'Rooftop Dinner Party',
  description: 'Join us for an exclusive rooftop dinner with stunning city views...',
  image: 'https://...',
  host: {
    id: 'host_1',
    name: 'Sarah Johnson',
    avatar: '👩‍🦰',
    rating: 4.8,
    verified: true
  },
  location: {
    name: 'Skyline Restaurant',
    address: '123 Main St, San Francisco',
    lat: 37.7749,
    lng: -122.4194
  },
  date: new Date('2026-05-25T20:00:00'),
  endDate: new Date('2026-05-25T23:00:00'),
  audience: 'mixed',
  guestCount: 12,
  maxGuests: 20,
  ticketPrice: 45,
  interests: 15,
  attendees: [
    { id: 'u1', name: 'John', avatar: '👨', joinedAt: new Date() },
    // ... more
  ],
  reviews: [
    { id: 'r1', userId: 'u1', userName: 'John', rating: 5, comment: 'Amazing event!' },
    // ... more
  ]
};
```

---

## 🔄 Updated Route Handler

```typescript
// In App.tsx router config
<Route path="/event/:id" element={<EventDetail />} />

// In EventDetail.tsx
const { id } = useParams<{ id: string }>();
const navigate = useNavigate();

useEffect(() => {
  // Validate ID exists
  if (!id) {
    navigate('/discover');
    return;
  }
  
  // Load event data
  loadEvent(id);
}, [id]);
```

---

## ✨ Animation Enhancements

1. **Image parallax** on scroll (hero image moves slower)
2. **Staggered entrance** for sections
3. **Attendee avatars** - fade in on stagger
4. **Rating stars** - animate on load
5. **Button hover** - lift effect
6. **Map load** - fade in

---

## 📊 Implementation Checklist

- [ ] Add Apply/Interested button logic
- [ ] Implement state management for application status
- [ ] Add map preview component
- [ ] Load event data from route parameter
- [ ] Implement share functionality
- [ ] Add attendee list section
- [ ] Add message host button
- [ ] Add cancel attendance feature
- [ ] Add to calendar functionality
- [ ] Add reviews/ratings section
- [ ] Style responsive layout
- [ ] Add animations
- [ ] Test on mobile/tablet/desktop
- [ ] Handle loading/error states
- [ ] Add skeleton loader

---

**Next Step:** Start with dynamic data loading and API integration.
