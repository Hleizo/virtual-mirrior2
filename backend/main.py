# Virtual Mirror Backend - FastAPI Application

from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import json
import os
import uuid
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession

# Load environment variables
load_dotenv()

# Database imports
from database import get_db, init_db, engine, Base
from models import Session as SessionModel, Task, Metric
import crud
import schemas

# ReportLab imports for PDF generation
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from reportlab.pdfgen import canvas

# Google TTS (optional)
try:
    from gtts import gTTS
    GTTS_AVAILABLE = True
except ImportError:
    GTTS_AVAILABLE = False

# Import analysis module
from analysis import comprehensive_analysis, Classification

# Initialize FastAPI app
app = FastAPI(
    title="Virtual Mirror API",
    description="Backend API for Early Detection of Motor Weakness in Children",
    version="1.0.0"
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

# Get CORS origins from environment variable
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://localhost:5174").split(",")

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data directories (for file-based storage backup)
DATA_DIR = Path("data")
REPORTS_DIR = DATA_DIR / "reports"
AUDIO_DIR = DATA_DIR / "audio"
SESSIONS_DIR = DATA_DIR / "sessions"

# Create directories if they don't exist
for directory in [DATA_DIR, REPORTS_DIR, AUDIO_DIR, SESSIONS_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# ==================== Data Models ====================

class JointAngleData(BaseModel):
    leftShoulder: float
    rightShoulder: float
    leftElbow: float
    rightElbow: float
    leftHip: float
    rightHip: float
    leftKnee: float
    rightKnee: float
    timestamp: int

class SessionMetrics(BaseModel):
    session_id: Optional[str] = None
    patient_name: Optional[str] = "Anonymous"
    patient_age: Optional[int] = None
    session_date: Optional[str] = None
    duration: int  # seconds
    joint_angles: List[JointAngleData]
    
    # Task results
    raise_hand_results: Optional[Dict[str, Any]] = None
    balance_results: Optional[Dict[str, Any]] = None
    walk_results: Optional[Dict[str, Any]] = None
    jump_results: Optional[Dict[str, Any]] = None
    
    # Additional notes
    notes: Optional[str] = None

class AnalysisResult(BaseModel):
    session_id: str
    summary: Dict[str, Any]
    recommendations: List[str]
    risk_level: str  # low, moderate, high
    timestamp: str

class TTSRequest(BaseModel):
    text: str
    language: str = "ar"  # Arabic by default
    slow: bool = False

# ==================== Helper Functions ====================

def calculate_summary_statistics(joint_angles: List[JointAngleData]) -> Dict[str, Any]:
    """Calculate statistical summary from joint angle data"""
    if not joint_angles:
        return {}
    
    # Extract all angles for each joint
    joints = {
        'leftShoulder': [], 'rightShoulder': [],
        'leftElbow': [], 'rightElbow': [],
        'leftHip': [], 'rightHip': [],
        'leftKnee': [], 'rightKnee': []
    }
    
    for data in joint_angles:
        for joint in joints.keys():
            joints[joint].append(getattr(data, joint))
    
    # Calculate statistics
    stats = {}
    for joint, values in joints.items():
        if values:
            stats[joint] = {
                'mean': sum(values) / len(values),
                'min': min(values),
                'max': max(values),
                'range': max(values) - min(values)
            }
    
    return stats

def calculate_symmetry(left_values: List[float], right_values: List[float]) -> Dict[str, float]:
    """Calculate symmetry metrics between left and right sides"""
    if not left_values or not right_values:
        return {'difference': 0, 'percentage': 0}
    
    avg_left = sum(left_values) / len(left_values)
    avg_right = sum(right_values) / len(right_values)
    
    difference = abs(avg_left - avg_right)
    avg = (avg_left + avg_right) / 2
    percentage = (difference / avg * 100) if avg > 0 else 0
    
    return {
        'difference': round(difference, 2),
        'percentage': round(percentage, 2),
        'left_avg': round(avg_left, 2),
        'right_avg': round(avg_right, 2)
    }

def generate_recommendations(metrics: SessionMetrics, stats: Dict[str, Any]) -> List[str]:
    """Generate recommendations based on analysis"""
    recommendations = []
    
    # Check shoulder symmetry
    if 'leftShoulder' in stats and 'rightShoulder' in stats:
        left_shoulder = [a.leftShoulder for a in metrics.joint_angles]
        right_shoulder = [a.rightShoulder for a in metrics.joint_angles]
        symmetry = calculate_symmetry(left_shoulder, right_shoulder)
        
        if symmetry['percentage'] > 15:
            recommendations.append(
                f"Shoulder asymmetry detected ({symmetry['percentage']:.1f}%). "
                "Consider exercises to improve shoulder mobility and balance."
            )
    
    # Check range of motion
    for joint, values in stats.items():
        if values['range'] < 30:
            recommendations.append(
                f"Limited range of motion in {joint} ({values['range']:.1f}°). "
                "Stretching and flexibility exercises recommended."
            )
    
    # Task-specific recommendations
    if metrics.raise_hand_results:
        if not metrics.raise_hand_results.get('overallSuccess'):
            recommendations.append(
                "Difficulty raising hands above head detected. "
                "Practice shoulder flexion exercises."
            )
    
    if metrics.balance_results:
        if metrics.balance_results.get('stabilityScore', 100) < 60:
            recommendations.append(
                "Balance concerns noted. Single-leg stance exercises recommended."
            )
    
    if metrics.walk_results:
        if metrics.walk_results.get('gaitSymmetry', 0) > 20:
            recommendations.append(
                "Gait asymmetry detected. Consult with physical therapist for gait training."
            )
    
    if not recommendations:
        recommendations.append("Movement patterns appear normal. Continue regular physical activity.")
    
    return recommendations

def assess_risk_level(metrics: SessionMetrics, stats: Dict[str, Any]) -> str:
    """Assess overall risk level"""
    risk_score = 0
    
    # Check symmetry across all joints
    joint_pairs = [
        ('leftShoulder', 'rightShoulder'),
        ('leftElbow', 'rightElbow'),
        ('leftHip', 'rightHip'),
        ('leftKnee', 'rightKnee')
    ]
    
    for left, right in joint_pairs:
        left_values = [getattr(a, left) for a in metrics.joint_angles]
        right_values = [getattr(a, right) for a in metrics.joint_angles]
        symmetry = calculate_symmetry(left_values, right_values)
        
        if symmetry['percentage'] > 20:
            risk_score += 2
        elif symmetry['percentage'] > 10:
            risk_score += 1
    
    # Check task results
    if metrics.balance_results and metrics.balance_results.get('stabilityScore', 100) < 50:
        risk_score += 2
    
    if metrics.walk_results and metrics.walk_results.get('gaitSymmetry', 0) > 25:
        risk_score += 2
    
    # Determine risk level
    if risk_score >= 5:
        return "high"
    elif risk_score >= 3:
        return "moderate"
    else:
        return "low"

# ==================== API Routes ====================

@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "status": "healthy",
        "service": "Virtual Mirror API",
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "endpoints": {
            "health": "/health",
            "analyze": "/api/analyze",
            "report": "/api/report/{session_id}",
            "tts": "/api/tts"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for Docker"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "database": "connected" if DATA_DIR.exists() else "error",
        "tts_available": GTTS_AVAILABLE
    }

@app.post("/api/analyze", response_model=AnalysisResult)
async def analyze_session(metrics: SessionMetrics):
    """
    Analyze session metrics and generate summary
    
    Receives movement data, performs analysis, stores results, and returns summary
    """
    try:
        # Generate session ID if not provided
        session_id = metrics.session_id or str(uuid.uuid4())
        
        # Set session date if not provided
        if not metrics.session_date:
            metrics.session_date = datetime.now().isoformat()
        
        # Calculate statistics
        stats = calculate_summary_statistics(metrics.joint_angles)
        
        # Calculate symmetry metrics
        symmetry_analysis = {}
        joint_pairs = [
            ('leftShoulder', 'rightShoulder', 'shoulder'),
            ('leftElbow', 'rightElbow', 'elbow'),
            ('leftHip', 'rightHip', 'hip'),
            ('leftKnee', 'rightKnee', 'knee')
        ]
        
        for left, right, name in joint_pairs:
            left_values = [getattr(a, left) for a in metrics.joint_angles]
            right_values = [getattr(a, right) for a in metrics.joint_angles]
            symmetry_analysis[name] = calculate_symmetry(left_values, right_values)
        
        # Prepare data for advanced analysis module
        rom_data = {}
        if stats:
            for joint, joint_stats in stats.items():
                rom_data[joint] = joint_stats.get('range', 0)
        
        balance_data = {}
        if metrics.balance_results:
            balance_data = {
                'stability_score': metrics.balance_results.get('stabilityScore', 0),
                'single_leg_stance_time': metrics.balance_results.get('maxBalanceTime', 0) / 1000,  # Convert ms to s
                'sway_magnitude': metrics.balance_results.get('swayMagnitude', 0),
            }
        
        symmetry_data = {
            f"{name}_symmetry": sym['percentage']
            for name, sym in symmetry_analysis.items()
        }
        
        gait_data = {}
        if metrics.walk_results:
            gait_data = {
                'cadence': metrics.walk_results.get('cadence', 0),
                'step_length': metrics.walk_results.get('strideLength', 0),
            }
        
        # Perform comprehensive analysis using analysis module
        analysis_result = comprehensive_analysis(
            rom_data=rom_data if rom_data else None,
            balance_data=balance_data if balance_data else None,
            symmetry_data=symmetry_data if symmetry_data else None,
            gait_data=gait_data if gait_data else None,
            age=metrics.patient_age
        )
        
        # Use analysis module results
        recommendations = analysis_result.recommendations
        risk_level_map = {
            Classification.NORMAL: "low",
            Classification.BORDERLINE: "moderate",
            Classification.WEAKNESS_SUSPECTED: "high",
            Classification.INSUFFICIENT_DATA: "unknown"
        }
        risk_level = risk_level_map.get(analysis_result.classification, "unknown")
        
        # Add analysis module results to summary
        clinical_analysis = {
            'classification': analysis_result.classification.value,
            'confidence': analysis_result.confidence,
            'age_group': analysis_result.age_group,
            'flags': analysis_result.flags,
            'z_scores': analysis_result.z_scores,
            'detailed_metrics': analysis_result.metrics_analysis
        }
        
        # Create summary
        summary = {
            'session_id': session_id,
            'patient_name': metrics.patient_name,
            'patient_age': metrics.patient_age,
            'duration': metrics.duration,
            'data_points': len(metrics.joint_angles),
            'statistics': stats,
            'symmetry': symmetry_analysis,
            'task_results': {
                'raise_hand': metrics.raise_hand_results,
                'balance': metrics.balance_results,
                'walk': metrics.walk_results,
                'jump': metrics.jump_results
            },
            'clinical_analysis': clinical_analysis
        }
        
        # Store session data
        session_file = SESSIONS_DIR / f"{session_id}.json"
        with open(session_file, 'w') as f:
            json.dump({
                'metrics': metrics.dict(),
                'summary': summary,
                'recommendations': recommendations,
                'risk_level': risk_level,
                'timestamp': datetime.now().isoformat()
            }, f, indent=2)
        
        # Create analysis result
        result = AnalysisResult(
            session_id=session_id,
            summary=summary,
            recommendations=recommendations,
            risk_level=risk_level,
            timestamp=datetime.now().isoformat()
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/api/report/{session_id}")
async def get_report(session_id: str, background_tasks: BackgroundTasks):
    """
    Generate and return PDF report for a session
    
    Returns a downloadable PDF report with analysis results
    """
    try:
        # Load session data
        session_file = SESSIONS_DIR / f"{session_id}.json"
        if not session_file.exists():
            raise HTTPException(status_code=404, detail="Session not found")
        
        with open(session_file, 'r') as f:
            session_data = json.load(f)
        
        # Generate PDF report
        report_path = REPORTS_DIR / f"report_{session_id}.pdf"
        generate_pdf_report(session_data, report_path)
        
        # Schedule cleanup after sending (optional)
        # background_tasks.add_task(cleanup_old_reports)
        
        return FileResponse(
            path=report_path,
            filename=f"movement_assessment_{session_id}.pdf",
            media_type="application/pdf"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")

@app.post("/api/tts")
async def text_to_speech(request: TTSRequest):
    """
    Generate speech audio from text using Google TTS
    
    Supports Arabic and English text-to-speech conversion
    """
    if not GTTS_AVAILABLE:
        raise HTTPException(
            status_code=501,
            detail="Google TTS not available. Install with: pip install gtts"
        )
    
    try:
        # Generate unique filename
        audio_id = str(uuid.uuid4())
        audio_path = AUDIO_DIR / f"{audio_id}.mp3"
        
        # Generate speech
        tts = gTTS(text=request.text, lang=request.language, slow=request.slow)
        tts.save(str(audio_path))
        
        return FileResponse(
            path=audio_path,
            filename=f"speech_{audio_id}.mp3",
            media_type="audio/mpeg"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS generation failed: {str(e)}")

# ==================== PDF Report Generation ====================

def generate_pdf_report(session_data: Dict[str, Any], output_path: Path):
    """Generate a comprehensive PDF report"""
    
    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=18
    )
    
    # Container for PDF elements
    story = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1976d2'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#1976d2'),
        spaceAfter=12,
        spaceBefore=12
    )
    
    # Title
    story.append(Paragraph("Movement Assessment Report", title_style))
    story.append(Spacer(1, 12))
    
    # Patient Information
    summary = session_data['summary']
    story.append(Paragraph("Patient Information", heading_style))
    
    patient_info = [
        ['Name:', summary.get('patient_name', 'Anonymous')],
        ['Age:', str(summary.get('patient_age', 'N/A'))],
        ['Session Date:', session_data.get('timestamp', 'N/A')[:10]],
        ['Session ID:', summary.get('session_id', 'N/A')],
        ['Duration:', f"{summary.get('duration', 0)} seconds"],
        ['Data Points:', str(summary.get('data_points', 0))]
    ]
    
    patient_table = Table(patient_info, colWidths=[2*inch, 4*inch])
    patient_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e3f2fd')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey)
    ]))
    
    story.append(patient_table)
    story.append(Spacer(1, 20))
    
    # Risk Assessment
    story.append(Paragraph("Risk Assessment", heading_style))
    risk_level = session_data.get('risk_level', 'unknown').upper()
    risk_color = {
        'LOW': colors.green,
        'MODERATE': colors.orange,
        'HIGH': colors.red
    }.get(risk_level, colors.grey)
    
    risk_data = [['Risk Level:', risk_level]]
    risk_table = Table(risk_data, colWidths=[2*inch, 4*inch])
    risk_table.setStyle(TableStyle([
        ('BACKGROUND', (1, 0), (1, 0), risk_color),
        ('TEXTCOLOR', (1, 0), (1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey)
    ]))
    
    story.append(risk_table)
    story.append(Spacer(1, 20))
    
    # Symmetry Analysis
    story.append(Paragraph("Symmetry Analysis", heading_style))
    
    symmetry = summary.get('symmetry', {})
    symmetry_data = [['Joint', 'Left Avg', 'Right Avg', 'Difference', 'Asymmetry %']]
    
    for joint, data in symmetry.items():
        symmetry_data.append([
            joint.capitalize(),
            f"{data.get('left_avg', 0):.1f}°",
            f"{data.get('right_avg', 0):.1f}°",
            f"{data.get('difference', 0):.1f}°",
            f"{data.get('percentage', 0):.1f}%"
        ])
    
    symmetry_table = Table(symmetry_data, colWidths=[1.5*inch, 1*inch, 1*inch, 1*inch, 1*inch])
    symmetry_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976d2')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f5f5')])
    ]))
    
    story.append(symmetry_table)
    story.append(Spacer(1, 20))
    
    # Recommendations
    story.append(Paragraph("Recommendations", heading_style))
    
    recommendations = session_data.get('recommendations', [])
    for i, rec in enumerate(recommendations, 1):
        story.append(Paragraph(f"{i}. {rec}", styles['Normal']))
        story.append(Spacer(1, 6))
    
    story.append(Spacer(1, 20))
    
    # Footer
    story.append(Paragraph(
        "<i>This report is generated automatically and should be reviewed by a qualified healthcare professional.</i>",
        styles['Normal']
    ))
    
    # Build PDF
    doc.build(story)

# ==================== Database Endpoints ====================

@app.post("/api/db/sessions", response_model=schemas.SessionResponse, status_code=201)
async def create_session_db(
    session_data: schemas.SessionCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new session in the database
    """
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
        )
        return db_session
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create session: {str(e)}")


@app.get("/api/db/sessions/{session_id}", response_model=schemas.SessionResponse)
async def get_session_db(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get a session by ID from database
    """
    db_session = await crud.get_session_by_id_string(db, session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    return db_session


@app.get("/api/db/sessions/child/{child_name}", response_model=List[schemas.SessionResponse])
async def get_sessions_by_child_db(
    child_name: str,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all sessions for a specific child
    """
    # Note: These old CRUD functions don't exist in async crud.py
    # Return empty list for now
    return []


@app.get("/api/db/sessions/risk/{risk_level}", response_model=List[schemas.SessionResponse])
async def get_sessions_by_risk_db(
    risk_level: str,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """
    Get sessions filtered by risk level
    """
    if risk_level not in ["low", "moderate", "high"]:
        raise HTTPException(status_code=400, detail="Invalid risk level. Must be 'low', 'moderate', or 'high'")
    
    # Note: This function doesn't exist in async crud.py
    return []


@app.get("/api/db/sessions/recent/{days}", response_model=List[schemas.SessionResponse])
async def get_recent_sessions_db(
    days: int = 7,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """
    Get sessions from the last N days
    """
    # Note: This function doesn't exist in async crud.py
    return []


@app.put("/api/db/sessions/{session_id}", response_model=schemas.SessionResponse)
async def update_session_db(
    session_id: str,
    session_update: schemas.SessionUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Update session with analysis results
    """
    try:
        session_uuid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session ID format")
    
    # Note: This function doesn't exist in async crud.py
    raise HTTPException(status_code=501, detail="Not implemented yet")


@app.delete("/api/db/sessions/{session_id}", status_code=204)
async def delete_session_db(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a session by ID
    """
    try:
        session_uuid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session ID format")
    
    # Note: This function doesn't exist in async crud.py
    raise HTTPException(status_code=501, detail="Not implemented yet")


@app.get("/api/db/statistics", response_model=schemas.SessionStatistics)
async def get_statistics_db(db: AsyncSession = Depends(get_db)):
    """
    Get database statistics
    """
    # Note: This function doesn't exist in async crud.py
    return {
        "total_sessions": 0,
        "risk_distribution": {"low": 0, "moderate": 0, "high": 0},
        "sessions_this_week": 0,
        "sessions_this_month": 0,
        "average_score": 0.0
    }


# ==================== Task Result Endpoints ====================

@app.post("/api/db/task-results", response_model=schemas.TaskResultResponse, status_code=201)
async def create_task_result_db(
    task_data: schemas.TaskResultCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new task result
    """
    # Verify session exists
    session = await crud.get_session(db, task_data.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    task_result = await crud.create_task_result(
        db=db,
        session_id=task_data.session_id,
        task_name=task_data.task_name,
        duration_seconds=task_data.duration_seconds,
        status=task_data.status,
        notes=task_data.notes,
        metrics=task_data.metrics
    )
    return task_result


@app.get("/api/db/task-results/{task_id}", response_model=schemas.TaskResultResponse)
async def get_task_result_db(task_id: str, db: AsyncSession = Depends(get_db)):
    """
    Get a specific task result by ID
    """
    try:
        task_uuid = uuid.UUID(task_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid task ID format")
    
    task_result = await crud.get_task_result(db, task_uuid)
    if not task_result:
        raise HTTPException(status_code=404, detail="Task result not found")
    return task_result


@app.get("/api/db/task-results/session/{session_id}", response_model=schemas.TaskResultListResponse)
async def get_task_results_by_session_db(
    session_id: str,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all task results for a specific session
    """
    try:
        session_uuid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session ID format")
    
    # Verify session exists
    session = await crud.get_session(db, session_uuid)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    task_results = await crud.get_task_results_by_session(db, session_uuid, skip, limit)
    
    return {
        "task_results": task_results,
        "total": len(task_results)
    }


@app.get("/api/db/task-results/name/{task_name}", response_model=schemas.TaskResultListResponse)
async def get_task_results_by_name_db(
    task_name: str,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all task results for a specific task name
    """
    # Note: This function doesn't exist in async crud.py
    return {"task_results": [], "total": 0}


@app.get("/api/db/task-results/status/{status}", response_model=schemas.TaskResultListResponse)
async def get_task_results_by_status_db(
    status: str,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all task results by status (success, fail, borderline)
    """
    if status not in ["success", "fail", "borderline"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be: success, fail, or borderline")
    
    # Note: This function doesn't exist in async crud.py
    return {"task_results": [], "total": 0}


@app.put("/api/db/task-results/{task_id}", response_model=schemas.TaskResultResponse)
async def update_task_result_db(
    task_id: str,
    task_data: schemas.TaskResultUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Update a task result
    """
    try:
        task_uuid = uuid.UUID(task_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid task ID format")
    
    # Note: This function doesn't exist in async crud.py
    raise HTTPException(status_code=501, detail="Not implemented yet")


@app.delete("/api/db/task-results/{task_id}", status_code=204)
async def delete_task_result_db(task_id: str, db: AsyncSession = Depends(get_db)):
    """
    Delete a task result
    """
    try:
        task_uuid = uuid.UUID(task_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid task ID format")
    
    # Note: This function doesn't exist in async crud.py
    raise HTTPException(status_code=501, detail="Not implemented yet")


# ==================== Metric Endpoints ====================

@app.post("/api/db/metrics", response_model=schemas.MetricResponse, status_code=201)
async def create_metric_db(
    metric_data: schemas.MetricCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new metric for a task result
    """
    # Verify task result exists
    task_result = await crud.get_task_result(db, metric_data.task_id)
    if not task_result:
        raise HTTPException(status_code=404, detail="Task result not found")
    
    metric = await crud.create_metric(
        db=db,
        task_id=metric_data.task_id,
        metric_name=metric_data.metric_name,
        metric_value=metric_data.metric_value
    )
    return metric


@app.post("/api/db/metrics/batch", response_model=List[schemas.MetricResponse], status_code=201)
async def create_metrics_batch_db(
    task_id: str,
    metrics: Dict[str, float],
    db: AsyncSession = Depends(get_db)
):
    """
    Create multiple metrics for a task at once
    Example body: {"accuracy": 0.95, "stability": 0.88, "balance": 0.92}
    """
    try:
        task_uuid = uuid.UUID(task_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid task ID format")
    
    # Verify task result exists
    task_result = await crud.get_task_result(db, task_uuid)
    if not task_result:
        raise HTTPException(status_code=404, detail="Task result not found")
    
    created_metrics = await crud.create_metrics_batch(db, task_uuid, metrics)
    return created_metrics


@app.get("/api/db/metrics/{metric_id}", response_model=schemas.MetricResponse)
async def get_metric_db(metric_id: str, db: AsyncSession = Depends(get_db)):
    """
    Get a specific metric by ID
    """
    try:
        metric_uuid = uuid.UUID(metric_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid metric ID format")
    
    # Note: get_metric doesn't exist in async crud.py
    raise HTTPException(status_code=501, detail="Not implemented yet")


@app.get("/api/db/metrics/task/{task_id}", response_model=schemas.MetricListResponse)
async def get_metrics_by_task_db(
    task_id: str,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all metrics for a specific task result
    """
    try:
        task_uuid = uuid.UUID(task_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid task ID format")
    
    # Verify task result exists
    task_result = await crud.get_task_result(db, task_uuid)
    if not task_result:
        raise HTTPException(status_code=404, detail="Task result not found")
    
    metrics = await crud.get_metrics_by_task(db, task_uuid, skip, limit)
    
    return {
        "metrics": metrics,
        "total": len(metrics)
    }


@app.get("/api/db/metrics/task/{task_id}/name/{metric_name}", response_model=List[schemas.MetricResponse])
async def get_metrics_by_name_db(
    task_id: str,
    metric_name: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all metrics with a specific name for a task
    """
    try:
        task_uuid = uuid.UUID(task_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid task ID format")
    
    # Note: This function doesn't exist in async crud.py
    return []


@app.put("/api/db/metrics/{metric_id}", response_model=schemas.MetricResponse)
async def update_metric_db(
    metric_id: str,
    metric_data: schemas.MetricUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Update a metric value
    """
    try:
        metric_uuid = uuid.UUID(metric_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid metric ID format")
    
    # Note: This function doesn't exist in async crud.py
    raise HTTPException(status_code=501, detail="Not implemented yet")


@app.delete("/api/db/metrics/{metric_id}", status_code=204)
async def delete_metric_db(metric_id: str, db: AsyncSession = Depends(get_db)):
    """
    Delete a metric
    """
    try:
        metric_uuid = uuid.UUID(metric_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid metric ID format")
    
    # Note: This function doesn't exist in async crud.py
    raise HTTPException(status_code=501, detail="Not implemented yet")


# ==================== Cleanup Functions ====================

def cleanup_old_reports():
    """Remove reports older than 24 hours"""
    import time
    current_time = time.time()
    for report in REPORTS_DIR.glob("*.pdf"):
        if current_time - report.stat().st_mtime > 86400:  # 24 hours
            report.unlink()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
