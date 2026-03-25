from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.middleware.auth import get_current_user_id
from app.middleware.rate_limit import rate_limit_middleware
from app.routers import spending, teller
from app.utils.logging import audit_logging_middleware

app = FastAPI(title="LedgerWise API", version="0.1.0")

# --- Middleware (order matters: last added = first executed) ---

# 1. CORS — restrict to known frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# 2. Rate limiting (per-IP + stricter on sensitive endpoints)
app.middleware("http")(rate_limit_middleware)

# 3. Audit logging (method, path, status, duration, user)
app.middleware("http")(audit_logging_middleware)

app.include_router(teller.router, prefix="/api/v1")
app.include_router(spending.router, prefix="/api/v1")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/v1/me")
async def me(user_id: str = Depends(get_current_user_id)) -> dict:
    return {"user_id": user_id}
