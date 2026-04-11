"""migrate category color to color_id

Revision ID: a4b5c6d7e8f9
Revises: 95344dc6bc02
Create Date: 2026-04-10 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a4b5c6d7e8f9'
down_revision: Union[str, Sequence[str], None] = '95344dc6bc02'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Canonical palette: hex -> color_id
HEX_TO_ID: dict[str, int] = {
    '#EF4444': 1,  '#F97316': 2,  '#F43F5E': 3,  '#EC4899': 4,
    '#D946EF': 5,  '#8B5CF6': 6,  '#6366F1': 7,  '#3B82F6': 8,
    '#0EA5E9': 9,  '#06B6D4': 10, '#14B8A6': 11, '#10B981': 12,
    '#22C55E': 13, '#84CC16': 14, '#EAB308': 15, '#78716C': 16,
    '#6B7280': 17, '#64748B': 18, '#A78BFA': 19, '#FB923C': 20,
    '#38BDF8': 21, '#4ADE80': 22, '#FB7185': 23, '#2DD4BF': 24,
}

# Old palette colors that are NOT in the new canonical palette — map by closest hue
OLD_HEX_TO_NEAREST: dict[str, int] = {
    '#9333EA': 6,   # old brand purple -> Violet
    '#DC2626': 1,   # Crimson -> Red
    '#E67E22': 20,  # Amber -> Tangerine
    '#65A30D': 14,  # Olive -> Lime
    '#818CF8': 19,  # Slate Blue -> Lavender
    '#16A34A': 13,  # Warm Green -> Green
    '#7C3AED': 6,   # Violet (old) -> Violet
    '#B45309': 20,  # Bronze -> Tangerine
    '#475569': 18,  # Graphite -> Slate
    # Pastel colors from CategoryBottomSheet
    '#D8B4FE': 19,  # light purple -> Lavender
    '#FBBF24': 15,  # yellow -> Yellow
    '#86EFAC': 22,  # light green -> Mint
    '#99F6E4': 24,  # light teal -> Aqua
    '#C4B5FD': 19,  # light violet -> Lavender
    '#22D3EE': 10,  # light cyan -> Cyan
    '#F9A8D4': 4,   # light pink -> Pink
    '#A3E635': 14,  # lime -> Lime
}


def _resolve_color_id(hex_val: str) -> int:
    """Map a hex color to a canonical color_id."""
    upper = hex_val.upper().strip()
    # Normalize: the palette uses mixed case; compare case-insensitively
    for h, cid in HEX_TO_ID.items():
        if h.upper() == upper:
            return cid
    for h, cid in OLD_HEX_TO_NEAREST.items():
        if h.upper() == upper:
            return cid
    # Fallback: hash the hex string to pick an ID (1-24)
    hash_val = 0
    for ch in upper:
        hash_val = (hash_val * 31 + ord(ch)) & 0xFFFFFFFF
    return (hash_val % 24) + 1


def upgrade() -> None:
    """Migrate color (hex string) -> color_id (integer)."""
    # 1. Add color_id column (nullable initially for data migration)
    op.add_column('categories', sa.Column('color_id', sa.Integer(), nullable=True))

    # 2. Migrate data: convert hex values to IDs
    conn = op.get_bind()
    rows = conn.execute(
        sa.text("SELECT id, user_id, color FROM categories ORDER BY created_at ASC")
    ).fetchall()

    # Track which color_ids are taken per user to avoid unique constraint violations
    user_taken: dict[str, set[int]] = {}

    for row in rows:
        cat_id, user_id, hex_color = row[0], str(row[1]), row[2]
        taken = user_taken.setdefault(str(user_id), set())

        color_id = _resolve_color_id(hex_color)

        # If this color_id is already taken for this user, find next available
        if color_id in taken:
            for candidate in range(1, 25):
                if candidate not in taken:
                    color_id = candidate
                    break

        taken.add(color_id)
        conn.execute(
            sa.text("UPDATE categories SET color_id = :cid WHERE id = :cat_id"),
            {"cid": color_id, "cat_id": cat_id},
        )

    # 3. Make color_id non-nullable now that all rows have values
    op.alter_column('categories', 'color_id', nullable=False)

    # 4. Drop old color column
    op.drop_column('categories', 'color')

    # 5. Add CHECK constraint (1-24)
    op.create_check_constraint(
        'ck_categories_color_id_range',
        'categories',
        'color_id >= 1 AND color_id <= 24',
    )

    # 6. Add UNIQUE constraint on (user_id, color_id)
    op.create_unique_constraint(
        'uq_category_color_per_user',
        'categories',
        ['user_id', 'color_id'],
    )


def downgrade() -> None:
    """Revert color_id back to color hex string."""
    # Reverse lookup: id -> hex
    ID_TO_HEX = {v: k for k, v in HEX_TO_ID.items()}

    op.drop_constraint('uq_category_color_per_user', 'categories', type_='unique')
    op.drop_constraint('ck_categories_color_id_range', 'categories', type_='check')

    # Add color column back
    op.add_column('categories', sa.Column('color', sa.String(length=7), nullable=True))

    # Convert color_id back to hex
    conn = op.get_bind()
    for cid, hex_val in ID_TO_HEX.items():
        conn.execute(
            sa.text("UPDATE categories SET color = :hex WHERE color_id = :cid"),
            {"hex": hex_val, "cid": cid},
        )

    op.alter_column('categories', 'color', nullable=False)
    op.drop_column('categories', 'color_id')
