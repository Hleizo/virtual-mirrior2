"""
CRUD operations for database models (Async SQLAlchemy 2.0)
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, asc, func
from typing import List, Optional, Dict, Any, Sequence
from datetime import datetime, timedelta
import uuid

from models import Session as SessionModel, Task, Metric


# ==================== Session CRUD ====================

async def create_session(
    db: AsyncSession,
    child_name: str,
    child_age: int,
    child_height_cm: Optional[float] = None,
    child_weight_kg: Optional[float] = None,
    child_gender: Optional[str] = None,
    child_notes: Optional[str] = None,
    task_metrics: Optional[Dict[str, Any]] = None,
    session_type: str = "initial",
    parent_session_id: Optional[str] = None,
) -> SessionModel:
    """
    Create a new session record
    """
    import random
    
    session_id = str(uuid.uuid4())
    
    # Generate unique 4-digit display ID
    while True:
        display_id = random.randint(1000, 9999)
        # Check if this ID already exists
        existing = await db.execute(
            select(SessionModel).where(SessionModel.display_id == display_id)
        )
        if not existing.scalar_one_or_none():
            break
    
    db_session = SessionModel(
        id=session_id,
        display_id=display_id,
        child_name=child_name,
        child_age=child_age,
        child_height_cm=child_height_cm,
        child_weight_kg=child_weight_kg,
        child_gender=child_gender,
        child_notes=child_notes,
        started_at=datetime.utcnow(),
        session_type=session_type,
        parent_session_id=parent_session_id,
    )
    db.add(db_session)
    await db.flush()
    await db.refresh(db_session)
    return db_session


async def get_session(db: AsyncSession, session_id: str) -> Optional[SessionModel]:
    """
    Get a session by ID (text)
    """
    result = await db.execute(
        select(SessionModel).where(SessionModel.id == session_id)
    )
    return result.scalar_one_or_none()


async def get_session_by_id_string(db: AsyncSession, session_id: str) -> Optional[SessionModel]:
    """
    Get a session by ID string
    """
    return await get_session(db, session_id)


async def get_all_sessions(
    db: AsyncSession, 
    skip: int = 0, 
    limit: int = 100
) -> List[SessionModel]:
    """
    Get all sessions ordered by most recent first with pagination
    """
    result = await db.execute(
        select(SessionModel)
        .order_by(desc(SessionModel.started_at))
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_followup_sessions(db: AsyncSession, parent_session_id: str) -> List[SessionModel]:
    """
    Get all follow-up sessions for a parent session
    """
    result = await db.execute(
        select(SessionModel)
        .where(SessionModel.parent_session_id == parent_session_id)
        .order_by(asc(SessionModel.started_at))
    )
    return list(result.scalars().all())


# ==================== Task CRUD ====================

async def create_task_result(
    db: AsyncSession,
    session_id: str,
    task_name: str,
    duration_seconds: Optional[float] = None,
    status: Optional[str] = None,
    notes: Optional[str] = None,
    metrics: Optional[Dict[str, Any]] = None,
) -> Task:
    """
    Create a new task result record
    """
    task_id = str(uuid.uuid4())
    db_task = Task(
        id=task_id,
        session_id=session_id,
        task_name=task_name,
        duration_seconds=duration_seconds,
        status=status,
        notes=notes,
    )
    db.add(db_task)
    await db.flush()
    await db.refresh(db_task)
    return db_task


async def get_task_result(db: AsyncSession, task_id: str) -> Optional[Task]:
    """
    Get a task result by ID (text)
    """
    result = await db.execute(
        select(Task).where(Task.id == task_id)
    )
    return result.scalar_one_or_none()


async def get_task_results_by_session(
    db: AsyncSession,
    session_id: str,
    skip: int = 0,
    limit: int = 100
) -> Sequence[Task]:
    """
    Get all task results for a specific session
    """
    result = await db.execute(
        select(Task)
        .where(Task.session_id == session_id)
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


# ==================== Metric CRUD ====================

async def create_metric(
    db: AsyncSession,
    task_id: str,
    metric_name: str,
    metric_value: float,
) -> Metric:
    """
    Create a new metric record
    """
    metric_id = str(uuid.uuid4())
    db_metric = Metric(
        id=metric_id,
        task_id=task_id,
        metric_name=metric_name,
        metric_value=metric_value,
    )
    db.add(db_metric)
    await db.flush()
    await db.refresh(db_metric)
    return db_metric


async def create_metrics_batch(
    db: AsyncSession,
    task_id: str,
    metrics: Dict[str, float],
) -> List[Metric]:
    """
    Create multiple metrics for a task at once
    """
    db_metrics = []
    for metric_name, metric_value in metrics.items():
        metric_id = str(uuid.uuid4())
        db_metric = Metric(
            id=metric_id,
            task_id=task_id,
            metric_name=metric_name,
            metric_value=metric_value,
        )
        db_metrics.append(db_metric)
    
    db.add_all(db_metrics)
    await db.flush()
    for metric in db_metrics:
        await db.refresh(metric)
    return db_metrics


async def get_metrics_by_task(
    db: AsyncSession,
    task_id: str,
    skip: int = 0,
    limit: int = 100
) -> Sequence[Metric]:
    """
    Get all metrics for a specific task
    """
    result = await db.execute(
        select(Metric)
        .where(Metric.task_id == task_id)
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()
