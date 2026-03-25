"""Structured audit logging for security-sensitive operations.

All log entries include user_id, action, and timestamp. Sensitive values
(tokens, passwords) are NEVER logged.
"""

import logging
import time
from collections.abc import Awaitable, Callable
from typing import Any

from fastapi import Request, Response

logger = logging.getLogger("ledgerwise.audit")
logger.setLevel(logging.INFO)

# Ensure at least one handler exists so logs aren't silently dropped
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(
        logging.Formatter("%(asctime)s %(levelname)s %(name)s — %(message)s")
    )
    logger.addHandler(handler)


def log_auth_success(user_id: str) -> None:
    logger.info("AUTH_SUCCESS user=%s", user_id)


def log_auth_failure(reason: str, *, ip: str = "") -> None:
    logger.warning("AUTH_FAILURE reason=%s ip=%s", reason, ip)


def log_enrollment(user_id: str, account_count: int) -> None:
    logger.info("ENROLL user=%s accounts=%d", user_id, account_count)


def log_data_access(user_id: str, resource: str) -> None:
    logger.info("DATA_ACCESS user=%s resource=%s", user_id, resource)


def log_security_event(event: str, details: dict[str, Any] | None = None) -> None:
    logger.warning("SECURITY_EVENT event=%s details=%s", event, details or {})


async def audit_logging_middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    """Log every request with method, path, status, and duration."""
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000

    # Extract user_id from request state if auth middleware set it
    user_id = getattr(request.state, "user_id", "anonymous")

    logger.info(
        "REQUEST method=%s path=%s status=%d duration_ms=%.1f user=%s ip=%s",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
        user_id,
        request.client.host if request.client else "unknown",
    )
    return response
