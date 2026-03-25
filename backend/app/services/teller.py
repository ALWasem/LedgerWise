import base64
import logging
from datetime import date as date_type
from decimal import Decimal
from typing import Any

import httpx
from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.config import settings
from app.models import Account, Transaction
from app.schemas import AccountResponse, TransactionResponse
from app.utils.encryption import decrypt, encrypt
from app.utils.logging import log_enrollment

logger = logging.getLogger("ledgerwise.audit")

TELLER_BASE_URL = "https://api.teller.io"


def _auth_header(access_token: str) -> str:
    """Teller uses HTTP Basic auth: access_token as username, empty password."""
    encoded = base64.b64encode(f"{access_token}:".encode()).decode()
    return f"Basic {encoded}"


def _client() -> httpx.AsyncClient:
    return httpx.AsyncClient(
        cert=(settings.teller_cert_path, settings.teller_key_path),
        timeout=30.0,
    )


async def get_accounts(access_token: str) -> list[dict[str, Any]]:
    async with _client() as client:
        response = await client.get(
            f"{TELLER_BASE_URL}/accounts",
            headers={"Authorization": _auth_header(access_token)},
        )
        response.raise_for_status()
        return response.json()


async def get_transactions(access_token: str, account_id: str) -> list[dict[str, Any]]:
    async with _client() as client:
        response = await client.get(
            f"{TELLER_BASE_URL}/accounts/{account_id}/transactions",
            headers={"Authorization": _auth_header(access_token)},
        )
        response.raise_for_status()
        return response.json()


async def get_all_transactions(access_token: str) -> list[dict[str, Any]]:
    accounts = await get_accounts(access_token)
    all_transactions: list[dict[str, Any]] = []
    for account in accounts:
        txns = await get_transactions(access_token, account["id"])
        for txn in txns:
            txn["account_name"] = account.get("name", "Unknown")
        all_transactions.extend(txns)
    all_transactions.sort(key=lambda t: t.get("date", ""), reverse=True)
    return all_transactions


async def get_transactions_from_db(db: AsyncSession) -> list[TransactionResponse]:
    """Fetch all transactions from the database, joined with account info."""
    result = await db.execute(
        select(Transaction)
        .options(joinedload(Transaction.account))
        .order_by(Transaction.date.desc())
    )
    rows = result.scalars().all()
    return _map_transactions(rows)


async def get_user_accounts(db: AsyncSession, user_id: str) -> list[Account]:
    """Fetch all accounts belonging to a user."""
    result = await db.execute(
        select(Account).where(Account.user_id == user_id)
    )
    return list(result.scalars().all())


async def get_user_transactions(
    db: AsyncSession,
    user_id: str,
    start_date: date_type | None = None,
    end_date: date_type | None = None,
) -> list[TransactionResponse]:
    """Fetch transactions for a specific user, joined with account info."""
    stmt = (
        select(Transaction)
        .join(Account)
        .where(Account.user_id == user_id)
        .options(joinedload(Transaction.account))
        .order_by(Transaction.date.desc())
    )

    if start_date:
        stmt = stmt.where(Transaction.date >= start_date)
    if end_date:
        stmt = stmt.where(Transaction.date <= end_date)

    result = await db.execute(stmt)
    rows = result.scalars().all()
    return _map_transactions(rows)


def _map_transactions(rows: list[Transaction]) -> list[TransactionResponse]:
    """Convert Transaction ORM rows to response models."""
    results: list[TransactionResponse] = []
    for txn in rows:
        category = (txn.category or "General").title()
        amount = txn.amount
        if category == "Refund":
            amount = abs(amount)
        results.append(TransactionResponse(
            id=str(txn.teller_transaction_id),
            date=txn.date.isoformat(),
            description=txn.description,
            amount=str(amount),
            account_name=txn.account.account_name or "Unknown",
            category=category,
        ))
    return results


async def enroll_accounts(
    db: AsyncSession, user_id: str, access_token: str
) -> list[AccountResponse]:
    """Pull accounts and transactions from Teller API and persist to DB."""
    teller_accounts = await get_accounts(access_token)

    saved_accounts: list[AccountResponse] = []

    encrypted_token = encrypt(access_token)

    for acct in teller_accounts:
        stmt = pg_insert(Account).values(
            teller_account_id=acct["id"],
            user_id=user_id,
            teller_access_token=encrypted_token,
            institution_name=acct.get("institution", {}).get("name"),
            account_name=acct.get("name"),
            account_type=acct.get("type"),
            account_subtype=acct.get("subtype"),
        ).on_conflict_do_update(
            constraint="uq_account_per_user",
            set_={
                "teller_access_token": encrypted_token,
                "institution_name": acct.get("institution", {}).get("name"),
                "account_name": acct.get("name"),
                "updated_at": func.now(),
            },
        ).returning(Account.id, Account.teller_account_id)

        result = await db.execute(stmt)
        row = result.fetchone()
        account_db_id = row.id

        saved_accounts.append(AccountResponse(
            id=str(account_db_id),
            teller_account_id=acct["id"],
            institution_name=acct.get("institution", {}).get("name"),
            account_name=acct.get("name"),
            account_type=acct.get("type"),
            account_subtype=acct.get("subtype"),
        ))

        teller_txns = await get_transactions(access_token, acct["id"])
        logger.info(
            "TELLER_TXNS account=%s count=%d",
            acct["id"],
            len(teller_txns),
        )
        for txn in teller_txns:
            txn_stmt = pg_insert(Transaction).values(
                account_id=account_db_id,
                teller_transaction_id=txn["id"],
                amount=Decimal(txn["amount"]),
                date=date_type.fromisoformat(txn["date"]),
                description=txn.get("description", ""),
                category=txn.get("details", {}).get("category"),
                merchant_name=txn.get("merchant_name"),
                status=txn.get("status", "posted"),
            ).on_conflict_do_update(
                constraint="uq_transaction_per_account",
                set_={
                    "amount": Decimal(txn["amount"]),
                    "description": txn.get("description", ""),
                    "category": txn.get("details", {}).get("category"),
                    "status": txn.get("status", "posted"),
                },
            )
            await db.execute(txn_stmt)

    await db.commit()
    log_enrollment(user_id, len(saved_accounts))
    return saved_accounts
