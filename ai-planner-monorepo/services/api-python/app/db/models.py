from datetime import datetime, time
from enum import Enum

from sqlalchemy import DateTime, Enum as SqlEnum, Integer, String, Time
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.mixins import IdMixin, TimestampMixin


class TaskStatus(str, Enum):
    PLANNED = "planned"
    DONE = "done"
    CANCELLED = "cancelled"


class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class TaskSource(str, Enum):
    MANUAL = "manual"
    TEXT = "text"
    VOICE = "voice"


class Task(Base, IdMixin, TimestampMixin):
    """Модель задачи."""

    __tablename__ = "tasks"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(100), default="general")
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=30)
    status: Mapped[TaskStatus] = mapped_column(
        SqlEnum(TaskStatus),
        default=TaskStatus.PLANNED,
        nullable=False,
    )
    priority: Mapped[TaskPriority] = mapped_column(
        SqlEnum(TaskPriority),
        default=TaskPriority.MEDIUM,
        nullable=False,
    )
    source: Mapped[TaskSource] = mapped_column(
        SqlEnum(TaskSource),
        default=TaskSource.MANUAL,
        nullable=False,
    )


class Habit(Base, IdMixin, TimestampMixin):
    """Модель привычки с рекомендуемым временем."""

    __tablename__ = "habits"

    category: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    preferred_time: Mapped[time] = mapped_column(Time, nullable=False)