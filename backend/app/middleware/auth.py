from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt
from jwt import PyJWKClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.utils.logging import log_auth_failure, log_auth_success

bearer_scheme = HTTPBearer()

# JWKS client caches keys automatically
_jwks_client = PyJWKClient(f"{settings.supabase_url}/auth/v1/.well-known/jwks.json")

# Expected JWT issuer — must match your Supabase project
_expected_issuer = f"{settings.supabase_url}/auth/v1"


async def get_current_user_id(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> str:
    """Extract and verify the Supabase JWT, returning the user ID."""
    token = credentials.credentials
    client_ip = request.client.host if request.client else "unknown"

    try:
        signing_key = _jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256"],
            audience="authenticated",
            issuer=_expected_issuer,
        )
    except jwt.ExpiredSignatureError:
        log_auth_failure("expired_token", ip=client_ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
    except jwt.InvalidTokenError:
        log_auth_failure("invalid_token", ip=client_ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    user_id: str | None = payload.get("sub")
    if not user_id:
        log_auth_failure("missing_subject", ip=client_ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    # Store user_id on request state for audit logging middleware
    request.state.user_id = user_id
    log_auth_success(user_id)
    return user_id


async def require_pro_user(
    user_id: str = Depends(get_current_user_id),
) -> str:
    """Verify the authenticated user has an active Pro subscription.

    Raises 403 if not Pro. Uses its own DB session to avoid adding a
    ``db`` parameter that would conflict with endpoint signatures.
    """
    from app.dependencies import async_session
    from app.models.user import User

    async with async_session() as session:
        result = await session.execute(
            select(User.is_pro).where(User.id == user_id)
        )
        is_pro = result.scalar()

    if not is_pro:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Pro subscription required.",
        )
    return user_id
