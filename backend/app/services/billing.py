"""Billing service — Stripe checkout and subscription management."""

import asyncio
import logging
import random
from datetime import datetime, timedelta, timezone
from typing import Any

import stripe
from sqlalchemy import delete, func, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.processed_webhook_event import ProcessedWebhookEvent
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


async def handle_charge_refunded(
    db: AsyncSession, charge: dict[str, Any]
) -> None:
    """Revoke Pro when a charge is fully refunded."""
    customer_id = charge.get("customer", "")
    if not customer_id:
        logger.warning("STRIPE_WEBHOOK charge.refunded missing customer_id")
        return

    # Only revoke on full refund (refunded == true), not partial
    if not charge.get("refunded", False):
        return

    log_security_event(
        "stripe_charge_refunded",
        {"customer_id": customer_id, "charge_id": charge.get("id")},
    )

    try:
        result = await db.execute(
            update(User)
            .where(User.stripe_customer_id == customer_id)
            .values(is_pro=False, updated_at=func.now())
        )
        if result.rowcount == 0:
            logger.warning(
                "STRIPE_WEBHOOK charge.refunded no user found for customer=%s",
                customer_id,
            )
        await db.commit()
    except Exception:
        await db.rollback()
        raise


async def check_and_record_webhook_event(
    db: AsyncSession, event_id: str, event_type: str
) -> bool:
    """Record a webhook event for deduplication. Returns True if new, False if duplicate."""
    stmt = (
        pg_insert(ProcessedWebhookEvent)
        .values(event_id=event_id, event_type=event_type)
        .on_conflict_do_nothing(index_elements=["event_id"])
        .returning(ProcessedWebhookEvent.id)
    )
    result = await db.execute(stmt)
    inserted = result.scalar_one_or_none()

    if inserted is None:
        await db.rollback()
        return False
    await db.commit()
    return True


async def maybe_cleanup_old_events(
    db: AsyncSession, retention_days: int = 30
) -> None:
    """Probabilistic cleanup of old dedup records (~1% chance per call)."""
    if random.randint(1, 100) != 1:
        return
    cutoff = datetime.now(timezone.utc) - timedelta(days=retention_days)
    await db.execute(
        delete(ProcessedWebhookEvent).where(
            ProcessedWebhookEvent.processed_at < cutoff
        )
    )
    await db.commit()


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

    # Check Stripe subscriptions in parallel (batch of concurrent requests)
    users_to_check = [u for u in pro_users if u.stripe_customer_id]

    async def _check_user(user: User) -> dict[str, str] | None:
        try:
            subscriptions = await client.subscriptions.list_async(
                params={"customer": user.stripe_customer_id, "status": "active", "limit": 1}
            )
            if not subscriptions.data:
                return {
                    "user_id": str(user.id),
                    "customer_id": user.stripe_customer_id,
                    "action": "revoked_pro",
                    "reason": "no_active_stripe_subscription",
                }
        except stripe.StripeError:
            logger.error(
                "Failed to check Stripe subscriptions for user=%s customer=%s",
                user.id, user.stripe_customer_id, exc_info=True,
            )
        return None

    results = await asyncio.gather(*[_check_user(u) for u in users_to_check])

    corrections = []
    for result in results:
        if result is not None:
            user_id = result["user_id"]
            await db.execute(
                update(User)
                .where(User.id == user_id)
                .values(is_pro=False, updated_at=func.now())
            )
            corrections.append({
                "user_id": user_id,
                "action": result["action"],
                "reason": result["reason"],
            })
            log_security_event(
                "stripe_reconciliation_revoke",
                {"user_id": user_id, "customer_id": result["customer_id"]},
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
