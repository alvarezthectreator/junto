# 🔐 Authentication Setup

## Quick Start

### Demo Login Credentials
The app now has a complete login/registration system with NO backend required. Use these credentials:

**Email:** `demo@junto.app`  
**Password:** `password123`

Or create a new account with any email and password (minimum 6 characters).

---

## Authentication Flow

1. **Landing Page** → Homepage with branding
2. **Login Modal** → Sign in or create account
3. **Main App** → Full access to all features

### Key Files

- **`src/pages/Landing.tsx`** - Landing page with integrated login modal
- **`src/App.tsx`** - Auth state management & routing

---

## Features

✅ **Sign In** - Login with existing account  
✅ **Sign Up** - Create new account on the spot  
✅ **Demo Mode** - Works entirely in-browser, no backend  
✅ **Secure Password Toggle** - Show/hide password visibility  
✅ **Error Validation** - Real-time form validation  

### Sign Up Requirements

- Valid email format
- Password minimum 6 characters
- Creates account instantly

### Sign In Process

1. Enter demo credentials or any created account
2. Click "Sign In"
3. Redirected to main app

---

## How It Works (No Backend)

```
Landing Page (unauthenticated)
    ↓
Login Modal (email/password)
    ↓
Set isAuthenticated = true
    ↓
Main App Access (full features)
```

**All authentication is stored in browser state** - perfect for demo/MVP. When ready for production, integrate with your backend auth (Firebase, Supabase, custom API, etc).

---

## Quick Test

1. Go to landing page
2. Click "Log in" button
3. Try demo credentials: `demo@junto.app` / `password123`
4. Or create new: Enter any email + password (6+ chars)
5. Click "Sign In"
6. You're in! 🚀

---

## Customization

### To connect real backend:

In `App.tsx`, replace the `handleLogin` function:

```tsx
const handleLogin = async (email: string, password: string) => {
  // Call your backend API
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  const user = await response.json();
  setCurrentUser(user);
  setIsAuthenticated(true);
};
```

### To add email verification:

Update `Landing.tsx` login modal to include OTP step like the original Onboarding component.

### To add social login:

Add OAuth buttons (Google, Apple, etc) to the login modal in `Landing.tsx`.

---

## Demo Accounts

Feel free to create as many demo accounts as you want:

- `test1@junto.app` / `password123`
- `alice@junto.app` / `mypassword`
- `host@junto.app` / `secure456`

All work instantly with no backend verification! 🎉
