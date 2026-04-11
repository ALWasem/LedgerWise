import re
from datetime import datetime

from pydantic import BaseModel, field_validator


class MerchantRuleCreateRequest(BaseModel):
    transaction_id: str
    category_name: str

    @field_validator("transaction_id")
    @classmethod
    def validate_transaction_id(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("transaction_id must not be empty")
        if len(v) > 255:
            raise ValueError("transaction_id exceeds maximum length")
        if not re.match(r"^[a-zA-Z0-9_\-]+$", v):
            raise ValueError("transaction_id contains invalid characters")
        return v

    @field_validator("category_name")
    @classmethod
    def validate_category_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("category_name must not be empty")
        if len(v) > 100:
            raise ValueError("category_name exceeds maximum length")
        if not re.match(r"^[a-zA-Z0-9 &\-']+$", v):
            raise ValueError("category_name contains invalid characters")
        return v


class MerchantRuleResponse(BaseModel):
    id: str
    merchant_pattern: str
    match_field: str
    category_name: str
    transactions_updated: int
    created_at: datetime


class MerchantMatchPreview(BaseModel):
    merchant_pattern: str
    match_field: str
    matching_count: int
