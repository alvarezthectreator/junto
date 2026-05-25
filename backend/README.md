# Junto Backend - Quick Start

## ⚡ 5-Minute Setup

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Copy Environment File
```bash
cp .env.example .env
```

### 3. Ensure PostgreSQL is Running
```bash
# macOS
brew services start postgresql

# Linux
sudo service postgresql start

# Windows (if installed)
psql -U postgres
```

### 4. Initialize Database & Add Mock Data
```bash
npm run migrate  # Creates tables
npm run seed     # Adds 5 test users and events
```

### 5. Start the Server
```bash
npm run dev
```

✅ Server ready at: **http://localhost:5000**

---

## 📝 Environment Variables (.env)

Required before starting:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=junto_db
DB_USER=junto_user
DB_PASSWORD=junto_password_dev
PORT=5000
FRONTEND_URL=http://localhost:5173
```

---

## 🧪 Test the API

```bash
# Test server is running
curl http://localhost:5000/health

# Login with dummy phone number
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "+2348123456789"}'

# Get all events in Lagos
curl "http://localhost:5000/api/events?city=Lagos"
```

---

## 📚 Full Documentation

See **BACKEND_GUIDE.md** for:
- Complete API endpoint reference
- Database schema explanation
- Data flow examples
- Frontend integration code
- Troubleshooting guide

---

## 🎯 What's Included

✅ **All Features (Except Auth)**
- Events (create, list, filter, host)
- Event applications (apply, accept, reject)
- Messaging (conversations, messages)
- Nearby Mode (swipe, match)
- Safety Centre (trusted contacts, SOS, block, report)
- User profiles (CRUD)
- Notifications
- Travel Mode

---

## 🚀 Ready for Frontend Integration

Frontend can now call:
- `POST /api/auth/login` → Get user session
- `GET /api/events` → Browse events
- `POST /api/events` → Create event
- All other endpoints → See BACKEND_GUIDE.md

---

## ⚠️ Important Notes

- **Authentication:** Dummy login (no real SMS OTP yet)
- **Payments:** Billing tiers defined, not processed
- **SMS/SOS:** Logged to console only
- **File upload:** Use URLs, no actual upload service yet

---

Next: Read BACKEND_GUIDE.md for complete reference → Then integrate with frontend
