"""enable RLS on categories and merchant_category_rules

Revision ID: f1a2b3c4d5e6
Revises: e6f7a8b9c0d1
Create Date: 2026-04-20 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "f1a2b3c4d5e6"
down_revision: str = "e6f7a8b9c0d1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Enable RLS on categories and merchant_rules tables."""

    # ── categories table ─────────────────────────────────────────────
    op.execute("ALTER TABLE categories ENABLE ROW LEVEL SECURITY")
    op.execute("""
        CREATE POLICY categories_user_isolation ON categories
            FOR ALL
            USING (user_id = auth.uid())
            WITH CHECK (user_id = auth.uid())
    """)

    # ── merchant_rules table ─────────────────────────────────────────
    op.execute("ALTER TABLE merchant_rules ENABLE ROW LEVEL SECURITY")
    op.execute("""
        CREATE POLICY merchant_rules_user_isolation ON merchant_rules
            FOR ALL
            USING (user_id = auth.uid())
            WITH CHECK (user_id = auth.uid())
    """)


def downgrade() -> None:
    """Remove RLS policies from categories and merchant_rules."""

    op.execute("DROP POLICY IF EXISTS merchant_rules_user_isolation ON merchant_rules")
    op.execute("ALTER TABLE merchant_rules DISABLE ROW LEVEL SECURITY")

    op.execute("DROP POLICY IF EXISTS categories_user_isolation ON categories")
    op.execute("ALTER TABLE categories DISABLE ROW LEVEL SECURITY")
