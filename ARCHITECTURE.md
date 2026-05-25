# Junto - Complete Architecture Reference

**Purpose:** Single source of truth for anyone (AI agent or human) working on Junto  
**Last Updated:** May 2026  
**Scope:** Frontend (React) + Backend (Node.js/Express) + Database (PostgreSQL)

---

## 📂 Project Layout

```
junto-root/
├── frontend/                    # React + Vite (Port 5173)
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                     # Express.js (Port 5000)
│   ├── src/
│   │   ├── api/
│   │   │   ├── routes/         # Express routes
│   │   │   ├── controllers/    # Business logic
│   │   │   └── middlewares/    # Validators, auth
│   │   ├── db/
│   │   │   ├── connection.js   # PostgreSQL pool
│   │   │   ├── schema.sql      # Table definitions
│   │   │   ├── init.js         # Initialize DB
│   │   │   └── seed.js         # Mock data
│   │   └── index.js            # Server entry
│   ├── package.json
│   ├── .env.example
│   ├── README.md               # Quick start
│   └── BACKEND_GUIDE.md        # Full reference
│
└── [This file]                 # Architecture guide
```

---

## 🗂️ How to Extend This Project

### Adding a New Feature

1. **Create Route:** `backend/src/api/routes/[feature].js`
   ```javascript
   import express from 'express';
   import { getFeature, createFeature } from '../controllers/[feature].js';
   
   const router = express.Router();
   router.get('/', getFeature);
   router.post('/', createFeature);
   export default router;
   ```

2. **Create Controller:** `backend/src/api/controllers/[feature].js`
   ```javascript
   import { query } from '../db/connection.js';
   
   export async function getFeature(req, res) {
     try {
       const result = await query('SELECT * FROM [table]');
       res.json({ data: result.rows });
     } catch (error) {
       res.status(500).json({ error: error.message });
     }
   }
   ```

3. **Add Tables to Schema:** `backend/src/db/schema.sql`
   ```sql
   CREATE TABLE IF NOT EXISTS [table_name] (
     id UUID PRIMARY KEY,
     ...
   );
   ```

4. **Import Route in Server:** `backend/src/index.js`
   ```javascript
   import featureRoutes from './api/routes/[feature].js';
   app.use('/api/[feature]', featureRoutes);
   ```

5. **Call from Frontend:** 
   ```javascript
   const res = await fetch('/api/[feature]');
   ```

---

## 🎯 Feature Completeness Map

| Feature | Frontend | Backend | Database | Status |
|---------|----------|---------|----------|--------|
| **Authentication** | ✅ Form | ✅ Dummy login | ✅ users | 🟡 No SMS |
| **Profiles** | ✅ Edit form | ✅ CRUD | ✅ users, user_profiles | ✅ DONE |
| **Events Discovery** | ✅ Feed | ✅ GET /api/events | ✅ events | ✅ DONE |
| **Event Creation** | ❌ MISSING | ✅ POST /api/events | ✅ events | 🔴 BLOCKING |
| **Event Application** | ❌ MISSING | ✅ POST /api/applications | ✅ event_applications | 🔴 BLOCKING |
| **Messaging** | ✅ UI only | ✅ Send/receive | ✅ messages, conversations | ✅ DONE |
| **Nearby Mode** | ✅ Map only | ✅ Swipe logic | ✅ swipes, matches | ⚠️ No UI gestures |
| **Safety Centre** | ✅ UI | ✅ SOS, block, report | ✅ trusted_contacts, safety_alerts | ✅ DONE |
| **Travel Mode** | ✅ Toggle | ✅ GET /api/users/travel-mode | ✅ user_profiles | ✅ DONE |
| **Notifications** | ✅ UI | ✅ CRUD | ✅ notifications | ✅ DONE |
| **WhatsApp Sharing** | ✅ Button | ❌ Optional | ❌ Not needed | ✅ CLIENT-SIDE |

**Legend:** ✅ Done | 🟡 Partial | ❌ Missing | 🔴 Priority Blocker

---

## 🔌 API Contract (Frontend ↔ Backend)

### Login Flow
```
Frontend: POST /api/auth/login { phone_number }
Backend: returns { user: { id, display_name, profile_id }, session_token }
Frontend: stores user_id and session_token in localStorage
```

### Event Discovery Flow
```
Frontend: GET /api/events?city=Lagos&tier=2&date=2026-05-30
Backend: returns { events: [...] }
Frontend: displays event cards
User clicks event: GET /api/events/:eventId for full details
```

### Event Application Flow
```
Frontend: POST /api/applications { event_id, user_id, personal_note }
Backend: 
  - Saves application
  - Notifies host
  - Opens conversation
Frontend: shows "Application submitted"
Host views: GET /api/applications/event/:eventId
Host accepts: PUT /api/applications/:id/status { status: "accepted" }
Backend: Notifies applicant
Both: Can now message via /api/messages
```

### Messaging Flow
```
Frontend: POST /api/messages { sender_id, receiver_id, content }
Backend: 
  - Saves message
  - Creates conversation if not exists
  - Notifies receiver
Frontend: 
  - Shows message immediately (optimistic)
  - Fetches history: GET /api/messages/:conversationId
  - Marks read: PUT /api/messages/:id/read
```

### Nearby Mode Flow
```
Frontend: GET /api/nearby/:userId?limit=50
Backend: returns { nearby_users: [...] } (same city, not blocked, not swiped yet)
Frontend: Shows as card stack, user swipes
Frontend: POST /api/nearby/swipe { swiper_id, swiped_user_id, direction }
Backend:
  - Records swipe
  - Checks for mutual swipe
  - If mutual: creates match + conversation
  - Notifies both users
Frontend: Shows "It's a match!" if mutual
```

---

## 💾 Database Access Pattern

All database queries use parameterized queries to prevent SQL injection:

```javascript
// ✅ SAFE - Uses parameterized queries
const result = await query(
  'SELECT * FROM users WHERE id = $1',
  [userId]
);

// ❌ UNSAFE - String interpolation (NEVER DO THIS)
const result = await query(`SELECT * FROM users WHERE id = '${userId}'`);
```

---

## 🔐 Current Security Model

**Authentication (Dummy for MVP)**
- Phone number → Auto-creates user
- No password required
- No JWT validation yet
- Session token is not validated

**Authorization**
- User can edit own profile
- User can create events
- Host controls who joins event
- Blocked users excluded from searches/swipes

**Data Privacy**
- Full location (GPS) never shared, only city
- Phone number not shown publicly
- Private DMs require mutual follow (eventual)

**Production Security (To-Do)**
- [ ] Implement JWT with expiration
- [ ] Add rate limiting (prevent spam/DOS)
- [ ] Validate all inputs with Joi
- [ ] Add HTTPS/SSL
- [ ] Implement real SMS OTP
- [ ] Add logging for audit trail
- [ ] Encrypt sensitive data at rest

---

## 🗺️ Frontend Integration Checklist

### To connect frontend to backend, frontend needs:

1. **API Service Layer** (`src/utils/api.js` or similar)
   ```javascript
   export const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
   
   export async function loginUser(phoneNumber) {
     return fetch(`${API_BASE}/auth/login`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ phone_number: phoneNumber })
     }).then(r => r.json());
   }
   ```

2. **Store User Session** (localStorage or Context)
   ```javascript
   localStorage.setItem('user_id', user.id);
   localStorage.setItem('session_token', token);
   ```

3. **Update API Calls in Components**
   - Events page: Call `GET /api/events?city=...`
   - Event detail: Call `GET /api/events/:id`
   - Create event form: POST to `/api/events`
   - Apply button: POST to `/api/applications`
   - Messages: Use `/api/messages` endpoints
   - Nearby swipes: POST to `/api/nearby/swipe`
   - Safety: Use `/api/safety` endpoints

4. **Handle Responses**
   ```javascript
   try {
     const res = await fetch(url);
     if (!res.ok) throw new Error('API error');
     const data = await res.json();
     // Update component state with data
   } catch (error) {
     // Show error toast/notification
   }
   ```

5. **Test in Browser**
   - Open DevTools → Network tab
   - Check API calls are going to `http://localhost:5000/api/...`
   - Verify responses are valid JSON
   - Check status codes (200 OK, 201 Created, 404 Not Found, etc.)

---

## 🚦 Deployment Roadmap

### Phase 1: Local Development (Current)
- Frontend: localhost:5173
- Backend: localhost:5000
- Database: localhost PostgreSQL

### Phase 2: Staging (Cloud)
- Frontend: Vercel/Netlify
- Backend: Render/Railway
- Database: Railway PostgreSQL

### Phase 3: Production
- Frontend: Custom domain (junto.app)
- Backend: API domain (api.junto.app)
- Database: AWS RDS with backups
- Add CDN, SSL, monitoring

---

## 📞 Common Questions

**Q: I changed a database column, but the app doesn't see it**
A: Run `npm run migrate` to reinitialize tables

**Q: Events don't appear in the feed**
A: Make sure they're in same city and `status = 'active'`

**Q: Can't send messages to user**
A: Check if they've blocked you or if conversation exists

**Q: Backend not responding**
A: Check port 5000 isn't blocked, PostgreSQL is running

**Q: How do I add a new field to users?**
A: 1) Add column to schema.sql 2) Run migrate 3) Update controller 4) Call from frontend

---

## 🎓 For New Team Members

1. **Read this file first** (you're reading it)
2. **Read backend/BACKEND_GUIDE.md** (full API reference)
3. **Read backend/README.md** (5-minute setup)
4. **Explore frontend/src** (React component structure)
5. **Run locally:**
   ```bash
   # Terminal 1
   cd frontend && npm run dev
   
   # Terminal 2
   cd backend && npm run dev
   ```
6. **Test in browser:** http://localhost:5173

---

## ✅ Pre-Launch Checklist

- [ ] All 14 Junto features working
- [ ] Events can be created and discovered
- [ ] Users can apply to events
- [ ] Messaging works bidirectionally
- [ ] Nearby mode shows cards and swipes
- [ ] Safety features (block, report, SOS) work
- [ ] Notifications appear
- [ ] Travel mode switches feed
- [ ] Database has proper indexes
- [ ] Frontend calls all API endpoints
- [ ] No SQL injection vulnerabilities
- [ ] CORS configured correctly
- [ ] Error messages are helpful
- [ ] User session persists on refresh
- [ ] Performance is good (< 2s load time)

---

## 📞 Support

**For API/Backend Questions:**
- See BACKEND_GUIDE.md
- Check API status: `curl http://localhost:5000/health`
- Check database: `psql -U junto_user -d junto_db`

**For Frontend Questions:**
- See frontend/README.md
- Check browser console for errors
- Test API with Postman/Insomnia first

---

**Status:** 🟢 Ready for Integration  
**Next Step:** Add frontend calls to API endpoints  
**Blocked On:** Event creation UI in frontend
