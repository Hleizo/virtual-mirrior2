from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SessionCreate(BaseModel):
    child_name: str
    child_age: int
    child_height_cm: Optional[int] = None
    child_weight_kg: Optional[int] = None
    child_gender: Optional[str] = None
    child_notes: Optional[str] = None
    task_metrics: Optional[dict] = None
    session_type: Optional[str] = "initial"  # "initial" or "followup"
    parent_session_id: Optional[str] = None  # ID of the initial session if this is a follow-up


class SessionResponse(BaseModel):
    id: str
    display_id: Optional[int] = None
    child_name: str
    child_age: int
    child_height_cm: Optional[int] = None
    child_weight_kg: Optional[int] = None
    child_gender: Optional[str] = None
    child_notes: Optional[str] = None
    started_at: Optional[datetime] = None
    session_type: Optional[str] = "initial"
    parent_session_id: Optional[str] = None

    class Config:
        from_attributes = True


class SessionUpdate(BaseModel):
    risk_level: Optional[str] = None
    overall_score: Optional[int] = None
    child_notes: Optional[str] = None


class TaskResultCreate(BaseModel):
    task_name: str
    duration_seconds: Optional[float] = 0.0
    status: Optional[str] = "pending"
    notes: Optional[str] = ""
    metrics: Optional[dict] = None


class TaskResultUpdate(BaseModel):
    duration_seconds: Optional[float] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class TaskResultResponse(BaseModel):
    id: str
    session_id: str
    task_name: str
    duration_seconds: float
    status: str
    notes: str

    class Config:
        from_attributes = True


class MetricCreate(BaseModel):
    metric_name: str
    metric_value: float


class MetricUpdate(BaseModel):
    metric_value: Optional[float] = None


class MetricResponse(BaseModel):
    id: str
    task_id: str
    metric_name: str
    metric_value: float

    class Config:
        from_attributes = True


class SessionStatistics(BaseModel):
    total_sessions: int
    risk_distribution: dict
    sessions_this_week: int
    sessions_this_month: int
    average_score: float


class TaskResultListResponse(BaseModel):
    results: list[TaskResultResponse]


class MetricListResponse(BaseModel):
    metrics: list[MetricResponse]
