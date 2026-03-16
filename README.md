# LedgerWise

A personal finance app that connects to real bank accounts for transaction viewing, balances, and spending analysis. Built for a small friends & family user base, with an architecture designed to scale.

**Stack:** React Native (Expo) · FastAPI · Supabase (PostgreSQL) · Teller API

---

## Features

- **Bank linking** — Connect your bank account via [Teller](https://teller.io) (supports 10,000+ US institutions)
- **Transaction feed** — View all transactions across linked accounts in a single feed
- **Spending summary** — Category breakdown with proportional bars and summary chips
- **Google sign-in** — OAuth authentication via Supabase Auth (works on web and iOS)
- **Cross-platform** — Web and iOS from the same codebase

## Project structure

```
├── backend/      FastAPI — auth, Teller proxy, spending analysis, database
│   ├── app/
│   │   ├── middleware/   JWT validation (Supabase JWKS)
│   │   ├── models/       SQLAlchemy models (User, Account, Transaction)
│   │   ├── routers/      API endpoints
│   │   ├── schemas/      Pydantic request/response validation
│   │   └── services/     Business logic
│   └── alembic/          Database migrations
└── frontend/     Expo app — web + iOS
    ├── App.tsx           Composition root
    └── src/
        ├── api/          API client + Supabase client
        ├── components/   Reusable UI (TransactionRow, TellerModal, LoginScreen)
        ├── contexts/     AuthContext (Google OAuth + Supabase session)
        ├── hooks/        useTellerConnect, useTransactions
        ├── spending/     Spending summary feature module
        ├── styles/       Co-located StyleSheet files
        ├── types/        Shared TypeScript interfaces
        └── utils/        Helpers (category colors, etc.)
```

---

## Running locally

### Prerequisites

- Python 3.11+
- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier)
- Teller credentials (App ID + certificate files) — ask the project owner
- Google OAuth client IDs (Web + iOS) from [Google Cloud Console](https://console.cloud.google.com)

### 1. Set up credentials

Place the Teller certificate files in `backend/certs/`:
- `backend/certs/certificate.pem`
- `backend/certs/private_key.pem`

Create `backend/.env`:

```
TELLER_CERT_PATH=certs/certificate.pem
TELLER_KEY_PATH=certs/private_key.pem
TELLER_ENV=sandbox
CORS_ORIGINS=["http://localhost:8081"]
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/dbname
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
```

Create `frontend/.env`:

```
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_TELLER_APP_ID=your_teller_app_id
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-web-client-id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-google-ios-client-id
```

### 2. Install dependencies

```bash
make install
```

### 3. Run database migrations

```bash
cd backend && source venv/bin/activate && alembic upgrade head
```

### 4. Run

```bash
make backend   # FastAPI on http://localhost:8000
make frontend  # Expo dev server on http://localhost:8081
```

---

## Platform-specific notes

### Web

```bash
make frontend
# Press 'w' to open in browser
```

### iOS simulator

```bash
make frontend
# Press 'i' to open in iOS simulator
```

> **Tip:** In the Simulator menu bar, go to **I/O → Keyboard → disable "Connect Hardware Keyboard"**, otherwise typing in WebViews (like Teller Connect) will cause the page to refresh.

### Physical phone

Your phone can't reach `localhost` — use your Mac's local network IP instead.

1. Find your Mac's IP:
   ```bash
   ipconfig getifaddr en0
   ```

2. Update `frontend/.env`:
   ```
   EXPO_PUBLIC_API_URL=http://<your-mac-ip>:8000
   ```

3. Add the IP to `backend/.env` CORS origins:
   ```
   CORS_ORIGINS=["http://localhost:8081","http://<your-mac-ip>:8081"]
   ```

4. Restart both servers (frontend needs `npx expo start --clear` after `.env` changes).

> Your Mac's local IP can change when you reconnect to WiFi. Re-run `ipconfig getifaddr en0` if it stops working.

### Teller sandbox credentials

When prompted by Teller Connect in sandbox mode, use:
- **Username:** `username`
- **Password:** `password`

---

## Auth setup

Google OAuth is configured through three services:

1. **Google Cloud Console** — Create two OAuth client IDs:
   - **Web** — for browser-based sign-in
   - **iOS** — bundle ID `host.exp.Exponent` (Expo Go); change to your real bundle ID for production builds

2. **Supabase Dashboard** (Authentication → Providers → Google):
   - Add both client IDs (comma-separated) to the "Client IDs" field
   - Enable "Skip nonce checks" (required for expo-auth-session)
   - Client Secret: from the Web OAuth client

3. **Frontend `.env`** — Set both `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` and `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`

---

## Tech stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React Native + Expo SDK 54 | Web + iOS from one codebase |
| Auth | Supabase Auth + Google OAuth | expo-auth-session on native |
| Backend | FastAPI + Uvicorn | Python 3.11+, async |
| Database | Supabase (PostgreSQL) | SQLAlchemy 2.0 async + Alembic |
| Banking API | Teller | mTLS, sandbox → production |
| Hosting (web) | Vercel | Auto-deploys from `main` |
| Hosting (API) | Railway | Auto-deploys from `main` |

---

## Deployment

- **Backend:** [Railway](https://railway.app) — push to `main` and it auto-deploys
- **Frontend (web):** [Vercel](https://vercel.com) — push to `main` and it auto-deploys
- **Frontend (iOS):** EAS Build — `eas build --platform ios` (planned)
