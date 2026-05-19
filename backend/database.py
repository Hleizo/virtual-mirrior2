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

# Require a single DATABASE_URL for database configuration.
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL environment variable is not set. Please check your .env file or service configuration."
    )

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = "postgresql+psycopg://" + DATABASE_URL[len("postgres://"):]
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = "postgresql+psycopg://" + DATABASE_URL[len("postgresql://"):]

parsed_db_url = urlparse(DATABASE_URL)
connection_label = (
    f"{parsed_db_url.username or 'user'}@"
    f"{parsed_db_url.hostname or 'host'}:"
    f"{parsed_db_url.port or '5432'}/"
    f"{(parsed_db_url.path or '').lstrip('/') or 'db'}"
)

print(f"Connecting to database at: {connection_label}")
print(f"Loading .env from: {env_path}")
print("Using psycopg driver for PostgreSQL async connection")

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
        print("Database connection successful")
    except Exception as e:
        print(f"Database connection failed: {e}")
        raise
