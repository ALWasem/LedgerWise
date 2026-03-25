"""Spending summary endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.middleware.auth import get_current_user_id
from app.schemas import SpendingSummaryResponse
from app.services import spending as spending_service
from app.utils.logging import log_data_access

router = APIRouter(prefix="/spending", tags=["spending"])


@router.get("/summary", response_model=SpendingSummaryResponse)
async def spending_summary(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> SpendingSummaryResponse:
    log_data_access(user_id, "spending_summary")
    return await spending_service.get_spending_summary(db, user_id)
