# CLAUDE.md — Project Context for AI Assistants

## Project Overview

Full-stack fintech app connecting to real bank accounts for transaction viewing, balances, and spending analysis. React Native Web frontend (Expo) + FastAPI backend + Supabase (PostgreSQL). Targets friends & family initially (5–50 users), designed to scale.

**Current state:** Teller bank linking, transaction list, and spending summary work on web and iOS (Expo Go). Google OAuth via Supabase Auth works on both web and native iOS. Database layer in place (SQLAlchemy + Alembic + Supabase). Auth middleware guards teller + spending routes (user-scoped queries). GET endpoints fetch accounts and transactions by authenticated user. POST `/teller/transactions` still available for enrollment (uses DB fallback). Real Teller service code is ready but commented out.

## Development Phases

### Phase 1 — Web App (CURRENT)
**Iteration 1 (done):** Teller Connect → transaction list on web + iOS. DB models + migrations + Supabase connection.
**Iteration 1.5 (done):** Spending summary with category breakdown. Frontend decomposed into components, hooks, and feature modules.
**Iteration 1.75 (done):** Google OAuth sign-in via Supabase Auth. Web uses `signInWithOAuth` redirect flow; native iOS uses `expo-auth-session` + `signInWithIdToken` (bypasses Supabase redirect, which doesn't work in Expo Go). Backend JWT validation middleware via JWKS. Auth applied to teller + spending routes with user-scoped DB queries. Accounts-first data loading flow (fetch accounts → fetch transactions + spending in parallel). CategoryAccordion animated with expand/collapse and refund variant. `Account` type + `AccountResponse` schema added.
**Iteration 2 (next):** Re-enable live Teller data, Expo Router migration, persist enrolled tokens, native session persistence (AsyncStorage).

### Phase 2 — Mobile (FUTURE)
Build iOS app from same Expo codebase via EAS Build. Push notifications, biometric auth, widgets. Evaluate Android.

### Phase 3 — Scale (FUTURE)
Migrate Teller → Plaid if > 100 connections. Add Celery + Redis for background jobs. Cloudflare for caching + DDoS.

## Code Organization & Best Practices

These rules apply to all new code and refactors.

### No God Files
- No file should try to do everything. When a file is getting large or handling multiple concerns, extract.
- `App.tsx` is the composition root — wires hooks + components, minimal logic.

### Frontend Components
- **One component per file.** Never define multiple components in one file.
- **Components are single units.** Render ONE thing. Need multiple instances (e.g. 4 summary chips)? The component renders one, the parent creates 4. Need variants (e.g. a refund accordion)? Use a `variant` prop.
- **Composition at the parent/screen level.** The screen component (e.g. `SpendingSummary.tsx`) decides what to render, how many, and in what order. Sub-components don't compose sibling sub-components.
- **Screen-level components** → feature root (e.g. `src/spending/SpendingSummary.tsx`)
- **Reusable UI components** → `src/components/`
- **Feature sub-components** → `src/spending/components/`
- Extract only when it improves readability, enables reuse, or the parent is too long.
- **CRITICAL:** Use only React Native primitives (`View`, `Text`, `Pressable`, `ScrollView`, etc.). Never HTML elements. This ensures mobile compatibility.

### Feature Modules
- Group related code by feature (e.g. `src/spending/`).
- Barrel export (`index.ts`) for the public API. Keep internals private.

### Custom Hooks
- Extract stateful logic into `src/hooks/`. One responsibility per hook.

### Styles
- Co-located style files in `src/styles/` (e.g. `app.styles.ts`, `spending.styles.ts`).
- `StyleSheet.create()` always — no inline style objects.

### Backend Layering
- **Router → Service → Model** — strict call hierarchy, never skip layers.
- Routers: HTTP only (parsing, formatting, error mapping). No business logic.
- Services: Business logic, external APIs, data orchestration.
- Models: SQLAlchemy table definitions. No logic.
- Schemas: Pydantic request/response validation, one file per domain.

### Helpers & Types
- Extract to `src/utils/` or `app/utils/` when **reused across files**. Inline is fine for one-off logic.
- Name utility files by domain (`categoryColors.ts`), not generic (`helpers.ts`).
- Shared TypeScript interfaces → `src/types/`, one file per domain. Keep single-use types in the component file.
- Prefer `interface` over `type`. Never use `any`.

### General
- Prefer readable functions with clear names over clever one-liners.
- Follow existing codebase patterns. Don't invent new structures.
- Comments explain **why**, not **what**.

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React Native + Expo SDK 54 | Web + iOS from one codebase |
| Auth | Supabase Auth + Google OAuth | expo-auth-session on native |
| Hosting (web) | Railway | Same platform as backend |
| Routing | `App.tsx` (Iteration 1) | Expo Router in Iteration 2 |
| State | React hooks + custom hooks | Zustand if complexity grows |
| API Client | `src/api/client.ts` | All backend calls centralized |
| Styling | StyleSheet API | Co-located in `src/styles/` |
| Backend | FastAPI + Uvicorn | Python 3.11+, pip |
| Hosting (API) | Railway | Free tier ($5/mo credit) |
| Database | Supabase (PostgreSQL) | SQLAlchemy 2.0 async + Alembic |
| Banking API | Teller | httpx mTLS, sandbox → production |
| Cache | Upstash Redis | **PLANNED** — cache-aside pattern |
| File Storage | Cloudflare R2 | **PLANNED** — receipts, exports |

Backend is platform-agnostic (JSON over HTTPS) — no changes needed for mobile.

## Project Structure

Files marked `*` exist now. Unmarked files are planned for future iterations.

```
/
├── CLAUDE.md                  *
├── Makefile                   * make backend, make frontend, make install
├── backend/
│   ├── app/
│   │   ├── main.py            * FastAPI app, CORS config
│   │   ├── config.py          * pydantic-settings env config
│   │   ├── dependencies.py    * Async SQLAlchemy engine + get_db
│   │   ├── middleware/         *
│   │   │   ├── auth.py        * JWKS-based JWT validation (Supabase) + issuer check
│   │   │   └── rate_limit.py  * In-memory sliding-window rate limiter
│   │   ├── models/            * User, Account, Transaction
│   │   ├── schemas/           * spending.py, transaction.py
│   │   ├── routers/           * teller.py, spending.py
│   │   │   ├── auth.py          /api/v1/auth/*
│   │   │   ├── accounts.py      /api/v1/accounts/*
│   │   │   ├── transactions.py  /api/v1/transactions/*
│   │   │   └── dashboard.py     /api/v1/dashboard/*
│   │   ├── services/          * teller.py, spending.py
│   │   │   ├── cache.py         Redis cache helpers
│   │   │   └── storage.py       R2 file upload helpers
│   │   └── utils/             *
│   │       ├── encryption.py  * AES-GCM encrypt/decrypt for Teller tokens
│   │       ├── logging.py     * Structured audit logging (auth, data access, enrollment)
│   │       └── errors.py        Standardized error responses
│   ├── alembic/               * Database migrations
│   ├── certs/                 * Teller mTLS certs (gitignored)
│   ├── requirements.txt       *
│   └── tests/
├── frontend/
│   ├── App.tsx                * Composition root
│   ├── index.ts               * Expo entry point
│   ├── app/                     Expo Router screens (Iteration 2)
│   │   ├── (tabs)/              Dashboard, transactions, accounts, settings
│   │   ├── auth/                Login, signup
│   │   └── _layout.tsx          Root layout
│   └── src/
│       ├── api/client.ts      * Centralized API client
│       ├── api/supabase.ts    * Supabase client (createClient)
│       ├── components/        * TransactionRow, TellerModal, LoginScreen
│       ├── hooks/             * useTellerConnect, useTransactions
│       ├── spending/          * Feature module (SpendingSummary + sub-components)
│       ├── styles/            * app, spending, transactionRow, auth
│       ├── types/             * transaction.ts, spending.ts, account.ts
│       ├── utils/             * categoryColors.ts
│       └── contexts/          * AuthContext (Google OAuth + Supabase session)
```

## Key Architecture Decisions

1. **Monorepo** — backend + frontend in one repo. No Turborepo/Nx needed at this scale.
2. **React Native Web from day one** — RN primitives compile to HTML/CSS via Expo. Mobile-ready without rewrite.
3. **API-first** — frontend is a thin client. All business logic in FastAPI.
4. **Teller tokens encrypted at rest** — AES-encrypted in DB. Key in env vars, never in code.
5. **Cache-aside** — Redis is optional. App works without it (just slower).
6. **Platform-aware auth** — Web uses Supabase `signInWithOAuth` (browser redirect). Native iOS uses `expo-auth-session` Google provider to get an ID token, then `signInWithIdToken` to create a Supabase session. Supabase's OAuth redirect flow doesn't work in Expo Go because `ASWebAuthenticationSession` can't intercept `exp://` scheme 302 redirects.

## Environment Variables

Backend (`backend/.env`):
```
# Active
TELLER_CERT_PATH=certs/certificate.pem
TELLER_KEY_PATH=certs/private_key.pem
TELLER_ENV=sandbox
CORS_ORIGINS=["http://localhost:8081"]
DATABASE_URL=          # Supabase Postgres connection string
SUPABASE_URL=
SUPABASE_KEY=

ENCRYPTION_KEY=        # AES-256-GCM key (64 hex chars) — encrypts Teller tokens at rest

# Planned (Iteration 2+)
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=
R2_ACCOUNT_ID=
R2_ACCESS_KEY=
R2_SECRET_KEY=
R2_BUCKET_NAME=
```

Frontend (`frontend/.env`):
```
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_TELLER_APP_ID=
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=    # Google Cloud Console → Web OAuth client
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=    # Google Cloud Console → iOS OAuth client (bundle ID: host.exp.Exponent for Expo Go)
```

## Conventions

### Python
- Black (88 char), Ruff, type hints required, `async def` for all routes + DB queries
- snake_case for functions/variables, PascalCase for classes
- `HTTPException` with standardized schemas — never raw exceptions

### TypeScript
- Prettier, ESLint (Expo config), functional components only
- camelCase for functions/variables, PascalCase for components/files
- Barrel exports for feature modules, direct imports otherwise

### Git
- Branch: `feature/`, `fix/`, `chore/`
- Conventional commits: `feat:`, `fix:`, `docs:`, `chore:`
- Feature branch → PR → merge to `main`

## Common Tasks

```bash
make install       # Install all dependencies
make backend       # Start FastAPI (auto-creates venv)
make frontend      # Start Expo

# Manual alternatives
cd backend && uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
cd frontend && npx expo start --web        # Web at localhost:8081
cd frontend && npx expo start              # Press 'i' for iOS simulator

# Database
cd backend && alembic upgrade head
cd backend && alembic revision --autogenerate -m "description"

# After editing .env, restart with: npx expo start --web --clear
```

**Deploy:** Push to `main` → Railway auto-deploys both backend and frontend services.

## Auth Setup (Google OAuth + Supabase)

**Google Cloud Console:**
- Web OAuth client → used for browser-based sign-in
- iOS OAuth client → bundle ID `host.exp.Exponent` (Expo Go); change to real bundle ID for production builds

**Supabase Dashboard (Authentication → Providers → Google):**
- Client IDs field: comma-separated list of both Web and iOS client IDs
- "Skip nonce checks" enabled (required — expo-auth-session generates nonces Supabase can't verify)
- Client Secret: from the Web OAuth client

**Native auth flow:** `expo-auth-session/providers/google` → `Google.useAuthRequest` with `iosClientId` → redirect via reversed client ID scheme (`com.googleusercontent.apps.CLIENT_ID:/oauthredirect`) → ID token → `supabase.auth.signInWithIdToken()`

## Security & Compliance

This is a **financial application** with access to real bank accounts. Security is not optional. Every change must be reviewed through a security lens. When in doubt, choose the safer option.

### Security Principles
- **Defense in depth** — never rely on a single layer. Auth middleware + user-scoped queries + (planned) RLS.
- **Least privilege** — Teller integration is read-only (GET only). No payment/transfer endpoints.
- **Fail closed** — if auth fails, deny access. If encryption fails, reject the operation. Never fall back to plaintext.
- **No secrets in code** — all credentials in env vars. `.env` files gitignored. Never log tokens, passwords, or keys.

### Implemented Security Controls
- **Teller tokens encrypted at rest** — AES-256-GCM (`app/utils/encryption.py`). Key in `ENCRYPTION_KEY` env var. Tokens are encrypted before DB storage and decrypted only when needed for Teller API calls.
- **HTTPS only** — enforced by Railway in production.
- **CORS restricted** — only known frontend origins, explicit methods (`GET`, `POST`, `OPTIONS`), explicit headers (`Authorization`, `Content-Type`).
- **JWT validation** — JWKS-based (`middleware/auth.py`), validates signature, audience, expiration, and **issuer** (must match Supabase project URL). Guards all teller + spending routes.
- **User-scoped queries** — all data endpoints filter by authenticated `user_id`. No cross-user data access.
- **Rate limiting** — in-memory sliding-window (`middleware/rate_limit.py`). 60 req/min global per IP, 5 req/min on sensitive endpoints (`/enroll`).
- **Input validation** — Pydantic schemas with strict validators. `TokenRequest` validates token format, length, and allowed characters.
- **Generic error responses** — internal exceptions are logged server-side but never exposed to clients. All user-facing errors return safe, generic messages.
- **Audit logging** — structured logs (`utils/logging.py`) for: auth success/failure with IP, data access by user, enrollment events, request method/path/status/duration. Sensitive values (tokens, passwords) are **never** logged.
- **WebView origin restriction** — `TellerModal` restricts `originWhitelist` to HTTPS origins only.
- **Google OAuth client IDs are public** — they are not secrets (validated server-side by Google).

### Security Rules for All Code Changes
1. **Never log or expose Teller access tokens** — they grant direct bank access.
2. **Never store sensitive data in plaintext** — encrypt at rest using `app/utils/encryption.py`.
3. **Never return raw exception messages to clients** — log internally, return generic error.
4. **Never use `allow_origins=["*"]`** or `allow_methods=["*"]` in CORS.
5. **Always validate input** — use Pydantic validators with format/length/charset checks.
6. **Always scope queries by user_id** — no endpoint should return another user's data.
7. **Always add audit logging** to new endpoints — use `log_data_access()` for reads, `log_security_event()` for sensitive operations.
8. **Never commit `.env` files or certificates** — verify `.gitignore` covers new secret files.
9. **Never disable JWT validation** — not even temporarily for testing. Use test fixtures instead.
10. **Review all new dependencies** for known CVEs before adding.

### Planned Security Enhancements
- Supabase RLS on all user tables (defense in depth at DB level)
- Migrate rate limiter to Redis (Upstash) for multi-instance support
- Teller token rotation mechanism
- CSP headers on WebView content
- `npm audit` / `pip audit` in CI pipeline

## Scaling Path

1. Railway free tier → $5/mo hobby plan (or Render/Fly.io)
2. \>100 bank connections → paid Teller plan (or migrate to Plaid)
3. Database >500MB → Supabase Pro ($25/mo)
4. Background jobs → Celery + Redis
5. High traffic → Cloudflare caching + DDoS protection
6. Mobile → `eas build --platform ios`, no code rewrite
7. Push notifications → Expo Push Notifications or FCM
