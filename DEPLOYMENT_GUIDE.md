# Local Deployment Guide

This project is now configured to run without Railway.

## Local Setup

### Frontend

```bash
npm install
npm run dev
```

The Vite dev server runs on `http://localhost:5173` and proxies `/api` requests to the local backend.

### Backend

```bash
cd backend
npm install
npm run migrate
npm run seed
npm run dev
```

The backend runs on `http://localhost:5000`.

## Environment Variables

Frontend optional variables:

```bash
VITE_API_BASE_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000
```

Backend optional variables:

```bash
PORT=5000
DB_PATH=./junto.db
FRONTEND_URL=http://localhost:5173
```

## Admin Logs

The admin System Status page shows:

- API health
- WebSocket health
- Notification delivery status
- Local crash/error logs
- Admin activity log

## Notes

- SQLite is the default local database.
- Crash reports are stored in the browser's local storage unless you configure an external crash endpoint.
- If you want a public deployment later, we can wire up a different host without bringing Railway back.
