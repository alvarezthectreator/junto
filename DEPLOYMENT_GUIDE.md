# Railway Deployment Guide

## Overview
This guide will deploy your Junto app to Railway (backend) and Vercel (frontend).

## Important: Database Migration Required
Your current backend uses **SQLite**, which doesn't work on Railway (ephemeral filesystem). You have two options:

### Option A: Use Railway's PostgreSQL (Recommended)
- Railway provides managed PostgreSQL
- Data persists across deployments
- Easy setup through Railway dashboard

### Option B: Keep SQLite Local
- Run backend locally on your machine
- Frontend on Vercel calls `http://your-machine-ip:5000/api`
- Less reliable for production

## Setup Steps

### 1. Deploy Backend to Railway

#### Prerequisites
- Railway account (sign up at https://railway.app)
- Git repository (already done ✅)

#### Step 1A: Create Railway Project
1. Go to https://railway.app/dashboard
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Connect your GitHub account if needed
5. Select your `junto` repository
6. Select the `main` branch

#### Step 1B: Configure Backend Service
1. In Railway dashboard, click on your project
2. Click "Add Service" → "GitHub Repo"
3. Select your repository again (or the service will auto-detect)
4. Set Root Directory to `backend/`
5. Click "Deploy"

#### Step 1C: Add PostgreSQL Database
1. Click "Add Service" → "Add from Marketplace"
2. Search for "PostgreSQL"
3. Click "PostgreSQL" and confirm
4. Railway automatically sets `DATABASE_URL` environment variable

#### Step 1D: Configure Environment Variables
In Railway dashboard for backend service:
1. Go to "Variables" tab
2. Add these variables:
   ```
   PORT=5000
   FRONTEND_URL=https://your-vercel-domain.vercel.app
   NODE_ENV=production
   ```
3. The `DATABASE_URL` is auto-set from PostgreSQL service

#### Step 1E: Get Your Backend URL
1. In Railway dashboard, go to your backend service
2. Click "Settings"
3. You'll see a public domain like `https://your-backend-randomid.railway.app`
4. **Copy this URL** (you'll need it for frontend)

### 2. Update Frontend for Production

#### Step 2A: Create Production Environment File
Create `.env.production` in your project root:
```
VITE_API_BASE_URL=https://your-backend-randomid.railway.app/api
```

#### Step 2B: Redeploy to Vercel
1. Push these changes to GitHub:
   ```bash
   git add .env.example railway.json backend/Procfile backend/.env.example
   git commit -m "Add Railway deployment configuration"
   git push origin main
   ```

2. Go to https://vercel.com/dashboard
3. Your project should auto-redeploy when you push
4. Once deployed, Vercel shows your frontend URL (like `junto.vercel.app`)

#### Step 2C: Update Backend's FRONTEND_URL
1. Go back to Railway backend service
2. Update `FRONTEND_URL` variable to your Vercel URL:
   ```
   FRONTEND_URL=https://junto.vercel.app
   ```
3. Save and let it redeploy

### 3. Migrate Database Schema to PostgreSQL

Your backend currently uses SQLite. When you connect to PostgreSQL on Railway, you need to run the schema:

#### Option A: Manual Migration (Easy)
1. In Railway dashboard, click PostgreSQL service
2. Go to "Connect" tab
3. Copy the connection string
4. Use a PostgreSQL client to run `backend/src/db/schema.sql`

#### Option B: Auto-migration (requires code change)
Let me update your backend to auto-run schema on PostgreSQL connection.

## Troubleshooting

### "Failed to fetch" Error
- **Cause**: Frontend can't reach backend
- **Fix**: Check that `VITE_API_BASE_URL` environment variable is set correctly in Vercel
- **Verify**: Open Vercel project → Settings → Environment Variables

### Backend Not Starting
- Check Railway logs: Dashboard → Backend Service → "Logs" tab
- Look for database connection errors
- Ensure PostgreSQL service is running

### CORS Errors
- Update `FRONTEND_URL` in Railway backend variables to your Vercel domain
- Check backend code has correct CORS origin

## Quick Reference

| Service | URL | Details |
|---------|-----|---------|
| Frontend (Vercel) | https://junto.vercel.app | React + Vite |
| Backend (Railway) | https://your-backend-randomid.railway.app | Node.js + Express |
| Database (Railway) | PostgreSQL instance | Auto-managed |
| API Endpoint | https://your-backend-randomid.railway.app/api | Called from frontend |

## Next Steps
1. Sign up for Railway: https://railway.app
2. Connect GitHub and deploy backend
3. Add PostgreSQL database
4. Update frontend environment variables
5. Test login with +2348123456789
