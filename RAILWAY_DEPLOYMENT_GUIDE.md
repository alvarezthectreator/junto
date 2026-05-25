# Complete Railway Deployment Guide

## Overview
You will deploy your Junto app in 3 parts:
1. **Backend** → Railway (Node.js + PostgreSQL)
2. **Frontend** → Vercel (React)
3. **Database** → Railway PostgreSQL

---

## PART 1: Deploy Backend to Railway

### Step 1.1: Create Railway Account
1. Go to https://railway.app
2. Click "Login" or "Start Building"
3. Sign up with GitHub (recommended - easier)
4. Authorize Railway to access your GitHub account

### Step 1.2: Create New Project
1. After login, go to https://railway.app/dashboard
2. Click **"New Project"** (top right button)
3. Click **"Deploy from GitHub"**
4. Railway will ask to connect your GitHub account (if not already done)
   - Click "Authorize"
   - Allow Railway to access your repositories

### Step 1.3: Select Your Repository
1. You'll see a list of your GitHub repos
2. Find and click **"junto"** repository
3. Railway redirects you to your new project

### Step 1.4: Configure Backend Service
This is the critical part - Railway needs to know where your backend code is:

1. You should see your project dashboard
2. In the middle, click **"Add Service"**
3. Click **"GitHub Repo"** (or it may auto-detect)
4. Select your **"junto"** repo again if prompted
5. Now you'll see a service being added - Railway will show it as loading

### Step 1.5: Set Root Directory for Backend
⚠️ **THIS IS IMPORTANT - This is what was missing before**

1. Wait for the service to appear in your Railway dashboard
2. Click on the service (it might be called "junto" or show your repo name)
3. Click the **"Settings"** tab (usually on the right side)
4. Look for **"Root Directory"** setting
5. Enter: `backend`
6. Press Enter/Save

**Why?** Because your backend code is in `/backend` folder, not root.

### Step 1.6: Verify Package.json Location
1. Still in Settings tab
2. Scroll down to see if Railway detected `package.json` from `/backend/package.json`
3. It should show something like "Nixpacks" as the builder
4. If it says "package.json not found", you might need to manually deploy

### Step 1.7: Start Deployment
1. Go back to **"Deploy"** tab (not Settings)
2. Click **"Deploy"** or **"Redeploy"** button
3. Watch the deployment logs appear
4. This takes 2-3 minutes

---

## PART 2: Add PostgreSQL Database

### Step 2.1: Add Database Service
1. In your Railway project dashboard (main page)
2. Click **"Add Service"** (big button in the middle)
3. Click **"Add from Marketplace"**
4. Search: `PostgreSQL`
5. Click **"PostgreSQL"**
6. Click **"Add"** or **"Provision"**

### Step 2.2: Automatic Configuration
Railway automatically:
- Creates a PostgreSQL instance
- Sets the `DATABASE_URL` environment variable
- Your backend will auto-detect it and use PostgreSQL
- ✅ **No additional setup needed**

### Step 2.3: Verify Database is Connected
1. In Railway dashboard, you should now see 2 services:
   - `junto` (your backend)
   - `PostgreSQL` (your database)
2. Click on the PostgreSQL service
3. Go to **"Variables"** tab
4. You should see `DATABASE_URL` showing a connection string

---

## PART 3: Check Backend Deployment Status

### Step 3.1: View Backend Logs
1. Click on your **"junto"** service (the backend)
2. Click **"Deploy"** tab or **"Logs"** tab
3. Watch the logs - look for:
   ```
   🐘 Connected to PostgreSQL database
   📦 Creating database tables (postgres)...
   🌱 Seeding postgres database with mock data...
   ✅ Junto Backend Server Running
   🚀 http://localhost:5000
   ```

### Step 3.2: Wait for "Build Succeeded"
1. The logs should show: `✓ built` or `Build succeeded`
2. Then: `✓ Deploy succeeded`
3. If you see **"Crashed"** or red errors, check Step 3.3

### Step 3.3: Troubleshooting Crashes
**If it says "Crashed" or shows errors:**

1. Check the error message in logs
2. Common issues:
   - **"Cannot find module"** → Make sure Root Directory is set to `backend/` (Step 1.5)
   - **"DATABASE_URL not set"** → Make sure you added PostgreSQL service (Step 2)
   - **"Port already in use"** → Railway handles this automatically

3. To redeploy:
   - Go to Settings tab
   - Scroll down to **"Dangerously..."** section
   - Click **"Delete Service"**
   - Then go back and click **"Add Service"** → **"Deploy from GitHub"**
   - Select your repo and set Root Directory to `backend/` again

### Step 3.4: Get Your Backend URL
1. Click on the **"junto"** service
2. Go to **"Settings"** tab
3. Look for **"Public URL"** or **"Domain"**
4. You'll see something like: `https://imaginative-vitality-prod.railway.app`
5. **Copy this URL** - you'll need it for the frontend

---

## PART 4: Configure Frontend Environment Variables

### Step 4.1: Create Production Environment File
1. On your Mac, open the project in VS Code
2. In the root folder (same level as `package.json`), create a new file: `.env.production`
3. Add this line (replace with YOUR backend URL from Step 3.4):
   ```
   VITE_API_BASE_URL=https://your-backend-url.railway.app/api
   ```
   
   Example:
   ```
   VITE_API_BASE_URL=https://imaginative-vitality-prod.railway.app/api
   ```

### Step 4.2: Commit and Push
```bash
cd /Users/burntoffering/Downloads/e526be05-35ac-4c5c-9375-35b529637fc5

git add .env.production

git commit -m "Add production backend URL"

git push origin main
```

### Step 4.3: Vercel Auto-Redeploys
1. Go to https://vercel.com/dashboard
2. Your "junto" project should auto-redeploy
3. Wait ~30 seconds for deployment to complete
4. Once done, you'll get a green checkmark

---

## PART 5: Update Backend's CORS Settings

### Step 5.1: Set Frontend URL in Backend
Your backend needs to know your frontend URL for CORS (Cross-Origin Resource Sharing).

1. In Railway, click on your **"junto"** backend service
2. Go to **"Variables"** tab
3. Look for `FRONTEND_URL` variable (if it exists)
4. If not, click **"New Variable"** and add:
   - **Key:** `FRONTEND_URL`
   - **Value:** Your Vercel frontend URL (e.g., `https://junto.vercel.app`)
5. Click Save
6. Railway will auto-restart the backend with the new variable

**Note:** You need your Vercel frontend URL first. If you don't have it:
- Go to https://vercel.com/dashboard
- Click your "junto" project
- Copy the URL from the top (e.g., `https://junto.vercel.app`)

---

## FINAL STEP: Test the Live App

### Step 6.1: Open Your Frontend
1. Go to your Vercel frontend URL
2. Example: `https://junto.vercel.app`

### Step 6.2: Try to Login
1. Enter phone number: `+2348123456789`
2. Click Login
3. Should now work! ✅

### Step 6.3: If It Doesn't Work
Check the browser's Developer Console (F12 → Console tab):
- **"Failed to fetch"** → Backend URL is wrong in `.env.production`
- **"CORS error"** → Update `FRONTEND_URL` in Railway backend variables
- **"Network error"** → Backend service might have crashed

---

## Complete URLs Reference

After deployment, you'll have:

| Service | URL | Location |
|---------|-----|----------|
| **Frontend** | https://junto.vercel.app | Vercel |
| **Backend** | https://your-backend-xyz.railway.app | Railway |
| **API** | https://your-backend-xyz.railway.app/api | Railway |
| **Database** | PostgreSQL on Railway | Auto-managed |

---

## Quick Checklist

- [ ] Create Railway account
- [ ] Create new project from GitHub
- [ ] Deploy backend with Root Directory = `backend/`
- [ ] Add PostgreSQL from Marketplace
- [ ] Check deployment logs show "Backend Running"
- [ ] Copy backend URL
- [ ] Create `.env.production` with backend URL
- [ ] Push to GitHub
- [ ] Vercel auto-redeploys
- [ ] Update `FRONTEND_URL` in Railway backend variables
- [ ] Test login at your Vercel frontend URL

---

## Still Need Help?

**Backend not starting:**
- Check logs for "Cannot find module" → Set Root Directory to `backend/`
- Check logs for "DATABASE_URL not set" → Verify PostgreSQL service is added
- Check logs for other errors → Share the error message

**Frontend can't connect:**
- Check `.env.production` has correct backend URL
- Check browser console (F12) for exact error
- Make sure backend service shows "Running" in Railway dashboard

**Getting 404 on login:**
- Make sure API endpoint is correct: `https://backend-url/api/auth/login`
- Check backend is actually running in Railway logs

Let me know which step you're at and I can help!
