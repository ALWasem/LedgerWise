import re
from datetime import datetime

from pydantic import BaseModel, field_validator

from app.schemas.merchant_rule import MerchantMatchPreview


class TransactionResponse(BaseModel):
    id: str
    date: str
    description: str
    amount: str
    account_name: str
    category: str
    provider: str = "plaid"
    merchant_name: str | None = None
    personal_finance_category_primary: str | None = None
    personal_finance_category_detailed: str | None = None
    payment_channel: str | None = None
    pending: bool = False
    authorized_date: str | None = None
    plaid_transaction_id: str | None = None
    merchant_match: MerchantMatchPreview | None = None


class CategoryUpdateRequest(BaseModel):
    category: str

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("category must not be empty")
        if len(v) > 100:
            raise ValueError("category exceeds maximum length")
        if not re.match(r"^[a-zA-Z0-9 &\-']+$", v):
            raise ValueError("category contains invalid characters")
        return v


class AccountResponse(BaseModel):
    id: str
    provider: str = "plaid"
    institution_name: str | None = None
    account_name: str | None = None
    account_type: str | None = None
    account_subtype: str | None = None
    balance_current: str | None = None
    balance_limit: str | None = None
    item_id: str | None = None
    persistent_account_id: str | None = None
    last_synced_at: datetime | None = None
    created_at: datetime | None = None


class PlaidItemResponse(BaseModel):
    id: str
    item_id: str
    institution_id: str | None = None
    institution_name: str | None = None
    last_synced_at: datetime | None = None
    created_at: datetime | None = None


class LinkTokenCreateRequest(BaseModel):
    received_redirect_uri: str | None = None

    @field_validator("received_redirect_uri")
    @classmethod
    def validate_redirect_uri(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.strip()
        if not v:
            return None
        if len(v) > 2048:
            raise ValueError("received_redirect_uri exceeds maximum length")
        if not v.startswith("https://"):
            raise ValueError("received_redirect_uri must use HTTPS")
        return v


class LinkTokenResponse(BaseModel):
    link_token: str


class ExchangeTokenResponse(BaseModel):
    item: PlaidItemResponse
    accounts: list[AccountResponse]


class SyncResponse(BaseModel):
    synced: int


class BackfillResponse(BaseModel):
    fetched: int


class PublicTokenRequest(BaseModel):
    public_token: str

    @field_validator("public_token")
    @classmethod
    def validate_public_token(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("public_token must not be empty")
        if len(v) > 512:
            raise ValueError("public_token exceeds maximum length")
        if not re.match(r"^[a-zA-Z0-9_\-]+$", v):
            raise ValueError("public_token contains invalid characters")
        return v
