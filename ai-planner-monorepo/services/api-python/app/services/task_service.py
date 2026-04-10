import logging
from collections import Counter
from datetime import date, datetime, timedelta

import httpx

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.models import Job, Task, TaskSource, TaskStatus
from app.repositories.habit_repository import HabitRepository
from app.repositories.task_repository import TaskRepository
from app.schemas.task import TaskCreate, TaskStatusUpdate, TaskUpdate
from app.services.text_parser import parse_task_command


SLOT_STEP_MINUTES = 30
DEFAULT_TASK_DURATION = 30
logger = logging.getLogger(__name__)


class TaskService:
    """Бизнес-логика задач и планирования."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.task_repository = TaskRepository(db)
        self.habit_repository = HabitRepository(db)

    @staticmethod
    def _resolve_notification_email(user_email: str | None) -> str:
        if user_email and user_email.strip():
            return user_email.strip()

        return "no-reply@example.com"

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

    @staticmethod
    def _priority_to_int(task: Task) -> int:
        if task.priority.name == "HIGH":
            return 3
        if task.priority.name == "MEDIUM":
            return 2
        return 1

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

    async def create(self, task_data: TaskCreate, user_id: int, user_email: str | None = None) -> Task:
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
                    "email": self._resolve_notification_email(user_email),
                    "message": f"New task created: {task.title}",
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

    async def create_from_text(self, text: str, user_id: int, user_email: str | None = None) -> Task:
        parsed = parse_task_command(text)

        task_data = TaskCreate(
            title=parsed.title,
            category=parsed.category,
            scheduled_at=parsed.scheduled_at,
            duration_minutes=DEFAULT_TASK_DURATION,
            source=TaskSource.TEXT,
        )
        return await self.create(task_data, user_id, user_email=user_email)

    async def list_all(self, user_id: int) -> list[Task]:
        return await self.task_repository.list_all(user_id)

    async def get_optimized_schedule(self, user_id: int) -> list[dict[str, int | str]]:
        tasks = await self.task_repository.list_all(user_id)
        active_tasks = [task for task in tasks if task.status == TaskStatus.PLANNED]

        payload = [
            {
                "id": task.id,
                "title": task.title,
                "priority": self._priority_to_int(task),
            }
            for task in active_tasks
        ]

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.post(settings.scheduler_url, json=payload)
                response.raise_for_status()
                optimized = response.json()
        except (httpx.RequestError, httpx.TimeoutException, httpx.HTTPStatusError) as error:
            logger.warning(
                "Scheduler service unavailable, falling back to local sorting: %s",
                error,
            )
            optimized = sorted(
                payload,
                key=lambda task: (-int(task["priority"]), int(task["id"])),
            )

        return optimized

    async def update_status(self, task_id: int, payload: TaskStatusUpdate, user_id: int) -> Task:
        task = await self.task_repository.get_by_id(task_id, user_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        task.status = payload.status
        return await self.task_repository.save(task)

    async def delete(self, task_id: int, user_id: int) -> None:
        deleted = await self.task_repository.delete(task_id, user_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Task not found")

    async def update(self, task_id: int, user_id: int, data: TaskUpdate) -> Task:
        payload = data.model_dump(exclude_none=True)
        task = await self.task_repository.update(task_id, user_id, payload)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        return task

    async def get_stats(self, user_id: int) -> dict[str, int | float | str | None]:
        tasks = await self.task_repository.list_all(user_id)
        today = date.today()

        total_tasks = len(tasks)
        completed_tasks_list = [task for task in tasks if task.status == TaskStatus.DONE]
        completed_tasks = len(completed_tasks_list)
        tasks_today = sum(1 for task in tasks if task.scheduled_at and task.scheduled_at.date() == today)
        completed_today = sum(
            1
            for task in completed_tasks_list
            if task.scheduled_at and task.scheduled_at.date() == today
        )

        top_category = None
        if completed_tasks_list:
            category_counts = Counter(task.category for task in completed_tasks_list)
            top_category = category_counts.most_common(1)[0][0]

        completed_days = {
            task.scheduled_at.date()
            for task in completed_tasks_list
            if task.scheduled_at is not None
        }
        current_streak = 0
        cursor = today
        while cursor in completed_days:
            current_streak += 1
            cursor -= timedelta(days=1)

        completion_rate = 0.0
        if total_tasks > 0:
            completion_rate = completed_tasks / total_tasks

        return {
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "completion_rate": completion_rate,
            "tasks_today": tasks_today,
            "completed_today": completed_today,
            "top_category": top_category,
            "current_streak": current_streak,
        }
