import logging

from fastapi import APIRouter, Depends, HTTPException, Path
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.middleware.auth import get_current_user_id, require_pro_user
from app.schemas import MerchantMatchPreview, MerchantRuleCreateRequest, MerchantRuleResponse
from app.services import merchant_rule as merchant_rule_service
from app.utils.logging import log_data_access
from app.utils.validation import TRANSACTION_ID_PATTERN

logger = logging.getLogger("ledgerwise.audit")

router = APIRouter(prefix="/merchant-rules", tags=["merchant-rules"])


@router.get(
    "/preview/{transaction_id}",
    response_model=MerchantMatchPreview,
    responses={204: {"description": "No other transactions match this merchant"}},
)
async def preview_match(
    transaction_id: str = Path(..., max_length=255),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> MerchantMatchPreview | Response:
    """Preview how many other transactions share the same merchant."""
    if not TRANSACTION_ID_PATTERN.match(transaction_id):
        raise HTTPException(status_code=400, detail="Invalid transaction ID format.")
    log_data_access(user_id, f"merchant_rule_preview:{transaction_id}")
    try:
        result = await merchant_rule_service.preview_merchant_match(
            db, user_id, transaction_id
        )
    except Exception:
        logger.error(
            "Failed merchant match preview for user=%s transaction=%s",
            user_id,
            transaction_id,
            exc_info=True,
        )
        raise HTTPException(status_code=500, detail="Failed to preview merchant match.")
    if result is None:
        return Response(status_code=204)
    return result


@router.post("/", response_model=MerchantRuleResponse, status_code=201)
async def create_rule(
    body: MerchantRuleCreateRequest,
    user_id: str = Depends(require_pro_user),
    db: AsyncSession = Depends(get_db),
) -> MerchantRuleResponse:
    """Create a merchant rule and batch-apply to all matching transactions."""
    log_data_access(user_id, f"merchant_rule_create:{body.transaction_id}")
    try:
        return await merchant_rule_service.create_rule_and_apply(
            db, user_id, body.transaction_id, body.category_name
        )
    except ValueError:
        raise HTTPException(status_code=404, detail="Transaction not found.")
    except Exception:
        logger.error(
            "Failed to create merchant rule for user=%s transaction=%s",
            user_id,
            body.transaction_id,
            exc_info=True,
        )
        raise HTTPException(status_code=500, detail="Failed to create merchant rule.")
