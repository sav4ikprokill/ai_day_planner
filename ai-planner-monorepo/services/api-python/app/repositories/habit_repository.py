from sqlalchemy import select

from app.db.models import Habit
from app.repositories.base import BaseRepository


class HabitRepository(BaseRepository[Habit]):
    """Репозиторий привычек."""

    async def get_by_category(self, category: str, user_id: int) -> Habit | None:
        stmt = select(Habit).where(
            Habit.category == category,
            Habit.user_id == user_id,
        )
        result = await self.db.scalars(stmt)
        return result.first()

    async def list_all(self, user_id: int) -> list[Habit]:
        stmt = select(Habit).where(Habit.user_id == user_id).order_by(Habit.category.asc())
        result = await self.db.scalars(stmt)
        return list(result.all())
