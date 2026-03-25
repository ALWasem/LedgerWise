"""Spending summary aggregation service."""

from datetime import date

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Account, Transaction
from app.schemas import CategoryResponse, SpendingSummaryResponse


def _title_case(s: str) -> str:
    """Title-case a category name."""
    return " ".join(w.capitalize() for w in s.split())


def _build_category_label():
    """SQL expression that normalizes null/empty categories to 'General'."""
    return case(
        (Transaction.category.is_(None), "General"),
        (Transaction.category == "", "General"),
        else_=Transaction.category,
    )


def _is_payment():
    """SQL expression that detects CC payments by description keywords."""
    desc_lower = func.lower(func.coalesce(Transaction.description, ""))
    return desc_lower.like("%pymt%") | desc_lower.like("%payment%")


def _spending_filter():
    """SQL filter that excludes payments and refunds from spending totals."""
    excluded = ["payment", "refund"]
    category_ok = func.lower(func.coalesce(Transaction.category, "")).notin_(excluded)
    not_payment = ~_is_payment()
    return category_ok & not_payment


async def _query_category_totals(
    db: AsyncSession,
    category_label,
    spending_filter,
    user_id: str,
    start_date: date | None = None,
    end_date: date | None = None,
):
    """Query spending totals grouped by category, scoped to a user."""
    base = (
        select(
            category_label.label("category"),
            func.sum(Transaction.amount).label("total"),
            func.count().label("count"),
        )
        .join(Account, Transaction.account_id == Account.id)
        .where(Account.user_id == user_id)
    )

    if start_date:
        base = base.where(Transaction.date >= start_date)
    if end_date:
        base = base.where(Transaction.date <= end_date)

    stmt = (
        base.where(Transaction.amount > 0, spending_filter)
        .group_by(category_label)
        .order_by(func.sum(Transaction.amount).desc())
    )
    result = await db.execute(stmt)
    rows = result.all()

    return rows


async def _query_refund_totals(
    db: AsyncSession,
    user_id: str,
    start_date: date | None = None,
    end_date: date | None = None,
) -> tuple[float, int]:
    """Query aggregate refund total and count (negative amounts that aren't CC payments)."""
    refund_by_category = func.lower(func.coalesce(Transaction.category, "")) == "refund"
    refund_by_amount = (Transaction.amount < 0) & ~_is_payment()
    refund_filter = refund_by_category | refund_by_amount

    base = (
        select(
            func.sum(func.abs(Transaction.amount)).label("total"),
            func.count().label("count"),
        )
        .join(Account, Transaction.account_id == Account.id)
        .where(Account.user_id == user_id)
    )

    if start_date:
        base = base.where(Transaction.date >= start_date)
    if end_date:
        base = base.where(Transaction.date <= end_date)

    stmt = base.where(refund_filter)
    result = await db.execute(stmt)
    row = result.one()
    return round(float(row.total or 0), 2), row.count or 0


def _build_categories(
    rows, total_spent: float
) -> tuple[list[CategoryResponse], int, float]:
    """Build category list and extract uncategorized stats."""
    categories: list[CategoryResponse] = []
    uncategorized_count = 0
    uncategorized_pct = 0.0

    for row in rows:
        pct = (float(row.total) / total_spent * 100) if total_spent else 0
        name = _title_case(row.category)
        categories.append(CategoryResponse(
            name=name,
            total=round(float(row.total), 2),
            count=row.count,
            percentage=round(pct, 1),
        ))
        if name == "General":
            uncategorized_count = row.count
            uncategorized_pct = (
                round(float(row.total) / total_spent * 100, 1) if total_spent else 0
            )

    return categories, uncategorized_count, uncategorized_pct


async def get_spending_summary(
    db: AsyncSession,
    user_id: str,
    start_date: date | None = None,
    end_date: date | None = None,
) -> SpendingSummaryResponse:
    """Aggregate spending data by category, optionally scoped to a user and date range."""
    category_label = _build_category_label()
    rows = await _query_category_totals(
        db, category_label, _spending_filter(), user_id, start_date, end_date
    )

    total_spent = sum(float(r.total) for r in rows)
    transaction_count = sum(r.count for r in rows)

    categories, uncategorized_count, uncategorized_pct = _build_categories(
        rows, total_spent
    )
    refund_total, refund_count = await _query_refund_totals(
        db, user_id, start_date, end_date
    )

    return SpendingSummaryResponse(
        total_spent=round(total_spent, 2),
        transaction_count=transaction_count,
        category_count=len(categories),
        categories=categories,
        uncategorized_count=uncategorized_count,
        uncategorized_percentage=uncategorized_pct,
        refund_total=refund_total,
        refund_count=refund_count,
    )
