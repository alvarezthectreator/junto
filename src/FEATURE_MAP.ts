// Pages Structure for Junto App
// Feature Specification v1.0 - Feature map and implementation tracker

export const PAGE_STRUCTURE = {
  MAIN_NAVIGATION: {
    discover: 'Main event discovery board with filtering',
    myRequests: 'Join requests, applications, wishlist',
    messages: 'Real-time messaging and calls',
    safety: 'Trust & safety features dashboard',
  },

  FEATURE_PAGES: {
    ONBOARDING: {
      landing: 'User Onboarding Flow - 6 steps',
    },

    DISCOVERY: {
      discover: 'Event Categories & Tags, Discovery Board',
      eventDetail: 'Full event detail with ratings & billing breakdown',
      eventSearch: 'Search functionality with filters',
      eventCapacity: 'Companion capacity management',
    },

    SOCIAL: {
      profile: 'User profiles with editable info and media',
      nearby: 'Nearby Mode - Tinder-style swipe discovery',
      myRequests: 'Private events, wishlist, squad events',
    },

    TRUST_AND_SAFETY: {
      safety: 'Main safety hub',
      safetyCentre: 'Verified badge, Emergency SOS, Trusted Contacts',
      // Features included:
      // - ID Verification (Smile Identity, Youverify, Sumsub)
      // - Reliability Score System (publicly visible)
      // - Cancellation Window System (dynamic 20% calculation)
      // - Automatic No-Show Detection (GPS check-in)
      // - Post-Outing Wellbeing Check
      // - Star Ratings (post-outing feedback)
      // - Report a User functionality
      // - Block a User functionality
      // - Emergency SOS (always free)
    },

    BILLING_AND_PLANS: {
      premium: 'Junto Premium subscription & plan comparison',
      // Features included:
      // - 4 Billing Tiers (HOST_ALL, HOST_NO_TRANSPORT, SPLIT, HOST_ME)
      // - Financial Agreement Modal
      // - Plan Limits (Free vs Paid)
      // - Paystack & Stripe integration
    },

    HOSTING: {
      hostDashboard: 'Host event management dashboard',
      // Features included:
      // - Active events management
      // - Application review & acceptance
      // - Attendee check-in tracking
      // - Past events with ratings
    },

    COMMUNICATION: {
      messages: 'Full messaging with audio/video calls',
      // Features included:
      // - Text, Image, Audio, Video, GIF messages
      // - WebRTC peer-to-peer calls
      // - WhatsApp invite and sharing
      // - In-App Notifications Centre
      // - Push Notification Preferences
    },

    TRAVEL_AND_PREMIUM: {
      travelMode: 'Travel Mode for paid users (10 supported cities, saved search management)',
      // Features included:
      // - Virtual and Physical event distinction
      // - Tour Guide listings
      // - Visible to Travelers toggle
      // - Saved search rename/delete
      // - Stale saved-search cleanup
    },

    PREMIUM_SERVICES: {
      // Included in premium feature set:
      // - Venue Profiles with in-app booking
      // - Celebrity Profiles with booking flow
      // - Junto for Business - Venue Portal
    },

    SUPPORT: {
      help: 'Help & FAQ Centre with live chat',
      // Features included:
      // - Searchable help articles
      // - Account deletion and data export
      // - GDPR/NDPR compliance
      // - Referral System
    },
  },

  FEATURE_GROUPS: {
    CORE_SOCIAL: [
      '01. User Onboarding Flow',
      '02. Event Categories and Tags',
      '03. Discovery and Event Board',
      '04. Event Detail View',
      '05. Event Capacity',
      '06. Event Search',
      '19. User Profiles',
      '20. Nearby Mode — Swipe Discovery',
      '21. Private Events',
      '23. Wishlist — Save Event for Later',
    ],

    GROUP: [
      '22. Squad Events — Group Outings',
      '24. Host Dashboard',
    ],

    TRUST_SAFETY: [
      '09. ID Verification and Verified Badge',
      '10. Reliability Score System',
      '11. Cancellation Window System',
      '12. Automatic No-Show Detection',
      '13. GPS Check-In and Proximity Verification',
      '14. Post-Outing Wellbeing Check',
      '15. Star Ratings',
      '16. Report a User',
      '17. Block a User',
      '18. Safety Centre and Emergency SOS',
    ],

    BILLING_PLANS: [
      '25. Billing System — Plan Restricted',
      '26. Financial Agreement Modal',
      '27. Plan Limits — Free vs Paid',
      '28. Junto Premium Subscription',
    ],

    COMMUNICATION: [
      '29. Messaging and Chat',
      '30. WhatsApp Invite and Sharing',
      '31. In-App Notifications Centre',
      '32. Push Notification Preferences',
    ],

    TRAVEL: [
      '07. Saved Searches',
      '08. Event Expiry and Cleanup',
      '33. Travel Mode — Paid Users Only',
    ],

    PREMIUM_SERVICES: [
      '34. Venue Profiles',
      '35. Junto for Business — Venue Portal',
      '36. Celebrity Profiles',
    ],

    GROWTH_COMPLIANCE: [
      '37. Referral System',
      '38. Account Deletion and Data Export',
      '39. Help and FAQ Centre',
      '40. Claude Code Developer Prompt',
    ],
  },

  TECH_STACK: {
    frontend: 'React + TypeScript + Vite',
    styling: 'Tailwind CSS + Framer Motion',
    icons: 'Lucide React',
    maps: 'React Leaflet + Leaflet',
    colors: {
      dark: '#0C0D10',
      accentRed: '#FF6B6B',
      accentPurple: '#A78BFA',
      gold: '#F59E0B',
    },
  },

  COMPLETED_PAGES: [
    'Landing.tsx - Onboarding',
    'Discover.tsx - Event discovery board',
    'EventDetail.tsx - Full event view',
    'Nearby.tsx - Swipe discovery (Feature 20)',
    'Profile.tsx - User profiles (Feature 19)',
    'HostDashboard.tsx - Event management (Feature 24)',
    'Premium.tsx - Billing & subscription (Features 25-28)',
    'SafetyCentre.tsx - Trust & Safety (Features 9-18)',
    'TravelMode.tsx - Travel mode (Feature 33)',
    'Help.tsx - Help & FAQ (Feature 39)',
    'MyRequests.tsx - Requests & wishlist (Feature 23)',
    'Messages.tsx - Chat & calls (Features 29-32)',
    'Safety.tsx - Safety dashboard',
  ],

  NEXT_STEPS: [
    '1. Finish profile verification provider integration',
    '2. Add server-backed safety review, SMS, and emergency escalation integrations',
    '3. Tighten Nearby Mode matching and empty states',
    '4. Add real-time messaging and calls',
    '5. Finish OTP authentication and session handling',
    '6. Add payment and billing integrations',
    '7. Set up database and file storage infrastructure',
    '8. Add push notifications and background jobs',
    '9. Harden anti-fraud and trust automation',
    '10. Deploy to production',
  ],
};

export default PAGE_STRUCTURE;
