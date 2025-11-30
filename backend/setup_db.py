import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from models import Base  # Base = declarative base from SQLAlchemy

# Load environment variables from backend directory
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

# Build DATABASE_URL from Supabase environment variables
SUPABASE_DB_HOST = os.getenv("SUPABASE_DB_HOST")
SUPABASE_DB_PORT = os.getenv("SUPABASE_DB_PORT")
SUPABASE_DB_USER = os.getenv("SUPABASE_DB_USER")
SUPABASE_DB_PASSWORD = os.getenv("SUPABASE_DB_PASSWORD")
SUPABASE_DB_NAME = os.getenv("SUPABASE_DB_NAME")

if not all([SUPABASE_DB_HOST, SUPABASE_DB_PORT, SUPABASE_DB_USER, SUPABASE_DB_PASSWORD, SUPABASE_DB_NAME]):
    raise ValueError("❌ Missing Supabase database environment variables in .env file!")

ASYNC_DATABASE_URL = f"postgresql+asyncpg://{SUPABASE_DB_USER}:{SUPABASE_DB_PASSWORD}@{SUPABASE_DB_HOST}:{SUPABASE_DB_PORT}/{SUPABASE_DB_NAME}"

engine = create_async_engine(ASYNC_DATABASE_URL, echo=True, future=True)


async def setup_database():
    print("🚀 Starting async database setup...")
    print(f"📊 Using database: {ASYNC_DATABASE_URL}")

    async with engine.begin() as conn:
        print("📝 Creating all tables using metadata...")
        await conn.run_sync(Base.metadata.create_all)

        print("🔍 Fetching created tables...")
        result = await conn.execute(text(
            "SELECT table_name FROM information_schema.tables WHERE table_schema='public';"
        ))
        tables = [row[0] for row in result]

    print("\n✅ SUCCESS! Tables created in Supabase:")
    for t in tables:
        print(f"   - {t}")

    print("\n✨ Database initialization completed.")


if __name__ == "__main__":
    asyncio.run(setup_database())