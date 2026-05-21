# Travel Mode Implementation Guide

**Status:** 🟡 Partial (50% → needs 50% more)  
**Priority:** Medium  
**File:** `src/pages/TravelMode.tsx`  
**Related Components:** City search, trip planner, destination events

---

## 📋 Current State vs. Missing Features

### ✅ Already Implemented (50%)
- Page structure
- City selector layout
- Responsive design
- Header

### ❌ Missing Features (50%)
- [ ] City input/search
- [ ] Suggested cities
- [ ] Set destination button
- [ ] Map preview of destination
- [ ] Events in that city
- [ ] Toggle on/off state
- [ ] Disable/cancel
- [ ] Trip date picker
- [ ] Saved trips history

---

## 🎯 Core Features to Build

### 1. City Search Input

**Search Interface:**
```
┌────────────────────────────────┐
│ Travel Mode                    │
│ Where are you traveling?       │
├────────────────────────────────┤
│ [Search city, country...]     │
│ [✓ Clear]                     │
│                                │
│ Suggested Cities:              │
│ • New York, USA (2,341 events) │
│ • London, UK (1,203 events)    │
│ • Paris, France (945 events)   │
│ • Tokyo, Japan (1,102 events)  │
│ • Sydney, Australia (657)      │
│                                │
│ Your Recent Trips:             │
│ • Los Angeles, CA (visited)    │
│ • Miami, FL (visited)          │
│                                │
└────────────────────────────────┘
```

**Search Features:**
```typescript
const handleCitySearch = (query: string) => {
  // Autocomplete suggestions
  // Returns: city name, country, coordinates, event count
  const results = searchCities(query);
  
  // Display results with:
  // - City name & flag
  // - Country
  // - Number of events
  // - Star rating (average host rating)
};

interface CityResult {
  id: string;
  name: string;
  country: string;
  flag: string;
  coordinates: { lat: number; lng: number };
  eventCount: number;
  averageRating: number;
}
```

---

### 2. Suggested Cities

**Display Logic:**
- Popular destinations globally
- Trending this season
- Based on user's home location
- Similar to places they've visited
- Highest event count

**Display:**
```
┌────────────────────────────────┐
│ Popular Destinations           │
├────────────────────────────────┤
│ 🔥 Trending:                   │
│ • Barcelona, Spain (1,523)     │
│ • Amsterdam, Netherlands       │
│ • Bangkok, Thailand            │
│                                │
│ ⭐ Top Rated:                  │
│ • Vienna, Austria              │
│ • Prague, Czechia              │
│                                │
│ 📍 Near You:                   │
│ • Los Angeles, CA (124 mi)     │
│ • Las Vegas, NV (295 mi)       │
│                                │
└────────────────────────────────┘
```

---

### 3. Set Destination & Trip Dates

**Trip Setup:**
```
┌────────────────────────────────┐
│ Set Up Your Trip               │
├────────────────────────────────┤
│ Destination: [Barcelona, Spain]│
│ (Selected) [Change]            │
│                                │
│ Travel Dates:                  │
│ From: [June 1, 2026]          │
│ To: [June 10, 2026]           │
│                                │
│ Number of travelers:           │
│ ○ Just me                      │
│ ○ 2 people                     │
│ ○ 3+ people                    │
│                                │
│ Travel Style:                  │
│ [Adventure] [Cultural]         │
│ [Nightlife] [Relaxation]       │
│ [Food] [Outdoor]               │
│                                │
│ [Cancel] [Confirm & Explore]   │
│                                │
└────────────────────────────────┘
```

---

### 4. Map Preview of Destination

**Map View:**
```
┌────────────────────────────────┐
│ Barcelona, Spain               │
├────────────────────────────────┤
│  ╔════════════════════════════╗│
│  ║                            ║│
│  ║  [Map with events]         ║│
│  ║  - Red pins: Events        ║│
│  ║  - Info windows on click   ║│
│  ║                            ║│
│  ║  Zoom controls             ║│
│  ║  Your location             ║│
│  ║                            ║│
│  ╚════════════════════════════╝│
│ [View Events] [Plan Trip]      │
│                                │
└────────────────────────────────┘
```

**Implementation:**
```typescript
// Use Leaflet or MapLibre
<MapContainer center={[lat, lng]} zoom={13}>
  <TileLayer />
  {destinationEvents.map(event => (
    <Marker key={event.id} position={[event.lat, event.lng]}>
      <Popup>
        <div>
          <h3>{event.title}</h3>
          <p>{event.date}</p>
          <p>{event.price}$</p>
        </div>
      </Popup>
    </Marker>
  ))}
</MapContainer>
```

---

### 5. Events in Destination City

**Events Browse:**
```
┌────────────────────────────────┐
│ Events in Barcelona (127)      │
├────────────────────────────────┤
│ [Filter] [Sort By]             │
│                                │
│ ┌──────────────────────────┐   │
│ │ [Img] Tapas Night       │   │
│ │ Sat, June 2 @ 8:00 PM   │   │
│ │ ⭐★★★★ 4.8 (23 reviews)│   │
│ │ 💰 €35 • 👥 12/15      │   │
│ │ [Interested] [Details]  │   │
│ └──────────────────────────┘   │
│                                │
│ [Load More Events]             │
│                                │
└────────────────────────────────┘
```

**Filters:**
- Date range
- Price range
- Event type
- Distance from center
- Rating

---

### 6. Toggle Travel Mode On/Off

**Status Display:**
```
┌────────────────────────────────┐
│ Travel Mode Status             │
├────────────────────────────────┤
│                                │
│ Current Status: ACTIVE ✓       │
│                                │
│ Destination: Barcelona, Spain  │
│ Travel Dates: June 1-10, 2026  │
│ Events Found: 127              │
│                                │
│ Your profile now shows:        │
│ • Events in Barcelona          │
│ • Travel radius: 50km          │
│ • Hosts can see you're coming  │
│                                │
│ [Turn Off Travel Mode]         │
│ [Edit Destination]             │
│ [Add More Destinations]        │
│                                │
└────────────────────────────────┘
```

**Turn Off:**
```
Modal:
┌────────────────────────────────┐
│ Turn Off Travel Mode?          │
│                                │
│ You won't see Barcelona events │
│ in your Discover feed anymore. │
│                                │
│ [Keep On] [Turn Off]           │
└────────────────────────────────┘
```

---

### 7. Edit/Cancel Destination

**Edit Trip:**
```
┌────────────────────────────────┐
│ Edit Your Trip                 │
├────────────────────────────────┤
│ Destination: [Barcelona    ▼]  │
│ From: [June 1    ▼]            │
│ To: [June 10    ▼]             │
│                                │
│ [Save Changes]                 │
│ [Cancel This Trip]             │
│                                │
└────────────────────────────────┘
```

**Cancel Trip:**
```
Modal:
┌────────────────────────────────┐
│ Cancel This Trip?              │
│                                │
│ Your applications and messages │
│ will not be affected.          │
│                                │
│ [Keep Trip] [Cancel Trip]      │
└────────────────────────────────┘
```

---

### 8. Saved Trips History

**Previous Trips:**
```
┌────────────────────────────────┐
│ Your Trips                     │
├────────────────────────────────┤
│                                │
│ Upcoming:                      │
│ • Barcelona, Spain             │
│   June 1-10, 2026              │
│   127 events found             │
│   Status: ACTIVE               │
│                                │
│ Past Trips:                    │
│ • Paris, France                │
│   April 15-22, 2026            │
│   Attended 4 events            │
│   Status: COMPLETED            │
│                                │
│ • New York, USA                │
│   March 8-15, 2026             │
│   Attended 6 events            │
│                                │
│ [Add Another Trip]             │
│                                │
└────────────────────────────────┘
```

---

### 9. Trip Statistics

**Trip Dashboard:**
```
┌────────────────────────────────┐
│ Barcelona Trip Stats           │
├────────────────────────────────┤
│                                │
│ Duration: 10 days              │
│ Events Found: 127              │
│ Applications: 4                │
│ Confirmed Attending: 2         │
│ Saved to Wishlist: 7           │
│                                │
│ Best Time for Events:          │
│ Evenings (8-11 PM)             │
│                                │
│ Most Popular Vibes:            │
│ Social • Dining • Adventure    │
│                                │
└────────────────────────────────┘
```

---

## 📱 Full Page Flow

**Mobile Journey:**
```
1. Landing:
   ┌─────────────────────┐
   │ Travel Mode         │
   │ Where traveling?    │
   │ [Search...]         │
   │ [Popular cities]    │
   └─────────────────────┘

2. Search Results:
   ┌─────────────────────┐
   │ Results for "Bar"   │
   │ • Barcelona, Spain  │
   │ • Barcelona, VE     │
   │ • Barbados          │
   └─────────────────────┘

3. Set Dates:
   ┌─────────────────────┐
   │ Barcelona, Spain    │
   │ From: [______]      │
   │ To: [______]        │
   │ [Confirm]           │
   └─────────────────────┘

4. Browse Events:
   ┌─────────────────────┐
   │ 127 events found    │
   │ [Event list...]     │
   └─────────────────────┘
```

---

## 💾 Mock Data

```typescript
interface Trip {
  id: string;
  destination: {
    city: string;
    country: string;
    coordinates: { lat: number; lng: number };
  };
  startDate: Date;
  endDate: Date;
  travelersCount: number;
  travelStyle: string[];
  status: 'active' | 'completed' | 'cancelled';
  eventsFound: number;
  applicationsCount: number;
  confirmedCount: number;
  createdAt: Date;
}

const mockTrips: Trip[] = [
  {
    id: 'trip_1',
    destination: { 
      city: 'Barcelona', 
      country: 'Spain',
      coordinates: { lat: 41.3851, lng: 2.1734 }
    },
    startDate: new Date('2026-06-01'),
    endDate: new Date('2026-06-10'),
    travelersCount: 2,
    travelStyle: ['food', 'adventure', 'nightlife'],
    status: 'active',
    eventsFound: 127,
    applicationsCount: 4,
    confirmedCount: 2,
    createdAt: new Date()
  }
];

const suggestedCities: CityResult[] = [
  {
    id: 'city_1',
    name: 'Barcelona',
    country: 'Spain',
    flag: '🇪🇸',
    coordinates: { lat: 41.3851, lng: 2.1734 },
    eventCount: 127,
    averageRating: 4.7
  }
];
```

---

## 🎨 Animation Specs

1. **Map load:** Fade in + zoom effect
2. **City results:** Staggered list
3. **Mode toggle:** Slide transition
4. **Trip add:** Scale + bounce

---

## 📊 Implementation Checklist

- [ ] Build city search input with autocomplete
- [ ] Create suggested cities display
- [ ] Implement date picker
- [ ] Add map preview
- [ ] Build events filter/sort
- [ ] Create trip management UI
- [ ] Implement toggle on/off
- [ ] Add trip statistics
- [ ] Build previous trips history
- [ ] Add animations
- [ ] Responsive design
- [ ] Backend integration (Google Places API)
- [ ] Geolocation features

---

**Next Step:** Build the city search component with autocomplete.
