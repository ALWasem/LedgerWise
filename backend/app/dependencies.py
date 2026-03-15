from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings

# Convert postgresql:// to postgresql+asyncpg:// for async driver
database_url = settings.database_url.replace(
    "postgresql://", "postgresql+asyncpg://", 1
)

engine = create_async_engine(
    database_url,
    echo=False,
    pool_size=5,
    max_overflow=10,
    connect_args={"statement_cache_size": 0},  # Required for Supabase transaction pooler (pgbouncer)
)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that provides a database session per request."""
    async with async_session() as session:
        yield session
