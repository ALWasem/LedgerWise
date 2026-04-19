"""Plaid banking integration service.

API calls → DB persistence → response mapping.
All Plaid SDK calls are synchronous and run via asyncio.to_thread().
"""

import asyncio
import hashlib
import json
import logging
import time
import uuid
from datetime import date, timedelta
from decimal import Decimal

import jwt
from plaid.exceptions import ApiException as PlaidApiException
from plaid.model.accounts_get_request import AccountsGetRequest
from plaid.model.country_code import CountryCode
from plaid.model.institutions_get_by_id_request import InstitutionsGetByIdRequest
from plaid.model.item_get_request import ItemGetRequest
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.link_token_transactions import LinkTokenTransactions
from plaid.model.products import Products
from plaid.model.transactions_get_request import TransactionsGetRequest
from plaid.model.transactions_get_request_options import TransactionsGetRequestOptions
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
from app.utils.encryption import encrypt, decrypt
from app.utils.logging import log_data_access, log_enrollment, log_security_event

logger = logging.getLogger("ledgerwise.audit")


async def create_link_token(
    user_id: str, received_redirect_uri: str | None = None
) -> str:
    """Create a Plaid Link token for the frontend widget.

    When ``received_redirect_uri`` is provided this is an OAuth re-init:
    Plaid requires that ``products`` is omitted (they were set in the
    original link token) and ``received_redirect_uri`` is included.
    """
    client = get_plaid_client()
    kwargs: dict = {
        "user": LinkTokenCreateRequestUser(client_user_id=user_id),
        "client_name": "LedgerWise",
        "country_codes": [CountryCode("US")],
        "language": "en",
    }

    if received_redirect_uri:
        # OAuth re-initialization — omit products, include the redirect URI
        kwargs["received_redirect_uri"] = received_redirect_uri
    else:
        # Normal link token creation
        kwargs["products"] = [Products("transactions")]
        kwargs["transactions"] = LinkTokenTransactions(
            days_requested=730,
        )

    if settings.plaid_redirect_uri:
        kwargs["redirect_uri"] = settings.plaid_redirect_uri

    if settings.plaid_webhook_url:
        kwargs["webhook"] = settings.plaid_webhook_url

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

    # 5. Full historical transaction pull via /transactions/get
    await fetch_all_transactions(db, user_id, item_id, access_token, plaid_acct_id_map)

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


async def fetch_all_transactions(
    db: AsyncSession,
    user_id: str,
    item_id: str,
    access_token: str,
    account_map: dict[str, uuid.UUID],
) -> int:
    """Pull full transaction history via /transactions/get (up to 2 years).

    Used on initial account link to get everything upfront.
    Retries with backoff when Plaid returns PRODUCT_NOT_READY (data still
    being processed after linking). Paginates in 500-transaction batches.
    """
    client = get_plaid_client()

    end_date = date.today()
    start_date = end_date - timedelta(days=730)  # 2 years

    # Wait for Plaid to finish processing — retry up to 8 times
    # with exponential backoff: 5s, 10s, 15s, 20s, 25s, 30s, 30s, 30s (~3 min total)
    max_retries = 8
    for attempt in range(max_retries + 1):
        try:
            initial_request = TransactionsGetRequest(
                access_token=access_token,
                start_date=start_date,
                end_date=end_date,
                options=TransactionsGetRequestOptions(count=1, offset=0),
            )
            initial_response = await asyncio.to_thread(
                client.transactions_get, initial_request
            )
            total_available = initial_response.total_transactions
            logger.info(
                "Plaid reports %d total transactions for item=%s (attempt %d)",
                total_available, item_id, attempt + 1,
            )
            break
        except PlaidApiException as exc:
            error_body = getattr(exc, "body", "") or ""
            if "PRODUCT_NOT_READY" in str(error_body) and attempt < max_retries:
                wait = min(5 * (attempt + 1), 30)
                logger.info(
                    "PRODUCT_NOT_READY for item=%s, retrying in %ds (attempt %d/%d)",
                    item_id, wait, attempt + 1, max_retries,
                )
                await asyncio.sleep(wait)
                continue
            raise
    else:
        logger.warning("Plaid data never became ready for item=%s", item_id)
        return 0

    total_fetched = 0
    offset = 0
    batch_size = 500
    fetched_transaction_ids: list[str] = []

    while offset < total_available:
        request = TransactionsGetRequest(
            access_token=access_token,
            start_date=start_date,
            end_date=end_date,
            options=TransactionsGetRequestOptions(
                count=batch_size,
                offset=offset,
            ),
        )
        response = await asyncio.to_thread(client.transactions_get, request)

        for txn in response.transactions:
            account_db_id = account_map.get(txn.account_id)
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
            update_fields = {
                k: v for k, v in values.items()
                if k not in ("account_id", "provider", "plaid_transaction_id")
            }
            txn_stmt = pg_insert(Transaction).values(**values).on_conflict_do_update(
                constraint="uq_plaid_transaction_per_account",
                set_=update_fields,
            )
            await db.execute(txn_stmt)
            fetched_transaction_ids.append(txn.transaction_id)
            total_fetched += 1

        offset += len(response.transactions)
        # Update total in case Plaid processed more while we were paginating
        total_available = response.total_transactions

    # Apply merchant rules to fetched transactions
    await apply_rules_to_transactions(db, user_id, fetched_transaction_ids)

    log_data_access(user_id, f"plaid_fetch_all:{item_id}:txns={total_fetched}")
    return total_fetched


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


async def sync_all_items(db: AsyncSession, user_id: str) -> int:
    """Sync transactions for all of a user's Plaid items."""
    items = await get_user_plaid_items(db, user_id)
    total = 0
    for item in items:
        access_token = decrypt(item.access_token)
        try:
            synced = await sync_transactions(
                db, user_id, item.item_id, access_token
            )
            total += synced
        except Exception:
            logger.warning(
                "Plaid sync skipped item=%s for user=%s",
                item.item_id, user_id, exc_info=True,
            )
            continue
    await db.commit()
    return total


async def backfill_all_items(db: AsyncSession, user_id: str) -> int:
    """Full historical pull for all of a user's Plaid items."""
    items = await get_user_plaid_items(db, user_id)
    total = 0
    for item in items:
        access_token = decrypt(item.access_token)
        acct_stmt = select(Account).where(
            Account.item_id == item.item_id, Account.user_id == user_id
        )
        acct_result = await db.execute(acct_stmt)
        account_map = {
            acct.persistent_account_id: acct.id
            for acct in acct_result.scalars().all()
        }
        try:
            fetched = await fetch_all_transactions(
                db, user_id, item.item_id, access_token, account_map
            )
            total += fetched
        except Exception:
            logger.warning(
                "Plaid backfill skipped item=%s for user=%s",
                item.item_id, user_id, exc_info=True,
            )
            continue
    await db.commit()
    return total


# --- Plaid Webhook Verification & Handling ---

# Plaid serves its JWKS via a POST endpoint, not a standard .well-known URL.
# PyJWKClient expects a GET endpoint, so we fetch the key manually.
_plaid_key_cache: dict[str, tuple[float, object]] = {}
_KEY_CACHE_TTL = 1800  # 30 minutes


async def _get_plaid_verification_key(key_id: str) -> object:
    """Fetch the JWK for a given key_id from Plaid's key endpoint."""
    now = time.time()
    cached = _plaid_key_cache.get(key_id)
    if cached and now - cached[0] < _KEY_CACHE_TTL:
        return cached[1]

    client = get_plaid_client()

    from plaid.model.webhook_verification_key_get_request import WebhookVerificationKeyGetRequest

    request = WebhookVerificationKeyGetRequest(key_id=key_id)
    response = await asyncio.to_thread(
        client.webhook_verification_key_get, request
    )
    jwk_data = response.key
    # Build a PyJWK from the raw JWK dict
    from jwt import PyJWK

    jwk_dict = {
        "kty": jwk_data.kty,
        "crv": jwk_data.crv,
        "x": jwk_data.x,
        "y": jwk_data.y,
        "use": jwk_data.use,
        "kid": jwk_data.kid,
        "alg": jwk_data.alg,
    }
    key = PyJWK.from_dict(jwk_dict)
    _plaid_key_cache[key_id] = (now, key.key)
    return key.key


async def verify_plaid_webhook_token(token: str, body: bytes) -> dict:
    """Verify the Plaid-Verification JWT against the request body.

    Returns the parsed webhook JSON body on success.
    Raises ``ValueError`` on verification failure.
    """
    # 1. Decode JWT header to get the key ID
    try:
        unverified_header = jwt.get_unverified_header(token)
    except jwt.DecodeError as exc:
        raise ValueError(f"Invalid webhook JWT header: {exc}") from exc

    key_id = unverified_header.get("kid")
    if not key_id:
        raise ValueError("Webhook JWT missing kid in header")

    # 2. Fetch the verification key from Plaid
    signing_key = await _get_plaid_verification_key(key_id)

    # 3. Verify and decode the JWT (Plaid uses ES256)
    try:
        claims = jwt.decode(
            token,
            signing_key,
            algorithms=["ES256"],
            options={"verify_aud": False},
        )
    except jwt.InvalidTokenError as exc:
        raise ValueError(f"Webhook JWT verification failed: {exc}") from exc

    # 4. Verify the body hash matches the claim
    expected_hash = claims.get("request_body_sha256")
    if not expected_hash:
        raise ValueError("Webhook JWT missing request_body_sha256 claim")

    actual_hash = hashlib.sha256(body).hexdigest()
    if actual_hash != expected_hash:
        raise ValueError("Webhook body hash mismatch")

    # 5. Check issued-at is not too old (5 min tolerance)
    iat = claims.get("iat", 0)
    if time.time() - iat > 300:
        raise ValueError("Webhook JWT is too old")

    return json.loads(body)


async def handle_transactions_webhook(
    db: AsyncSession, item_id: str, webhook_code: str
) -> int:
    """Handle a TRANSACTIONS webhook by syncing the affected item.

    For HISTORICAL_UPDATE, does a full /transactions/get pull to capture
    the complete history (up to 2 years) that Plaid has now finished
    processing. For other codes, uses incremental /transactions/sync.

    Returns the number of transactions synced.
    """
    stmt = select(PlaidItem).where(PlaidItem.item_id == item_id)
    result = await db.execute(stmt)
    plaid_item = result.scalars().first()

    if not plaid_item:
        logger.warning("Webhook for unknown item_id=%s", item_id)
        return 0

    access_token = decrypt(plaid_item.access_token)

    if webhook_code == "HISTORICAL_UPDATE":
        # Full history is now available — do a complete pull
        acct_stmt = select(Account).where(
            Account.item_id == item_id, Account.user_id == plaid_item.user_id
        )
        acct_result = await db.execute(acct_stmt)
        account_map = {
            acct.persistent_account_id: acct.id
            for acct in acct_result.scalars().all()
        }
        synced = await fetch_all_transactions(
            db, plaid_item.user_id, item_id, access_token, account_map
        )
    else:
        synced = await sync_transactions(
            db, plaid_item.user_id, item_id, access_token
        )

    # Consolidate any new categories from synced transactions
    if synced > 0:
        await consolidate_categories(db, plaid_item.user_id)

    await db.commit()

    logger.info(
        "WEBHOOK_SYNC item_id=%s code=%s synced=%d user=%s",
        item_id,
        webhook_code,
        synced,
        plaid_item.user_id,
    )
    return synced
