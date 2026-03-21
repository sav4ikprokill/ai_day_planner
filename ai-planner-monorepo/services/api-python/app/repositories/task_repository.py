from sqlalchemy import select

from app.db.models import Task
from app.repositories.base import BaseRepository


class TaskRepository(BaseRepository[Task]):
    """Репозиторий задач."""

    async def list_all(self) -> list[Task]:
        stmt = select(Task).order_by(Task.id.desc())
        result = await self.db.scalars(stmt)
        return list(result.all())

    async def list_scheduled(self) -> list[Task]:
        stmt = select(Task).where(Task.scheduled_at.is_not(None))
        result = await self.db.scalars(stmt)
        return list(result.all())

    async def get_by_id(self, task_id: int) -> Task | None:
        stmt = select(Task).where(Task.id == task_id)
        result = await self.db.scalars(stmt)
        return result.first()
