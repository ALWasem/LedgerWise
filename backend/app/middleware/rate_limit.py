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

SENSITIVE_PATHS = {"/api/v1/teller/enroll"}

# In-memory stores — keyed by (ip,) or (ip, path)
_global_hits: dict[str, list[float]] = defaultdict(list)
_sensitive_hits: dict[str, list[float]] = defaultdict(list)


def _prune(hits: list[float], window: float, now: float) -> list[float]:
    cutoff = now - window
    return [t for t in hits if t > cutoff]


async def rate_limit_middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()

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

    # --- sensitive endpoint per-IP check ---
    path = request.url.path
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

    return await call_next(request)
