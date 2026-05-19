import os
import sys
import asyncio
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.pool import NullPool
from sqlalchemy import text
from urllib.parse import urlparse

# Fix for Windows psycopg compatibility - must be before any async operations
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

# Load .env from backend directory
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

# Prefer a full DATABASE_URL when provided; fall back to Supabase pieces.
SUPABASE_URL = os.getenv("SUPABASE_URL")
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL and DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = "postgresql+psycopg://" + DATABASE_URL[len("postgresql://"):]

if not DATABASE_URL:
    # Supabase PostgreSQL connection details
    DB_PASSWORD = os.getenv("SUPABASE_DB_PASSWORD")
    DB_USER = os.getenv("SUPABASE_DB_USER")
    DB_NAME = os.getenv("SUPABASE_DB_NAME")
    DB_HOST = os.getenv("SUPABASE_DB_HOST")
    DB_PORT = os.getenv("SUPABASE_DB_PORT") or "5432"

    missing = [
        name for name, value in {
            "SUPABASE_DB_PASSWORD": DB_PASSWORD,
            "SUPABASE_DB_USER": DB_USER,
            "SUPABASE_DB_NAME": DB_NAME,
            "SUPABASE_DB_HOST": DB_HOST,
        }.items()
        if not value
    ]

    if missing:
        raise ValueError(
            "Missing required database environment variables: " + ", ".join(missing)
        )

    # Use psycopg (async) instead of asyncpg for Render compatibility
    DATABASE_URL = f"postgresql+psycopg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

    connection_label = f"{DB_USER}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
else:
    parsed_db_url = urlparse(DATABASE_URL)
    connection_label = (
        f"{parsed_db_url.username or 'user'}@"
        f"{parsed_db_url.hostname or 'host'}:"
        f"{parsed_db_url.port or '5432'}/"
        f"{(parsed_db_url.path or '').lstrip('/') or 'db'}"
    )

print(f"🔗 Connecting to database at: {connection_label}")
print(f"📁 Loading .env from: {env_path}")
print(f"🔌 Using psycopg driver for PostgreSQL async connection")

engine = create_async_engine(
    DATABASE_URL, 
    echo=False, 
    future=True,
    poolclass=NullPool
)

async_session_maker = sessionmaker(
    bind=engine,
    expire_on_commit=False,
    class_=AsyncSession
)

class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def init_db():
    """Test database connection"""
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        print("✅ Database connection successful")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        raise
