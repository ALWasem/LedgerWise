import logging
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.middleware.auth import get_current_user_id, require_pro_user
from app.schemas import AccountResponse, CategoryUpdateRequest, TransactionResponse
from app.services import banking as banking_service
from app.services import merchant_rule as merchant_rule_service
from app.utils.logging import log_data_access
from app.utils.validation import TRANSACTION_ID_PATTERN

logger = logging.getLogger("ledgerwise.audit")

router = APIRouter(prefix="/banking", tags=["banking"])


@router.get("/accounts", response_model=list[AccountResponse])
async def get_my_accounts(
    account_type: str | None = Query(None, max_length=50, pattern=r"^[a-zA-Z_]+$", description="Filter by account type (e.g. credit)"),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> list[AccountResponse]:
    """Return all bank accounts linked to the authenticated user."""
    log_data_access(user_id, "accounts")
    try:
        accounts = await banking_service.get_user_accounts(db, user_id, account_type)
    except Exception:
        logger.error("Failed to fetch accounts for user=%s", user_id, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve accounts.")
    return [
        AccountResponse(
            id=str(acct.id),
            provider=acct.provider,
            institution_name=acct.institution_name,
            account_name=acct.account_name,
            account_type=acct.account_type,
            account_subtype=acct.account_subtype,
            balance_current=float(acct.balance_current) if acct.balance_current is not None else None,
            balance_limit=float(acct.balance_limit) if acct.balance_limit is not None else None,
            item_id=acct.item_id,
            persistent_account_id=acct.persistent_account_id,
            created_at=acct.created_at,
        )
        for acct in accounts
    ]


@router.get("/transactions", response_model=list[TransactionResponse])
async def get_my_transactions(
    start_date: date | None = Query(None, description="Filter from this date (inclusive)"),
    end_date: date | None = Query(None, description="Filter up to this date (inclusive)"),
    account_type: str | None = Query(None, max_length=50, pattern=r"^[a-zA-Z_]+$", description="Filter by account type (e.g. credit)"),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> list[TransactionResponse]:
    """Return transactions for the authenticated user's accounts."""
    log_data_access(user_id, "transactions")
    try:
        return await banking_service.get_user_transactions(
            db, user_id, start_date, end_date, account_type
        )
    except Exception:
        logger.error("Failed to fetch transactions for user=%s", user_id, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve transactions.")


@router.patch("/transactions/{transaction_id}/category", response_model=TransactionResponse)
async def update_category(
    transaction_id: str = Path(..., max_length=255, description="Provider transaction ID"),
    body: CategoryUpdateRequest = ...,
    user_id: str = Depends(require_pro_user),
    db: AsyncSession = Depends(get_db),
) -> TransactionResponse:
    """Update the category of a single transaction."""
    if not TRANSACTION_ID_PATTERN.match(transaction_id):
        raise HTTPException(status_code=400, detail="Invalid transaction ID format.")
    log_data_access(user_id, f"transaction_category_update:{transaction_id}")
    try:
        result = await banking_service.update_transaction_category(
            db, user_id, transaction_id, body.category
        )
    except Exception:
        logger.error(
            "Failed to update category for user=%s transaction=%s",
            user_id,
            transaction_id,
            exc_info=True,
        )
        raise HTTPException(status_code=500, detail="Failed to update transaction category.")
    if result is None:
        raise HTTPException(status_code=404, detail="Transaction not found.")
    # Attach merchant match preview so frontend can prompt batch-apply
    try:
        preview = await merchant_rule_service.preview_merchant_match(
            db, user_id, transaction_id
        )
        result.merchant_match = preview
    except Exception:
        logger.warning(
            "Failed to compute merchant match preview for user=%s transaction=%s",
            user_id,
            transaction_id,
            exc_info=True,
        )
    return result
