---
name: cleanup-be
description: Post-feature backend cleanup — enforce CLAUDE.md layering, SQLAlchemy best practices, API correctness, fintech data-precision rules, performance optimization, and Plaid integration correctness. Security concerns are handled by the security-audit skill.
disable-model-invocation: true
argument-hint: [scope e.g. app/services/plaid.py, or blank for changed files]
allowed-tools: Bash Grep Read Edit Glob Agent
effort: max
---

# Post-Feature Backend Cleanup

Clean up backend code after a feature push. Enforces CLAUDE.md project conventions AND industry best practices for a FastAPI fintech backend handling real bank account data.

**Scope:** If `$ARGUMENTS` is provided, focus on those paths under `backend/`. Otherwise, detect changed backend files by running `git diff --name-only main...HEAD -- backend/`. If on `main`, default to `git diff --name-only HEAD~1 -- backend/` (last commit only) and suggest the user pass an explicit scope via `$ARGUMENTS` if they want a wider sweep.

Work through each section in order. For every issue found, fix it — don't just report it.

> **Security scope:** Deep security review (auth, IDOR, token encryption, RLS, Stripe webhook integrity, etc.) is handled by the `security-audit` skill. This skill covers only the lightweight security sanity checks that are cheap to verify during routine cleanup. For anything beyond the basics here, run `security-audit`.

---

## P0 — Critical (always fix)

### 1. Security Sanity Checks (lightweight only)

These are cheap, grep-able checks worth doing on every cleanup pass. For a full security review, run the `security-audit` skill instead.

- No `print()` statements anywhere in `backend/app/` — use structured logging
- No raw exception strings in client-facing responses — grep for `detail=str(e)`, `detail=str(exc)`, `HTTPException(..., detail=str(`
- No obvious secret leakage in logs — grep for `logger.*token`, `logger.*secret`, `logger.*key`, `console.log.*token`
- No f-string SQL — grep for `execute(f"`, `text(f"`, `.format(` in any `execute()` or `text()` call
- Every new router endpoint in the diff uses `Depends(get_current_user_id)` unless it's explicitly public (health, webhooks) — if public, flag for `security-audit` follow-up
- Every new request body has a Pydantic schema (no raw `dict` or `Any` as the body type)

If anything in this section fails, fix it AND recommend running `security-audit` before the next release.

---

## P1 — High Priority

### 2. API Layering (Router -> Service -> Model)

- **Routers** handle HTTP concerns ONLY: parse request, call service, format response, map exceptions to HTTP status codes
- **Services** contain business logic, external API calls, data orchestration — never import `HTTPException` or `status` from FastAPI
- **Models** are pure table definitions — no query logic, no business logic, no validation
- **Schemas** handle validation (Pydantic) — one file per domain, shared via barrel export in `schemas/__init__.py`
- No service function should return an HTTP response or status code — return data or raise domain exceptions
- Routers should not contain raw SQLAlchemy queries — all DB access goes through services
- Check for circular imports between layers

### 3. Error Handling

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

### 4. Database Best Practices

- **All DB operations must be async** — `async def` + `await db.execute()`, never synchronous calls
- Use `expire_on_commit=False` on session factory to prevent lazy-load issues after commit (verify in `dependencies.py`)
- Verify `joinedload()` or `selectinload()` is used where relationships are accessed — prevent N+1 query patterns
- Write operations (`INSERT`, `UPDATE`) must be wrapped in an explicit transaction scope — verify `await db.commit()` is called and `await db.rollback()` on failure
- Upsert operations (`ON CONFLICT DO UPDATE`) must specify the correct constraint name and update only the fields that should change
- Verify all ForeignKey definitions include an explicit `ondelete` behavior (`CASCADE`, `RESTRICT`, or `SET NULL`) matching the semantic intent — never leave it as the default. For LedgerWise: `PlaidItem → Account → Transaction` typically CASCADE since disconnecting an Item should remove its accounts and transactions, but audit each relationship against the intended lifecycle before assuming CASCADE.
- Check for missing indexes on frequently filtered columns (`user_id`, `account_id`, `plaid_transaction_id`, `date`)
- Never use `db.execute(text("DROP ..."))` or `db.execute(text("TRUNCATE ..."))` outside of migrations
- Verify `statement_cache_size=0` is set if using Supabase transaction pooler (pgbouncer compatibility)

### 5. Async & Concurrency

- Every route handler must be `async def` — never `def` (blocks the event loop)
- External API calls (Plaid SDK) should be dispatched via `asyncio.to_thread()` since the Plaid SDK is synchronous
- Where multiple independent external calls are needed (e.g. syncing transactions for N items), use `asyncio.gather()` to parallelize — not sequential `await` in a loop
- Set reasonable timeouts on all external calls — never use infinite timeout
- DB session lifecycle: one session per request via `Depends(get_db)` — never share sessions across requests or create global sessions

### 6. Audit Logging

- Every endpoint must log access via `log_data_access(user_id, resource)` for reads or `log_security_event()` for sensitive operations
- Enrollment: log user ID + account count (never the token)
- Auth: log success with user ID, failure with reason + IP (never the token)
- Category updates: log user ID + transaction ID + new category (never the old category — it might contain user-entered sensitive data depending on future features)
- Request logging middleware: log method, path, status, duration, user ID, IP for every request
- Verify the audit logger has at least one handler configured — logs must not be silently dropped
- Log format must be structured and parseable (key=value pairs or JSON) — not free-form prose
- **Never log at DEBUG level in production code** — use INFO for normal operations, WARNING for security events, ERROR for failures

### 7. Plaid Integration Correctness (non-security)

- The pull-once-then-disconnect architecture must be preserved: after a successful transactions sync, verify the code calls `/item/remove` and the DB row is cleaned up — otherwise ongoing Plaid billing continues ($0.30/Item/month)
- Verify Plaid SDK calls follow the `asyncio.to_thread()` rule from section 5 — any direct SDK call inside an `async def` without the threadpool hop blocks the event loop
- Upsert keys for Plaid data match the documented uniqueness: `(item_id, persistent_account_id)` for accounts, `(plaid_transaction_id, account_id)` for transactions — flag if the ON CONFLICT target differs
- Institution name fetches are best-effort: wrapped in try/except, logged but not fatal — flag if an institution lookup failure would abort the whole enrollment

### 8. Performance & Optimization

Optimization review for every cleanup pass. A fintech backend hit by real users can't afford slow endpoints or unnecessary external calls.

This section assumes section 4 (Database Best Practices) has already passed — its focus is hot-path tuning, unbounded-list issues, and cost optimization, not general correctness. If a query is structurally wrong (missing `selectinload`, missing index on a filter column), that's a section 4 finding. Flag it once, not twice.

**Database performance:**
- N+1 query detection — any relationship access inside a loop must use `selectinload()` or `joinedload()` up front. Grep for `for ... in` followed by attribute access on the loop variable that triggers a lazy load.
- Batch inserts/updates — multiple individual `INSERT` or `UPDATE` statements in a loop should be consolidated into a single bulk operation or `executemany()`. Especially critical for transaction sync where 100+ rows may arrive at once.
- Avoid `SELECT *` patterns — when only a few columns are needed, use `select(Model.col1, Model.col2)` instead of full model loading.
- Verify indexes exist on every column used in `WHERE`, `JOIN`, or `ORDER BY` clauses — flag queries that filter or sort on unindexed columns.
- Pagination on list endpoints — any endpoint that returns a list of user data (transactions, accounts, categories) must support `limit`/`offset` or cursor pagination. Unbounded lists will OOM the backend and the mobile client.
- Avoid `COUNT(*)` on large tables in hot paths — use approximate counts or cached counts where exact precision isn't required.
- Connection pool sizing — verify the SQLAlchemy engine pool size matches Railway's constraints and doesn't exhaust the Supabase connection limit.

**Async & concurrency (optimization angle):**
- Parallelize independent external calls with `asyncio.gather()` — flag sequential `await` loops where each iteration hits a different external API / Plaid item.
- Set explicit timeouts on all outbound HTTP/SDK calls (Plaid, Supabase, Stripe) — unbounded waits cascade into request backlog.
- Short-circuit early — validate cheap conditions (auth, input format, cached state) before expensive DB queries or external calls.

**Caching:**
- Identify repeated reads of rarely-changing data (user categories, merchant rules, Plaid institution metadata) and cache in-memory with a TTL — flag endpoints that re-fetch the same static data on every request.
- Category resolution during transaction sync should use an in-memory lookup, not one query per transaction.
- Never cache per-user data in a global cache without a user_id key — that's a data leak, not an optimization.

**Payload size:**
- Response bodies should not include fields the client doesn't use — review response schemas for fields that are always null, always empty, or never read by the frontend.
- Date range defaults — list endpoints that default to "all transactions ever" are an anti-pattern; default to a recent window (e.g. last 90 days) and require the client to opt into more.
- Compress large responses — verify `GZip` middleware or Railway-level compression is active for responses over ~1KB.

**Plaid-specific optimization:**
- Transactions sync uses cursor-based incremental sync (`transactions_sync`), not full re-fetch — flag any use of `transactions_get` in a cron or scheduled path.
- The pull-once-then-disconnect flow (see Plaid Correctness section) is itself the #1 cost optimization — never leave Items connected after a successful sync.
- Batch Plaid institution lookups where possible — institution metadata is stable, cache it.

**Measurement:**
- Any endpoint touched in this cleanup pass that lacks request duration logging should have it added (already part of `audit_logging_middleware`, but verify the path isn't bypassing middleware).
- Flag any endpoint with obvious hot-path cost (multiple external calls, large query results) that doesn't have a comment documenting the expected latency budget.

Do NOT optimize prematurely. Only flag and fix where:
- The code is on a user-facing hot path (dashboard, transaction list, enrollment)
- The cost is concrete (N+1 measured or obvious from code shape, unbounded list, missing index on a filter column)
- The fix is low-risk and doesn't rearchitect the function

---

## P2 — Medium Priority

### 9. Response Schema Consistency

- Every endpoint must declare `response_model` in the decorator — never return untyped dicts
- Response models must use `model_config = ConfigDict(from_attributes=True)` if they might be constructed from ORM objects
- Financial amounts in responses must be serialized as strings (preserving Decimal precision) or use Pydantic's `Decimal` type — never plain `float`. Floating-point arithmetic on money causes rounding bugs. Enforce consistently across ALL endpoints.
- Date fields: use ISO 8601 format strings consistently — verify with Pydantic `datetime` or `date` types
- Nullable fields must be explicitly typed as `str | None` with a default of `None` — never use `Optional` (deprecated pattern)
- List endpoints should return typed lists (`list[TransactionResponse]`), not raw `list[dict]`

### 10. Configuration & Environment

- All secrets and environment-specific values must come from `Settings` (pydantic-settings) — never `os.getenv()` directly
- Validate required settings on startup — fail fast with a clear error if `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_KEY`, or `ENCRYPTION_KEY` are missing
- CORS origins must be explicit lists — never `["*"]`
- CORS methods must be explicit — never `["*"]`
- Default values for non-secret settings are fine, but secrets must have no default (force explicit configuration)
- `Settings` should use `env_file=".env"` for local dev — verify it's configured

### 11. Dependency Management

- Check `requirements.txt` for pinned versions (e.g. `fastapi==0.110.0`, not just `fastapi`)
- Flag any dependency without a version pin
- Remove unused dependencies

---

## P3 — Maintenance

### 12. Code Organization

- No file over ~200 lines — extract if growing
- Utility functions must be in `utils/`, not inline in services or routers
- Shared constants (rate limit values, etc.) should be defined once and imported — not duplicated
- `__init__.py` barrel exports for `models/`, `schemas/`, `services/` — keep them up to date
- Migration files should have descriptive names — not auto-generated hashes only

### 13. Type Hints & Documentation

- **All function signatures must have type hints** — parameters and return types
- Use modern syntax: `str | None` not `Optional[str]`, `list[str]` not `List[str]`
- Service functions should have a one-line docstring explaining what they do (not how)
- No `Any` type hints unless genuinely unavoidable (e.g. raw JSON from external API) — add a comment explaining why

### 14. Dead Code & Imports

- Remove unused imports (run `ruff check --select F401` mentally or via tool)
- Remove unused functions, variables, and commented-out code
- Remove unused model fields or schema fields
- Check for unreachable code paths (e.g. code after `raise` or `return`)

### 15. Alembic Migrations

- Verify all model changes have corresponding migrations — run `alembic check` if available
- Migration files must be idempotent where possible — use `IF NOT EXISTS` for index creation
- Down migrations (`downgrade`) should be implemented — not left as `pass`
- Verify the migration chain is linear — no forks or conflicts in the `versions/` directory

---

## Process

1. **Identify scope** — determine which backend files to review
2. **Read each file** — understand before changing
3. **Fix by priority** — P0 first (security sanity), then P1, P2, P3
4. **Verify after changes** — ensure imports are correct, no circular dependencies introduced
5. **Summarize changes** — brief summary organized by priority level of what was found and fixed

## Rules

- Follow existing codebase patterns from CLAUDE.md — don't invent new structures
- Don't add features, docstrings, or type annotations to code you didn't change, UNLESS the addition is trivial (one line, no behavior change) and directly adjacent to code you're already editing
- Comments explain WHY, not WHAT
- Prefer readable functions with clear names over clever one-liners
- When extracting, update all import paths across the codebase
- If unsure whether something is intentional, ask before removing
- **Never disable or weaken security controls** — even temporarily
- **Never create test bypass flags** for auth or encryption
