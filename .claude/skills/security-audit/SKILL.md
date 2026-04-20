---
name: security-audit
description: Full-spectrum security audit of the LedgerWise codebase — authentication, authorization, cross-user data isolation, sensitive data handling, Plaid/Teller token protection, Stripe billing integrity, injection vulnerabilities, frontend secret exposure, dependency CVEs, and infrastructure misconfigurations. Run before major releases, after new auth/data/billing endpoints, or whenever I want a security sanity check.
disable-model-invocation: true
argument-hint: [scope: "backend", "frontend", "full" (default), or a specific path]
allowed-tools: Bash Grep Read Glob Agent
effort: max
---

# Security Audit

Perform a comprehensive, read-only security audit of the LedgerWise codebase. Do NOT modify any code — output a prioritized report.

**Scope resolution** based on `$ARGUMENTS`:
- `full` or empty (default): audit both `backend/` and `frontend/`
- `backend`: audit `backend/` only
- `frontend`: audit `frontend/` only
- Any other value: treat as a path glob and audit matching files

For every issue found:
1. Report the exact file + line number
2. Explain the concrete attack scenario it enables
3. Propose a specific fix (not a vague recommendation)
4. Rate severity: **P0** (exploitable now) / **P1** (defense-in-depth gap) / **P2** (hardening)

---

## Audit Categories — Run ALL of These

### 1. Authentication & Session Integrity

- Every route under `backend/app/routers/` that touches user data depends on `get_current_user_id` — grep for routes missing the dependency
- JWT validation in `middleware/auth.py` verifies signature (JWKS), expiration, audience, AND issuer — flag if any missing
- No route accepts `user_id` from request body, query params, or path — user_id must come ONLY from the JWT `sub` claim
- Supabase anon key is never used server-side for privileged operations (should use service role key or RLS-bound session)
- Frontend does not store JWTs in `localStorage` or plain `AsyncStorage` on native — should use `expo-secure-store` for the refresh token; in-memory for access token. Flag any `localStorage.setItem` or `AsyncStorage.setItem` involving tokens.
- Check session expiry + refresh flow for race conditions

### 2. Authorization & IDOR (Cross-User Data Access)

This is the #1 risk.

- For EVERY endpoint that takes an entity ID as a path or query param (e.g. `/transactions/{id}`, `/accounts/{id}`, `/categories/{id}`, `/plaid/items/{id}`, `/stripe/subscriptions/{id}`), verify the DB query filters by BOTH the entity ID and the authenticated `user_id`
- Verify Supabase RLS policies exist on ALL user-scoped tables: `users`, `accounts`, `transactions`, `plaid_items`, `user_categories`, `merchant_category_rules`, plus any Stripe-related tables (`stripe_customers`, `subscriptions`, etc. — whatever exists)
- RLS policies must use `auth.uid()` comparison — flag any policy using `true`, `current_user`, or session variables
- Check for queries that bypass RLS by using service role key when they shouldn't
- Verify the `transactions` table RLS policy correctly subqueries through `accounts` (since it has no direct user_id column)

### 3. Plaid / Teller Token Protection (CRITICAL — Bank Access)

- All access tokens MUST be encrypted at rest. Grep `PlaidItem.access_token` and `Account.teller_access_token` assignments — every write path must call `encrypt()` first
- `decrypt()` calls must be scoped narrowly — never assigned to module-level or long-lived variables
- Tokens must NEVER appear in: logs, error messages, API responses, frontend state, URL params, or git history
- Grep for: `logger.*access_token`, `logger.*token=`, `print.*token`, `console.log.*token`, `response.*access_token`
- Scan git history for committed tokens: `git log --all -p -S "access-production-" -S "access-sandbox-" -S "public-token-"`
- `ENCRYPTION_KEY` must be validated on startup (length + hex format)
- Check that Plaid webhook endpoint (when added) verifies the `Plaid-Verification` JWT header before trusting payloads
- Confirm the pull-once-then-disconnect architecture: after sync, is `/item/remove` called and the encrypted token deleted from DB? Flag any stale tokens.

### 4. Stripe Billing Integrity (CRITICAL — Money + Entitlements)

This section has two modes. Detect which applies before running:
- **Mode A — Stripe code exists in backend:** full audit below.
- **Mode B — Stripe is connected at the account level but no backend code yet:** report "Stripe integration is configured externally but no server-side code found. The following checks will become P0 as soon as checkout or webhook endpoints ship:" and list every check below as a forward-looking requirement.

Run these checks:

- **Webhook signature verification** — the Stripe webhook endpoint MUST call `stripe.Webhook.construct_event(payload, sig_header, webhook_secret)` on the raw request body. Flag any webhook handler that parses JSON before verifying signature, or that skips verification entirely.
- **Raw body preservation** — the webhook route must receive the raw bytes, not a Pydantic-parsed body. FastAPI default is to parse JSON; verify the route reads `await request.body()` and uses the raw bytes for signature verification.
- **Webhook secret storage** — `STRIPE_WEBHOOK_SECRET` must be in env (Railway), never in code, never prefixed `EXPO_PUBLIC_`. Verify separate secrets for test vs live mode.
- **Webhook idempotency** — Stripe retries events. Every webhook handler must be idempotent. Check for an `event.id` dedup table or an explicit idempotency key check. Flag handlers that would double-apply `is_pro=true` or double-credit a user on retry.
- **Event type allow-list** — the webhook handler should switch on `event.type` against an explicit allow-list. Flag handlers that process unknown event types or use truthy fallbacks.
- **Entitlement source of truth** — the `is_pro` flag in Supabase must be set ONLY by verified webhook events. Grep for any code path that sets `is_pro=true` from: a client request body, a checkout success redirect param, a Stripe Session ID posted from the frontend, or any non-webhook context. These are all exploitable.
- **Customer-to-user binding** — when a webhook arrives, how is the Stripe `customer` ID mapped back to a LedgerWise `user_id`? Verify the binding is created server-side at checkout session creation (with `client_reference_id` or a stored `stripe_customer_id` on the user row), and is NEVER taken from webhook metadata alone without cross-checking against the stored mapping.
- **Checkout session creation** — the endpoint that creates a Stripe Checkout Session must: (a) be authenticated with `get_current_user_id`, (b) use the authenticated user's ID as `client_reference_id`, (c) use a server-controlled price ID (never accept `price_id` from the client), (d) set `success_url` and `cancel_url` to LedgerWise-controlled domains only (no open redirect)
- **Customer Portal** — any endpoint that generates a Stripe Billing Portal session must create it for the CURRENTLY AUTHENTICATED user's `stripe_customer_id` only. Never accept a `customer_id` from the request. This is a common IDOR path.
- **Price/product tampering** — server holds the price IDs; client never submits them. Check that the checkout endpoint has a hardcoded or config-driven map of allowed plans and rejects anything else.
- **Amount validation** — never trust amounts from the client. Flag any code path that reads `amount_total` or `amount` from a request body (vs. from a Stripe-signed event).
- **API key hygiene** — `STRIPE_SECRET_KEY` (starts `sk_live_` or `sk_test_`) is backend-only. Grep frontend for `sk_live_`, `sk_test_`. Grep for any `EXPO_PUBLIC_STRIPE_SECRET`. Publishable key in frontend is fine.
- **Mode separation** — production backend must use `sk_live_` keys and live webhook endpoint; staging/dev uses test keys. Flag any code that mixes modes or falls back from live to test.
- **PII in Stripe metadata** — Stripe `metadata` fields should contain ONLY IDs (user_id, plan_id), never emails, names, transaction details, or bank data.
- **Subscription state drift** — a cron or reconciliation job should periodically verify local `is_pro` flags match Stripe's actual subscription state. Flag if this doesn't exist (P1).
- **Refund/dispute handling** — `charge.refunded` and `charge.dispute.created` events should downgrade `is_pro` immediately. Missing handlers = exploitable.
- **Frontend Stripe usage** — if using Stripe.js or `@stripe/stripe-react-native`, confirm card elements are Stripe-hosted (PCI-safe). Flag any custom `<input>` fields collecting raw card numbers, CVCs, or expiration dates.

### 5. Input Validation & Injection

- All request bodies use Pydantic schemas with field validators (length, format, charset) — flag any router accepting raw `dict` or `Any`
- All SQL uses SQLAlchemy parameterized queries or ORM — grep for string-formatted SQL (`f"SELECT..."`, `"...%s..." %`, `.format(`, concatenation with user input)
- Check `alembic/versions/` migrations — raw SQL is fine there but flag if any migration uses user-supplied values
- NoSQL/Redis commands (if any) use parameterized APIs
- Frontend: no `dangerouslySetInnerHTML`, no `eval`, no dynamic `Function()` construction
- Frontend: all user-controlled strings in URLs are `encodeURIComponent`-wrapped
- Check for SSRF: any endpoint that fetches a user-supplied URL? (should not exist — but verify)

### 6. Sensitive Data Exposure

- Error responses to clients contain only generic messages — grep for `HTTPException.*str(e)`, `detail=str(`, `detail=exc`, raw exception passthrough
- No stack traces, SQL, or internal paths in 4xx/5xx responses
- CORS: `allow_origins` is an explicit list, never `["*"]`; `allow_methods` and `allow_headers` are explicit. Stripe webhook endpoint should NOT be behind CORS restrictions (it's server-to-server) but must still verify signature.
- Security headers middleware sets: HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, CSP
- CSP allows Stripe domains if Stripe.js is used (`js.stripe.com`, `checkout.stripe.com`) — verify CSP isn't blocking legitimate Stripe resources or wildcarding everything
- `.env`, `certs/`, `*.pem`, `*.key` are in `.gitignore`
- No secrets committed: `git log --all -p -S "ENCRYPTION_KEY=" -S "SUPABASE_SERVICE" -S "PLAID_SECRET" -S "STRIPE_SECRET" -S "STRIPE_WEBHOOK_SECRET" -S "sk_live" -S "sk_test" -S "whsec_"` (excluding `.env.example`)
- Frontend `EXPO_PUBLIC_*` vars contain ONLY non-secret values — confirm no service keys, no Plaid secrets, no Stripe secret keys are prefixed `EXPO_PUBLIC_`
- Supabase `anon` key in frontend is OK; `service_role` key must NEVER appear in frontend code
- Stripe publishable key in frontend is OK; Stripe secret key must NEVER appear in frontend code

### 7. Rate Limiting & Abuse

- Rate limit middleware is registered on the FastAPI app
- Sensitive endpoints (`/enroll`, `/exchange-token`, `/create-link-token`, `/stripe/create-checkout-session`, `/stripe/create-portal-session`, auth callbacks) have stricter limits than default
- Stripe webhook endpoint should NOT be aggressively rate-limited (Stripe may burst retries) — but should have replay protection via event ID dedup
- Limits are enforced per-user (JWT sub) AND per-IP, not just one
- Check for brute-force surfaces: any endpoint that accepts a code/token/OTP and returns different responses for valid vs invalid

### 8. Frontend Attack Surface (Expo / React Native + Web)

- Deep link handlers (`/oauth-redirect`, Stripe Checkout return URLs, auth callbacks) validate the source/scheme and do not blindly execute params
- Stripe success/cancel redirect URLs only set a UI state — they never trigger entitlement changes client-side (entitlement is webhook-driven, per category 4)
- WebView `originWhitelist` is restricted to HTTPS known origins (Plaid Link, Teller, Stripe Checkout — check `PlaidLinkModal`, `TellerModal`, and any Stripe WebView)
- WebView does not inject `injectedJavaScript` that forwards cookies/tokens to untrusted content
- No `console.log` of tokens, user emails, account numbers, transaction details, or Stripe customer IDs in production builds — grep for `console.log` under `src/` and `app/`
- Deep link / universal link routes don't allow arbitrary redirect targets (open redirect)

### 9. Infrastructure & Deployment

- Railway backend: HTTPS enforced, `PLAID_ENV=production` matches the deployed env, `ENCRYPTION_KEY` is 64 hex chars, `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` present in live env
- Supabase: email confirmation required, password min length >= 12, leaked-password protection enabled, MFA available
- GitHub repo: branch protection on `main`, required reviews, no force-push, secret scanning enabled (should catch `sk_live_`, `whsec_`, `access-production-` prefixes), Dependabot enabled
- GitHub Actions (if any) use pinned action versions (commit SHAs, not floating tags)
- No `*.env` files tracked; `.env.example` contains only placeholders (including placeholder Stripe keys)
- Stripe Dashboard side (report as external check, cannot be audited from code): webhook endpoint points to production Railway URL, webhook signing secret matches `STRIPE_WEBHOOK_SECRET` env var, only subscribed to needed events, test-mode webhook points to staging (if applicable)

### 10. Dependency Hygiene

- Run `pip install pip-audit && pip-audit -r backend/requirements.txt` and report CVEs (pay special attention to `stripe`, `plaid-python`, `cryptography`, `fastapi`, `sqlalchemy`)
- Run `npm audit --prefix frontend --audit-level=moderate` and report issues
- Flag any package with no updates in 2+ years and in a security-sensitive path (crypto, auth, HTTP client, payment SDK)

### 11. Audit Logging Completeness

- Every sensitive action (token exchange, enrollment, category rule apply, account disconnect, login, logout, Stripe checkout session creation, Stripe webhook receipt, subscription upgrade/downgrade, portal session creation) calls `log_security_event()` or `log_data_access()`
- Logs never contain tokens, passwords, full card numbers, full SSNs, or Stripe secret identifiers — grep the log call sites
- Logs include `user_id`, IP, timestamp, and action name
- Stripe webhook logs include `event.id` and `event.type` (useful for forensics) but never log the full event body (may contain customer emails)

### 12. LedgerWise-Specific Threat Model

- Plaid "pull once then disconnect" lifecycle: verify there is no code path that re-uses a removed item's token
- Annual vs monthly Stripe subscription: the plan upgrade/downgrade flow is webhook-driven, not client-driven (cross-referenced with category 4)
- Freemium paywall: the `is_pro` check must happen server-side on every gated endpoint (not just frontend blur overlays). Grep for Pro-gated features and verify each has a backend check, not only a frontend check.
- Color ID storage (recent migration): verify no user-controlled path writes to the reserved brand color IDs (purple/gold) in `user_categories.color_id`
- Merchant category rules: confirm rules are scoped to the authenticated user and cannot be applied to another user's transactions
- TestFlight build: confirm no debug flags, `__DEV__` bypasses, or test-only backdoor endpoints are compiled in
- TestFlight build: confirm Stripe test-mode keys are not bundled into production frontend build

---

## Output Format

Write the report to `SECURITY_AUDIT_REPORT.md` in the repo root containing:

1. **Executive summary** — count of P0/P1/P2 findings, overall risk posture (1 paragraph)
2. **Stripe integration mode** — state whether Mode A (code exists) or Mode B (external-only) applies, and what that means
3. **P0 findings** — actively exploitable, fix immediately, with file:line + attack scenario + fix
4. **P1 findings** — defense-in-depth gaps, fix before next release
5. **P2 findings** — hardening opportunities
6. **Pass list** — categories that audited clean (reassurance for things that are done right)
7. **Suggested next steps** — prioritized order to address findings
8. **External checks reminder** — Stripe Dashboard settings, Supabase auth settings, GitHub repo settings that can't be verified from code but should be reviewed manually

**Do not modify any code. This is audit-only.**
