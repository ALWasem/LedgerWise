"""Spending summary endpoints."""

import logging
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.middleware.auth import get_current_user_id, require_pro_user
from app.schemas import SpendingSummaryResponse
from app.services import spending as spending_service
from app.utils.logging import log_data_access

logger = logging.getLogger("ledgerwise.audit")

router = APIRouter(prefix="/spending", tags=["spending"])


@router.get("/summary", response_model=SpendingSummaryResponse)
async def spending_summary(
    start_date: date | None = Query(None, description="Filter from this date (inclusive)"),
    end_date: date | None = Query(None, description="Filter up to this date (inclusive)"),
    account_type: str | None = Query(None, max_length=50, pattern=r"^[a-zA-Z_]+$", description="Filter by account type (e.g. credit)"),
    user_id: str = Depends(require_pro_user),
    db: AsyncSession = Depends(get_db),
) -> SpendingSummaryResponse:
    log_data_access(user_id, "spending_summary")
    try:
        return await spending_service.get_spending_summary(
            db, user_id, start_date, end_date, account_type
        )
    except Exception:
        logger.error("Failed to compute spending summary for user=%s", user_id, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve spending summary.")
