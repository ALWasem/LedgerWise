"""One-time script to backfill categories for all existing users.

Scans each user's transactions and creates Category rows for any
categories that don't already have entries in the categories table.

Usage:
    cd backend
    python -m scripts.backfill_categories
"""

import asyncio
import logging
import sys

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.models.user import User
from app.services.category import consolidate_categories

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)


async def main() -> None:
    db_url = settings.database_url
    if not db_url:
        logger.error("DATABASE_URL not set")
        sys.exit(1)

    # Ensure async driver
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    engine = create_async_engine(db_url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as db:
        result = await db.execute(select(User.id))
        user_ids = [str(row[0]) for row in result.all()]

    logger.info("Found %d users to backfill", len(user_ids))

    total_created = 0
    for user_id in user_ids:
        async with async_session() as db:
            created = await consolidate_categories(db, user_id)
            await db.commit()
            if created:
                logger.info("  User %s: created %d categories", user_id, created)
            total_created += created

    logger.info("Done. Created %d total categories across %d users.", total_created, len(user_ids))
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
