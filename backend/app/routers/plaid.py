import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from plaid.exceptions import ApiException
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.middleware.auth import get_current_user_id
from app.schemas.billing import WebhookResponse
from app.schemas.transaction import (
    BackfillResponse,
    ExchangeTokenResponse,
    LinkTokenCreateRequest,
    LinkTokenResponse,
    PlaidItemResponse,
    PublicTokenRequest,
    SyncResponse,
)
from app.services import plaid as plaid_service
from app.utils.logging import log_data_access, log_security_event

logger = logging.getLogger("ledgerwise.audit")

router = APIRouter(prefix="/plaid", tags=["plaid"])


@router.post("/create-link-token", response_model=LinkTokenResponse)
async def create_link_token(
    body: LinkTokenCreateRequest | None = None,
    user_id: str = Depends(get_current_user_id),
) -> LinkTokenResponse:
    """Create a Plaid Link token for the frontend widget.

    When ``received_redirect_uri`` is provided, creates a token for
    OAuth re-initialization (user returning from bank OAuth flow).
    """
    received_redirect_uri = body.received_redirect_uri if body else None
    log_data_access(user_id, "plaid_link_token_create")
    try:
        link_token = await plaid_service.create_link_token(
            user_id, received_redirect_uri=received_redirect_uri
        )
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


@router.post("/sync", response_model=SyncResponse)
async def sync_transactions(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> SyncResponse:
    """Re-sync transactions for all linked Plaid items."""
    log_data_access(user_id, "plaid_sync_all")
    try:
        total = await plaid_service.sync_all_items(db, user_id)
    except Exception:
        logger.error("Unexpected error during sync for user=%s", user_id, exc_info=True)
        raise HTTPException(status_code=500, detail="Transaction sync failed.")
    return SyncResponse(synced=total)


@router.post("/sync/{item_id}", response_model=SyncResponse)
async def sync_item_transactions(
    item_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> SyncResponse:
    """Re-sync transactions for a single Plaid item."""
    log_data_access(user_id, f"plaid_sync_item:{item_id}")
    try:
        total = await plaid_service.sync_single_item(db, user_id, item_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Linked account not found.")
    except Exception:
        logger.error(
            "Unexpected error during item sync for user=%s item=%s",
            user_id, item_id, exc_info=True,
        )
        raise HTTPException(status_code=500, detail="Transaction sync failed.")
    return SyncResponse(synced=total)


@router.post("/backfill", response_model=BackfillResponse)
async def backfill_transactions(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> BackfillResponse:
    """Full historical pull via /transactions/get for all linked Plaid items."""
    log_data_access(user_id, "plaid_backfill_all")
    try:
        total = await plaid_service.backfill_all_items(db, user_id)
    except Exception:
        logger.error("Unexpected error during backfill for user=%s", user_id, exc_info=True)
        raise HTTPException(status_code=500, detail="Transaction backfill failed.")
    return BackfillResponse(fetched=total)


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


# Webhook codes that should trigger a transaction sync
_SYNC_CODES = {
    "SYNC_UPDATES_AVAILABLE",
    "INITIAL_UPDATE",
    "HISTORICAL_UPDATE",
    "DEFAULT_UPDATE",
}


@router.post("/webhook", response_model=WebhookResponse)
async def plaid_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> WebhookResponse:
    """Handle Plaid webhook events. No auth — verified via Plaid JWT signature."""
    body = await request.body()
    verification_token = request.headers.get("plaid-verification", "")

    if not verification_token:
        logger.warning("PLAID_WEBHOOK missing Plaid-Verification header")
        raise HTTPException(status_code=400, detail="Missing verification header.")

    try:
        payload = await plaid_service.verify_plaid_webhook_token(
            verification_token, body
        )
    except ValueError as exc:
        logger.warning("PLAID_WEBHOOK verification failed: %s", exc)
        raise HTTPException(status_code=400, detail="Invalid webhook signature.")

    webhook_type = payload.get("webhook_type", "")
    webhook_code = payload.get("webhook_code", "")
    item_id = payload.get("item_id", "")

    log_security_event(
        "plaid_webhook",
        {"type": webhook_type, "code": webhook_code, "item_id": item_id},
    )

    if webhook_type == "TRANSACTIONS" and webhook_code in _SYNC_CODES:
        try:
            synced = await plaid_service.handle_transactions_webhook(
                db, item_id, webhook_code
            )
            logger.info(
                "PLAID_WEBHOOK processed type=%s code=%s item=%s synced=%d",
                webhook_type,
                webhook_code,
                item_id,
                synced,
            )
        except Exception:
            logger.error(
                "PLAID_WEBHOOK handler failed type=%s code=%s item=%s",
                webhook_type,
                webhook_code,
                item_id,
                exc_info=True,
            )

    return WebhookResponse(status="ok")
