# Nearby Mode / Swipe Page Implementation Guide

**Status:** 🟡 Partial (40% → needs 60% more)  
**Priority:** High  
**File:** `src/pages/Nearby.tsx`  
**Related Components:** Card stack, gesture handler, match modal

---

## 📋 Current State vs. Missing Features

### ✅ Already Implemented (40%)
- Page structure
- Map component
- Basic layout
- Typography/styling

### ❌ Missing Features (60%)
- [ ] Swipe card stack UI
- [ ] Profile cards (photos, name, bio)
- [ ] Swipe gesture detection
- [ ] Like/Pass buttons
- [ ] Match animation
- [ ] Location tracking
- [ ] Match confirmation modal
- [ ] No-more-matches state
- [ ] Profile preview modal

---

## 🎯 Core Features to Build

### 1. Card Stack Component

**Structure:** Tinder-like card stack

```
┌─────────────────────────────┐
│        [Card 3]             │
│ (Behind, slightly visible)  │
└─────────────────────────────┘
      ┌──────────────────────────────┐
      │       [Card 2]               │
      │ (Behind, more visible)       │
      └──────────────────────────────┘
           ┌───────────────────────────────┐
           │        [Card 1]               │
           │  (Front, full visible)        │
           │ Draggable - swipe left/right  │
           └───────────────────────────────┘
```

**Features:**
- 3 cards visible at once
- Front card is draggable
- Smooth stacking animation
- Auto-load next card on swipe
- Infinite deck (loop back when empty)

**Data Structure:**
```typescript
interface NearbyProfile {
  id: string;
  name: string;
  age: number;
  photos: string[];
  bio: string;
  interests: string[];
  distance: number; // miles
  location: string;
  verified: boolean;
  lastActive: Date;
  compatibility?: number; // 0-100
}
```

---

### 2. Profile Card Display

**Front Card Layout:**
```
┌──────────────────────────────┐
│  [Profile Photo]             │
│  (Full card background)      │
│                              │
│  ┌────────────────────────┐  │
│  │ Sarah, 26              │  │
│  │ 2 miles away           │  │
│  │ ★★★★★ 92% Match      │  │
│  │                        │  │
│  │ Yoga & Travel 🧘✈️    │  │
│  └────────────────────────┘  │
│                              │
│  [✗ Pass] [♥ Like]          │
└──────────────────────────────┘
```

**Card Information:**
- Name & age (top-left)
- Distance from user
- Compatibility percentage
- Bio/interests (bottom gradient overlay)
- Action buttons (Pass / Like)

---

### 3. Swipe Gesture Detection

**Implementation using Framer Motion:**

```typescript
const [exitX, setExitX] = useState(0);

const handleDragEnd = (event, info) => {
  const swipeThreshold = 50; // pixels
  
  if (info.offset.x < -swipeThreshold) {
    // Swiped left (Pass)
    setExitX(-500);
    handlePass();
  } else if (info.offset.x > swipeThreshold) {
    // Swiped right (Like)
    setExitX(500);
    handleLike();
  } else {
    // Not swiped far enough, snap back
    setExitX(0);
  }
};

const cardVariants = {
  center: { opacity: 1, scale: 1, x: 0, rotate: 0 },
  exit: {
    opacity: 0,
    scale: 0.8,
    x: exitX,
    rotate: exitX > 0 ? 20 : -20,
    transition: { duration: 0.3 }
  }
};
```

**Gestures:**
- **Drag right (>50px):** Like ❤️
- **Drag left (>50px):** Pass ✗
- **Drag up:** Open profile preview
- **Snap back:** Release without sufficient drag

---

### 4. Like/Pass Buttons

**Button Layout:**
```
       [Card]
         │
    ┌────┴────┐
    │          │
  [✗Pass]  [♥Like]
```

**Button Features:**
- **Pass Button:** Gray, round, X icon
- **Like Button:** Red/accent color, round, heart icon
- **Hover:** Scale up + shadow
- **Click:** Trigger swipe animation

**Implementation:**
```typescript
const handlePassClick = () => {
  // Animate card out to left
  setExitX(-500);
  handlePass();
};

const handleLikeClick = () => {
  // Animate card out to right
  setExitX(500);
  handleLike();
};
```

---

### 5. Match Animation & Modal

**When Mutual Like:**
```
1. Card swipes off screen with heart trail
2. "It's a Match! 🎉" modal appears
3. Confetti animation falls
4. Show both profiles side-by-side
5. "Send Message" button
6. "Keep Swiping" button
```

**Modal Structure:**
```typescript
interface MatchModalProps {
  isOpen: boolean;
  profile1: NearbyProfile;
  profile2: NearbyProfile;
  onSendMessage: () => void;
  onKeepSwiping: () => void;
}

export const MatchModal: React.FC<MatchModalProps> = ({
  isOpen,
  profile1,
  profile2,
  onSendMessage,
  onKeepSwiping
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed inset-0 flex items-center justify-center bg-black/50"
        >
          <div className="bg-white rounded-3xl p-8 text-center max-w-sm">
            <h2 className="text-3xl font-bold mb-4">It's a Match! 🎉</h2>
            
            {/* Profile Photos Side by Side */}
            <div className="flex justify-center gap-4 mb-6">
              <img src={profile1.photos[0]} className="w-24 h-24 rounded-full" />
              <img src={profile2.photos[0]} className="w-24 h-24 rounded-full" />
            </div>
            
            <p className="text-gray-600 mb-6">
              You and {profile2.name} liked each other!
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={onKeepSwiping}
                className="flex-1 py-3 border-2 rounded-full font-semibold"
              >
                Keep Swiping
              </button>
              <button
                onClick={onSendMessage}
                className="flex-1 py-3 bg-red-500 text-white rounded-full font-semibold"
              >
                Send Message
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
```

---

### 6. Location Tracking

**Get User Location:**
```typescript
useEffect(() => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        console.error('Location error:', error);
        // Fallback to default city
        setUserLocation(DEFAULT_LOCATION);
      }
    );
  }
}, []);

// Calculate distance between user and profiles
const calculateDistance = (userLat: number, userLng: number, profileLat: number, profileLng: number) => {
  // Haversine formula
  const R = 3959; // Earth's radius in miles
  const dLat = (profileLat - userLat) * Math.PI / 180;
  const dLng = (profileLng - userLng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(userLat * Math.PI / 180) * Math.cos(profileLat * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in miles
};
```

---

### 7. No-More-Matches State

**When deck is empty:**
```
┌────────────────────────────────┐
│                                │
│      No More Profiles 😴       │
│                                │
│   Come back later or expand    │
│   your search radius!          │
│                                │
│  [Adjust Preferences] [Go Back]│
│                                │
└────────────────────────────────┘
```

**Fallback Display:**
```typescript
if (profiles.length === 0) {
  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <p className="text-2xl font-semibold mb-4">No More Profiles</p>
      <p className="text-gray-600 mb-8">Check back later!</p>
      <button
        onClick={() => navigate('/discover')}
        className="px-6 py-3 bg-accent rounded-full"
      >
        Browse Events Instead
      </button>
    </div>
  );
}
```

---

### 8. Profile Preview Modal

**Swipe up or click on card:**
```
┌──────────────────────────────┐
│  ◄ Close                    ✓ │
├──────────────────────────────┤
│  [Full Profile Photos]       │
│  (Carousel)                  │
├──────────────────────────────┤
│  Sarah, 26                   │
│  ★★★★★ 92% Match            │
│  📍 2 miles away             │
│  ✓ ID Verified              │
├──────────────────────────────┤
│  About                       │
│  Love yoga, travel, and...   │
├──────────────────────────────┤
│  Interests                   │
│  🧘 Yoga 🎮 Gaming ✈️ Travel │
├──────────────────────────────┤
│  [✗ Pass] [♥ Like]          │
└──────────────────────────────┘
```

---

## 📱 Responsive Layout

**Mobile (Full Screen):**
- Card takes up 90% of screen width
- Buttons centered below
- Full height for card image
- Bottom padding for safe area

**Tablet:**
- Card takes 70% width, centered
- Larger images

---

## 💾 Mock Data

```typescript
const mockNearbyProfiles: NearbyProfile[] = [
  {
    id: 'nearby_1',
    name: 'Sarah',
    age: 26,
    photos: ['https://...', 'https://...'],
    bio: 'Love yoga and travel ✈️ Always up for weekend adventures!',
    interests: ['yoga', 'travel', 'hiking', 'photography'],
    distance: 2.3,
    location: 'Mission District',
    verified: true,
    lastActive: new Date(Date.now() - 30 * 60000),
    compatibility: 92
  },
  {
    id: 'nearby_2',
    name: 'Jessica',
    age: 24,
    photos: ['https://...', 'https://...'],
    bio: 'Foodie, artist, dog lover 🐕',
    interests: ['art', 'food', 'music', 'dogs'],
    distance: 1.8,
    location: 'Castro',
    verified: true,
    lastActive: new Date(Date.now() - 5 * 60000),
    compatibility: 87
  }
  // ... more profiles
];
```

---

## 🎨 Animation Specs

1. **Card Stack:** Slight scale increase for front card
2. **Swipe Exit:** Rotate + scale + fade
3. **Match Confetti:** Celebratory particle animation
4. **Button Hover:** Scale up + shadow
5. **Profile Preview:** Slide up from bottom

---

## 🔄 State Management

```typescript
// Nearby.tsx
const [profiles, setProfiles] = useState<NearbyProfile[]>([]);
const [currentIndex, setCurrentIndex] = useState(0);
const [matches, setMatches] = useState<string[]>([]);
const [showMatchModal, setShowMatchModal] = useState(false);
const [lastMatch, setLastMatch] = useState<{ profile1: NearbyProfile; profile2: NearbyProfile } | null>(null);

const handleLike = (profileId: string) => {
  // Check if mutual match
  if (userLikes.includes(profileId) && profileLikes[profileId]?.includes(userId)) {
    setShowMatchModal(true);
    setLastMatch({ profile1: currentProfile, profile2: getProfile(profileId) });
  }
  
  // Move to next card
  setCurrentIndex(prev => prev + 1);
};

const handlePass = () => {
  setCurrentIndex(prev => prev + 1);
};
```

---

## 📊 Implementation Checklist

- [ ] Create card stack component
- [ ] Implement swipe gesture detection
- [ ] Add profile photo carousel
- [ ] Add Like/Pass buttons
- [ ] Implement location tracking
- [ ] Create match modal
- [ ] Add confetti animation
- [ ] Build profile preview modal
- [ ] Handle empty deck state
- [ ] Create preferences/filter UI
- [ ] Add animations for card transitions
- [ ] Test on iOS/Android gestures
- [ ] Add loading skeleton
- [ ] Implement backend integration

---

**Next Step:** Build the card stack component with gesture handling.
