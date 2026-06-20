# Junto Feature Breakdown

Last updated: 2026-06-20

This is the current source-of-truth summary based on the codebase audit and the feature spec PDF. I kept this focused on what is actually in the repo today.

## Implemented

### Core App
- Landing page and onboarding flow
- Router, sidebar navigation, responsive layout
- Shared animation system and mobile-friendly UI patterns

### Discovery and Events
- Event discovery board with filters
- Event detail view
- Event creation and editing
- Event applications and capacity handling
- Save/bookmark events
- Event ratings and reviews
- Check-in flows and attendance tracking hooks

### Profiles and Accounts
- User profile pages and editing
- Code-based email and phone verification
- Referral info
- Account export and account deletion
- Session handling and browser-stored user state

### Nearby and Group Features
- Nearby swipe discovery
- Matches view
- Basic squad creation and management
- Squad invitations and member management routes

### Trust and Safety
- Safety dashboard
- Safety Centre
- Trusted contacts
- Report user
- Block user / unblock user
- Emergency SOS flow
- Reliability score tracking
- Cancellation penalty logging

### Messaging and Notifications
- Messaging UI
- Conversation and message routes
- Local message persistence
- Notification inbox and browser notification preferences
- Attachment and call mock flows in the frontend

### Travel, Venues, Celebrities
- Travel Mode
- Venue browsing
- Celebrity browsing
- Venue and celebrity backend routes

### Premium and Support
- Premium pricing UI and subscription management
- Billing tier display
- Financial agreement UI
- Help / FAQ centre

### Backend and Database
- SQLite local database default
- PostgreSQL-friendly schema files
- Schema init and seeding
- Migration support
- Shared API connection layer

## Partial

- Authentication is functional, but still not a fully polished production identity stack
- OTP and verification exist, with code-based email and phone flows now wired end-to-end
- Messaging is not fully server-synced with realtime transport everywhere
- Push notifications are mostly preference/UI level, not full delivery infrastructure
- Premium billing is still manual in-app subscription management, not a live payment integration
- Identity verification is still not wired to a real KYC provider
- Fraud and moderation automation now handles report escalation, verification review, and no-show enforcement
- Venue and celebrity booking flows need more end-to-end polish
- Squad experiences exist, but they still need a fuller product pass

## Still Missing For Production

- A managed production database rollout and backup plan
- Live payment provider checkout
- True push notification delivery
- Real-time chat/call transport
- Identity verification provider integration
- Stronger identity verification provider integration and moderation ops
- Monitoring, alerting, and secret management
- Production-grade deployment hardening

## What I Kept

- The feature spec PDF
- `README.md`
- Backend architecture and setup guides that still help day to day
- The remaining-work tracker

## What I Removed

- Old session writeups
- Duplicate implementation summaries
- Stale deployment/status docs that repeated the same information
