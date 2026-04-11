import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class MerchantRule(Base):
    __tablename__ = "merchant_rules"
    __table_args__ = (
        UniqueConstraint(
            "user_id", "merchant_pattern", "match_field",
            name="uq_merchant_rule_per_user",
        ),
        Index("ix_merchant_rules_user_id", "user_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    merchant_pattern: Mapped[str] = mapped_column(String(500), nullable=False)
    category_name: Mapped[str] = mapped_column(String(100), nullable=False)
    match_field: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default="merchant_name"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
