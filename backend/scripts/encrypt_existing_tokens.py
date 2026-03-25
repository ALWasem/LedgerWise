"""One-time migration: encrypt any plaintext Teller tokens already in the DB.

Run from backend/:
    python -m scripts.encrypt_existing_tokens

Safe to run multiple times — skips tokens that are already base64 (encrypted).
"""

import asyncio
import base64
import sys
from pathlib import Path

# Ensure backend/ is on the path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import async_session
from app.models import Account
from app.utils.encryption import encrypt


def _looks_encrypted(token: str) -> bool:
    """Encrypted tokens are base64-encoded; raw Teller tokens are alphanumeric."""
    try:
        raw = base64.b64decode(token, validate=True)
        # AES-GCM output: 12-byte nonce + >=16-byte ciphertext+tag
        return len(raw) >= 28
    except Exception:
        return False


async def migrate() -> None:
    async with async_session() as session:
        result = await session.execute(select(Account))
        accounts = result.scalars().all()

        migrated = 0
        skipped = 0

        for acct in accounts:
            if _looks_encrypted(acct.teller_access_token):
                skipped += 1
                continue

            encrypted = encrypt(acct.teller_access_token)
            await session.execute(
                update(Account)
                .where(Account.id == acct.id)
                .values(teller_access_token=encrypted)
            )
            migrated += 1

        await session.commit()
        print(f"Done. Encrypted: {migrated}, Already encrypted: {skipped}")


if __name__ == "__main__":
    asyncio.run(migrate())
