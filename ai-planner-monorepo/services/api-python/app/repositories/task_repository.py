from sqlalchemy import select

from app.db.models import Task
from app.repositories.base import BaseRepository


class TaskRepository(BaseRepository[Task]):
    """Репозиторий задач."""

    async def list_all(self, user_id: int) -> list[Task]:
        stmt = select(Task).where(Task.user_id == user_id).order_by(Task.id.desc())
        result = await self.db.scalars(stmt)
        return list(result.all())

    async def list_scheduled(self, user_id: int) -> list[Task]:
        stmt = select(Task).where(
            Task.user_id == user_id,
            Task.scheduled_at.is_not(None),
        )
        result = await self.db.scalars(stmt)
        return list(result.all())

    async def get_by_id(self, task_id: int, user_id: int) -> Task | None:
        stmt = select(Task).where(
            Task.id == task_id,
            Task.user_id == user_id,
        )
        result = await self.db.scalars(stmt)
        return result.first()
