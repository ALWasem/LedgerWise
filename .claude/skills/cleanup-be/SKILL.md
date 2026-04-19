---
name: cleanup-be
description: Post-feature backend cleanup — enforce CLAUDE.md layering, fintech security hardening, SQLAlchemy best practices, API correctness, and performance optimizations
disable-model-invocation: true
argument-hint: [scope e.g. app/services/plaid.py, or blank for changed files]
allowed-tools: Bash Grep Read Edit Glob Agent
effort: max
---

# Post-Feature Backend Cleanup

Clean up backend code after a feature push. Enforces CLAUDE.md project conventions AND industry best practices for a FastAPI fintech backend handling real bank account data.

**Scope:** If `$ARGUMENTS` is provided, focus on those paths under `backend/`. Otherwise, detect changed backend files by running `git diff --name-only main...HEAD -- backend/` (or `git diff --name-only HEAD~5 -- backend/` if on main) and clean those up.

Work through each section in order. For every issue found, fix it — don't just report it.

---

## P0 — Critical (always fix)

### 1. Authentication & Authorization

- **Every route that touches user data MUST depend on `get_current_user_id`** — no exceptions, no bypass flags, no "temporary" skips
- JWT validation must verify: signature (JWKS), expiration, audience (`authenticated`), issuer (Supabase project URL) — confirm all four are present in `middleware/auth.py`
- Never accept user ID from request body or query params — always derive from the JWT `sub` claim
- Never return a different user's data — every DB query must include a `WHERE user_id = :user_id` or equivalent join filter
- Check for IDOR: if a route takes an entity ID as a path param (e.g. `/transactions/{id}/category`), the query MUST also filter by the authenticated user's ID
- Auth failures must return generic messages (`"Invalid token"`, `"Token expired"`) — never leak why validation failed (e.g. don't say "issuer mismatch" or "audience invalid")

### 2. Sensitive Data Protection

- **Plaid access tokens must be encrypted at rest** — verify `encrypt()` is called before any DB write of access tokens
- `decrypt()` should only be called at the moment of Plaid API calls — never store decrypted tokens in variables longer than the scope of that call
- **Never log tokens, secrets, encryption keys, or full account numbers** — grep for `logger.*token`, `logger.*key`, `logger.*secret`, `print(` and flag any hits
- No `print()` statements anywhere — use structured logging only
- Error responses to clients must never include stack traces, SQL queries, internal paths, or ORM details — only safe generic messages
- `.env` files and `certs/` must be in `.gitignore` — verify this
- Encryption key must be validated on startup (correct length, hex format) — not deferred to first use
- Check that `ENCRYPTION_KEY` is not committed anywhere in git history: `git log --all -p -S "ENCRYPTION_KEY=" -- "*.py" "*.env"` (excluding `.env.example`)

### 3. SQL Injection & Input Validation

- **All database queries must use parameterized statements** — never use f-strings or `.format()` to build SQL
- SQLAlchemy ORM queries and `select()` with `.where()` are safe — but audit any raw `text()` calls or `session.execute(text(...))` for parameter binding
- All user-facing inputs must be validated with Pydantic schemas — check every route parameter, query param, and request body
- Pydantic validators must enforce: max length, allowed characters (regex), format constraints
- Path parameters used in DB lookups (e.g. `transaction_id`) must be validated — reject if not matching expected format (UUID or Plaid ID pattern)
- `Query()` params with string types must have reasonable `max_length` constraints

### 4. Rate Limiting & Abuse Prevention

- Verify rate limiter covers ALL routes, not just a subset — check that the middleware runs before auth
- Sensitive operations (`/exchange-token`, any future write endpoints) must have stricter per-endpoint limits
- Rate limit responses must not leak internal details — just `429` with a generic message
- If rate limiter is in-memory: verify it prunes stale entries to prevent unbounded memory growth (add periodic cleanup or max-size eviction)

---

## P1 — High Priority

### 5. API Layering (Router -> Service -> Model)

- **Routers** handle HTTP concerns ONLY: parse request, call service, format response, map exceptions to HTTP status codes
- **Services** contain business logic, external API calls, data orchestration — never import `HTTPException` or `status` from FastAPI
- **Models** are pure table definitions — no query logic, no business logic, no validation
- **Schemas** handle validation (Pydantic) — one file per domain, shared via barrel export in `schemas/__init__.py`
- No service function should return an HTTP response or status code — return data or raise domain exceptions
- Routers should not contain raw SQLAlchemy queries — all DB access goes through services
- Check for circular imports between layers

### 6. Error Handling

- Every router endpoint must have explicit exception handling — catch service/domain exceptions and map to appropriate HTTP status codes
- **Never let unhandled exceptions reach the client** — the global exception handler should catch anything that slips through, log it, and return a generic 500
- Create a consistent error response schema: `{"detail": "message"}` across all endpoints
- Distinguish between:
  - `400` — bad input (validation failure, malformed request)
  - `401` — authentication failure (missing/invalid/expired token)
  - `403` — authorization failure (valid token but not allowed — for future use)
  - `404` — resource not found (but don't reveal whether it exists for another user — just "not found")
  - `429` — rate limited
  - `502` — upstream service failure (Plaid API down)
  - `500` — unexpected internal error (log full details, return generic message)
- External API call failures (Plaid, Supabase) must be caught and wrapped — never let SDK or HTTP exceptions propagate raw
- Log the full exception with traceback server-side for every 5xx error

### 7. Database Best Practices

- **All DB operations must be async** — `async def` + `await db.execute()`, never synchronous calls
- Use `expire_on_commit=False` on session factory to prevent lazy-load issues after commit (verify in `dependencies.py`)
- Verify `joinedload()` or `selectinload()` is used where relationships are accessed — prevent N+1 query patterns
- Write operations (`INSERT`, `UPDATE`) must be wrapped in an explicit transaction scope — verify `await db.commit()` is called and `await db.rollback()` on failure
- Upsert operations (`ON CONFLICT DO UPDATE`) must specify the correct constraint name and update only the fields that should change
- Verify all ForeignKey definitions include `ondelete="CASCADE"` where parent deletion should cascade
- Check for missing indexes on frequently filtered columns (`user_id`, `account_id`, `plaid_transaction_id`, `date`)
- Never use `db.execute(text("DROP ..."))` or `db.execute(text("TRUNCATE ..."))` outside of migrations
- Verify `statement_cache_size=0` is set if using Supabase transaction pooler (pgbouncer compatibility)

### 8. Async & Concurrency

- Every route handler must be `async def` — never `def` (blocks the event loop)
- External API calls (Plaid SDK) should be dispatched via `asyncio.to_thread()` since the Plaid SDK is synchronous
- Where multiple independent external calls are needed (e.g. syncing transactions for N items), use `asyncio.gather()` to parallelize — not sequential `await` in a loop
- Set reasonable timeouts on all external calls — never use infinite timeout
- DB session lifecycle: one session per request via `Depends(get_db)` — never share sessions across requests or create global sessions

### 9. Audit Logging

- Every endpoint must log access via `log_data_access(user_id, resource)` for reads or `log_security_event()` for sensitive operations
- Enrollment: log user ID + account count (never the token)
- Auth: log success with user ID, failure with reason + IP (never the token)
- Category updates: log user ID + transaction ID + new category (never the old category — it might contain user-entered sensitive data depending on future features)
- Request logging middleware: log method, path, status, duration, user ID, IP for every request
- Verify the audit logger has at least one handler configured — logs must not be silently dropped
- Log format must be structured and parseable (key=value pairs or JSON) — not free-form prose
- **Never log at DEBUG level in production code** — use INFO for normal operations, WARNING for security events, ERROR for failures

---

## P2 — Medium Priority

### 10. Response Schema Consistency

- Every endpoint must declare `response_model` in the decorator — never return untyped dicts
- Response models must use `model_config = ConfigDict(from_attributes=True)` if they might be constructed from ORM objects
- Financial amounts in responses: decide on `str` (preserves precision) or `float` (convenient) and enforce consistently across ALL endpoints — never mix
- Date fields: use ISO 8601 format strings consistently — verify with Pydantic `datetime` or `date` types
- Nullable fields must be explicitly typed as `str | None` with a default of `None` — never use `Optional` (deprecated pattern)
- List endpoints should return typed lists (`list[TransactionResponse]`), not raw `list[dict]`

### 11. Configuration & Environment

- All secrets and environment-specific values must come from `Settings` (pydantic-settings) — never `os.getenv()` directly
- Validate required settings on startup — fail fast with a clear error if `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_KEY`, or `ENCRYPTION_KEY` are missing
- CORS origins must be explicit lists — never `["*"]`
- CORS methods must be explicit — never `["*"]`
- Default values for non-secret settings are fine, but secrets must have no default (force explicit configuration)
- `Settings` should use `env_file=".env"` for local dev — verify it's configured

### 12. CORS & Security Headers

- Verify CORS `allow_origins` does not include `*` — must be explicit frontend URLs
- Verify `allow_methods` is restricted to methods actually used (`GET`, `POST`, `PATCH`, `OPTIONS`)
- Verify `allow_headers` is restricted to headers actually needed (`Authorization`, `Content-Type`)
- Security headers middleware must set: `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`
- Check for missing `Content-Security-Policy` header (even a basic one: `default-src 'self'`)
- Verify no `Access-Control-Allow-Credentials: true` unless explicitly needed

### 13. Dependency Management

- Check `requirements.txt` for pinned versions (e.g. `fastapi==0.110.0`, not just `fastapi`)
- Flag any dependency without a version pin
- Check for known vulnerable versions — run `pip audit` if available, or check against recent CVE databases
- Remove unused dependencies
- Verify `cryptography` package is used for encryption (not a hand-rolled implementation)

---

## P3 — Maintenance

### 14. Code Organization

- No file over ~200 lines — extract if growing
- Utility functions must be in `utils/`, not inline in services or routers
- Shared constants (rate limit values, etc.) should be defined once and imported — not duplicated
- `__init__.py` barrel exports for `models/`, `schemas/`, `services/` — keep them up to date
- Migration files should have descriptive names — not auto-generated hashes only

### 15. Type Hints & Documentation

- **All function signatures must have type hints** — parameters and return types
- Use modern syntax: `str | None` not `Optional[str]`, `list[str]` not `List[str]`
- Service functions should have a one-line docstring explaining what they do (not how)
- No `Any` type hints unless genuinely unavoidable (e.g. raw JSON from external API) — add a comment explaining why

### 16. Dead Code & Imports

- Remove unused imports (run `ruff check --select F401` mentally or via tool)
- Remove unused functions, variables, and commented-out code
- Remove unused model fields or schema fields
- Check for unreachable code paths (e.g. code after `raise` or `return`)

### 17. Alembic Migrations

- Verify all model changes have corresponding migrations — run `alembic check` if available
- Migration files must be idempotent where possible — use `IF NOT EXISTS` for index creation
- Down migrations (`downgrade`) should be implemented — not left as `pass`
- Verify the migration chain is linear — no forks or conflicts in the `versions/` directory

---

## Process

1. **Identify scope** — determine which backend files to review
2. **Read each file** — understand before changing
3. **Fix by priority** — P0 first (auth, secrets, injection, rate limiting), then P1, P2, P3
4. **Verify after changes** — ensure imports are correct, no circular dependencies introduced
5. **Summarize changes** — brief summary organized by priority level of what was found and fixed

## Rules

- Follow existing codebase patterns from CLAUDE.md — don't invent new structures
- Don't add features, docstrings, or type annotations to code you didn't change
- Comments explain WHY, not WHAT
- Prefer readable functions with clear names over clever one-liners
- When extracting, update all import paths across the codebase
- If unsure whether something is intentional, ask before removing
- **Never disable or weaken security controls** — even temporarily
- **Never create test bypass flags** for auth or encryption
