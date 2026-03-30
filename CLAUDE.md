# CLAUDE.md — Project Context for AI Assistants

## Project Overview

Full-stack fintech app connecting to real bank accounts for transaction viewing, balances, and spending analysis. React Native Web frontend (Expo) + FastAPI backend + Supabase (PostgreSQL). Targets friends & family initially (5–50 users), designed to scale.

**Current state:**
- Teller bank linking, transaction list, spending summary, analytics — working on web + iOS (Expo Go)
- Google OAuth via Supabase Auth (web redirect flow + native `expo-auth-session` + `signInWithIdToken`)
- Database: SQLAlchemy + Alembic + Supabase PostgreSQL, auth middleware with user-scoped queries
- Expo Router file-based routing — sidebar nav (web), bottom tabs (mobile)
- Client-side data: `TransactionDataContext` fetches once, `useDataSlice()` filters by date range for instant period switching
- Dark mode via `ThemeContext` + `useThemeStyles` hook, design tokens in `src/theme/`
- ErrorBoundary wraps entire app, accessibility props on all interactive elements
- In-memory API cache (5-min TTL), Railway deployment (backend + frontend)

## Development Phases

### Phase 1 — Web App (CURRENT)
**Done:** Teller Connect + transaction list (1.0) → spending summary + feature modules (1.5) → Google OAuth + JWT auth + user-scoped queries (1.75) → Expo Router + dashboard layout + time period selector (1.9) → TransactionDataContext + overview page + Railway deploy + security headers (1.95) → analytics page + dark mode + theme system + ErrorBoundary + accessibility + frontend cleanup (1.96).
**Next (Iteration 2):** Re-enable live Teller data, persist enrolled tokens, native session persistence (AsyncStorage).

### Phase 2 — Mobile (FUTURE)
Build iOS app from same Expo codebase via EAS Build. Push notifications, biometric auth, widgets. Evaluate Android.

### Phase 3 — Scale (FUTURE)
Migrate Teller → Plaid if >100 connections. Celery + Redis for background jobs. Cloudflare for caching + DDoS. Supabase Pro if DB >500MB. Push notifications via Expo/FCM.

## Code Organization & Best Practices

These rules apply to all new code and refactors.

### No God Files
- No file should try to do everything. When a file is getting large or handling multiple concerns, extract.
- Expo Router `app/` directory handles routing. Screen files in `app/dashboard/` are thin orchestrators that wire hooks + components.

### Frontend Components
- **One component per file.** Never define multiple components in one file.
- **Components are single units.** Render ONE thing. Need multiple instances (e.g. 4 summary chips)? The component renders one, the parent creates 4. Need variants (e.g. a refund accordion)? Use a `variant` prop.
- **Composition at the parent/screen level.** The screen component (e.g. `SpendingSummary.tsx`) decides what to render, how many, and in what order. Sub-components don't compose sibling sub-components.
- **Screen-level components** → feature root (e.g. `src/features/spending/SpendingSummary.tsx`)
- **Reusable UI components** → `src/components/`
- **Feature sub-components** → `src/features/<feature>/components/`
- **Feature styles** → `src/features/<feature>/styles/`
- **Feature utils** → `src/features/<feature>/utils/`
- Extract only when it improves readability, enables reuse, or the parent is too long.
- **CRITICAL:** Use only React Native primitives (`View`, `Text`, `Pressable`, `ScrollView`, etc.). Never HTML elements. This ensures mobile compatibility.
- **Accessibility:** All interactive elements (`Pressable`, tab-like controls) must have `accessibilityRole`, `accessibilityLabel`, and where applicable `accessibilityState` props.
- **ErrorBoundary** wraps the app as the outermost component in `app/_layout.tsx` (outside all providers). Uses hardcoded styles since it renders outside ThemeProvider.

### Feature Modules
- Group related code by feature under `src/features/` (e.g. `src/features/spending/`, `src/features/analytics/`).
- Each feature module has: root component, `components/`, `styles/`, `utils/`, and `index.ts` barrel export.
- Barrel export (`index.ts`) for the public API. Keep internals private.
- Feature-specific hooks live in the feature root (e.g. `useAccordionHeight.ts`, `useAnalyticsData.ts`).

### Custom Hooks
- Shared/cross-feature hooks → `src/hooks/` (e.g. `useTellerConnect.ts`, `useThemeStyles.ts`).
- Feature-specific hooks → feature root (e.g. `src/features/analytics/useAnalyticsData.ts`).
- One responsibility per hook.

### Styles
- Shared/layout styles → `src/styles/` (e.g. `dashboardLayout.styles.ts`, `auth.styles.ts`).
- Feature-specific styles → `src/features/<feature>/styles/` (e.g. `spending.styles.ts`, `analytics.styles.ts`).
- `StyleSheet.create()` always — no inline style objects.
- Theme-aware styles use factory functions: `createXStyles(colors)` → passed to `useThemeStyles()` hook.
- Design tokens (colors, spacing, typography, shadows) in `src/theme/`.

### Backend Layering
- **Router → Service → Model** — strict call hierarchy, never skip layers.
- Routers: HTTP only (parsing, formatting, error mapping). No business logic.
- Services: Business logic, external APIs, data orchestration.
- Models: SQLAlchemy table definitions. No logic.
- Schemas: Pydantic request/response validation, one file per domain.

### Helpers & Types
- Shared utils → `src/utils/`. Feature-specific utils → `src/features/<feature>/utils/`.
- Name utility files by domain (`categoryColors.ts`), not generic (`helpers.ts`).
- **All shared TypeScript interfaces → `src/types/`, one file per domain.** Never put types inside feature folders. Keep single-use types in the component file.
- Prefer `interface` over `type`. Never use `any`.
- Deduplicate shared logic — if the same pattern exists in multiple files, extract to a single source of truth and import.

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
| Routing | Expo Router (file-based) | `app/` directory, sidebar + bottom tabs |
| State | React Context + custom hooks | TransactionDataContext + useDataSlice |
| API Client | `src/api/client.ts` | All backend calls centralized |
| Styling | StyleSheet API + theme factories | `src/styles/` (shared) + `src/features/*/styles/` |
| Backend | FastAPI + Uvicorn | Python 3.11+, pip |
| Hosting (API) | Railway | Free tier ($5/mo credit) |
| Database | Supabase (PostgreSQL) | SQLAlchemy 2.0 async + Alembic |
| Banking API | Teller | httpx mTLS, sandbox → production |
| Cache | Upstash Redis | **PLANNED** — cache-aside pattern |
| File Storage | Cloudflare R2 | **PLANNED** — receipts, exports |

Backend is platform-agnostic (JSON over HTTPS) — no changes needed for mobile.

## Project Structure

```
/
├── CLAUDE.md
├── Makefile                      make backend, make frontend, make install
├── backend/
│   ├── app/
│   │   ├── main.py               FastAPI app, CORS, security headers, middleware stack
│   │   ├── config.py             pydantic-settings env config
│   │   ├── dependencies.py       Async SQLAlchemy engine + get_db
│   │   ├── middleware/
│   │   │   ├── auth.py           JWKS-based JWT validation (Supabase) + issuer check
│   │   │   └── rate_limit.py     In-memory sliding-window rate limiter
│   │   ├── models/               User, Account, Transaction (SQLAlchemy)
│   │   ├── schemas/              spending.py, transaction.py (Pydantic)
│   │   ├── routers/
│   │   │   ├── teller.py         GET /accounts, GET /transactions, POST /enroll
│   │   │   └── spending.py       GET /spending/summary
│   │   ├── services/
│   │   │   ├── teller.py         Teller API integration + DB persistence
│   │   │   └── spending.py       Spending summary aggregation
│   │   └── utils/
│   │       ├── encryption.py     AES-GCM encrypt/decrypt for Teller tokens
│   │       └── logging.py        Structured audit logging (auth, data access, enrollment)
│   ├── alembic/                  Database migrations
│   ├── certs/                    Teller mTLS certs (gitignored)
│   └── requirements.txt
├── frontend/
│   ├── app/                      Expo Router screens (file-based routing)
│   │   ├── _layout.tsx           Root layout (ErrorBoundary + SafeAreaProvider + providers)
│   │   ├── index.tsx             Auth gate (redirects to login or dashboard)
│   │   ├── login.tsx             Login screen
│   │   └── dashboard/
│   │       ├── _layout.tsx       Dashboard layout (sidebar on web, bottom tabs on mobile)
│   │       ├── index.tsx         Redirects to /dashboard/spending
│   │       ├── overview.tsx      Overview page (stats, alerts)
│   │       ├── spending.tsx      Spending page (Teller connect, time period, summary)
│   │       ├── analytics.tsx     Analytics page (bar chart, category filters, stats)
│   │       └── settings.tsx      Settings page (placeholder)
│   └── src/
│       ├── api/
│       │   ├── client.ts         Centralized API client with in-memory cache (5-min TTL)
│       │   └── supabase.ts       Supabase client (createClient)
│       ├── components/           Shared UI components
│       │   ├── AccordionReveal.tsx
│       │   ├── ErrorBoundary.tsx  App-wide error boundary (class component)
│       │   ├── LoginScreen.tsx
│       │   ├── StaggeredView.tsx
│       │   ├── StatCard.tsx
│       │   ├── TellerModal.tsx
│       │   ├── ThemeToggle.tsx
│       │   ├── TimePeriodSelector.tsx
│       │   └── icons/            LedgerWiseLogo, GoogleIcon
│       ├── contexts/
│       │   ├── AuthContext.tsx    Google OAuth + Supabase session management
│       │   ├── ThemeContext.tsx   Dark/light mode provider + useColors hook
│       │   └── TransactionDataContext.tsx  Data fetching + client-side filtering
│       ├── features/
│       │   ├── analytics/        Analytics feature module
│       │   │   ├── Analytics.tsx         Screen-level component
│       │   │   ├── useAnalyticsData.ts   Data hook (aggregation, filtering)
│       │   │   ├── index.ts              Barrel export
│       │   │   ├── components/
│       │   │   │   ├── BarChart.tsx       Monthly spending trend chart
│       │   │   │   ├── CategoryFilterPills.tsx
│       │   │   │   └── SummaryStatsRow.tsx
│       │   │   ├── styles/
│       │   │   │   └── analytics.styles.ts
│       │   │   └── utils/
│       │   │       └── analyticsAggregation.ts
│       │   └── spending/         Spending feature module
│       │       ├── SpendingSummary.tsx    Screen-level component
│       │       ├── useAccordionHeight.ts
│       │       ├── index.ts              Barrel export
│       │       ├── components/
│       │       │   ├── CategoryAccordion.tsx
│       │       │   └── ProportionBar.tsx
│       │       ├── styles/
│       │       │   ├── spending.styles.ts
│       │       │   └── spendingScreen.styles.ts
│       │       └── utils/
│       │           ├── categoryRanking.ts
│       │           └── spendingSummary.ts  Includes shared isPayment()
│       ├── hooks/
│       │   ├── useTellerConnect.ts  Teller Connect widget integration
│       │   └── useThemeStyles.ts   Theme-aware StyleSheet factory hook
│       ├── styles/               Shared/layout StyleSheet files
│       │   ├── auth.styles.ts
│       │   ├── authGate.styles.ts
│       │   ├── dashboardLayout.styles.ts
│       │   ├── overview.styles.ts
│       │   ├── placeholder.styles.ts
│       │   ├── shared.styles.ts
│       │   ├── statCard.styles.ts
│       │   ├── tellerModal.styles.ts
│       │   └── timePeriod.styles.ts
│       ├── theme/                Design tokens
│       │   ├── colors.ts         Light mode palette
│       │   ├── darkColors.ts     Dark mode palette
│       │   ├── spacing.ts
│       │   ├── typography.ts
│       │   ├── shadows.ts
│       │   └── index.ts          Barrel export
│       ├── types/                Shared TypeScript interfaces (one file per domain)
│       │   ├── account.ts
│       │   ├── analytics.ts
│       │   ├── spending.ts
│       │   └── transaction.ts
│       └── utils/                Shared utilities
│           ├── categoryColors.ts
│           ├── pressable.ts      Platform-safe hover state helper
│           └── responsive.ts     Screen width breakpoint utilities
```

## Key Architecture Decisions

1. **Monorepo** — backend + frontend in one repo. No Turborepo/Nx needed at this scale.
2. **React Native Web from day one** — RN primitives compile to HTML/CSS via Expo. Mobile-ready without rewrite.
3. **API-first** — frontend is a thin client. All business logic in FastAPI.
4. **Teller tokens encrypted at rest** — AES-encrypted in DB. Key in env vars, never in code.
5. **Cache-aside** — Redis is optional. App works without it (just slower).
6. **Platform-aware auth** — Web uses Supabase `signInWithOAuth` (browser redirect). Native iOS uses `expo-auth-session` Google provider to get an ID token, then `signInWithIdToken` to create a Supabase session. Supabase's OAuth redirect flow doesn't work in Expo Go because `ASWebAuthenticationSession` can't intercept `exp://` scheme 302 redirects.
7. **Expo Router with platform-aware navigation** — File-based routing in `app/` directory. Dashboard layout renders a sidebar (256px) on web and bottom tabs on mobile. Auth gate at root redirects unauthenticated users to `/login`.
8. **Date-range filtering** — Backend endpoints accept optional `start_date`/`end_date` query params. Frontend `TimePeriodSelector` converts user-friendly periods (month/year/YTD/all) to ISO date strings via `periodToDateRange()`.
9. **TransactionDataContext** — Provider fetches all transactions once on mount. `useDataSlice(dateRange?)` filters by date range and computes spending summaries client-side via `computeSpendingSummary()`. This enables instant period switching without additional API calls. The context is mounted in the dashboard layout so data persists across tab navigation.
10. **In-memory API cache** — `client.ts` caches GET responses for 5 minutes (keyed by URL). `clearApiCache()` invalidates on refresh or enrollment. Eliminates redundant fetches during tab switching.
11. **Theme system** — `ThemeContext` provides `isDark`, `toggleTheme`, and `colors`. Style files export factory functions (`createXStyles(colors)`) consumed by `useThemeStyles()` hook, which re-creates styles when theme changes. Design tokens (colors, spacing, typography, shadows) live in `src/theme/`.

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
- Prettier, ESLint (Expo config), functional components only (except ErrorBoundary)
- camelCase for functions/variables, PascalCase for components/files
- Barrel exports for feature modules, direct imports otherwise
- Pure helper functions extracted to module scope (not recreated inside components)
- Render callbacks that depend on component scope wrapped in `useCallback`
- `useEffect` cleanup functions for DOM side effects (e.g. script injection)

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
