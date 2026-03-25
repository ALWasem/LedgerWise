import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.middleware.auth import get_current_user_id
from app.schemas import AccountResponse, TokenRequest, TransactionResponse
from app.services import teller as teller_service
from app.utils.logging import log_data_access

logger = logging.getLogger("ledgerwise.audit")

router = APIRouter(prefix="/teller", tags=["teller"])


@router.get("/accounts", response_model=list[AccountResponse])
async def get_my_accounts(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> list[AccountResponse]:
    """Return all bank accounts linked to the authenticated user."""
    log_data_access(user_id, "accounts")
    accounts = await teller_service.get_user_accounts(db, user_id)
    return [
        AccountResponse(
            id=str(acct.id),
            teller_account_id=acct.teller_account_id,
            institution_name=acct.institution_name,
            account_name=acct.account_name,
            account_type=acct.account_type,
            account_subtype=acct.account_subtype,
        )
        for acct in accounts
    ]


@router.get("/transactions", response_model=list[TransactionResponse])
async def get_my_transactions(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> list[TransactionResponse]:
    """Return transactions for the authenticated user's accounts."""
    log_data_access(user_id, "transactions")
    return await teller_service.get_user_transactions(db, user_id)


@router.post("/enroll", response_model=list[AccountResponse])
async def enroll(
    body: TokenRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> list[AccountResponse]:
    """Connect a bank via Teller: pull accounts + transactions and save to DB."""
    try:
        return await teller_service.enroll_accounts(db, user_id, body.access_token)
    except Exception as exc:
        logger.exception("Enrollment failed for user=%s", user_id)
        raise HTTPException(
            status_code=502,
            detail="Bank connection failed. Please try again later.",
        ) from exc
