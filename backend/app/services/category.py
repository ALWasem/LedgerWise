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

# --- Color palette (mirrors frontend src/utils/categoryColors.ts) ---

_CATEGORY_COLORS = [
    '#9333EA', '#10B981', '#F43F5E', '#0EA5E9',
    '#F97316', '#14B8A6', '#D946EF', '#84CC16',
    '#3B82F6', '#DC2626', '#06B6D4', '#E67E22',
    '#6366F1', '#22C55E', '#EC4899', '#65A30D',
    '#818CF8', '#EF4444', '#16A34A', '#7C3AED',
    '#B45309', '#64748B', '#475569',
]


def _hash_color(name: str) -> str:
    """Deterministic hash-based color — same algorithm as the frontend."""
    h = 0
    for ch in name:
        h = (h * 31 + ord(ch)) & 0xFFFFFFFF
    # Convert to signed 32-bit then abs, matching JS (hash * 31 + charCode) | 0
    if h >= 0x80000000:
        h -= 0x100000000
    return _CATEGORY_COLORS[abs(h) % len(_CATEGORY_COLORS)]


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
        color=cat.color,
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
    db: AsyncSession, user_id: str, name: str, color: str,
) -> UserCategoryResponse:
    cat = Category(user_id=user_id, name=name, color=color)
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
    color: str | None = None,
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
    if color is not None:
        cat.color = color

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
       If unmatched, creates a new Category entry with a hash-based color.
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
            # New category — create DB entry with hash-based color
            color = _hash_color(normalized)
            cat = Category(user_id=user_id, name=normalized, color=color)
            db.add(cat)
            existing_names.append(normalized)
            created += 1

    if created:
        logger.info(
            "Auto-created %d categories for user=%s", created, user_id,
        )

    return created
