from datetime import datetime

from pydantic import BaseModel, field_validator


class UserCategoryCreateRequest(BaseModel):
    name: str
    color_id: int

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        import re
        v = v.strip()
        if not v:
            raise ValueError("name must not be empty")
        if len(v) > 100:
            raise ValueError("name exceeds maximum length")
        if not re.match(r"^[a-zA-Z0-9 &\-']+$", v):
            raise ValueError("name contains invalid characters")
        return v

    @field_validator("color_id")
    @classmethod
    def validate_color_id(cls, v: int) -> int:
        if not (1 <= v <= 24):
            raise ValueError("color_id must be between 1 and 24")
        return v


class UserCategoryUpdateRequest(BaseModel):
    name: str | None = None
    color_id: int | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str | None) -> str | None:
        if v is None:
            return v
        import re
        v = v.strip()
        if not v:
            raise ValueError("name must not be empty")
        if len(v) > 100:
            raise ValueError("name exceeds maximum length")
        if not re.match(r"^[a-zA-Z0-9 &\-']+$", v):
            raise ValueError("name contains invalid characters")
        return v

    @field_validator("color_id")
    @classmethod
    def validate_color_id(cls, v: int | None) -> int | None:
        if v is None:
            return v
        if not (1 <= v <= 24):
            raise ValueError("color_id must be between 1 and 24")
        return v


class UserCategoryResponse(BaseModel):
    id: str
    name: str
    color_id: int
    display_order: int | None = None
    transaction_count: int = 0
    created_at: datetime
    updated_at: datetime


class DeleteCategoryResponse(BaseModel):
    deleted: bool
    transactions_affected: int
