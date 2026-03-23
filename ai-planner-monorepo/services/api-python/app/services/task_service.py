from datetime import date, datetime, timedelta

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Job, Task, TaskSource, TaskStatus
from app.repositories.habit_repository import HabitRepository
from app.repositories.task_repository import TaskRepository
from app.schemas.task import TaskCreate, TaskStatusUpdate
from app.services.text_parser import parse_task_command


SLOT_STEP_MINUTES = 30
DEFAULT_TASK_DURATION = 30


class TaskService:
    """Бизнес-логика задач и планирования."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.task_repository = TaskRepository(db)
        self.habit_repository = HabitRepository(db)

    async def _build_scheduled_datetime(self, category: str, user_id: int) -> datetime | None:
        habit = await self.habit_repository.get_by_category(category, user_id)
        if not habit:
            return None

        now = datetime.now()
        scheduled = datetime.combine(date.today(), habit.preferred_time)

        if scheduled <= now:
            scheduled += timedelta(days=1)

        return scheduled

    @staticmethod
    def _get_task_end(task: Task) -> datetime | None:
        if task.scheduled_at is None:
            return None
        return task.scheduled_at + timedelta(minutes=task.duration_minutes)

    async def _has_conflict(self, scheduled_at: datetime, duration_minutes: int, user_id: int) -> bool:
        new_start = scheduled_at
        new_end = scheduled_at + timedelta(minutes=duration_minutes)

        for task in await self.task_repository.list_scheduled(user_id):
            existing_start = task.scheduled_at
            existing_end = self._get_task_end(task)

            if existing_start is None or existing_end is None:
                continue

            if new_start < existing_end and new_end > existing_start:
                return True

        return False

    async def _find_next_free_slot(
        self,
        scheduled_at: datetime,
        duration_minutes: int,
        user_id: int,
        ) -> datetime:
        candidate = scheduled_at

        while await self._has_conflict(candidate, duration_minutes, user_id):
            candidate += timedelta(minutes=SLOT_STEP_MINUTES)

        return candidate

    async def create(self, task_data: TaskCreate, user_id: int) -> Task:
        scheduled_at = task_data.scheduled_at

        if scheduled_at is None:
            scheduled_at = await self._build_scheduled_datetime(task_data.category, user_id)

        if scheduled_at is not None:
            scheduled_at = await self._find_next_free_slot(
                scheduled_at=scheduled_at,
                duration_minutes=task_data.duration_minutes,
                user_id=user_id,
            )

        task = Task(
            user_id=user_id,
            title=task_data.title,
            category=task_data.category,
            scheduled_at=scheduled_at,
            duration_minutes=task_data.duration_minutes,
            status=TaskStatus.PLANNED,
            priority=task_data.priority,
            source=task_data.source,
        )
        try:
            await self.task_repository.save(task, commit=False)

            job = Job(
                task_type="send_notification",
                payload={
                    "task_id": task.id,
                    "chat_id": user_id,
                    "message": "New task created!",
                },
                status="pending",
            )
            self.db.add(job)

            await self.db.commit()
            await self.db.refresh(task)
            return task
        except Exception:
            await self.db.rollback()
            raise

    async def create_from_text(self, text: str, user_id: int) -> Task:
        parsed = parse_task_command(text)

        task_data = TaskCreate(
            title=parsed.title,
            category=parsed.category,
            scheduled_at=parsed.scheduled_at,
            duration_minutes=DEFAULT_TASK_DURATION,
            source=TaskSource.TEXT,
        )
        return await self.create(task_data, user_id)

    async def list_all(self, user_id: int) -> list[Task]:
        return await self.task_repository.list_all(user_id)

    async def update_status(self, task_id: int, payload: TaskStatusUpdate, user_id: int) -> Task:
        task = await self.task_repository.get_by_id(task_id, user_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        task.status = payload.status
        return await self.task_repository.save(task)
