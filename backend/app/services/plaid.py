"""Plaid banking integration service.

Mirrors the Teller service pattern: API calls → DB persistence → response mapping.
All Plaid SDK calls are synchronous and run via asyncio.to_thread().
"""

import asyncio
import logging
import uuid
from decimal import Decimal

from plaid.model.accounts_get_request import AccountsGetRequest
from plaid.model.country_code import CountryCode
from plaid.model.institutions_get_by_id_request import InstitutionsGetByIdRequest
from plaid.model.item_get_request import ItemGetRequest
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.products import Products
from plaid.model.transactions_sync_request import TransactionsSyncRequest
from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Account, PlaidItem, Transaction
from app.schemas import AccountResponse
from app.schemas.transaction import PlaidItemResponse
from app.config import settings
from app.services.plaid_client import get_plaid_client
from app.services.category import consolidate_categories
from app.services.merchant_rule import apply_rules_to_transactions
from app.utils.encryption import encrypt
from app.utils.logging import log_data_access, log_enrollment

logger = logging.getLogger("ledgerwise.audit")


async def create_link_token(user_id: str) -> str:
    """Create a Plaid Link token for the frontend widget."""
    client = get_plaid_client()
    kwargs = {
        "user": LinkTokenCreateRequestUser(client_user_id=user_id),
        "client_name": "LedgerWise",
        "products": [Products("transactions")],
        "country_codes": [CountryCode("US")],
        "language": "en",
    }
    if settings.plaid_redirect_uri:
        kwargs["redirect_uri"] = settings.plaid_redirect_uri
    request = LinkTokenCreateRequest(**kwargs)
    response = await asyncio.to_thread(client.link_token_create, request)
    return response.link_token


async def exchange_public_token(
    db: AsyncSession, user_id: str, public_token: str
) -> tuple[PlaidItemResponse, list[AccountResponse]]:
    """Exchange a public token, persist the item + accounts, and sync transactions."""
    client = get_plaid_client()

    # 1. Exchange public token for access token
    exchange_request = ItemPublicTokenExchangeRequest(public_token=public_token)
    exchange_response = await asyncio.to_thread(
        client.item_public_token_exchange, exchange_request
    )
    access_token = exchange_response.access_token
    item_id = exchange_response.item_id

    # 2. Get institution info
    item_request = ItemGetRequest(access_token=access_token)
    item_response = await asyncio.to_thread(client.item_get, item_request)
    institution_id = item_response.item.institution_id

    institution_name: str | None = None
    if institution_id:
        try:
            inst_request = InstitutionsGetByIdRequest(
                institution_id=institution_id,
                country_codes=[CountryCode("US")],
            )
            inst_response = await asyncio.to_thread(
                client.institutions_get_by_id, inst_request
            )
            institution_name = inst_response.institution.name
        except Exception:
            logger.warning("Failed to fetch institution name for %s", institution_id)

    # 3. Persist PlaidItem
    encrypted_token = encrypt(access_token)
    plaid_item_stmt = pg_insert(PlaidItem).values(
        user_id=user_id,
        item_id=item_id,
        access_token=encrypted_token,
        institution_id=institution_id,
        institution_name=institution_name,
    ).on_conflict_do_update(
        index_elements=["item_id"],
        set_={
            "access_token": encrypted_token,
            "institution_id": institution_id,
            "institution_name": institution_name,
        },
    ).returning(PlaidItem.id, PlaidItem.created_at)
    item_result = await db.execute(plaid_item_stmt)
    item_row = item_result.fetchone()

    # 4. Fetch and persist accounts
    accounts_request = AccountsGetRequest(access_token=access_token)
    accounts_response = await asyncio.to_thread(client.accounts_get, accounts_request)

    saved_accounts: list[AccountResponse] = []
    # Map Plaid account_id → DB account UUID (for transaction sync lookups)
    plaid_acct_id_map: dict[str, uuid.UUID] = {}
    for acct in accounts_response.accounts:
        balance = acct.balances
        acct_stmt = pg_insert(Account).values(
            user_id=user_id,
            provider="plaid",
            item_id=item_id,
            persistent_account_id=acct.account_id,
            institution_name=institution_name,
            account_name=acct.name,
            account_type=acct.type.value if acct.type else None,
            account_subtype=acct.subtype.value if acct.subtype else None,
            balance=Decimal(str(balance.available)) if balance.available is not None else None,
            balance_current=Decimal(str(balance.current)) if balance.current is not None else None,
            balance_limit=Decimal(str(balance.limit)) if balance.limit is not None else None,
            currency=balance.iso_currency_code or "USD",
        ).on_conflict_do_update(
            constraint="uq_plaid_account_per_item",
            set_={
                "account_name": acct.name,
                "balance": Decimal(str(balance.available)) if balance.available is not None else None,
                "balance_current": Decimal(str(balance.current)) if balance.current is not None else None,
                "balance_limit": Decimal(str(balance.limit)) if balance.limit is not None else None,
                "updated_at": func.now(),
            },
        ).returning(Account.id, Account.created_at)
        result = await db.execute(acct_stmt)
        row = result.fetchone()
        plaid_acct_id_map[acct.account_id] = row.id

        saved_accounts.append(AccountResponse(
            id=str(row.id),
            provider="plaid",
            item_id=item_id,
            persistent_account_id=acct.account_id,
            institution_name=institution_name,
            account_name=acct.name,
            account_type=acct.type.value if acct.type else None,
            account_subtype=acct.subtype.value if acct.subtype else None,
            balance_current=float(balance.current) if balance.current is not None else None,
            balance_limit=float(balance.limit) if balance.limit is not None else None,
            created_at=row.created_at,
        ))

    # 5. Initial transaction sync
    await sync_transactions(db, user_id, item_id, access_token, plaid_acct_id_map)

    # 6. Auto-create Category entries and consolidate similar names
    await consolidate_categories(db, user_id)

    try:
        await db.commit()
    except Exception:
        await db.rollback()
        raise

    log_enrollment(user_id, len(saved_accounts))

    plaid_item_response = PlaidItemResponse(
        id=str(item_row.id),
        item_id=item_id,
        institution_id=institution_id,
        institution_name=institution_name,
        created_at=item_row.created_at,
    )
    return plaid_item_response, saved_accounts


async def sync_transactions(
    db: AsyncSession,
    user_id: str,
    item_id: str,
    access_token: str,
    account_map: dict[str, uuid.UUID] | None = None,
) -> int:
    """Sync transactions using Plaid's /transactions/sync endpoint.

    Uses cursor-based pagination to fetch all available transactions.
    Returns the number of transactions added/modified.
    """
    client = get_plaid_client()

    # Get current cursor from DB
    stmt = select(PlaidItem).where(PlaidItem.item_id == item_id, PlaidItem.user_id == user_id)
    result = await db.execute(stmt)
    plaid_item = result.scalars().first()
    cursor = plaid_item.sync_cursor if plaid_item else None

    # Build account_id lookup: plaid account_id → DB account UUID
    if account_map is not None:
        accounts = account_map
    else:
        acct_stmt = select(Account).where(Account.item_id == item_id, Account.user_id == user_id)
        acct_result = await db.execute(acct_stmt)
        accounts = {acct.persistent_account_id: acct.id for acct in acct_result.scalars().all()}

    total_synced = 0
    synced_transaction_ids: list[str] = []
    has_more = True

    while has_more:
        sync_request = TransactionsSyncRequest(
            access_token=access_token,
            cursor=cursor or "",
        )
        sync_response = await asyncio.to_thread(client.transactions_sync, sync_request)

        # Process added + modified transactions (same upsert logic)
        for txn in [*sync_response.added, *sync_response.modified]:
            account_db_id = accounts.get(txn.account_id)
            if account_db_id is None:
                continue

            pfc = txn.personal_finance_category
            values = {
                "account_id": account_db_id,
                "provider": "plaid",
                "plaid_transaction_id": txn.transaction_id,
                "amount": Decimal(str(txn.amount)),
                "date": txn.date,
                "description": txn.name or "",
                "category": pfc.primary.lower() if pfc else None,
                "merchant_name": txn.merchant_name,
                "status": "pending" if txn.pending else "posted",
                "personal_finance_category_primary": pfc.primary if pfc else None,
                "personal_finance_category_detailed": pfc.detailed if pfc else None,
                "payment_channel": txn.payment_channel if txn.payment_channel else None,
                "pending": txn.pending,
                "authorized_date": txn.authorized_date,
            }
            update_fields = {k: v for k, v in values.items() if k not in ("account_id", "provider", "plaid_transaction_id")}
            txn_stmt = pg_insert(Transaction).values(**values).on_conflict_do_update(
                constraint="uq_plaid_transaction_per_account",
                set_=update_fields,
            )
            await db.execute(txn_stmt)
            synced_transaction_ids.append(txn.transaction_id)
            total_synced += 1

        # Handle removed transactions (scoped to user's accounts)
        for removed in sync_response.removed:
            remove_stmt = (
                select(Transaction)
                .join(Account)
                .where(
                    Transaction.plaid_transaction_id == removed.transaction_id,
                    Account.user_id == user_id,
                )
            )
            remove_result = await db.execute(remove_stmt)
            txn_to_remove = remove_result.scalars().first()
            if txn_to_remove:
                await db.delete(txn_to_remove)

        cursor = sync_response.next_cursor
        has_more = sync_response.has_more

    # Apply merchant rules to newly synced transactions
    await apply_rules_to_transactions(db, user_id, synced_transaction_ids)

    # Update cursor on the PlaidItem
    if plaid_item and cursor:
        plaid_item.sync_cursor = cursor
        plaid_item.last_synced_at = func.now()

    log_data_access(user_id, f"plaid_sync:{item_id}:txns={total_synced}")
    return total_synced


async def get_user_plaid_items(db: AsyncSession, user_id: str) -> list[PlaidItem]:
    """Fetch all Plaid items belonging to a user."""
    stmt = select(PlaidItem).where(PlaidItem.user_id == user_id)
    result = await db.execute(stmt)
    return list(result.scalars().all())
