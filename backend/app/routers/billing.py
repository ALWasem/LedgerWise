import logging

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.middleware.auth import get_current_user_id
from app.schemas.billing import CheckoutRequest, CheckoutResponse, WebhookResponse
from app.services.billing import (
    ALLOWED_PRICE_IDS,
    create_checkout_session,
    handle_dispute_created,
    handle_invoice_payment_failed,
    handle_subscription_created,
    handle_subscription_deleted,
    handle_subscription_updated,
    reconcile_subscriptions,
    verify_webhook_signature,
)
from app.utils.logging import log_data_access, log_security_event

logger = logging.getLogger("ledgerwise.audit")

router = APIRouter(prefix="/billing", tags=["billing"])

# In-memory set of processed Stripe event IDs (dedup within process lifetime).
# For multi-instance deployments, migrate to a database table or Redis.
_processed_event_ids: set[str] = set()
_MAX_PROCESSED_EVENTS = 10_000


@router.post("/create-checkout-session", response_model=CheckoutResponse)
async def create_checkout_session_endpoint(
    body: CheckoutRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> CheckoutResponse:
    """Create a Stripe Checkout session for a subscription."""
    if body.price_id not in ALLOWED_PRICE_IDS:
        raise HTTPException(status_code=400, detail="Invalid price selected.")

    log_data_access(user_id, "billing_checkout_create")

    try:
        checkout_url = await create_checkout_session(user_id, body.price_id, db)
    except LookupError:
        raise HTTPException(status_code=404, detail="User not found.")
    except stripe.StripeError:
        logger.error(
            "Stripe checkout session creation failed for user=%s",
            user_id,
            exc_info=True,
        )
        raise HTTPException(
            status_code=502,
            detail="Failed to create checkout session. Please try again later.",
        )
    except Exception:
        logger.error(
            "Unexpected error creating checkout session for user=%s",
            user_id,
            exc_info=True,
        )
        raise HTTPException(
            status_code=500,
            detail="Failed to create checkout session. Please try again later.",
        )

    return CheckoutResponse(checkout_url=checkout_url)


# Event types we handle — ignore anything else
_HANDLED_EVENTS = {
    "customer.subscription.created",
    "customer.subscription.deleted",
    "customer.subscription.updated",
    "charge.dispute.created",
    "invoice.payment_failed",
}


@router.post("/webhook", response_model=WebhookResponse)
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> WebhookResponse:
    """Handle Stripe webhook events. No auth — verified via webhook signature."""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = verify_webhook_signature(payload, sig_header)
    except ValueError:
        logger.warning("STRIPE_WEBHOOK invalid payload")
        raise HTTPException(status_code=400, detail="Invalid payload.")
    except stripe.SignatureVerificationError:
        logger.warning("STRIPE_WEBHOOK invalid signature")
        raise HTTPException(status_code=400, detail="Invalid signature.")

    event_id = event["id"]
    event_type = event["type"]
    log_security_event("stripe_webhook", {"type": event_type, "id": event_id})

    # Dedup: skip already-processed events (Stripe retries on failure)
    if event_id in _processed_event_ids:
        logger.info("STRIPE_WEBHOOK skipping duplicate event_id=%s", event_id)
        return WebhookResponse(status="ok")

    data_object = event["data"]["object"]

    if event_type == "customer.subscription.created":
        await handle_subscription_created(db, data_object)
    elif event_type == "customer.subscription.deleted":
        await handle_subscription_deleted(db, data_object)
    elif event_type == "customer.subscription.updated":
        await handle_subscription_updated(db, data_object)
    elif event_type == "charge.dispute.created":
        await handle_dispute_created(db, data_object)
    elif event_type == "invoice.payment_failed":
        await handle_invoice_payment_failed(db, data_object)

    # Mark as processed after successful handling
    _processed_event_ids.add(event_id)
    # Evict oldest entries if set grows too large
    if len(_processed_event_ids) > _MAX_PROCESSED_EVENTS:
        # Remove roughly half the entries (oldest aren't trackable in a set,
        # but clearing half prevents unbounded growth)
        to_remove = len(_processed_event_ids) - _MAX_PROCESSED_EVENTS // 2
        for _ in range(to_remove):
            _processed_event_ids.pop()

    return WebhookResponse(status="ok")


@router.post("/reconcile", response_model=dict)
async def reconcile_endpoint(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Admin endpoint: reconcile local is_pro flags against Stripe subscriptions.

    Requires authentication. In production, restrict to admin users.
    """
    log_security_event("stripe_reconciliation_triggered", {"triggered_by": user_id})

    try:
        result = await reconcile_subscriptions(db)
    except Exception:
        logger.error("Subscription reconciliation failed", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Reconciliation failed. Check server logs.",
        )

    return result
