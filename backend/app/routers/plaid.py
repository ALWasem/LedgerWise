import logging

from fastapi import APIRouter, Depends, HTTPException
from plaid.exceptions import ApiException
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.middleware.auth import get_current_user_id
from app.schemas.transaction import (
    ExchangeTokenResponse,
    LinkTokenResponse,
    PlaidItemResponse,
    PublicTokenRequest,
)
from app.services import plaid as plaid_service
from app.utils.logging import log_data_access, log_security_event

logger = logging.getLogger("ledgerwise.audit")

router = APIRouter(prefix="/plaid", tags=["plaid"])


@router.post("/create-link-token", response_model=LinkTokenResponse)
async def create_link_token(
    user_id: str = Depends(get_current_user_id),
) -> LinkTokenResponse:
    """Create a Plaid Link token for the frontend widget."""
    log_data_access(user_id, "plaid_link_token_create")
    try:
        link_token = await plaid_service.create_link_token(user_id)
    except ApiException:
        logger.error("Plaid link token creation failed for user=%s", user_id, exc_info=True)
        raise HTTPException(
            status_code=502,
            detail="Failed to initialize bank connection. Please try again later.",
        )
    except Exception:
        logger.error("Unexpected error creating link token for user=%s", user_id, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to initialize bank connection. Please try again later.",
        )
    return LinkTokenResponse(link_token=link_token)


@router.post("/exchange-token", response_model=ExchangeTokenResponse)
async def exchange_token(
    body: PublicTokenRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> ExchangeTokenResponse:
    """Exchange a Plaid public token, persist item + accounts, and sync transactions."""
    log_security_event("plaid_token_exchange", {"user_id": user_id})
    try:
        plaid_item, accounts = await plaid_service.exchange_public_token(
            db, user_id, body.public_token
        )
    except ApiException:
        logger.warning(
            "Plaid API error during token exchange for user=%s",
            user_id,
            exc_info=True,
        )
        raise HTTPException(
            status_code=502,
            detail="Bank connection failed. Please try again later.",
        )
    except ValueError:
        logger.warning(
            "Invalid data during Plaid token exchange for user=%s",
            user_id,
            exc_info=True,
        )
        raise HTTPException(
            status_code=400,
            detail="Invalid enrollment data.",
        )
    except Exception:
        logger.error(
            "Unexpected error during Plaid token exchange for user=%s",
            user_id,
            exc_info=True,
        )
        raise HTTPException(
            status_code=502,
            detail="Bank connection failed. Please try again later.",
        )
    return ExchangeTokenResponse(item=plaid_item, accounts=accounts)


@router.get("/items", response_model=list[PlaidItemResponse])
async def get_items(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> list[PlaidItemResponse]:
    """Return all Plaid items (linked institutions) for the authenticated user."""
    log_data_access(user_id, "plaid_items")
    try:
        items = await plaid_service.get_user_plaid_items(db, user_id)
    except Exception:
        logger.error("Failed to fetch Plaid items for user=%s", user_id, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve linked institutions.")
    return [
        PlaidItemResponse(
            id=str(item.id),
            item_id=item.item_id,
            institution_id=item.institution_id,
            institution_name=item.institution_name,
            last_synced_at=item.last_synced_at,
            created_at=item.created_at,
        )
        for item in items
    ]
