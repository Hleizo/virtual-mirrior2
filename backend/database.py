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

# Construct DATABASE_URL from Supabase environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL")

if not SUPABASE_URL:
    raise ValueError("SUPABASE_URL environment variable is not set. Please check your .env file.")

# Parse the Supabase URL to extract the host
parsed_url = urlparse(SUPABASE_URL)
# Extract project reference from subdomain (e.g., xbmhcywclslbuecajkuw from https://xbmhcywclslbuecajkuw.supabase.co)
project_ref = parsed_url.netloc.split('.')[0]

# Construct the PostgreSQL connection URL
# Supabase PostgreSQL connection details
DB_PASSWORD = os.getenv("SUPABASE_DB_PASSWORD")
DB_USER = os.getenv("SUPABASE_DB_USER")
DB_NAME = os.getenv("SUPABASE_DB_NAME")
DB_HOST = os.getenv("SUPABASE_DB_HOST")
DB_PORT = os.getenv("SUPABASE_DB_PORT")

if not DB_PASSWORD:
    raise ValueError("SUPABASE_DB_PASSWORD environment variable is not set. Please check your .env file.")
if not DB_HOST:
    raise ValueError("SUPABASE_DB_HOST environment variable is not set. Please check your .env file.")

# Use psycopg (async) instead of asyncpg for Render compatibility
DATABASE_URL = f"postgresql+psycopg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

print(f"🔗 Connecting to database at: {DB_USER}@{DB_HOST}:{DB_PORT}/{DB_NAME}")
print(f"📁 Loading .env from: {env_path}")
print(f"✅ Environment variables loaded - DB_HOST: {DB_HOST}")
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
