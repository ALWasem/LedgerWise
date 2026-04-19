"""remove teller columns and constraints

Revision ID: e6f7a8b9c0d1
Revises: d5e6f7a8b9c0
Create Date: 2026-04-19 12:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e6f7a8b9c0d1"
down_revision: Union[str, None] = "d5e6f7a8b9c0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop Teller-specific unique constraints
    op.drop_constraint("uq_account_per_user", "accounts", type_="unique")
    op.drop_constraint("uq_transaction_per_account", "transactions", type_="unique")

    # Drop provider CHECK constraints that allowed 'teller' or 'plaid'
    op.drop_constraint("ck_accounts_provider", "accounts", type_="check")
    op.drop_constraint("ck_transactions_provider", "transactions", type_="check")

    # Drop Teller-specific columns from accounts
    op.drop_column("accounts", "teller_account_id")
    op.drop_column("accounts", "teller_access_token")

    # Drop Teller-specific column from transactions
    op.drop_column("transactions", "teller_transaction_id")

    # Update provider default from 'teller' to 'plaid'
    op.alter_column(
        "accounts",
        "provider",
        server_default="plaid",
    )
    op.alter_column(
        "transactions",
        "provider",
        server_default="plaid",
    )


def downgrade() -> None:
    # Restore provider default to 'teller'
    op.alter_column(
        "transactions",
        "provider",
        server_default="teller",
    )
    op.alter_column(
        "accounts",
        "provider",
        server_default="teller",
    )

    # Re-add Teller columns
    op.add_column(
        "transactions",
        sa.Column("teller_transaction_id", sa.String(255), nullable=True),
    )
    op.add_column(
        "accounts",
        sa.Column("teller_access_token", sa.String(512), nullable=True),
    )
    op.add_column(
        "accounts",
        sa.Column("teller_account_id", sa.String(255), nullable=True),
    )

    # Re-add Teller constraints
    op.create_unique_constraint(
        "uq_transaction_per_account", "transactions", ["teller_transaction_id", "account_id"]
    )
    op.create_unique_constraint(
        "uq_account_per_user", "accounts", ["teller_account_id", "user_id"]
    )

    # Re-add provider CHECK constraints
    op.create_check_constraint(
        "ck_accounts_provider", "accounts", "provider IN ('teller', 'plaid')"
    )
    op.create_check_constraint(
        "ck_transactions_provider", "transactions", "provider IN ('teller', 'plaid')"
    )
