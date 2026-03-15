from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.services import teller as teller_service

router = APIRouter(prefix="/teller", tags=["teller"])


class TokenRequest(BaseModel):
    access_token: str


@router.post("/transactions")
async def fetch_transactions(
    body: TokenRequest, db: AsyncSession = Depends(get_db)
) -> list[dict]:
    # TODO: re-enable live Teller data when ready
    # try:
    #     return teller_service.get_all_transactions(body.access_token)
    # except Exception as exc:
    #     raise HTTPException(status_code=502, detail=str(exc)) from exc

    return await teller_service.get_transactions_from_db(db)
