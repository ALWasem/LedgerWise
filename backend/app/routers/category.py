"""Category management endpoints."""

import logging
import re

from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.middleware.auth import get_current_user_id
from app.schemas.category import (
    DeleteCategoryResponse,
    UserCategoryCreateRequest,
    UserCategoryResponse,
    UserCategoryUpdateRequest,
)
from app.services import category as category_service
from app.utils.logging import log_data_access, log_security_event

_UUID_PATTERN = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.IGNORECASE,
)

logger = logging.getLogger("ledgerwise.audit")

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("/", response_model=list[UserCategoryResponse])
async def list_categories(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> list[UserCategoryResponse]:
    log_data_access(user_id, "categories")
    try:
        return await category_service.list_categories(db, user_id)
    except Exception:
        logger.error("Failed to list categories for user=%s", user_id, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve categories.")


@router.post("/", response_model=UserCategoryResponse, status_code=201)
async def create_category(
    body: UserCategoryCreateRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> UserCategoryResponse:
    log_security_event("category_create", {"user_id": user_id, "name": body.name})
    try:
        return await category_service.create_category(
            db, user_id, body.name, body.color_id,
        )
    except ValueError as exc:
        detail = str(exc)
        status = 409 if "already" in detail.lower() else 422
        raise HTTPException(status_code=status, detail=detail)
    except Exception:
        logger.error("Failed to create category for user=%s", user_id, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create category.")


def _validate_category_id(category_id: str) -> None:
    if not _UUID_PATTERN.match(category_id):
        raise HTTPException(status_code=400, detail="Invalid category ID format.")


@router.patch("/{category_id}", response_model=UserCategoryResponse)
async def update_category(
    category_id: str = Path(..., max_length=36),
    body: UserCategoryUpdateRequest = ...,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> UserCategoryResponse:
    _validate_category_id(category_id)
    log_security_event(
        "category_update", {"user_id": user_id, "category_id": category_id},
    )
    try:
        result = await category_service.update_category(
            db, user_id, category_id, name=body.name, color_id=body.color_id,
        )
    except ValueError as exc:
        detail = str(exc)
        status = 409 if "already" in detail.lower() else 422
        raise HTTPException(status_code=status, detail=detail)
    except Exception:
        logger.error("Failed to update category for user=%s", user_id, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update category.")

    if result is None:
        raise HTTPException(status_code=404, detail="Category not found.")
    return result


@router.delete("/{category_id}", response_model=DeleteCategoryResponse)
async def delete_category(
    category_id: str = Path(..., max_length=36),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> DeleteCategoryResponse:
    _validate_category_id(category_id)
    log_security_event(
        "category_delete", {"user_id": user_id, "category_id": category_id},
    )
    try:
        found, affected = await category_service.delete_category(
            db, user_id, category_id,
        )
    except Exception:
        logger.error("Failed to delete category for user=%s", user_id, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to delete category.")

    if not found:
        raise HTTPException(status_code=404, detail="Category not found.")

    return DeleteCategoryResponse(deleted=True, transactions_affected=affected)
