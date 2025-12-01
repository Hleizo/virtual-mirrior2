"""
Virtual Mirror API - Production Backend for Render.com
FastAPI async backend with PostgreSQL (Supabase) using psycopg driver
"""
from fastapi import FastAPI, HTTPException, Depends, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Optional
from contextlib import asynccontextmanager
import uuid
import os
import sys
import asyncio
import logging
from datetime import datetime

# Fix for Windows psycopg compatibility
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from database import get_db, init_db, engine
from models import Session as SessionModel, Task, Metric
import crud
import schemas
from sqlalchemy import text

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle"""
    # Startup
    logger.info("🚀 Starting Virtual Mirror API...")
    try:
        await init_db()
        logger.info("✅ Database connection established")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        # Don't crash on startup - let health checks fail instead
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down Virtual Mirror API...")
    await engine.dispose()
    logger.info("✅ Database connections closed")

# Initialize FastAPI with lifespan
app = FastAPI(
    title="Virtual Mirror API",
    description="Backend API for Early Detection of Motor Weakness in Children",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS configuration - Production-ready
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:5174,http://localhost:3000"
).split(",")

# Add production deployments support
CORS_ORIGINS.extend([
    "https://virtual-mirrior2.vercel.app",
    "https://virtual-mirror2.vercel.app",
    "https://*.vercel.app",
    "https://*.netlify.app"
])

logger.info(f"🌐 CORS enabled for origins: {CORS_ORIGINS}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for now
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests"""
    start_time = datetime.now()
    
    # Skip logging for health checks and favicon
    if request.url.path not in ["/health", "/favicon.ico"]:
        logger.info(f"📥 {request.method} {request.url.path}")
    
    response = await call_next(request)
    
    process_time = (datetime.now() - start_time).total_seconds()
    
    if request.url.path not in ["/health", "/favicon.ico"]:
        logger.info(f"📤 {request.method} {request.url.path} - {response.status_code} ({process_time:.3f}s)")
    
    return response

# ==================== Health & Status Routes ====================

@app.get("/", tags=["Status"])
async def root():
    """Root endpoint - API status"""
    return {
        "status": "ok",
        "service": "virtual-mirror-backend",
        "version": "2.0.0",
        "docs": "/docs"
    }

@app.get("/health", tags=["Status"])
async def health_check():
    """Health check endpoint for Render"""
    try:
        # Test database connection
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"❌ Health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "database": "disconnected",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
        )

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    """Return empty response for favicon to prevent 404s"""
    return Response(status_code=204)


# ==================== Session Endpoints ====================

@app.post("/sessions", response_model=schemas.SessionResponse, status_code=201, tags=["Sessions"])
async def create_session(
    session_data: schemas.SessionCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new assessment session"""
    try:
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
        logger.info(f"✅ Created session {db_session.id} for child: {session_data.child_name}")
        return db_session
    except Exception as e:
        logger.error(f"Error creating session: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create session: {str(e)}")


@app.get("/sessions/{session_id}", response_model=schemas.SessionResponse, tags=["Sessions"])
async def get_session(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get a session by ID"""
    try:
        db_session = await crud.get_session_by_id_string(db, session_id)
        if not db_session:
            raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
        return db_session
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching session: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch session: {str(e)}")


@app.get("/sessions", response_model=List[schemas.SessionResponse], tags=["Sessions"])
async def get_all_sessions(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """Get all sessions with pagination"""
    try:
        sessions = await crud.get_all_sessions(db, skip=skip, limit=limit)
        return sessions
    except Exception as e:
        logger.error(f"Error fetching sessions: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch sessions: {str(e)}")


@app.get("/sessions/{session_id}/followups", response_model=List[schemas.SessionResponse], tags=["Sessions"])
async def get_followup_sessions(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get all follow-up sessions for a parent session"""
    try:
        followups = await crud.get_followup_sessions(db, session_id)
        return followups
    except Exception as e:
        logger.error(f"Error fetching followups: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch followups: {str(e)}")


@app.delete("/sessions/{session_id}", status_code=200, tags=["Sessions"])
async def delete_session(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Delete a session by ID (cascades to tasks and metrics)"""
    try:
        session = await crud.get_session(db, session_id)
        if not session:
            raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
        
        await db.delete(session)
        await db.commit()
        logger.info(f"🗑️ Deleted session {session_id}")
        return {"message": "Session deleted successfully", "session_id": session_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting session: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete session: {str(e)}")



# ==================== Task Result Endpoints ====================

@app.post("/sessions/{session_id}/tasks", response_model=schemas.TaskResultResponse, status_code=201, tags=["Tasks"])
async def create_task_for_session(
    session_id: str,
    task_data: schemas.TaskResultCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new task result for a session"""
    try:
        # Verify session exists
        session = await crud.get_session(db, session_id)
        if not session:
            raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
        
        # Create task result
        task_result = await crud.create_task_result(
            db=db,
            session_id=session_id,
            task_name=task_data.task_name,
            duration_seconds=task_data.duration_seconds or 0.0,
            status=task_data.status or "completed",
            notes=task_data.notes or "",
            metrics=task_data.metrics or {}
        )
        return task_result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating task: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create task: {str(e)}")


@app.get("/sessions/{session_id}/tasks", response_model=List[schemas.TaskResultResponse], tags=["Tasks"])
async def get_tasks_for_session(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get all task results for a specific session"""
    try:
        # Verify session exists
        session = await crud.get_session(db, session_id)
        if not session:
            raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
        
        tasks = await crud.get_task_results_by_session(db, session_id)
        return tasks
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching tasks: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch tasks: {str(e)}")


# ==================== Metric Endpoints ====================

@app.get("/tasks/{task_id}/metrics", response_model=List[schemas.MetricResponse], tags=["Metrics"])
async def get_metrics_for_task(
    task_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get all metrics for a specific task"""
    try:
        # Verify task exists
        task = await crud.get_task_result(db, task_id)
        if not task:
            raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
        
        metrics = await crud.get_metrics_by_task(db, task_id)
        return metrics
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch metrics: {str(e)}")


@app.post("/tasks/{task_id}/metrics", response_model=schemas.MetricResponse, status_code=201, tags=["Metrics"])
async def create_metric_for_task(
    task_id: str,
    metric_data: schemas.MetricCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a single metric for a task"""
    try:
        # Verify task exists
        task = await crud.get_task_result(db, task_id)
        if not task:
            raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
        
        # Create single metric
        metric = await crud.create_metric(
            db, 
            task_id, 
            metric_data.metric_name, 
            metric_data.metric_value
        )
        return metric
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating metric: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create metric: {str(e)}")


# ==================== Global Exception Handler ====================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all exception handler for production"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "path": str(request.url.path),
            "timestamp": datetime.utcnow().isoformat()
        }
    )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "main_async:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )

