from sqlalchemy import Column, String, Integer, Numeric, Text, ForeignKey, TIMESTAMP
from sqlalchemy.orm import relationship
from database import Base

class Session(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, index=True)
    display_id = Column(Integer, unique=True, index=True)  # 4-digit ID for display
    child_name = Column(Text)
    child_age = Column(Integer)
    child_height_cm = Column(Numeric)
    child_weight_kg = Column(Numeric)
    child_gender = Column(Text)
    child_notes = Column(Text)
    started_at = Column(TIMESTAMP)
    session_type = Column(Text, default="initial")  # "initial" or "followup"
    parent_session_id = Column(String, ForeignKey("sessions.id", ondelete="SET NULL"), nullable=True)  # Links to initial session

    tasks = relationship("Task", back_populates="session", cascade="all, delete")
    followups = relationship("Session", remote_side=[id], backref="parent_session")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(String, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("sessions.id", ondelete="CASCADE"))
    task_name = Column(Text)
    duration_seconds = Column(Numeric)
    status = Column(Text)
    notes = Column(Text)

    session = relationship("Session", back_populates="tasks")
    metrics = relationship("Metric", back_populates="task", cascade="all, delete")


class Metric(Base):
    __tablename__ = "metrics"

    id = Column(String, primary_key=True, index=True)
    task_id = Column(String, ForeignKey("tasks.id", ondelete="CASCADE"))
    metric_name = Column(Text)
    metric_value = Column(Numeric)

    task = relationship("Task", back_populates="metrics")
