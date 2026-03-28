"""Spending summary endpoints."""

from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.middleware.auth import get_current_user_id
from app.schemas import SpendingSummaryResponse
from app.services import spending as spending_service
from app.utils.logging import log_data_access

router = APIRouter(prefix="/spending", tags=["spending"])


@router.get("/summary", response_model=SpendingSummaryResponse)
async def spending_summary(
    start_date: date | None = Query(None, description="Filter from this date (inclusive)"),
    end_date: date | None = Query(None, description="Filter up to this date (inclusive)"),
    account_type: str | None = Query(None, description="Filter by account type (e.g. credit)"),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> SpendingSummaryResponse:
    log_data_access(user_id, "spending_summary")
    return await spending_service.get_spending_summary(
        db, user_id, start_date, end_date, account_type
    )
