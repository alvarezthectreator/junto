# Deploying the backend to Fly.io

Steps to deploy the `backend/` service to Fly.io. Copy & paste these commands locally.

1. Install `flyctl` (macOS Homebrew):

```bash
brew install flyctl/tap/flyctl
```

Or (universal):

```bash
curl -L https://fly.io/install.sh | sh
```

2. Login to Fly:

```bash
flyctl auth login
```

3. Create the app (if you didn't already):

```bash
flyctl apps create junto --org personal --region iad
```

4. If you want persistent SQLite storage, create a volume for SQLite (1 GB recommended):

```bash
flyctl volumes create junto_data --region iad --size 1
```

5. Set required secrets (example list):

```bash
flyctl secrets set JWT_SECRET="<your-secret>" FRONTEND_URL="https://junto-six-swart.vercel.app"
```

Add any other env values you need (GMAIL creds, SMTP, etc.).

6. Deploy from the `backend/` directory:

```bash
cd backend
flyctl deploy --app junto
```

7. Verify health and logs:

```bash
curl -v https://junto.fly.dev/api/health
flyctl logs -a junto
flyctl status -a junto
```

8. After successful deploy, update Vercel project env vars:

- `VITE_API_BASE_URL = https://junto.fly.dev/api`
- `VITE_WS_URL = wss://junto.fly.dev`

Then redeploy your Vercel frontend.

Troubleshooting hints:
- If `curl /api/health` returns 404 or 403, check `flyctl logs` to see if the process started and bound to `PORT`.
- If SQLite fails, ensure `DB_PATH` points to the mounted `/data` path and the volume exists.
