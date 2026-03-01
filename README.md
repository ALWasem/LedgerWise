# LedgerWise

A personal finance app that connects to real bank accounts and shows your transactions in one place. Built for a small friends & family user base, with an architecture designed to scale.

**Stack:** React Native (Expo) · FastAPI · Supabase · Teller API

---

## What it does

- Connect your bank account via [Teller](https://teller.io) (supports 10,000+ US institutions)
- View all transactions across linked accounts in a single feed
- Works on web and iOS from the same codebase

## Project structure

```
├── backend/     FastAPI backend — Teller proxy, auth, database
└── frontend/    Expo app — runs as web app and iOS/Android
```

---

## Running locally

### Prerequisites

- Python 3.11+
- Node.js 18+
- A [Teller](https://teller.io) account with sandbox credentials (App ID + certificate files)

### Backend

Create `backend/.env` with the following:

```
TELLER_CERT_PATH=certs/certificate.pem
TELLER_KEY_PATH=certs/private_key.pem
TELLER_ENV=sandbox
CORS_ORIGINS=["http://localhost:8081"]
```

Place your Teller certificate files in `backend/certs/` (`certificate.pem` and `private_key.pem`), then:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
# API docs at http://localhost:8000/docs
```

> Each time you open a new terminal you'll need to re-run `source venv/bin/activate` from the `backend/` directory before starting the server.

> **`--host 0.0.0.0`** makes the server reachable on your local network (required for testing on a physical phone). Without it, the server only accepts connections from your own machine.

### Frontend (web)

Create `frontend/.env` with the following:

```
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_TELLER_APP_ID=your_teller_app_id_here
```

Then:

```bash
cd frontend
npm install
npx expo start --web
# Opens at http://localhost:8081
```

### Frontend (iOS simulator)

```bash
cd frontend
npx expo start
# Press 'i' to open in iOS simulator
```

> **iOS simulator tip:** Go to **I/O → Keyboard → disable "Connect Hardware Keyboard"** in the Simulator menu bar, otherwise typing in the Teller Connect login form will cause the page to refresh.

### Frontend (physical phone)

Your phone can't reach `localhost` — you need to use your Mac's local network IP instead.

1. Find your Mac's IP:
   ```bash
   ipconfig getifaddr en0
   ```

2. Update `frontend/.env`:
   ```
   EXPO_PUBLIC_API_URL=http://<your-mac-ip>:8000
   ```

3. Update `backend/.env` to add the IP to CORS origins:
   ```
   CORS_ORIGINS=["http://localhost:8081","http://<your-mac-ip>:8081"]
   ```

4. Restart both the backend and Expo (`npx expo start --clear`).

> Your Mac's local IP can change when you reconnect to WiFi. Re-run `ipconfig getifaddr en0` if it stops working.

### Teller sandbox credentials

When prompted by Teller Connect in sandbox mode, use:
- **Username:** `username`
- **Password:** `password`

---

## Deployment

- **Backend:** Railway — push to `main` and it auto-deploys
- **Frontend (web):** Vercel — push to `main` and it auto-deploys
- **Frontend (iOS):** EAS Build — `eas build --platform ios` (Phase 2)
