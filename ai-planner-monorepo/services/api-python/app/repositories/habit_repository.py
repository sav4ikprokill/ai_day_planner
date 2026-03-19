from sqlalchemy import select

from app.db.models import Habit
from app.repositories.base import BaseRepository


class HabitRepository(BaseRepository[Habit]):
    """Репозиторий привычек."""

    def get_by_category(self, category: str) -> Habit | None:
        stmt = select(Habit).where(Habit.category == category)
        return self.db.scalars(stmt).first()

    def list_all(self) -> list[Habit]:
        stmt = select(Habit).order_by(Habit.category.asc())
        return list(self.db.scalars(stmt).all())