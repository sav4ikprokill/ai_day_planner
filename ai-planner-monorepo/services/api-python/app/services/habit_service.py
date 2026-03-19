from sqlalchemy.orm import Session

from app.db.models import Habit
from app.repositories.habit_repository import HabitRepository
from app.schemas.habit import HabitCreate


class HabitService:
    """Бизнес-логика привычек."""

    def __init__(self, db: Session) -> None:
        self.habit_repository = HabitRepository(db)

    def create_or_update(self, habit_data: HabitCreate) -> Habit:
        """Создаёт новую привычку или обновляет существующую."""
        habit = self.habit_repository.get_by_category(habit_data.category)

        if habit:
            habit.preferred_time = habit_data.preferred_time
            return self.habit_repository.save(habit)

        new_habit = Habit(
            category=habit_data.category,
            preferred_time=habit_data.preferred_time,
        )
        return self.habit_repository.save(new_habit)

    def list_all(self) -> list[Habit]:
        """Возвращает список привычек."""
        return self.habit_repository.list_all()

    def get_by_category(self, category: str) -> Habit | None:
        """Возвращает привычку по категории."""
        return self.habit_repository.get_by_category(category)