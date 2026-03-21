from sqlalchemy import select

from app.db.models import Habit
from app.repositories.base import BaseRepository


class HabitRepository(BaseRepository[Habit]):
    """Репозиторий привычек."""

    async def get_by_category(self, category: str) -> Habit | None:
        stmt = select(Habit).where(Habit.category == category)
        result = await self.db.scalars(stmt)
        return result.first()

    async def list_all(self) -> list[Habit]:
        stmt = select(Habit).order_by(Habit.category.asc())
        result = await self.db.scalars(stmt)
        return list(result.all())
