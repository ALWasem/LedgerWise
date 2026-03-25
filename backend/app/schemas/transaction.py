import re

from pydantic import BaseModel, field_validator


class TokenRequest(BaseModel):
    access_token: str

    @field_validator("access_token")
    @classmethod
    def validate_token_format(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("access_token must not be empty")
        if len(v) > 512:
            raise ValueError("access_token exceeds maximum length")
        # Teller tokens are alphanumeric with underscores/hyphens
        if not re.match(r"^[a-zA-Z0-9_\-]+$", v):
            raise ValueError("access_token contains invalid characters")
        return v


class TransactionResponse(BaseModel):
    id: str
    date: str
    description: str
    amount: str
    account_name: str
    category: str


class AccountResponse(BaseModel):
    id: str
    teller_account_id: str
    institution_name: str | None
    account_name: str | None
    account_type: str | None
    account_subtype: str | None
