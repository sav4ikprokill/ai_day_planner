from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.db.models import TaskPriority, TaskSource, TaskStatus


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    category: str = Field(default="general", min_length=1, max_length=100)
    scheduled_at: datetime | None = None
    duration_minutes: int = Field(default=30, ge=1, le=1440)
    priority: TaskPriority = TaskPriority.MEDIUM
    source: TaskSource = TaskSource.MANUAL


class TaskParseRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=500)
    source: Literal[TaskSource.TEXT, TaskSource.VOICE] = TaskSource.TEXT


class TaskParsedData(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=1000)
    priority: int = Field(default=1, ge=1, le=3)
    due_date: datetime | None = None


class TaskStatusUpdate(BaseModel):
    status: TaskStatus


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    category: str | None = Field(default=None, min_length=1, max_length=100)
    scheduled_at: datetime | None = None
    duration_minutes: int | None = Field(default=None, ge=1, le=1440)
    priority: TaskPriority | None = None


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


class TaskOptimizedResponse(BaseModel):
    id: int
    title: str
    priority: int = Field(default=1, ge=1, le=3)


class TaskStatsResponse(BaseModel):
    total_tasks: int
    completed_tasks: int
    completion_rate: float
    tasks_today: int
    completed_today: int
    top_category: str | None
    current_streak: int
