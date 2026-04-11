"""Category CRUD service."""

import logging

from sqlalchemy import delete, func, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.category import Category
from app.models.transaction import Transaction
from app.schemas.category import UserCategoryResponse

logger = logging.getLogger("ledgerwise.audit")

# --- Canonical 24-color palette (mirrors frontend CATEGORY_COLORS) ---
# color_id -> hex  (IDs are 1-indexed)
PALETTE_SIZE = 24


def _hash_color_id(name: str) -> int:
    """Deterministic hash-based color_id — same algorithm as the frontend."""
    h = 0
    for ch in name:
        h = (h * 31 + ord(ch)) & 0xFFFFFFFF
    # Convert to signed 32-bit then abs, matching JS (hash * 31 + charCode) | 0
    if h >= 0x80000000:
        h -= 0x100000000
    return (abs(h) % PALETTE_SIZE) + 1


def _normalize_name(raw: str) -> str:
    """Normalize a raw category string to title case (mirrors frontend normalizeCategory)."""
    return raw.replace('_', ' ').title()


def _find_best_match(name: str, existing: list[str]) -> str | None:
    """Find an existing category that is similar enough to consolidate.

    Match rules (applied in order):
      1. Exact match (case-insensitive)
      2. All tokens of the shorter name appear in the longer name
         e.g. "rent" matches "Rent And Utilities"
    """
    name_lower = name.lower()
    name_tokens = set(name_lower.split())

    for existing_name in existing:
        existing_lower = existing_name.lower()

        # Exact match
        if name_lower == existing_lower:
            return existing_name

        existing_tokens = set(existing_lower.split())

        # All tokens of the shorter name appear in the longer name
        shorter, longer = (
            (name_tokens, existing_tokens)
            if len(name_tokens) <= len(existing_tokens)
            else (existing_tokens, name_tokens)
        )
        if shorter and shorter.issubset(longer):
            return existing_name

    return None


def _to_response(cat: Category, transaction_count: int = 0) -> UserCategoryResponse:
    return UserCategoryResponse(
        id=str(cat.id),
        name=cat.name,
        color_id=cat.color_id,
        display_order=cat.display_order,
        transaction_count=transaction_count,
        created_at=cat.created_at,
        updated_at=cat.updated_at,
    )


async def _count_transactions_for_category(
    db: AsyncSession, user_id: str, category_name: str,
) -> int:
    """Count spending transactions matching a category name for a user.

    Normalizes underscores to spaces so Plaid raw categories match user-facing names.
    """
    result = await db.execute(
        select(func.count())
        .select_from(Transaction)
        .join(Account, Transaction.account_id == Account.id)
        .where(
            Account.user_id == user_id,
            func.replace(func.lower(Transaction.category), '_', ' ') == category_name.lower().replace('_', ' '),
        )
    )
    return result.scalar_one()


async def _get_taken_color_ids(db: AsyncSession, user_id: str) -> set[int]:
    """Return the set of color_ids already used by this user's categories."""
    result = await db.execute(
        select(Category.color_id).where(Category.user_id == user_id)
    )
    return {row[0] for row in result.all()}


async def _pick_available_color_id(
    db: AsyncSession, user_id: str, preferred: int, exclude_category_id: str | None = None,
) -> int:
    """Return preferred color_id if available, otherwise the first free one."""
    result = await db.execute(
        select(Category.color_id).where(
            Category.user_id == user_id,
            *([Category.id != exclude_category_id] if exclude_category_id else []),
        )
    )
    taken = {row[0] for row in result.all()}

    if preferred not in taken:
        return preferred
    for candidate in range(1, PALETTE_SIZE + 1):
        if candidate not in taken:
            return candidate
    # All 24 taken — should be impossible in practice, but return preferred anyway
    return preferred


async def list_categories(
    db: AsyncSession, user_id: str,
) -> list[UserCategoryResponse]:
    # Single query: fetch categories with transaction counts via LEFT JOIN
    # Normalize underscores to spaces so Plaid raw categories match user-facing names
    user_account_ids = select(Account.id).where(Account.user_id == user_id)
    cat_name_expr = func.replace(func.lower(Transaction.category), '_', ' ').label("cat_name")
    count_subq = (
        select(
            cat_name_expr,
            func.count().label("txn_count"),
        )
        .where(Transaction.account_id.in_(user_account_ids))
        .where(Transaction.category.isnot(None))
        .group_by(cat_name_expr)
        .subquery()
    )

    stmt = (
        select(Category, func.coalesce(count_subq.c.txn_count, 0))
        .outerjoin(
            count_subq,
            func.replace(func.lower(Category.name), '_', ' ') == count_subq.c.cat_name,
        )
        .where(Category.user_id == user_id)
        .order_by(
            Category.display_order.asc().nullslast(),
            Category.created_at.asc(),
        )
    )
    result = await db.execute(stmt)
    rows = result.all()

    return [_to_response(cat, count) for cat, count in rows]


async def create_category(
    db: AsyncSession, user_id: str, name: str, color_id: int,
) -> UserCategoryResponse:
    # Validate color_id uniqueness for this user
    taken = await _get_taken_color_ids(db, user_id)
    if color_id in taken:
        raise ValueError(f"Color {color_id} is already assigned to another category.")

    cat = Category(user_id=user_id, name=name, color_id=color_id)
    db.add(cat)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise ValueError("A category with this name already exists.")
    except Exception:
        await db.rollback()
        raise
    await db.refresh(cat)

    count = await _count_transactions_for_category(db, user_id, name)
    return _to_response(cat, count)


async def update_category(
    db: AsyncSession,
    user_id: str,
    category_id: str,
    name: str | None = None,
    color_id: int | None = None,
) -> UserCategoryResponse | None:
    result = await db.execute(
        select(Category).where(
            Category.id == category_id,
            Category.user_id == user_id,
        )
    )
    cat = result.scalar_one_or_none()
    if not cat:
        return None

    old_name = cat.name

    if name is not None:
        cat.name = name

    if color_id is not None:
        # Validate color_id uniqueness (excluding this category)
        taken_result = await db.execute(
            select(Category.color_id).where(
                Category.user_id == user_id,
                Category.id != category_id,
            )
        )
        taken = {row[0] for row in taken_result.all()}
        if color_id in taken:
            raise ValueError(f"Color {color_id} is already assigned to another category.")
        cat.color_id = color_id

    # Cascade rename to matching transactions
    # Normalize underscores to spaces so Plaid raw categories (e.g. "food_and_drink")
    # match user-facing names (e.g. "Food And Drink")
    if name is not None and name != old_name:
        user_account_ids = select(Account.id).where(Account.user_id == user_id)
        await db.execute(
            update(Transaction)
            .where(
                Transaction.account_id.in_(user_account_ids),
                func.replace(func.lower(Transaction.category), '_', ' ') == old_name.lower().replace('_', ' '),
            )
            .values(category=name.lower())
        )

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise ValueError("A category with this name already exists.")
    except Exception:
        await db.rollback()
        raise
    await db.refresh(cat)

    count = await _count_transactions_for_category(db, user_id, cat.name)
    return _to_response(cat, count)


async def delete_category(
    db: AsyncSession, user_id: str, category_id: str,
) -> tuple[bool, int]:
    """Delete a category and nullify matching transactions.

    Returns (found, transactions_affected).
    """
    result = await db.execute(
        select(Category).where(
            Category.id == category_id,
            Category.user_id == user_id,
        )
    )
    cat = result.scalar_one_or_none()
    if not cat:
        return False, 0

    category_name = cat.name

    # Nullify transactions matching this category
    # Normalize underscores to spaces so Plaid raw categories match
    user_account_ids = select(Account.id).where(Account.user_id == user_id)
    txn_result = await db.execute(
        update(Transaction)
        .where(
            Transaction.account_id.in_(user_account_ids),
            func.replace(func.lower(Transaction.category), '_', ' ') == category_name.lower().replace('_', ' '),
        )
        .values(category=None)
    )
    affected = txn_result.rowcount

    await db.execute(
        delete(Category).where(
            Category.id == category_id,
            Category.user_id == user_id,
        )
    )

    try:
        await db.commit()
    except Exception:
        await db.rollback()
        raise
    return True, affected


async def consolidate_categories(
    db: AsyncSession, user_id: str,
) -> int:
    """Auto-create Category entries and consolidate similar names after a sync.

    1. Collects distinct transaction categories for the user.
    2. For each, finds a matching existing Category (exact or token-subset).
       If matched, renames the transactions to the existing category name.
       If unmatched, creates a new Category entry with a hash-based color_id.
    3. Skips 'general' / null categories.

    Returns the number of new Category entries created.
    """
    user_account_ids = select(Account.id).where(Account.user_id == user_id)

    # Distinct raw category strings from this user's transactions
    raw_stmt = (
        select(Transaction.category)
        .where(
            Transaction.account_id.in_(user_account_ids),
            Transaction.category.isnot(None),
        )
        .distinct()
    )
    raw_result = await db.execute(raw_stmt)
    raw_categories: list[str] = [r[0] for r in raw_result.all()]

    # Existing user categories from DB
    cat_stmt = select(Category).where(Category.user_id == user_id)
    cat_result = await db.execute(cat_stmt)
    existing_cats: list[Category] = list(cat_result.scalars().all())
    existing_names: list[str] = [c.name for c in existing_cats]
    taken_ids: set[int] = {c.color_id for c in existing_cats}

    created = 0

    for raw in raw_categories:
        normalized = _normalize_name(raw)
        if normalized.lower() == "general" or not normalized.strip():
            continue

        # Check if a Category entry already covers this name
        match = _find_best_match(normalized, existing_names)

        if match:
            # Consolidate: rename transactions to the existing category name
            match_lower = match.lower()
            raw_normalized_lower = normalized.lower()
            if raw_normalized_lower != match_lower:
                await db.execute(
                    update(Transaction)
                    .where(
                        Transaction.account_id.in_(user_account_ids),
                        func.replace(func.lower(Transaction.category), '_', ' ')
                        == raw_normalized_lower,
                    )
                    .values(category=match_lower)
                )
        else:
            # New category — create DB entry with hash-based color_id
            preferred_id = _hash_color_id(normalized)
            # Find an available color_id
            color_id = preferred_id
            if color_id in taken_ids:
                for candidate in range(1, PALETTE_SIZE + 1):
                    if candidate not in taken_ids:
                        color_id = candidate
                        break

            cat = Category(user_id=user_id, name=normalized, color_id=color_id)
            db.add(cat)
            existing_names.append(normalized)
            taken_ids.add(color_id)
            created += 1

    if created:
        logger.info(
            "Auto-created %d categories for user=%s", created, user_id,
        )

    return created
