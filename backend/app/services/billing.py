"""Billing service — Stripe checkout and subscription management."""

import logging
from typing import Any

import stripe
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.user import User
from app.utils.logging import log_security_event

logger = logging.getLogger("ledgerwise.audit")

_stripe_client: stripe.StripeClient | None = None


def _get_stripe_client() -> stripe.StripeClient:
    """Return a lazily-initialized Stripe client. Fails fast if unconfigured."""
    global _stripe_client
    if _stripe_client is None:
        if not settings.stripe_secret_key:
            raise RuntimeError("Stripe is not configured — STRIPE_SECRET_KEY is missing")
        _stripe_client = stripe.StripeClient(settings.stripe_secret_key)
    return _stripe_client


ALLOWED_PRICE_IDS = {
    pid
    for pid in (settings.stripe_price_id_monthly, settings.stripe_price_id_yearly)
    if pid
}


async def create_checkout_session(
    user_id: str, price_id: str, db: AsyncSession
) -> str:
    """Create a Stripe Checkout session and return the checkout URL."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise LookupError("User not found")

    checkout_params: dict[str, Any] = {
        "mode": "subscription",
        "line_items": [{"price": price_id, "quantity": 1}],
        "success_url": f"{settings.frontend_url or settings.cors_origins[0]}/dashboard/settings?billing=success",
        "cancel_url": f"{settings.frontend_url or settings.cors_origins[0]}/dashboard/settings?billing=cancel",
        "subscription_data": {"metadata": {"user_id": user_id}},
        "metadata": {"user_id": user_id},
    }

    if user.stripe_customer_id:
        checkout_params["customer"] = user.stripe_customer_id
    else:
        checkout_params["customer_email"] = user.email

    client = _get_stripe_client()
    session = await client.checkout.sessions.create_async(
        params=checkout_params
    )
    if not session.url:
        raise RuntimeError("Stripe returned a checkout session without a URL")
    return session.url


def verify_webhook_signature(payload: bytes, sig_header: str) -> stripe.Event:
    """Verify Stripe webhook signature and return the parsed event."""
    return stripe.Webhook.construct_event(
        payload, sig_header, settings.stripe_webhook_secret
    )


async def _verify_customer_user_binding(
    db: AsyncSession, user_id: str, customer_id: str, event_name: str
) -> bool:
    """Cross-reference metadata user_id against stored stripe_customer_id.

    Returns True if the binding is valid, False if it should be rejected.
    On first subscription (no stored customer_id yet), allows the binding.
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        logger.warning(
            "STRIPE_WEBHOOK %s user_id=%s not found in database",
            event_name, user_id,
        )
        return False
    if user.stripe_customer_id and user.stripe_customer_id != customer_id:
        logger.warning(
            "STRIPE_WEBHOOK %s user_id/customer_id mismatch: "
            "metadata_user=%s webhook_customer=%s stored_customer=%s",
            event_name, user_id, customer_id, user.stripe_customer_id,
        )
        return False
    return True


async def handle_subscription_created(
    db: AsyncSession, subscription: dict[str, Any]
) -> None:
    """Set is_pro=True and persist stripe_customer_id."""
    user_id = subscription.get("metadata", {}).get("user_id")
    if not user_id:
        logger.warning("STRIPE_WEBHOOK subscription.created missing user_id in metadata")
        return

    customer_id = subscription.get("customer", "")
    if not await _verify_customer_user_binding(
        db, user_id, customer_id, "subscription.created"
    ):
        return

    log_security_event(
        "stripe_subscription_created",
        {"user_id": user_id, "subscription_id": subscription.get("id")},
    )

    try:
        await db.execute(
            update(User)
            .where(User.id == user_id)
            .values(
                is_pro=True,
                stripe_customer_id=customer_id,
                updated_at=func.now(),
            )
        )
        await db.commit()
    except Exception:
        await db.rollback()
        raise


async def handle_subscription_deleted(
    db: AsyncSession, subscription: dict[str, Any]
) -> None:
    """Set is_pro=False when a subscription is canceled/expired."""
    user_id = subscription.get("metadata", {}).get("user_id")
    if not user_id:
        logger.warning("STRIPE_WEBHOOK subscription.deleted missing user_id in metadata")
        return

    customer_id = subscription.get("customer", "")
    if not await _verify_customer_user_binding(
        db, user_id, customer_id, "subscription.deleted"
    ):
        return

    log_security_event(
        "stripe_subscription_deleted",
        {"user_id": user_id, "subscription_id": subscription.get("id")},
    )

    try:
        await db.execute(
            update(User)
            .where(User.id == user_id)
            .values(is_pro=False, updated_at=func.now())
        )
        await db.commit()
    except Exception:
        await db.rollback()
        raise


async def handle_subscription_updated(
    db: AsyncSession, subscription: dict[str, Any]
) -> None:
    """Handle subscription status changes (e.g. past_due, unpaid, canceled)."""
    user_id = subscription.get("metadata", {}).get("user_id")
    if not user_id:
        logger.warning("STRIPE_WEBHOOK subscription.updated missing user_id in metadata")
        return

    customer_id = subscription.get("customer", "")
    if not await _verify_customer_user_binding(
        db, user_id, customer_id, "subscription.updated"
    ):
        return

    status = subscription.get("status", "")
    is_active = status in ("active", "trialing")

    log_security_event(
        "stripe_subscription_updated",
        {
            "user_id": user_id,
            "subscription_id": subscription.get("id"),
            "status": status,
            "is_active": is_active,
        },
    )

    try:
        await db.execute(
            update(User)
            .where(User.id == user_id)
            .values(is_pro=is_active, updated_at=func.now())
        )
        await db.commit()
    except Exception:
        await db.rollback()
        raise


async def handle_dispute_created(
    db: AsyncSession, dispute: dict[str, Any]
) -> None:
    """Immediately revoke Pro on chargeback/dispute."""
    customer_id = dispute.get("customer", "") or ""
    if not customer_id:
        # Try to get customer from the charge
        charge = dispute.get("charge")
        if isinstance(charge, dict):
            customer_id = charge.get("customer", "")

    if not customer_id:
        logger.warning("STRIPE_WEBHOOK charge.dispute.created missing customer_id")
        return

    log_security_event(
        "stripe_dispute_created",
        {"customer_id": customer_id, "dispute_id": dispute.get("id")},
    )

    try:
        result = await db.execute(
            update(User)
            .where(User.stripe_customer_id == customer_id)
            .values(is_pro=False, updated_at=func.now())
        )
        if result.rowcount == 0:
            logger.warning(
                "STRIPE_WEBHOOK charge.dispute.created no user found for customer=%s",
                customer_id,
            )
        await db.commit()
    except Exception:
        await db.rollback()
        raise


async def handle_invoice_payment_failed(
    db: AsyncSession, invoice: dict[str, Any]
) -> None:
    """Downgrade on failed invoice payment (renewal failure)."""
    customer_id = invoice.get("customer", "")
    if not customer_id:
        logger.warning("STRIPE_WEBHOOK invoice.payment_failed missing customer_id")
        return

    # Only downgrade on subscription invoices, not one-off invoices
    if not invoice.get("subscription"):
        return

    log_security_event(
        "stripe_invoice_payment_failed",
        {"customer_id": customer_id, "invoice_id": invoice.get("id")},
    )

    try:
        result = await db.execute(
            update(User)
            .where(User.stripe_customer_id == customer_id)
            .values(is_pro=False, updated_at=func.now())
        )
        if result.rowcount == 0:
            logger.warning(
                "STRIPE_WEBHOOK invoice.payment_failed no user found for customer=%s",
                customer_id,
            )
        await db.commit()
    except Exception:
        await db.rollback()
        raise


async def reconcile_subscriptions(db: AsyncSession) -> dict[str, Any]:
    """Compare local is_pro flags against Stripe's actual subscription state.

    Returns a summary of users checked and any corrections made.
    """
    client = _get_stripe_client()

    # Get all users who are marked as Pro locally
    result = await db.execute(
        select(User).where(User.is_pro.is_(True))
    )
    pro_users = result.scalars().all()

    corrections = []
    for user in pro_users:
        if not user.stripe_customer_id:
            # Pro without a Stripe customer — likely granted manually via script
            continue

        try:
            subscriptions = await client.subscriptions.list_async(
                params={"customer": user.stripe_customer_id, "status": "active", "limit": 1}
            )
            if not subscriptions.data:
                # No active subscription in Stripe but is_pro=True locally
                await db.execute(
                    update(User)
                    .where(User.id == user.id)
                    .values(is_pro=False, updated_at=func.now())
                )
                corrections.append({
                    "user_id": str(user.id),
                    "action": "revoked_pro",
                    "reason": "no_active_stripe_subscription",
                })
                log_security_event(
                    "stripe_reconciliation_revoke",
                    {"user_id": str(user.id), "customer_id": user.stripe_customer_id},
                )
        except stripe.StripeError:
            logger.error(
                "Failed to check Stripe subscriptions for user=%s customer=%s",
                user.id, user.stripe_customer_id, exc_info=True,
            )

    if corrections:
        try:
            await db.commit()
        except Exception:
            await db.rollback()
            raise

    return {
        "pro_users_checked": len(pro_users),
        "corrections": corrections,
    }
