from sqlalchemy import select

from app.db.models import Task
from app.repositories.base import BaseRepository


class TaskRepository(BaseRepository[Task]):
    """Репозиторий задач."""

    def list_all(self) -> list[Task]:
        stmt = select(Task).order_by(Task.id.desc())
        return list(self.db.scalars(stmt).all())

    def list_scheduled(self) -> list[Task]:
        stmt = select(Task).where(Task.scheduled_at.is_not(None))
        return list(self.db.scalars(stmt).all())

    def get_by_id(self, task_id: int) -> Task | None:
        stmt = select(Task).where(Task.id == task_id)
        return self.db.scalars(stmt).first()