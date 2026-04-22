"""add pending_transaction_id to transactions

Revision ID: 84c956a7de41
Revises: 4137a9c45c5a
Create Date: 2026-04-20 19:41:00.527521

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '84c956a7de41'
down_revision: Union[str, Sequence[str], None] = '4137a9c45c5a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('transactions', sa.Column('pending_transaction_id', sa.String(length=255), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('transactions', 'pending_transaction_id')
