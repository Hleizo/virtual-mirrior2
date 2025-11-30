"""
Alembic migration initialization script

To use migrations:
1. Install: pip install alembic
2. Initialize: alembic init alembic
3. Configure alembic.ini with your DATABASE_URL
4. Create migration: alembic revision --autogenerate -m "message"
5. Apply migration: alembic upgrade head
"""

from database import Base
from models import Session

# Import all models here so Alembic can detect them
__all__ = ["Base", "Session"]
