"""
Test script for async database setup
"""
import asyncio
import sys
from database import AsyncSessionLocal, init_db
from models import Session, Task, Metric
from crud import create_session, create_task_result, create_metrics_batch


async def test_database():
    """Test database connection and basic operations"""
    print("🔍 Testing database connection...")
    
    try:
        # Test 1: Initialize database
        print("\n1️⃣ Initializing database...")
        await init_db()
        print("✅ Database tables created")
        
        # Test 2: Create session
        print("\n2️⃣ Creating test session...")
        async with AsyncSessionLocal() as db:
            session = await create_session(
                db=db,
                child_name="Test Child",
                child_age=8,
                child_height_cm=130.0,
                child_weight_kg=28.0
            )
            print(f"✅ Session created: {session.id}")
            
            # Test 3: Create task
            print("\n3️⃣ Creating test task...")
            task = await create_task_result(
                db=db,
                session_id=session.id,
                task_name="raise_hand",
                duration_seconds=15.5,
                status="success"
            )
            print(f"✅ Task created: {task.id}")
            
            # Test 4: Create metrics
            print("\n4️⃣ Creating test metrics...")
            metrics = await create_metrics_batch(
                db=db,
                task_id=task.id,
                metrics={
                    "accuracy": 0.95,
                    "stability": 0.88,
                    "max_angle": 165.5
                }
            )
            print(f"✅ Created {len(metrics)} metrics")
            
            # Test 5: Query data
            print("\n5️⃣ Querying data...")
            from sqlalchemy import select
            result = await db.execute(select(Session))
            sessions = result.scalars().all()
            print(f"✅ Found {len(sessions)} session(s)")
            
        print("\n" + "="*50)
        print("✅ All tests passed!")
        print("="*50)
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = asyncio.run(test_database())
    sys.exit(0 if success else 1)
