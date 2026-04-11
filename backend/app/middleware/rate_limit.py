"""In-memory sliding-window rate limiter.

Applies per-IP limits globally and stricter per-user limits on sensitive
endpoints. Replace the in-memory store with Redis (Upstash) when available.
"""

import time
from collections import defaultdict
from collections.abc import Awaitable, Callable

from fastapi import Request, Response
from fastapi.responses import JSONResponse

# window_seconds: length of sliding window, max_requests: allowed per window
GLOBAL_RATE_LIMIT = {"window_seconds": 60, "max_requests": 60}
SENSITIVE_RATE_LIMIT = {"window_seconds": 60, "max_requests": 5}
DATA_RATE_LIMIT = {"window_seconds": 60, "max_requests": 30}

SENSITIVE_PATHS = {"/api/v1/teller/enroll", "/api/v1/plaid/exchange-token", "/api/v1/merchant-rules/"}
DATA_PATHS = {
    "/api/v1/teller/accounts",
    "/api/v1/teller/transactions",
    "/api/v1/spending/summary",
    "/api/v1/plaid/items",
    "/api/v1/plaid/create-link-token",
    "/api/v1/categories",
    "/api/v1/categories/",
}
# Paths where rate limiting applies to any sub-path (e.g. /categories/{id})
DATA_PATH_PREFIXES = ("/api/v1/categories/", "/api/v1/merchant-rules/preview/")

# Max unique keys per store before forced eviction (prevents unbounded growth)
_MAX_KEYS = 10_000
# Cleanup stale entries every N requests
_CLEANUP_INTERVAL = 500
_request_counter = 0

# In-memory stores — keyed by (ip,) or (ip, path)
_global_hits: dict[str, list[float]] = defaultdict(list)
_sensitive_hits: dict[str, list[float]] = defaultdict(list)
_data_hits: dict[str, list[float]] = defaultdict(list)


def _prune(hits: list[float], window: float, now: float) -> list[float]:
    cutoff = now - window
    return [t for t in hits if t > cutoff]


def _cleanup_stale_entries(now: float) -> None:
    """Remove keys with no recent hits to prevent unbounded memory growth."""
    max_window = max(
        GLOBAL_RATE_LIMIT["window_seconds"],
        SENSITIVE_RATE_LIMIT["window_seconds"],
        DATA_RATE_LIMIT["window_seconds"],
    )
    for store in (_global_hits, _sensitive_hits, _data_hits):
        stale_keys = [k for k, v in store.items() if not v or v[-1] < now - max_window]
        for k in stale_keys:
            del store[k]
        # Hard cap: if store still exceeds max keys, evict oldest entries
        if len(store) > _MAX_KEYS:
            sorted_keys = sorted(store, key=lambda k: store[k][-1] if store[k] else 0)
            for k in sorted_keys[: len(store) - _MAX_KEYS]:
                del store[k]


async def rate_limit_middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    global _request_counter
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()

    # Periodic cleanup of stale entries
    _request_counter += 1
    if _request_counter >= _CLEANUP_INTERVAL:
        _request_counter = 0
        _cleanup_stale_entries(now)

    # --- global per-IP check ---
    gw = GLOBAL_RATE_LIMIT["window_seconds"]
    gmax = GLOBAL_RATE_LIMIT["max_requests"]
    _global_hits[client_ip] = _prune(_global_hits[client_ip], gw, now)
    if len(_global_hits[client_ip]) >= gmax:
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests. Please try again later."},
        )
    _global_hits[client_ip].append(now)

    # --- per-endpoint rate checks ---
    path = request.url.path
    is_data_path = path in DATA_PATHS or path.startswith(DATA_PATH_PREFIXES)
    if path in SENSITIVE_PATHS:
        sw = SENSITIVE_RATE_LIMIT["window_seconds"]
        smax = SENSITIVE_RATE_LIMIT["max_requests"]
        key = f"{client_ip}:{path}"
        _sensitive_hits[key] = _prune(_sensitive_hits[key], sw, now)
        if len(_sensitive_hits[key]) >= smax:
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded for this action. Please wait."},
            )
        _sensitive_hits[key].append(now)
    elif is_data_path:
        dw = DATA_RATE_LIMIT["window_seconds"]
        dmax = DATA_RATE_LIMIT["max_requests"]
        key = f"{client_ip}:{path}"
        _data_hits[key] = _prune(_data_hits[key], dw, now)
        if len(_data_hits[key]) >= dmax:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please try again later."},
            )
        _data_hits[key].append(now)

    return await call_next(request)
