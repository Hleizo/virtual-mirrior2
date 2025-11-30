"""
Simplified async API endpoints for Virtual Mirror
"""
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict
import uuid

from database import get_db, init_db
from models import Session as SessionModel, Task, Metric
import crud
import schemas

app = FastAPI(
    title="Virtual Mirror API",
    description="Backend API for Early Detection of Motor Weakness in Children",
    version="2.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database tables on startup"""
    try:
        await init_db()
        print("✅ Database initialized successfully")
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")


# ==================== Session Endpoints ====================

@app.post("/sessions", response_model=schemas.SessionResponse, status_code=201)
async def create_session(
    session_data: schemas.SessionCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new session
    POST /sessions
    """
    db_session = await crud.create_session(
        db=db,
        child_name=session_data.child_name,
        child_age=session_data.child_age,
        child_height_cm=session_data.child_height_cm,
        child_weight_kg=session_data.child_weight_kg,
        child_gender=session_data.child_gender,
        child_notes=session_data.child_notes,
        task_metrics=session_data.task_metrics,
        session_type=session_data.session_type or "initial",
        parent_session_id=session_data.parent_session_id,
    )
    return db_session


@app.get("/sessions/{session_id}", response_model=schemas.SessionResponse)
async def get_session(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get a session by ID
    GET /sessions/{id}
    """
    db_session = await crud.get_session_by_id_string(db, session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    return db_session


@app.get("/sessions", response_model=List[schemas.SessionResponse])
async def get_all_sessions(
    db: AsyncSession = Depends(get_db)
):
    """
    Get all sessions
    GET /sessions
    """
    sessions = await crud.get_all_sessions(db)
    return sessions


@app.get("/sessions/{session_id}/followups", response_model=List[schemas.SessionResponse])
async def get_followup_sessions(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all follow-up sessions for a parent session
    GET /sessions/{session_id}/followups
    """
    followups = await crud.get_followup_sessions(db, session_id)
    return followups


@app.delete("/sessions/{session_id}", status_code=200)
async def delete_session(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a session by ID (cascades to tasks and metrics)
    DELETE /sessions/{id}
    """
    session = await crud.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    await db.delete(session)
    await db.commit()
    return {"message": "Session deleted successfully", "session_id": session_id}


# ==================== Task Result Endpoints ====================

@app.post("/sessions/{session_id}/tasks", response_model=schemas.TaskResultResponse, status_code=201)
async def create_task_for_session(
    session_id: str,
    task_data: schemas.TaskResultCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new task result for a session
    POST /sessions/{id}/tasks
    """
    # Verify session exists
    session = await crud.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Create task result
    task_result = await crud.create_task_result(
        db=db,
        session_id=session_id,
        task_name=task_data.task_name,
        duration_seconds=task_data.duration_seconds,
        status=task_data.status,
        notes=task_data.notes,
        metrics=task_data.metrics
    )
    return task_result


@app.get("/sessions/{session_id}/tasks", response_model=List[schemas.TaskResultResponse])
async def get_tasks_for_session(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all task results for a specific session
    GET /sessions/{id}/tasks
    """
    # Verify session exists
    session = await crud.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    tasks = await crud.get_task_results_by_session(db, session_id)
    return tasks


# ==================== Metric Endpoints ====================

@app.get("/tasks/{task_id}/metrics", response_model=List[schemas.MetricResponse])
async def get_metrics_for_task(
    task_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all metrics for a specific task
    GET /tasks/{id}/metrics
    """
    # Verify task exists
    task = await crud.get_task_result(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    metrics = await crud.get_metrics_by_task(db, task_id)
    return metrics


@app.post("/tasks/{task_id}/metrics", response_model=schemas.MetricResponse, status_code=201)
async def create_metric_for_task(
    task_id: str,
    metric_data: schemas.MetricCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a single metric for a task
    POST /tasks/{id}/metrics
    Body: {"metric_name": "accuracy", "metric_value": 0.95}
    """
    # Verify task exists
    task = await crud.get_task_result(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Create single metric
    metric = await crud.create_metric(db, task_id, metric_data.metric_name, metric_data.metric_value)
    return metric


# ==================== Health Check ====================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "version": "2.0.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
