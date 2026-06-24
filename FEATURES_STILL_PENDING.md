# Remaining Work

Last updated: 2026-06-20

This file tracks the gaps that are still open after the current profile, event, safety, discovery, and host/dashboard passes.

## What is already in place

- Event discovery, event detail, and event creation
- User profiles and profile editing
- Nearby mode and travel-mode browsing
- Host dashboard browsing and application review
- Safety Centre, trusted contacts, report, block, and SOS flows
- Notifications inbox, local notification sync, and browser notification support
- OTP support screens and backend endpoints
- Settings account utilities, notification preferences, referral info, blocked users, and data export
- Messaging prototype with attachments, voice notes, local persistence, group chats, scheduled delivery, and call mockups
- True push delivery provider integration and background job delivery
- Admin dashboard frontend mock now renders locally at `/admin`
- Runtime/API failure alert routing plus backend health heartbeat tracking
- Optional OS-level app badge support where the platform exposes it

## Admin dashboard notes

- The admin screen is currently frontend-only and uses static mock data.
- Backend admin CRUD, moderation actions, and live data integration are intentionally deferred for now.
- The mocked admin UI is intended to be the working surface until the backend pass is resumed.

## Remaining items

- Identity verification provider integration for full KYC-style checks
- Premium live payment provider checkout, webhooks, and receipts
- Admin backend CRUD, moderation, and protected data fetches for the dashboard mock
- Persisted alert, asset, and severity data for the admin panels
- Role-based admin authentication and session enforcement for production rollout

## Lower Priority

- Finish backend-protected secret rotation and release automation for production rollout
- Document staging-to-production promotion and rollback steps for release operators
