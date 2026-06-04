# Authentication Flow Setup - CONFIRMED ✅

## Current Status
✅ **SMTP Email**: Working (verified with test email from testmail@orquex.com)  
✅ **Sign-In Flow**: Username + Password (NO OTP)  
✅ **Sign-Up Flow**: OTP Verification via Email  
✅ **OTP Delivery**: Via SMTP (cPanel email)

---

## 📧 SMTP Configuration

### Email Server Details
- **Provider**: cPanel SMTP
- **Host**: `mail.orquex.com`
- **Port**: 465 (SSL)
- **Sender Email**: `testmail@orquex.com`
- **Status**: ✅ Confirmed Working

### Configuration Location
- **Backend**: `/backend/src/services/otpService.js`
- **Initialization**: Called automatically on server startup in `/backend/src/index.js`

---

## 🔐 Sign-In (Login) Flow

### Path: Username + Password (NO OTP)
```
User → Landing Page (mode='login')
  ↓
User enters: username + password
  ↓
Calls: API.login(username, password)
  ↓
Backend: POST /api/auth/login
  ↓
Verify credentials in database
  ↓
Return JWT token & user data
  ↓
User logged in ✅
```

### Frontend Components
- **File**: `src/pages/Landing.tsx`
- **Function**: `handleLogin()`
- **Mode**: `'login'` mode

### Backend Route
- **File**: `backend/src/api/routes/auth.js`
- **Endpoint**: `POST /api/auth/login`
- **Controller**: `backend/src/api/controllers/auth.js` → `login()`

### Requirements
- ✅ Username (registered during signup)
- ✅ Password (registered during signup)
- ❌ NO OTP needed

---

## 📝 Sign-Up (Registration) Flow

### Path: Username + Email + Password + OTP Verification

#### Step 1: Initial Signup Form
```
User → Landing Page (mode='signup')
  ↓
User enters:
  - Username
  - Email
  - Password
  - Password confirmation
  ↓
Data stored in sessionStorage
  ↓
Navigate to OTPSignup page
```

#### Step 2: OTP Verification
```
OTPSignup Page
  ↓
User confirms email
  ↓
System sends OTP via SMTP → user's email ✅
  ↓
User enters 6-digit OTP code
  ↓
Verify OTP in database
  ↓
If valid: Create account
  ↓
Generate JWT token
  ↓
User logged in ✅
```

### Frontend Components
- **Signup Form**: `src/pages/Landing.tsx` (mode='signup')
- **OTP Verification**: `src/pages/OTPSignup.tsx`

### Backend Routes
- **Request OTP**: `POST /api/auth/request-otp`
- **Verify OTP**: `POST /api/auth/verify-otp`
- **Resend OTP**: `POST /api/auth/otp/resend`

### OTP Email Details
- **FROM**: testmail@orquex.com
- **TO**: User's email (Gmail, Yahoo, etc.)
- **Expiry**: 5 minutes
- **Format**: 6-digit code
- **Template**: HTML with branded design

---

## 🔄 Complete User Journey

### First-Time User (Sign Up)
1. ✅ Visits app → sees Landing page
2. ✅ Clicks "Sign Up" → mode='signup'
3. ✅ Enters username, email, password
4. ✅ Clicks "Create Account"
5. ✅ Redirected to OTPSignup page
6. ✅ System auto-sends OTP to email via SMTP ✉️
7. ✅ User sees OTP in inbox (testmail@orquex.com sender)
8. ✅ Enters 6-digit OTP
9. ✅ Account created
10. ✅ Logged in → App starts

### Returning User (Sign In)
1. ✅ Visits app → sees Landing page
2. ✅ Clicks "Sign In" → mode='login'
3. ✅ Enters username + password
4. ✅ Logged in immediately
5. ✅ NO OTP needed ✅

---

## 📋 API Endpoints

### Authentication
| Method | Endpoint | Purpose | OTP |
|--------|----------|---------|-----|
| POST | `/api/auth/login` | Username/password login | ❌ No |
| POST | `/api/auth/signup` | Create account | ❌ No |
| POST | `/api/auth/request-otp` | Send OTP to email | ✅ Yes |
| POST | `/api/auth/verify-otp` | Verify OTP & create account | ✅ Yes |
| POST | `/api/auth/otp/resend` | Resend OTP to email | ✅ Yes |
| GET | `/api/auth/otp/expiry` | Get OTP countdown timer | ✅ Yes |

---

## 🧪 How to Test

### Test OTP Email Sending
1. Start backend: `cd backend && npm start`
2. Go to frontend signup
3. Enter test email (e.g., your@gmail.com)
4. Click "Send Code"
5. ✅ Should receive OTP email from testmail@orquex.com
6. Copy OTP code
7. Enter code on verification screen
8. ✅ Account should be created

### Test Sign-In
1. Sign up with test account (above)
2. Logout
3. Click "Sign In"
4. Enter username + password
5. ✅ Should login immediately (NO OTP)

---

## ⚙️ Environment Variables (Optional)

If you need to customize SMTP settings, add to backend `.env`:

```env
# cPanel SMTP Configuration
CPANEL_EMAIL_HOST=mail.orquex.com
CPANEL_EMAIL_PORT=465
CPANEL_EMAIL_USER=testmail@orquex.com
CPANEL_EMAIL_PASSWORD=100000000
CPANEL_EMAIL_FROM=testmail@orquex.com
```

**Current Status**: Using defaults (shown above)  
**Location**: `backend/src/services/otpService.js` lines 18-26

---

## 🔍 Key Files

```
backend/
├── src/
│   ├── index.js                           # Initializes email transporter
│   ├── api/
│   │   ├── routes/
│   │   │   ├── auth.js                    # Login/signup routes
│   │   │   └── otp.js                     # OTP routes
│   │   └── controllers/
│   │       ├── auth.js                    # Login/signup logic
│   │       └── otp.js                     # OTP verification logic
│   └── services/
│       └── otpService.js                  # Email sending via SMTP
└── database.db                            # OTP storage

frontend/
├── src/
│   ├── pages/
│   │   ├── Landing.tsx                    # Login & signup forms
│   │   └── OTPSignup.tsx                  # OTP verification page
│   └── services/
│       └── api.ts                         # API calls
```

---

## ✅ Verification Checklist

- [x] SMTP configured with cPanel email
- [x] Email transporter initialized on server startup
- [x] Sign-in flow uses username + password only
- [x] Sign-up flow includes OTP verification
- [x] OTP emails sent via SMTP
- [x] OTP stored in database with 5-minute expiry
- [x] Rate limiting: 5 requests/hour per email
- [x] Rate limiting: 3 verification attempts per OTP
- [x] User created after successful OTP verification
- [x] JWT token generated for authenticated users

---

## 🚀 Ready to Use

**Your authentication system is fully configured and ready to use!**

- ✅ Sign-in: Username + Password (no OTP)
- ✅ Sign-up: With OTP verification via email
- ✅ SMTP: Working with cPanel email
- ✅ Security: Rate limiting enabled
- ✅ UX: Clean, modern interface

**No changes needed.** The system is already set up exactly as specified! 🎉
