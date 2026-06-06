# Junto Backend Architecture & Implementation Guide

**Version:** 0.1.0  
**Date:** May 2026  
**Status:** MVP Foundation - Ready for Frontend Integration  

---

## 📋 Overview

This document provides a complete technical reference for the Junto backend API. It explains the system architecture, database structure, API endpoints, and how to integrate with the frontend.

### Quick Facts
- **Framework:** Node.js + Express.js
- **Database:** SQLite for the current codebase, with `DB_PATH` support for production volumes
- **Authentication:** Dummy login (production auth comes later)
- **Scope:** All features except SMS/OTP authentication
- **API Style:** RESTful JSON

---

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── index.js                 # Main server entry point
│   ├── api/
│   │   ├── routes/              # Express route definitions
│   │   │   ├── auth.js
│   │   │   ├── users.js
│   │   │   ├── events.js
│   │   │   ├── applications.js
│   │   │   ├── messages.js
│   │   │   ├── nearby.js
│   │   │   ├── safety.js
│   │   │   └── notifications.js
│   │   ├── controllers/         # Business logic for each feature
│   │   │   └── [same structure as routes]
│   │   └── middlewares/         # Request handlers, auth, validation
│   ├── db/
│   │   ├── connection.js        # SQLite connection helper
│   │   ├── schema.sql           # Database table definitions
│   │   ├── init.js              # Initialize database tables
│   │   └── seed.js              # Populate with mock data
│   └── utils/                   # Helper functions
├── .env.example                 # Environment variables template
├── package.json                 # Dependencies
└── README.md                    # Quick start guide

frontend/                         # React frontend (separate folder)
```

---

## 🗄️ Database Schema

### Core Tables

#### **users**
- `id` (UUID): Primary key
- `phone_number` (VARCHAR): Unique, required
- `full_name` (VARCHAR): User's real name
- `display_name` (VARCHAR): Public nickname
- `profile_id` (VARCHAR): Unique ID like `JNT-2024-00123`
- `gender`, `city`, `occupation`, `bio`
- `is_active` (BOOLEAN): Account status
- `created_at`, `updated_at` (TIMESTAMP)

#### **user_profiles**
- Extended profile data
- `interests` (TEXT[]): Array of interests
- `profile_photos` (TEXT[]): Array of photo URLs
- `travel_mode_enabled` (BOOLEAN)
- `travel_destination_city` (VARCHAR)
- `last_active` (TIMESTAMP)

#### **events**
- `id` (UUID): Event ID
- `host_id` (UUID): References `users.id`
- `title`, `description`, `event_type`
- `location_city`, `location_address`, `location_coordinates` (POINT)
- `event_date`, `event_time`
- `billing_tier` (INT): 1-4 (Starter to Elite)
- `host_fee`, `guest_fee` (INT): in Naira
- `max_guests`, `current_guests_count`
- `status` (VARCHAR): active, completed, cancelled
- `cover_photo_url`

#### **event_applications**
- Stores user applications to attend events
- `event_id`, `user_id` (both UUID)
- `personal_note` (TEXT)
- `status` (VARCHAR): pending, accepted, rejected
- `financial_agreement_signed` (BOOLEAN)

#### **messages**
- `id` (UUID)
- `conversation_id` (UUID): Groups messages between two users
- `sender_id`, `receiver_id` (UUID)
- `content` (TEXT)
- `message_type` (VARCHAR): text, image, video, voice
- `media_url` (VARCHAR): For non-text media
- `is_read`, `read_at`

#### **conversations**
- `id` (UUID)
- `user1_id`, `user2_id` (UUID): The two participants
- `last_message_id`, `last_message_at`: For sorting

#### **swipes**
- Records Nearby Mode interactions
- `swiper_id`, `swiped_user_id` (UUID)
- `direction` (VARCHAR): 'right' or 'left'

#### **matches**
- Created when mutual swipes occur
- `user1_id`, `user2_id` (UUID)
- `matched_at` (TIMESTAMP)

#### **trusted_contacts**
- For Safety Centre feature
- `user_id`, `contact_name`, `contact_phone`
- `is_primary` (BOOLEAN): Primary emergency contact

#### **safety_alerts**
- SOS events
- `user_id`, `alert_type`, `status` (active/resolved)
- `location_latitude`, `location_longitude`

#### **blocked_users**
- Blocking relationships
- `blocker_id`, `blocked_user_id`, `reason`

#### **reports**
- User reports for safety
- `reporter_id`, `reported_user_id`
- `report_type`, `description`
- `status` (VARCHAR): pending, reviewed, resolved

#### **notifications**
- Push notifications
- `user_id`, `notification_type`
- `title`, `body`
- `related_user_id`, `related_event_id`: Context
- `is_read`, `read_at`

---

## 🔌 API Endpoints

### Authentication (`/api/auth`)

#### POST `/api/auth/login`
Dummy login - creates user if doesn't exist
```json
Request:
{
  "phone_number": "+2348123456789"
}

Response:
{
  "success": true,
  "user": {
    "id": "uuid",
    "phone_number": "+2348123456789",
    "display_name": "User_1234",
    "profile_id": "JNT-2024-00123"
  },
  "session_token": "dummy-session-xxx"
}
```

#### GET `/api/auth/verify`
Verify session (always returns valid for now)

---

### Users (`/api/users`)

#### GET `/api/users/:userId`
Get user by ID

#### GET `/api/users/:userId/profile`
Get full user profile with extended info

#### PUT `/api/users/:userId/profile`
Update user profile
```json
{
  "display_name": "Chioma",
  "bio": "I love art and travel",
  "city": "Lagos",
  "interests": ["art", "travel", "food"]
}
```

#### GET `/api/users/search?city=Lagos&interests=art`
Search users by filters

#### GET `/api/users/travel-mode/:city`
Get users in Travel Mode for specific city

---

### Events (`/api/events`)

#### GET `/api/events?city=Lagos&tier=2&date=2026-05-30`
Get events with filters
- `city` (string)
- `tier` (1-4)
- `date` (YYYY-MM-DD)
- `limit`, `offset` (pagination)

#### GET `/api/events/:eventId`
Get event details

#### POST `/api/events`
Create new event
```json
{
  "host_id": "uuid",
  "title": "Sunset Art Gallery Tour",
  "description": "Explore contemporary Nigerian art",
  "event_type": "art",
  "location_city": "Lagos",
  "location_address": "Lekki Peninsula",
  "event_date": "2026-06-15",
  "event_time": "18:00",
  "cover_photo_url": "https://...",
  "billing_tier": 2,
  "max_guests": 15
}
```

#### PUT `/api/events/:eventId`
Update event

#### DELETE `/api/events/:eventId`
Delete event

#### GET `/api/events/host/:hostId`
Get all events hosted by a user

---

### Event Applications (`/api/applications`)

#### POST `/api/applications`
Apply to attend an event
```json
{
  "event_id": "uuid",
  "user_id": "uuid",
  "personal_note": "I'd love to attend!"
}
```

#### GET `/api/applications/user/:userId?status=pending`
Get applications by user

#### GET `/api/applications/event/:eventId?status=pending`
Get applications for an event (host view)

#### PUT `/api/applications/:applicationId/status`
Accept/reject application
```json
{
  "status": "accepted"  // or "rejected"
}
```

#### DELETE `/api/applications/:applicationId`
Withdraw application

---

### Messages (`/api/messages`)

#### POST `/api/messages`
Send a message
```json
{
  "sender_id": "uuid",
  "receiver_id": "uuid",
  "content": "Hey, how are you?",
  "message_type": "text"
}
```

#### GET `/api/messages/conversations/:userId`
Get all conversations for a user

#### GET `/api/messages/:conversationId?limit=50&offset=0`
Get messages in a conversation

#### PUT `/api/messages/:messageId/read`
Mark message as read

#### DELETE `/api/messages/:messageId`
Delete a message

---

### Nearby Mode (`/api/nearby`)

#### GET `/api/nearby/:userId?limit=50`
Get nearby users in same city

#### POST `/api/nearby/swipe`
Swipe on a user
```json
{
  "swiper_id": "uuid",
  "swiped_user_id": "uuid",
  "direction": "right"  // or "left"
}
```

#### GET `/api/nearby/:userId/matches`
Get all matches for a user

#### GET `/api/nearby/:userId/history`
Get swipe history

---

### Safety (`/api/safety`)

#### GET `/api/safety/:userId/contacts`
Get trusted contacts

#### POST `/api/safety/:userId/contacts`
Add trusted contact
```json
{
  "contact_name": "Mom",
  "contact_phone": "+2349000000000",
  "is_primary": true
}
```

#### PUT `/api/safety/:contactId`
Update trusted contact

#### DELETE `/api/safety/:contactId`
Delete trusted contact

#### POST `/api/safety/:userId/sos`
Trigger SOS alert
```json
{
  "location_latitude": 6.5244,
  "location_longitude": 3.3792
}
```

#### GET `/api/safety/:userId/blocked`
Get blocked users

#### POST `/api/safety/:userId/block/:blockedUserId`
Block a user

#### DELETE `/api/safety/:userId/block/:blockedUserId`
Unblock a user

#### POST `/api/safety/:userId/report/:reportedUserId`
Report a user
```json
{
  "report_type": "harassment",
  "description": "Inappropriate messages"
}
```

---

### Notifications (`/api/notifications`)

#### GET `/api/notifications/:userId?unread_only=true`
Get notifications for a user

#### PUT `/api/notifications/:notificationId/read`
Mark notification as read

#### DELETE `/api/notifications/:notificationId`
Delete notification

---

## 🚀 Setup & Running

### 1. Prerequisites
- PostgreSQL 12+ installed and running
- Node.js 18+
- npm

### 2. Install Dependencies
```bash
cd backend
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your database credentials
```

### 4. Initialize Database
```bash
npm run migrate
```

### 5. Seed Mock Data
```bash
npm run seed
```

### 6. Start Server
```bash
npm run dev    # Development with auto-reload
npm start      # Production
```

Server runs at: **http://localhost:5000**

---

## 🧪 Testing Endpoints

### Quick Test with cURL

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "+2348123456789"}'

# Get events
curl http://localhost:5000/api/events?city=Lagos

# Create event
curl -X POST http://localhost:5000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "host_id": "the-user-uuid",
    "title": "Coffee Chat",
    "event_type": "coffee",
    "location_city": "Lagos",
    "event_date": "2026-06-15",
    "billing_tier": 1
  }'
```

---

## 🔄 Frontend Integration

### Base URL
```javascript
const API_BASE = 'http://localhost:5000/api';
```

### Example: Login & Get Events
```javascript
// 1. Login
const loginRes = await fetch(`${API_BASE}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone_number: '+2348123456789' })
});
const { user, session_token } = await loginRes.json();
localStorage.setItem('user_id', user.id);

// 2. Get events
const eventsRes = await fetch(`${API_BASE}/events?city=Lagos&tier=2`);
const { events } = await eventsRes.json();
```

---

## 📊 Data Flow Examples

### Event Discovery → Application → Acceptance → Messaging

1. **User browses events** → `GET /api/events?city=Lagos`
2. **User applies** → `POST /api/applications` with personal note
3. **Host reviews applications** → `GET /api/applications/event/:eventId`
4. **Host accepts** → `PUT /api/applications/:id/status` with "accepted"
5. **Both get notifications** → `GET /api/notifications/:userId`
6. **Conversation opens** → `POST /api/messages` creates automatic conversation
7. **They message** → Multiple `POST /api/messages` calls
8. **Meet in real world** → 🎉

### Nearby Mode → Match → Message

1. **Get nearby users** → `GET /api/nearby/:userId`
2. **Swipe on user** → `POST /api/nearby/swipe` with direction="right"
3. **Check if mutual** → API returns match if mutual
4. **If match, notify both** → Notifications created automatically
5. **Start messaging** → `POST /api/messages`

---

## 🛡️ Safety Features

### SOS Alert Flow
1. User triggers SOS → `POST /api/safety/:userId/sos`
2. Get trusted contacts → `GET /api/safety/:userId/contacts`
3. Send SMS to all (production) → Logged in console (dev)
4. Location shared → Latitude/longitude included

### Blocking & Reporting
- Block user → `POST /api/safety/:userId/block/:blockedUserId`
- Report user → `POST /api/safety/:userId/report/:reportedUserId`
- Blocked users don't appear in Nearby or searches

---

## 📝 Important Notes

### Current Limitations (MVP)
- ✅ No real SMS/OTP (dummy login only)
- ✅ No audio/video calls (endpoints not created yet)
- ✅ No payment processing (billing tiers defined but not charged)
- ✅ All SOS/SMS logged to console in development
- ✅ No file upload (photo URLs are strings, not actual upload)

### Next Phase (Future)
1. Implement real SMS OTP authentication (Twilio/Termii)
2. Add JWT token validation to all endpoints
3. Implement WebSocket for real-time messaging
4. Add file upload service (AWS S3/Firebase)
5. Implement WebRTC for calls (Agora/Twilio)
6. Add payment processor (Stripe/Paystack for Nigerian transactions)
7. Add background jobs (bull queue for notifications)

---

## 🔐 Security Checklist

- [ ] All endpoints validate required fields
- [ ] SQL injection prevented (using parameterized queries)
- [ ] CORS configured for frontend URL
- [ ] Environment variables used for secrets
- [ ] Timestamps tracked for all records
- [ ] Block/report system prevents abuse
- [ ] Profile IDs used instead of direct user IDs in some contexts

**To-Do for Production:**
- [ ] Add rate limiting per IP
- [ ] Implement JWT with expiration
- [ ] Add HTTPS/SSL
- [ ] Add request validation with Joi
- [ ] Implement proper error handling
- [ ] Add logging system
- [ ] Add API documentation (Swagger/OpenAPI)

---

## 📞 Support & Debugging

### Common Issues

**1. Cannot connect to SQLite database**
```
SQLite connection error
```
Solution: Ensure the database file path is writable and the app has permission to create `junto.db`
```bash
mkdir -p ./data
export DB_PATH=./data/junto.db
```

**2. Database already exists**
```
Error: database "junto_db" already exists
```
Solution: Drop and recreate
```bash
npm run migrate
```

**3. Port 5000 already in use**
Change `PORT` in `.env` or kill the process
```bash
lsof -i :5000
kill -9 <PID>
```

---

## 📚 Related Documentation

- **Frontend Setup:** See `/README.md` in frontend folder
- **API Testing:** Use Postman or Insomnia
- **Database GUI:** Use pgAdmin or DBeaver

---

**Last Updated:** May 2026  
**Maintained By:** Junto Dev Team  
**Status:** ✅ Ready for Production Frontend Integration
