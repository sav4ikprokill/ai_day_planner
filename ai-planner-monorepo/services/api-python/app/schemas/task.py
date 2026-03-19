from datetime import datetime

from pydantic import BaseModel, Field

from app.db.models import TaskPriority, TaskSource, TaskStatus


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    category: str = Field(default="general", min_length=1, max_length=100)
    scheduled_at: datetime | None = None
    duration_minutes: int = Field(default=30, ge=1, le=1440)
    priority: TaskPriority = TaskPriority.MEDIUM
    source: TaskSource = TaskSource.MANUAL


class TaskStatusUpdate(BaseModel):
    status: TaskStatus


class TaskResponse(BaseModel):
    id: int
    title: str
    category: str
    scheduled_at: datetime | None
    duration_minutes: int
    status: TaskStatus
    priority: TaskPriority
    source: TaskSource

    model_config = {"from_attributes": True}