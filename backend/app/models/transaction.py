import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Index, Numeric, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Transaction(Base):
    __tablename__ = "transactions"
    __table_args__ = (
        UniqueConstraint("plaid_transaction_id", "account_id", name="uq_plaid_transaction_per_account"),
        Index("ix_transactions_account_id", "account_id"),
        Index("ix_transactions_date", "date"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    account_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("accounts.id", ondelete="CASCADE"),
        nullable=False,
    )
    provider: Mapped[str] = mapped_column(String(20), nullable=False, server_default="plaid")

    plaid_transaction_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    personal_finance_category_primary: Mapped[str | None] = mapped_column(String(100))
    personal_finance_category_detailed: Mapped[str | None] = mapped_column(String(100))
    payment_channel: Mapped[str | None] = mapped_column(String(20))
    pending: Mapped[bool] = mapped_column(Boolean, server_default="false", nullable=False)
    authorized_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    # Shared fields
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    category: Mapped[str | None] = mapped_column(String(100))
    merchant_name: Mapped[str | None] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(20), default="posted")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    account: Mapped["Account"] = relationship(back_populates="transactions")
