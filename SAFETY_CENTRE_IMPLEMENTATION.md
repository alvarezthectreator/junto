# Safety Centre Implementation Guide

**Status:** 🟡 Partial (30% → needs 70% more)  
**Priority:** Critical  
**Files:** 
- `src/pages/Safety.tsx` (overview)
- `src/pages/SafetyCentre.tsx` (detailed)

**Related Components:** SOS button, trusted contacts, report form

---

## 📋 Current State vs. Missing Features

### ✅ Already Implemented (30%)
- Page structure
- Layout placeholders
- Icons and headings

### ❌ Missing Features (70%)
- [ ] Trusted contacts management (add/edit/remove)
- [ ] SOS button with location tracking
- [ ] Block/report functionality
- [ ] Safety tips/resources
- [ ] Anti-fraud guidelines
- [ ] Incident report form
- [ ] Safety checklist
- [ ] Emergency resources
- [ ] Verification badges
- [ ] Incident history

---

## 🎯 Core Features to Build

### 1. Trusted Contacts Management

**Interface:**
```
┌────────────────────────────────┐
│ Trusted Contacts (3)           │
│ [+ Add Contact]                │
├────────────────────────────────┤
│                                │
│ ┌──────────────────────────┐   │
│ │ Mom                      │   │
│ │ +1 (555) 123-4567       │   │
│ │ (Calls & SMS)           │   │
│ │ [Edit] [Remove]         │   │
│ └──────────────────────────┘   │
│                                │
│ ┌──────────────────────────┐   │
│ │ Best Friend              │   │
│ │ +1 (555) 234-5678       │   │
│ │ (Calls & SMS)           │   │
│ │ [Edit] [Remove]         │   │
│ └──────────────────────────┘   │
│                                │
└────────────────────────────────┘
```

**Add Contact Modal:**
```
┌──────────────────────────────┐
│ Add Trusted Contact          │
├──────────────────────────────┤
│ Name: [________________]     │
│ Phone: [________________]    │
│ Email: [________________]    │
│ Relationship (optional):     │
│ [Dropdown: Family/Friend]   │
│                              │
│ Notify Method:               │
│ ☑ Phone Call                │
│ ☑ SMS Text                  │
│ ☐ Email                     │
│                              │
│ [Cancel] [Save]              │
└──────────────────────────────┘
```

**Data Structure:**
```typescript
interface TrustedContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship?: string;
  notificationMethods: ('call' | 'sms' | 'email')[];
  addedAt: Date;
}
```

---

### 2. SOS Button with Location Tracking

**Main SOS Interface:**
```
┌────────────────────────────────┐
│                                │
│         [SOS BUTTON]           │
│      (Large, Red, Round)       │
│      "Hold to Activate"        │
│                                │
│ Your Location:                 │
│ 📍 123 Main St, San Francisco  │
│ Share with trusted contacts    │
│                                │
│ [Emergency Services] [Nearby]  │
│                                │
└────────────────────────────────┘
```

**When Activated:**
```typescript
const handleSOSPress = () => {
  // 1. Get current location
  const location = await getCurrentLocation();
  
  // 2. Send alerts to trusted contacts
  await notifyTrustedContacts({
    message: "I need help! Check my location",
    location: location,
    sosId: generateSOSId()
  });
  
  // 3. Show live tracking
  setShowLiveTracking(true);
  
  // 4. Set timeout to auto-call emergency services
  setTimeout(() => {
    callEmergencyServices(location);
  }, 30000); // 30 second grace period
};
```

**SOS Confirmation:**
```
┌────────────────────────────────┐
│ SOS Activated 🚨               │
├────────────────────────────────┤
│ Emergency services dispatched  │
│ Location: 123 Main St          │
│ Time: 8:45 PM                  │
│                                │
│ Trusted contacts notified:     │
│ ✓ Mom - SMS sent               │
│ ✓ Best Friend - Call sent      │
│                                │
│ [Cancel SOS] [Share Location]  │
│ [Live Chat with Support]       │
│                                │
└────────────────────────────────┘
```

---

### 3. Block & Report Functionality

**Report User Modal:**
```
┌────────────────────────────────┐
│ Report User                    │
├────────────────────────────────┤
│ User: Sarah Johnson            │
│ Report Type (required):        │
│ ✓ Inappropriate behavior       │
│ ○ Scam/Fraud                   │
│ ○ Harassment                   │
│ ○ Fake profile                 │
│ ○ Other                        │
│                                │
│ Details:                       │
│ [Text area for description]    │
│                                │
│ [Attach Screenshot]            │
│                                │
│ [ ] Block this user            │
│ [ ] Hide from my activity      │
│                                │
│ [Cancel] [Submit Report]       │
└────────────────────────────────┘
```

**Block User:**
- Prevents user from seeing your profile
- Prevents messaging
- Removes from mutual event lists
- Cannot unblock (user must reach out to support)

**Report Status:**
- Submitted timestamp
- Report ID
- Investigation status
- Resolution

---

### 4. Safety Tips & Resources

**Tips List:**
```
┌────────────────────────────────┐
│ Safety Tips                    │
├────────────────────────────────┤
│                                │
│ ✓ Meet in Public Places        │
│   Always choose crowded venues │
│   and let friends know         │
│   where you're going.          │
│                                │
│ ✓ Share Your Location          │
│   Tell trusted contacts where  │
│   you'll be.                   │
│                                │
│ ✓ Trust Your Instincts         │
│   If something feels off,      │
│   it's okay to leave.          │
│                                │
│ ✓ Verify Identity              │
│   Ask for ID verification.     │
│                                │
│ ✓ Stay Sober                   │
│   Keep your wits about you.    │
│                                │
│ [More Tips] [24/7 Support]     │
│                                │
└────────────────────────────────┘
```

---

### 5. Anti-Fraud Guidelines

**Fraud Prevention:**
```
┌────────────────────────────────┐
│ Protect Against Scams          │
├────────────────────────────────┤
│                                │
│ ⚠️ Red Flags:                  │
│ • Asks for money upfront       │
│ • Won't video call/verify      │
│ • Suspicious payment requests  │
│ • Wants to move off platform   │
│ • Mismatches in stories        │
│                                │
│ 🛡️ What We Do:               │
│ • Verify member accounts       │
│ • Monitor for scam patterns    │
│ • Protect payment info         │
│ • 24/7 fraud monitoring        │
│                                │
│ [Report Fraud] [Learn More]    │
│                                │
└────────────────────────────────┘
```

---

### 6. Incident Report Form

**Report an Incident:**
```
┌────────────────────────────────┐
│ Report an Incident             │
├────────────────────────────────┤
│ What happened?                 │
│ [Textarea - detailed account]  │
│                                │
│ When did it happen?            │
│ Date: [______] Time: [_______] │
│                                │
│ Where did it happen?           │
│ Location: [______________]     │
│                                │
│ Who was involved?              │
│ Other user: [Sarah Johnson]    │
│                                │
│ Do you need immediate help?    │
│ ○ No, just reporting          │
│ ○ Yes, contact support NOW    │
│                                │
│ Attachments: [Upload files]    │
│                                │
│ Report ID: RPT-2026-05-21-001  │
│                                │
│ [Cancel] [Submit Report]       │
│ [Call 911] [Chat Support]      │
│                                │
└────────────────────────────────┘
```

**After Submission:**
```
Your report has been submitted.
Report ID: RPT-2026-05-21-001

Our safety team will review within 24 hours.
You'll receive updates at your email/SMS.

[View Report Status] [Contact Support]
```

---

### 7. Safety Checklist

**Pre-Event Checklist:**
```
┌────────────────────────────────┐
│ Going to an Event? 📋         │
├────────────────────────────────┤
│                                │
│ Before You Go:                 │
│ ☐ Verify host identity         │
│ ☐ Read event details           │
│ ☐ Check host reviews/rating    │
│ ☐ Add to trusted calendar      │
│ ☐ Share location with friend   │
│ ☐ Set check-in reminder        │
│ ☐ Have exit plan               │
│                                │
│ At the Event:                  │
│ ☐ Arrive on time               │
│ ☐ Stay aware of surroundings   │
│ ☐ Keep phone charged           │
│ ☐ Don't leave drink unattended │
│ ☐ Stick with friends           │
│                                │
│ [Print Checklist] [Share]      │
│                                │
└────────────────────────────────┘
```

---

### 8. Emergency Resources

**Resources Card:**
```
┌────────────────────────────────┐
│ Emergency Resources            │
├────────────────────────────────┤
│                                │
│ 🚨 Emergency: 911              │
│ (Available 24/7)               │
│                                │
│ 📞 Wantuu Support: 1-800-WANTUU  │
│ (Available 24/7)               │
│                                │
│ 🏥 Poison Control              │
│ 1-800-222-1222                 │
│                                │
│ 💬 Crisis Text Line            │
│ Text "WANTUU" to 741741         │
│                                │
│ 🛡️ Local Police                │
│ Non-Emergency: [City Specific] │
│                                │
│ 🌐 Resources:                  │
│ • RAINN.org                    │
│ • Safety.com                   │
│ • CyberTipline.org             │
│                                │
└────────────────────────────────┘
```

---

## 📱 Page Layout

**Safety Overview Page (`Safety.tsx`):**
```
┌────────────────────────────────┐
│ Safety & Trust                 │
├────────────────────────────────┤
│                                │
│ 🚨 [SOS Button - Large]        │
│                                │
│ Quick Actions:                 │
│ [Trusted Contacts]             │
│ [Report User]                  │
│ [Report Incident]              │
│                                │
│ Safety Resources:              │
│ [Tips & Guidelines]            │
│ [Anti-Fraud Info]              │
│ [Emergency Resources]          │
│                                │
│ [Go to Full Safety Centre]     │
│                                │
└────────────────────────────────┘
```

**Detailed Safety Centre Page (`SafetyCentre.tsx`):**
```
┌────────────────────────────────┐
│ Safety Centre                  │
├────────────────────────────────┤
│ [Contacts] [Block] [Reports]   │
├────────────────────────────────┤
│                                │
│ Tab Content:                   │
│ [Full feature based on tab]    │
│                                │
└────────────────────────────────┘
```

---

## 💾 Mock Data

```typescript
const mockTrustedContacts: TrustedContact[] = [
  {
    id: 'contact_1',
    name: 'Mom',
    phone: '+1 (555) 123-4567',
    email: 'mom@email.com',
    relationship: 'Family',
    notificationMethods: ['call', 'sms'],
    addedAt: new Date(Date.now() - 30 * 24 * 60 * 60000)
  },
  {
    id: 'contact_2',
    name: 'Best Friend',
    phone: '+1 (555) 234-5678',
    email: 'friend@email.com',
    relationship: 'Friend',
    notificationMethods: ['sms', 'email'],
    addedAt: new Date(Date.now() - 15 * 24 * 60 * 60000)
  }
];

const mockBlockedUsers = [
  {
    id: 'blocked_1',
    name: 'Suspicious User',
    blockedAt: new Date(Date.now() - 7 * 24 * 60 * 60000),
    reason: 'Inappropriate behavior'
  }
];

const mockIncidents = [
  {
    id: 'incident_1',
    type: 'report',
    description: 'User was inappropriate at event',
    reportedUser: 'User Name',
    date: new Date(Date.now() - 3 * 24 * 60 * 60000),
    status: 'under_review',
    reportId: 'RPT-2026-05-18-001'
  }
];
```

---

## 🎨 Animation Specs

1. **SOS Button:** Pulse animation when idle
2. **Emergency Alert:** Shake animation + red glow
3. **Modal entries:** Scale + fade
4. **Checklist items:** Staggered check animation

---

## 🔒 Security Notes

- All location data should be encrypted
- SOS calls logged for legal protection
- Automatic data retention (90 days)
- GDPR compliant data handling
- Two-factor auth for sensitive actions

---

## 📊 Implementation Checklist

- [ ] Build trusted contacts manager
- [ ] Implement SOS button with location tracking
- [ ] Create block/report user functionality
- [ ] Add safety tips section
- [ ] Build anti-fraud guidelines
- [ ] Create incident report form
- [ ] Add safety checklist
- [ ] Compile emergency resources
- [ ] Implement emergency contact notifications
- [ ] Add 24/7 support chat integration
- [ ] Create incident history
- [ ] Add verification badges
- [ ] Responsive design
- [ ] Backend integration with location services

---

**Next Step:** Build the Trusted Contacts manager first with add/edit/remove functionality.
