"""
Migration script to add display_id column to sessions table
"""
import asyncio
import random
from sqlalchemy import text
from database import async_session_maker

async def add_display_id_column():
    """Add display_id column and populate with unique 4-digit IDs"""
    async with async_session_maker() as db:
        try:
            # Add display_id column if it doesn't exist
            print("Adding display_id column...")
            await db.execute(text("""
                ALTER TABLE sessions 
                ADD COLUMN IF NOT EXISTS display_id INTEGER UNIQUE
            """))
            await db.commit()
            print("✅ Column added")
            
            # Get all sessions without display_id
            result = await db.execute(text("""
                SELECT id FROM sessions WHERE display_id IS NULL
            """))
            sessions = result.fetchall()
            
            if not sessions:
                print("✅ All sessions already have display_id")
                return
            
            print(f"📝 Updating {len(sessions)} sessions with display_id...")
            
            # Generate unique display IDs for existing sessions
            used_ids = set()
            for session in sessions:
                session_id = session[0]
                
                # Generate unique 4-digit ID
                while True:
                    display_id = random.randint(1000, 9999)
                    if display_id not in used_ids:
                        used_ids.add(display_id)
                        break
                
                # Update session with display_id
                await db.execute(
                    text("UPDATE sessions SET display_id = :display_id WHERE id = :id"),
                    {"display_id": display_id, "id": session_id}
                )
            
            await db.commit()
            print(f"✅ Updated {len(sessions)} sessions with unique display IDs")
            
        except Exception as e:
            await db.rollback()
            print(f"❌ Migration failed: {e}")
            raise

if __name__ == "__main__":
    print("🚀 Starting display_id migration...")
    asyncio.run(add_display_id_column())
    print("✅ Migration complete!")
