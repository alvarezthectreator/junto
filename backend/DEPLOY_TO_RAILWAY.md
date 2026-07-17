# Deploying the backend to Railway

Steps to deploy the `backend/` service to Railway.

1. Install the Railway CLI:

```bash
npm install -g @railway/cli
```

2. Log in to Railway:

```bash
railway login
```

3. Create or select a Railway project:

```bash
cd backend
railway init
```

4. Add the required environment variables in Railway:

```bash
JWT_SECRET="<your-secret>"
FRONTEND_URL="https://junto-six-swart.vercel.app"
NODE_ENV="production"
DB_PATH="/data/junto.db"
```

Add any other env values you need, such as ZeptoMail SMTP or Gmail API credentials.

If you keep SQLite, attach a Railway volume and mount it at `/data` so the database survives deploys.

5. Add a Railway volume for SQLite persistence:

- Mount path: `/data`
- Use the existing `DB_PATH=/data/junto.db`

6. Deploy the backend:

```bash
railway up
```

7. Check the deployed URL in Railway and verify health:

```bash
curl -v https://YOUR-RAILWAY-DOMAIN.up.railway.app/api/health
```

8. Update your Vercel project env vars to point to Railway:

- `VITE_API_BASE_URL = https://YOUR-RAILWAY-DOMAIN.up.railway.app/api`
- `VITE_WS_URL = wss://YOUR-RAILWAY-DOMAIN.up.railway.app`

Then redeploy your Vercel frontend.

Troubleshooting hints:
- If `/api/health` returns 404 or 403, check Railway logs and confirm the service is starting successfully.
- If SQLite fails, confirm `DB_PATH` is writable in Railway or switch to Railway Postgres if you prefer a managed database.
