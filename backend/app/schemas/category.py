import re
from datetime import datetime

from pydantic import BaseModel, field_validator


class UserCategoryCreateRequest(BaseModel):
    name: str
    color: str

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("name must not be empty")
        if len(v) > 100:
            raise ValueError("name exceeds maximum length")
        if not re.match(r"^[a-zA-Z0-9 &\-']+$", v):
            raise ValueError("name contains invalid characters")
        return v

    @field_validator("color")
    @classmethod
    def validate_color(cls, v: str) -> str:
        v = v.strip()
        if not re.match(r"^#[0-9A-Fa-f]{6}$", v):
            raise ValueError("color must be a valid hex color (e.g. #9333EA)")
        return v


class UserCategoryUpdateRequest(BaseModel):
    name: str | None = None
    color: str | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.strip()
        if not v:
            raise ValueError("name must not be empty")
        if len(v) > 100:
            raise ValueError("name exceeds maximum length")
        if not re.match(r"^[a-zA-Z0-9 &\-']+$", v):
            raise ValueError("name contains invalid characters")
        return v

    @field_validator("color")
    @classmethod
    def validate_color(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.strip()
        if not re.match(r"^#[0-9A-Fa-f]{6}$", v):
            raise ValueError("color must be a valid hex color (e.g. #9333EA)")
        return v


class UserCategoryResponse(BaseModel):
    id: str
    name: str
    color: str
    display_order: int | None = None
    transaction_count: int = 0
    created_at: datetime
    updated_at: datetime


class DeleteCategoryResponse(BaseModel):
    deleted: bool
    transactions_affected: int
