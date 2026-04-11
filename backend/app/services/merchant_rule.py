"""Merchant rule service — preview matches, create rules, and auto-apply on sync."""

import logging

from sqlalchemy import func, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models import Account, MerchantRule, Transaction
from app.schemas.merchant_rule import MerchantMatchPreview, MerchantRuleResponse
from app.utils.logging import log_data_access, log_security_event

logger = logging.getLogger("ledgerwise.audit")


async def _lookup_transaction(
    db: AsyncSession, user_id: str, transaction_id: str
) -> Transaction | None:
    """Look up a transaction by provider ID, scoped to user."""
    stmt = (
        select(Transaction)
        .join(Account)
        .where(Account.user_id == user_id)
        .where(
            (Transaction.teller_transaction_id == transaction_id)
            | (Transaction.plaid_transaction_id == transaction_id)
        )
        .options(joinedload(Transaction.account))
    )
    result = await db.execute(stmt)
    return result.scalars().first()


def _derive_match_key(txn: Transaction) -> tuple[str, str]:
    """Derive the lowercased match pattern and field from a transaction.

    Returns (pattern, match_field).
    """
    if txn.merchant_name and txn.merchant_name.strip():
        return txn.merchant_name.strip().lower(), "merchant_name"
    return txn.description.strip().lower(), "description"


async def preview_merchant_match(
    db: AsyncSession, user_id: str, transaction_id: str
) -> MerchantMatchPreview | None:
    """Count other transactions sharing the same merchant, for a confirmation prompt."""
    txn = await _lookup_transaction(db, user_id, transaction_id)
    if txn is None:
        return None

    pattern, match_field = _derive_match_key(txn)

    # Count OTHER transactions with the same merchant value (same user)
    if match_field == "merchant_name":
        match_condition = func.lower(Transaction.merchant_name) == pattern
    else:
        match_condition = func.lower(Transaction.description) == pattern

    count_stmt = (
        select(func.count())
        .select_from(Transaction)
        .join(Account)
        .where(Account.user_id == user_id)
        .where(match_condition)
        .where(Transaction.id != txn.id)
    )
    result = await db.execute(count_stmt)
    count = result.scalar_one()

    if count == 0:
        return None

    log_data_access(user_id, f"merchant_match_preview:{pattern}")
    return MerchantMatchPreview(
        merchant_pattern=pattern,
        match_field=match_field,
        matching_count=count,
    )


async def create_rule_and_apply(
    db: AsyncSession, user_id: str, transaction_id: str, category_name: str
) -> MerchantRuleResponse:
    """Create (or update) a merchant rule and batch-apply to all matching transactions."""
    txn = await _lookup_transaction(db, user_id, transaction_id)
    if txn is None:
        raise ValueError("Transaction not found")

    pattern, match_field = _derive_match_key(txn)
    normalized_category = category_name.strip().lower()

    # Upsert the rule
    rule_stmt = (
        pg_insert(MerchantRule)
        .values(
            user_id=user_id,
            merchant_pattern=pattern,
            match_field=match_field,
            category_name=normalized_category,
        )
        .on_conflict_do_update(
            constraint="uq_merchant_rule_per_user",
            set_={"category_name": normalized_category},
        )
        .returning(MerchantRule.id, MerchantRule.created_at)
    )
    rule_result = await db.execute(rule_stmt)
    rule_row = rule_result.fetchone()

    # Batch-update all matching transactions for this user
    if match_field == "merchant_name":
        match_condition = func.lower(Transaction.merchant_name) == pattern
    else:
        match_condition = func.lower(Transaction.description) == pattern

    user_account_ids = select(Account.id).where(Account.user_id == user_id)

    update_stmt = (
        update(Transaction)
        .where(Transaction.account_id.in_(user_account_ids))
        .where(match_condition)
        .values(category=normalized_category)
    )
    update_result = await db.execute(update_stmt)
    transactions_updated = update_result.rowcount

    try:
        await db.commit()
    except Exception:
        await db.rollback()
        raise

    log_security_event(
        "merchant_rule_created",
        {
            "user_id": user_id,
            "pattern": pattern,
            "match_field": match_field,
            "category": normalized_category,
            "transactions_updated": transactions_updated,
        },
    )

    return MerchantRuleResponse(
        id=str(rule_row.id),
        merchant_pattern=pattern,
        match_field=match_field,
        category_name=normalized_category,
        transactions_updated=transactions_updated,
        created_at=rule_row.created_at,
    )


async def apply_rules_to_transactions(
    db: AsyncSession, user_id: str, transaction_ids: list[str]
) -> int:
    """Auto-categorize newly synced transactions using existing merchant rules.

    Only applies to transactions whose category is null or 'general'.
    Returns total number of transactions auto-categorized.
    """
    if not transaction_ids:
        return 0

    # Fetch all rules for this user
    rules_stmt = select(MerchantRule).where(MerchantRule.user_id == user_id)
    rules_result = await db.execute(rules_stmt)
    rules = list(rules_result.scalars().all())

    if not rules:
        return 0

    user_account_ids = select(Account.id).where(Account.user_id == user_id).scalar_subquery()
    txn_id_filter = (
        (Transaction.teller_transaction_id.in_(transaction_ids))
        | (Transaction.plaid_transaction_id.in_(transaction_ids))
    )
    uncategorized_filter = (
        (Transaction.category.is_(None))
        | (func.lower(Transaction.category) == "general")
    )
    total_updated = 0

    for rule in rules:
        if rule.match_field == "merchant_name":
            match_condition = func.lower(Transaction.merchant_name) == rule.merchant_pattern
        else:
            match_condition = func.lower(Transaction.description) == rule.merchant_pattern

        update_stmt = (
            update(Transaction)
            .where(Transaction.account_id.in_(user_account_ids))
            .where(txn_id_filter)
            .where(match_condition)
            .where(uncategorized_filter)
            .values(category=rule.category_name)
        )
        result = await db.execute(update_stmt)
        total_updated += result.rowcount

    if total_updated > 0:
        log_data_access(
            user_id,
            f"merchant_rules_auto_applied:txns={total_updated}",
        )

    return total_updated
