from datetime import datetime

from sqlalchemy import DateTime, Integer, func
from sqlalchemy.orm import Mapped, mapped_column


class IdMixin:
    """Добавляет первичный ключ id."""

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)


class TimestampMixin:
    """Добавляет дату создания записи."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )