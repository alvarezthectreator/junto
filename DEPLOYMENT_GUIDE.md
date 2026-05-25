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

### 3. Database Setup

### SQLite vs PostgreSQL

- **Development (Local)**: Uses SQLite (`junto.db`)
  - No setup needed, works out of the box
  - Great for testing
  - Run `npm run seed` to add mock data

- **Production (Railway)**: Uses PostgreSQL
  - Persistent database that survives deployments
  - Better performance
  - Automatic on Railway

### Backend Database Support

Your backend now supports **both SQLite and PostgreSQL** automatically:
- If `DATABASE_URL` environment variable exists → PostgreSQL
- Otherwise → SQLite

### Setting Up PostgreSQL on Railway

#### Step 1: Add PostgreSQL Service
1. Go to Railway dashboard for your project
2. Click "Add Service" → "Add from Marketplace"
3. Search "PostgreSQL" and click it
4. Confirm to add PostgreSQL to your project
5. Railway automatically creates `DATABASE_URL` environment variable ✅

#### Step 2: Run Database Migrations
When your backend starts with PostgreSQL, it will:
1. Detect `DATABASE_URL` is set
2. Use `schema-postgres.sql` instead of `schema.sql`
3. Create all tables automatically
4. Run seed data if `MOCK_DATA=true`

No manual migration needed! Your backend handles it.

#### Step 3: Verify in Logs
1. Go to Railway backend service logs
2. Should see: `🐘 Connected to PostgreSQL database`
3. Then: `📦 Creating database tables (postgres)...`
4. Then: `🌱 Seeding postgres database with mock data...`

### Local Development

Keep using SQLite:

```bash
# Start backend (uses SQLite)
npm run dev

# Seed with mock data
npm run seed

# Reinitialize database
npm run migrate
```

### Migration Commands

```bash
# Backend folder
cd backend

# Develop with SQLite
npm run dev

# Seed database with mock data
npm run seed

# Reinitialize/create tables
npm run migrate

# Production start
npm start
```

---
