from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Habit
from app.repositories.habit_repository import HabitRepository
from app.schemas.habit import HabitCreate


class HabitService:
    """Бизнес-логика привычек."""

    def __init__(self, db: AsyncSession) -> None:
        self.habit_repository = HabitRepository(db)

    async def create_or_update(self, habit_data: HabitCreate, user_id: int) -> Habit:
        """Создаёт новую привычку или обновляет существующую."""
        habit = await self.habit_repository.get_by_category(habit_data.category, user_id)

        if habit:
            habit.preferred_time = habit_data.preferred_time
            return await self.habit_repository.save(habit)

        new_habit = Habit(
            user_id=user_id,
            category=habit_data.category,
            preferred_time=habit_data.preferred_time,
        )
        return await self.habit_repository.save(new_habit)

    async def list_all(self, user_id: int) -> list[Habit]:
        """Возвращает список привычек."""
        return await self.habit_repository.list_all(user_id)

    async def get_by_category(self, category: str, user_id: int) -> Habit | None:
        """Возвращает привычку по категории."""
        return await self.habit_repository.get_by_category(category, user_id)
