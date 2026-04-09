"""Provider-agnostic banking operations (accounts, transactions, categories)."""

from datetime import date as date_type

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models import Account, Transaction
from app.schemas import TransactionResponse


async def get_user_accounts(
    db: AsyncSession, user_id: str, account_type: str | None = None
) -> list[Account]:
    """Fetch all accounts belonging to a user, optionally filtered by type."""
    stmt = select(Account).where(Account.user_id == user_id)
    if account_type:
        stmt = stmt.where(Account.account_type == account_type)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_user_transactions(
    db: AsyncSession,
    user_id: str,
    start_date: date_type | None = None,
    end_date: date_type | None = None,
    account_type: str | None = None,
) -> list[TransactionResponse]:
    """Fetch transactions for a specific user, joined with account info."""
    stmt = (
        select(Transaction)
        .join(Account)
        .where(Account.user_id == user_id)
        .options(joinedload(Transaction.account))
        .order_by(Transaction.date.desc())
    )
    if account_type:
        stmt = stmt.where(Account.account_type == account_type)

    if start_date:
        stmt = stmt.where(Transaction.date >= start_date)
    if end_date:
        stmt = stmt.where(Transaction.date <= end_date)

    result = await db.execute(stmt)
    rows = result.unique().scalars().all()
    return map_transactions(rows)


def map_transactions(rows: list[Transaction]) -> list[TransactionResponse]:
    """Convert Transaction ORM rows to response models."""
    results: list[TransactionResponse] = []
    for txn in rows:
        category = (txn.category or "General").replace("_", " ").title()
        amount = txn.amount
        if category == "Refund":
            amount = abs(amount)

        # Use the appropriate provider-specific ID, fall back to DB primary key
        if txn.provider == "plaid" and txn.plaid_transaction_id:
            txn_id = txn.plaid_transaction_id
        elif txn.teller_transaction_id:
            txn_id = txn.teller_transaction_id
        else:
            txn_id = str(txn.id)

        results.append(TransactionResponse(
            id=txn_id,
            date=txn.date.isoformat(),
            description=txn.description,
            amount=str(amount),
            account_name=txn.account.account_name or "Unknown",
            category=category,
            provider=txn.provider,
            merchant_name=txn.merchant_name,
            personal_finance_category_primary=txn.personal_finance_category_primary,
            personal_finance_category_detailed=txn.personal_finance_category_detailed,
            payment_channel=txn.payment_channel,
            pending=txn.pending,
            authorized_date=txn.authorized_date.isoformat() if txn.authorized_date else None,
            plaid_transaction_id=txn.plaid_transaction_id,
        ))
    return results


async def update_transaction_category(
    db: AsyncSession,
    user_id: str,
    transaction_id: str,
    category: str,
) -> TransactionResponse | None:
    """Update the category of a transaction, scoped to the authenticated user."""
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
    txn = result.scalars().first()
    if txn is None:
        return None

    txn.category = category.lower()
    try:
        await db.commit()
    except Exception:
        await db.rollback()
        raise
    return map_transactions([txn])[0]
