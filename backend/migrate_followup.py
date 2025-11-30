"""
Add session_type and parent_session_id columns to sessions table
"""
import asyncio
from database import engine
from sqlalchemy import text


async def migrate():
    """Add new columns to sessions table"""
    async with engine.begin() as conn:
        # Add session_type column
        await conn.execute(text(
            "ALTER TABLE sessions ADD COLUMN IF NOT EXISTS session_type TEXT DEFAULT 'initial'"
        ))
        print("✅ Added session_type column")
        
        # Add parent_session_id column
        await conn.execute(text(
            "ALTER TABLE sessions ADD COLUMN IF NOT EXISTS parent_session_id TEXT"
        ))
        print("✅ Added parent_session_id column")
        
        # Add foreign key constraint (may fail if already exists, that's ok)
        try:
            await conn.execute(text(
                "ALTER TABLE sessions ADD CONSTRAINT fk_parent_session "
                "FOREIGN KEY (parent_session_id) REFERENCES sessions(id) ON DELETE SET NULL"
            ))
            print("✅ Added foreign key constraint")
        except Exception as e:
            print(f"⚠️ Foreign key constraint might already exist: {e}")
        
    print("✅ Migration completed successfully")


if __name__ == "__main__":
    asyncio.run(migrate())
