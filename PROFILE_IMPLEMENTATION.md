# Profile Page Implementation Guide

**Status:** 🟡 Partial (50% → needs 50% more)  
**Priority:** High  
**File:** `src/pages/Profile.tsx`  
**Related Components:** Photo uploader, bio editor, interests selector

---

## 📋 Current State vs. Missing Features

### ✅ Already Implemented (50%)
- Profile structure
- Avatar display area
- Basic info layout
- Stats section
- Edit button placeholder
- Responsive design

### ❌ Missing Features (50%)
- [ ] Photo upload/gallery
- [ ] Edit profile modal
- [ ] Bio editing
- [ ] Interests selection
- [ ] Verify phone/email
- [ ] Profile completion progress
- [ ] View profile as others see it
- [ ] Privacy settings
- [ ] Account settings
- [ ] Notification preferences

---

## 🎯 Core Features to Build

### 1. Profile Header with Photo Gallery

**Current Display:**
```
┌────────────────────────────────┐
│ [Avatar Image]                 │
│ John Smith, 28                 │
│ San Francisco, CA              │
└────────────────────────────────┘
```

**Upgrade to:**
```
┌────────────────────────────────┐
│ [Primary Photo - Large]        │
│ [Carousel: 2 3 4 5 6]         │
│                                │
│ John Smith, 28                 │
│ 📍 San Francisco, CA           │
│ 🔗 Verified Member             │
│                                │
│ ★★★★★ 4.8/5 (12 reviews)     │
│                                │
│ [Edit Profile] [Share Profile] │
└────────────────────────────────┘
```

**Photo Gallery Features:**
```typescript
interface ProfilePhoto {
  id: string;
  url: string;
  order: number;
  uploadedAt: Date;
  isPrimary: boolean;
}

// Photo carousel with:
// - Thumbnail selector at bottom
// - Drag to reorder
// - Delete button
// - Upload new photos
// - Set as primary
```

---

### 2. Photo Upload Component

**Upload Modal:**
```
┌────────────────────────────────┐
│ Upload Photos                  │
├────────────────────────────────┤
│                                │
│ [Drop files here]              │
│ or                             │
│ [Select from computer]         │
│ [Take photo (mobile)]          │
│                                │
│ Max 6 photos, 5MB each         │
│ Recommended: 4:3 ratio         │
│                                │
│ [Preview] [Reorder] [Upload]   │
│                                │
│ Uploading: ████████░ 80%       │
│                                │
└────────────────────────────────┘
```

**Photo Requirements:**
- Min 400x300px
- Max 5MB
- Formats: JPG, PNG, WebP
- Recommended: 4:3 ratio (landscape)
- 6 photos max

---

### 3. Edit Profile Modal

**Full Editor:**
```
┌────────────────────────────────┐
│ Edit Profile                   │
├────────────────────────────────┤
│                                │
│ First Name: [John________]     │
│ Last Name:  [Smith______]      │
│ Age:        [28]               │
│ Location:   [San Francisco, CA]│
│                                │
│ Bio:                           │
│ [________________________      │
│  Love to explore new places... │
│  ________________________]     │
│ (160 characters max)           │
│                                │
│ Interests:                     │
│ [+ Add Interests]              │
│                                │
│ Visibility:                    │
│ ☑ Show in Discover             │
│ ☑ Show in Nearby               │
│ ☐ Hide age                     │
│                                │
│ [Cancel] [Save Changes]        │
│                                │
└────────────────────────────────┘
```

---

### 4. Interests Selection

**Interests Picker:**
```
┌────────────────────────────────┐
│ Select Your Interests          │
│ (Max 10)                       │
├────────────────────────────────┤
│                                │
│ [Yoga] [Travel] [Gaming]       │
│ [Art] [Music] [Hiking]         │
│ [Cooking] [Movies] [Reading]   │
│ [Fitness] [Photography]        │
│ [Volunteering] [Dance]         │
│ [Tech] [Fashion]               │
│                                │
│ [Search interests...]          │
│                                │
│ Selected: 5/10                 │
│                                │
│ [Cancel] [Save]                │
│                                │
└────────────────────────────────┘
```

**Data:**
```typescript
const AVAILABLE_INTERESTS = [
  'Yoga', 'Travel', 'Gaming', 'Art', 'Music', 'Hiking',
  'Cooking', 'Movies', 'Reading', 'Fitness', 'Photography',
  'Volunteering', 'Dance', 'Tech', 'Fashion', 'Outdoors',
  'Wine', 'Coffee', 'Sports', 'Theater', 'Comedy'
];
```

---

### 5. Verification Status

**Verification Display:**
```
┌────────────────────────────────┐
│ Verification Status            │
├────────────────────────────────┤
│                                │
│ ✓ Email Verified               │
│   verified@email.com           │
│   Verified on May 10, 2026     │
│   [Change Email]               │
│                                │
│ ✓ Phone Verified               │
│   +1 (555) 123-4567           │
│   Verified on May 10, 2026     │
│   [Change Phone]               │
│                                │
│ ○ ID Verified                  │
│   Not verified yet             │
│   [Verify ID]                  │
│                                │
│ Note: ID verification improves │
│ trust and visibility in events │
│                                │
└────────────────────────────────┘
```

**Verification Flow:**
```
1. Email Verification
   - Click verify link
   - 24 hour expiration
   - Resend option

2. Phone Verification
   - Enter phone number
   - Receive SMS code
   - Enter 6-digit code
   - Success confirmation

3. ID Verification
   - Upload front/back ID
   - AI verification
   - Manual review (24-48h)
   - Badge on profile if approved
```

---

### 6. Profile Completion Progress

**Progress Bar:**
```
┌────────────────────────────────┐
│ Profile Completion: 70%        │
├────────────────────────────────┤
│ ████████████░░░░░░░░░░░ 70%   │
│                                │
│ Complete these to unlock:      │
│ ✓ Add photos                   │
│ ✓ Write bio                    │
│ ✓ Add interests                │
│ ○ Verify phone                 │
│ ○ Verify email                 │
│ ○ Verify ID                    │
│                                │
│ Benefits of 100%:              │
│ • Higher visibility            │
│ • More event invitations       │
│ • Trust badge                  │
│ • Priority support             │
│                                │
└────────────────────────────────┘
```

---

### 7. View Profile As Others See It

**Preview Mode:**
```
┌────────────────────────────────┐
│ Preview Public Profile         │
├────────────────────────────────┤
│                                │
│ [What others see when browsing]│
│                                │
│ [Photos in carousel]           │
│ Name, Age, Location            │
│ Interests (visible)            │
│ Bio                            │
│ Rating & reviews               │
│ Host/Guest stats               │
│                                │
│ [Hidden from others:           │
│ - Email                        │
│ - Phone                        │
│ - Full address]               │
│                                │
│ [Done Reviewing]               │
│                                │
└────────────────────────────────┘
```

---

### 8. Privacy Settings

**Privacy Controls:**
```
┌────────────────────────────────┐
│ Privacy & Visibility           │
├────────────────────────────────┤
│                                │
│ Profile Visibility:            │
│ ☑ Show in Discover             │
│ ☑ Show in Nearby               │
│ ☑ Show in search results       │
│                                │
│ Personal Info Visibility:      │
│ ☑ Show age                     │
│ ☑ Show location               │
│ ☑ Show interests              │
│ ○ Hide exact location (show city only)
│                                │
│ Activity Status:               │
│ ☑ Show last active time       │
│ ☑ Allow seen receipts         │
│ ☑ Show online status          │
│                                │
│ Messaging:                     │
│ ○ Accept from anyone          │
│ ☑ Accept from verified only   │
│                                │
└────────────────────────────────┘
```

---

### 9. Account Settings

**Account Options:**
```
┌────────────────────────────────┐
│ Account Settings               │
├────────────────────────────────┤
│                                │
│ Email: user@email.com          │
│ [Change Email]                 │
│                                │
│ Password                       │
│ [Change Password]              │
│ [Enable 2-Factor Auth]         │
│                                │
│ Sessions                       │
│ [Manage devices]               │
│ [Sign out all]                 │
│                                │
│ Account Status:                │
│ ✓ Active (Good standing)       │
│ [Suspend Account]              │
│ [Delete Account]               │
│                                │
│ Billing:                       │
│ [View Payment Methods]         │
│ [Billing History]              │
│                                │
└────────────────────────────────┘
```

---

### 10. Notification Preferences

**Notification Settings:**
```
┌────────────────────────────────┐
│ Notifications                  │
├────────────────────────────────┤
│                                │
│ Events & Applications:         │
│ ☑ New event recommendations   │
│ ☑ Application updates         │
│ ☑ Accepted/Declined updates   │
│                                │
│ Messages:                      │
│ ☑ New messages                │
│ ☑ Message read receipts       │
│                                │
│ Promotions:                    │
│ ☑ Promotions & offers         │
│ ☑ Premium member deals        │
│ ☑ Special events              │
│                                │
│ Notification Channels:         │
│ ☑ Email notifications         │
│ ☑ Push notifications          │
│ ☑ SMS (if phone verified)     │
│                                │
│ Quiet Hours:                   │
│ From: 10:00 PM                 │
│ To: 8:00 AM                    │
│ [Turn off notifications]       │
│                                │
└────────────────────────────────┘
```

---

## 📱 Full Profile Layout

**Mobile:**
```
┌──────────────────────────┐
│ [Back] Profile [Share]   │
├──────────────────────────┤
│ [Main Photo]             │
│ [Thumbnails: 2 3 4 5]   │
│                          │
│ Name, Age, Location      │
│ Verified Badge           │
│ Rating                   │
│                          │
│ [Edit Profile]           │
│                          │
│ Bio                      │
│ Interests: [Tag] [Tag]  │
│                          │
│ Stats:                   │
│ Events: 5 | Host: 2     │
│ Rating: 4.8/5           │
│                          │
│ [Account Settings]       │
│ [Privacy]                │
│ [Notifications]          │
│                          │
└──────────────────────────┘
```

---

## 💾 Mock Data

```typescript
const mockUserProfile = {
  id: 'user_1',
  firstName: 'John',
  lastName: 'Smith',
  age: 28,
  location: 'San Francisco, CA',
  bio: 'Love exploring new places, yoga enthusiast, coffee addict ☕',
  photos: [
    { id: 'p1', url: 'https://...', order: 1, isPrimary: true },
    { id: 'p2', url: 'https://...', order: 2, isPrimary: false }
  ],
  interests: ['yoga', 'travel', 'photography', 'hiking', 'cooking'],
  rating: 4.8,
  reviewCount: 12,
  stats: {
    eventsAttended: 15,
    eventsHosted: 3,
    trustScore: 95
  },
  verification: {
    email: { verified: true, verifiedAt: new Date() },
    phone: { verified: true, verifiedAt: new Date() },
    id: { verified: false }
  },
  completionPercentage: 85
};
```

---

## 🎨 Animation Specs

1. **Photo carousel:** Smooth transition
2. **Modal open:** Scale + fade
3. **Progress bar:** Animated count-up
4. **Badge appear:** Spring animation

---

## 📊 Implementation Checklist

- [ ] Add photo gallery with carousel
- [ ] Build photo upload component
- [ ] Create edit profile modal
- [ ] Build interests selector
- [ ] Implement verification status display
- [ ] Add verification flows (email, phone, ID)
- [ ] Create profile completion progress
- [ ] Build profile preview mode
- [ ] Add privacy settings
- [ ] Create account settings
- [ ] Build notification preferences
- [ ] Add animations
- [ ] Responsive design
- [ ] Backend integration

---

**Next Step:** Build the photo gallery and upload component first.
