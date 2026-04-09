import asyncio
import base64
import logging
import uuid
from datetime import date as date_type
from decimal import Decimal
from typing import Any

import httpx
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import Account, Transaction
from app.schemas import AccountResponse
from app.utils.encryption import encrypt
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


async def enroll_accounts(
    db: AsyncSession, user_id: str, access_token: str
) -> list[AccountResponse]:
    """Pull accounts and transactions from Teller API and persist to DB."""
    teller_accounts = await get_accounts(access_token)

    saved_accounts: list[AccountResponse] = []
    encrypted_token = encrypt(access_token)

    # Upsert accounts first to get DB IDs
    account_ids: list[tuple[uuid.UUID, dict[str, Any]]] = []
    for acct in teller_accounts:
        stmt = pg_insert(Account).values(
            teller_account_id=acct["id"],
            user_id=user_id,
            provider="teller",
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
        ).returning(Account.id, Account.teller_account_id, Account.created_at)

        result = await db.execute(stmt)
        row = result.fetchone()
        account_ids.append((row.id, acct))

        saved_accounts.append(AccountResponse(
            id=str(row.id),
            teller_account_id=acct["id"],
            institution_name=acct.get("institution", {}).get("name"),
            account_name=acct.get("name"),
            account_type=acct.get("type"),
            account_subtype=acct.get("subtype"),
            created_at=row.created_at,
        ))

    # Fetch transactions for all accounts in parallel
    txn_results = await asyncio.gather(
        *(get_transactions(access_token, acct["id"]) for _, acct in account_ids)
    )

    # Persist all transactions
    for (account_db_id, _), teller_txns in zip(account_ids, txn_results):
        for txn in teller_txns:
            txn_stmt = pg_insert(Transaction).values(
                account_id=account_db_id,
                provider="teller",
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
                    "merchant_name": txn.get("merchant_name"),
                    "status": txn.get("status", "posted"),
                },
            )
            await db.execute(txn_stmt)

    try:
        await db.commit()
    except Exception:
        await db.rollback()
        raise
    log_enrollment(user_id, len(saved_accounts))
    return saved_accounts
