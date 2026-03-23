from datetime import datetime, time
from enum import Enum

from sqlalchemy import JSON, BigInteger, DateTime, Enum as SqlEnum, ForeignKey, Integer, String, Time, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

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


class User(Base):
    """Пользователь, авторизованный через Telegram."""

    __tablename__ = "users"

    telegram_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    username: Mapped[str | None] = mapped_column(String(255), nullable=True)
    first_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    tasks: Mapped[list["Task"]] = relationship(back_populates="user")
    habits: Mapped[list["Habit"]] = relationship(back_populates="user")


class Task(Base, IdMixin, TimestampMixin):
    """Модель задачи."""

    __tablename__ = "tasks"

    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.telegram_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(100), default="general")
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=30)
    status: Mapped[TaskStatus] = mapped_column(
        SqlEnum(TaskStatus, name="task_status"),
        default=TaskStatus.PLANNED,
        nullable=False,
    )
    priority: Mapped[TaskPriority] = mapped_column(
        SqlEnum(TaskPriority, name="task_priority"),
        default=TaskPriority.MEDIUM,
        nullable=False,
    )
    source: Mapped[TaskSource] = mapped_column(
        SqlEnum(TaskSource, name="task_source"),
        default=TaskSource.MANUAL,
        nullable=False,
    )

    user: Mapped[User] = relationship(back_populates="tasks")


class Habit(Base, IdMixin, TimestampMixin):
    """Модель привычки с рекомендуемым временем."""

    __tablename__ = "habits"

    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.telegram_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    preferred_time: Mapped[time] = mapped_column(Time, nullable=False)

    user: Mapped[User] = relationship(back_populates="habits")


class Job(Base, IdMixin):
    """Фоновая задача для асинхронной обработки."""

    __tablename__ = "jobs"

    task_type: Mapped[str] = mapped_column(String(100), nullable=False)
    payload: Mapped[dict[str, object]] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"),
        nullable=False,
        default=dict,
    )
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
