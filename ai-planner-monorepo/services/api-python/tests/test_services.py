from datetime import datetime, timedelta

import pytest

from app.db.models import Task, TaskPriority, TaskSource, TaskStatus, User
from app.services.task_service import TaskService
from app.services.text_parser import parse_task_command


@pytest.mark.asyncio
async def test_parse_task_command_tomorrow_at_1900():
    before = datetime.now()
    parsed = parse_task_command("завтра в 19:00")
    after = datetime.now()

    assert parsed.scheduled_at is not None
    assert parsed.scheduled_at.hour == 19
    assert parsed.scheduled_at.minute == 0
    assert parsed.scheduled_at.date() in {
        (before + timedelta(days=1)).date(),
        (after + timedelta(days=1)).date(),
    }


@pytest.mark.asyncio
async def test_parse_task_command_today_morning():
    today = datetime.now().date()
    parsed = parse_task_command("сегодня утром")

    assert parsed.scheduled_at is not None
    assert parsed.scheduled_at.date() == today
    assert parsed.scheduled_at.hour == 9
    assert parsed.scheduled_at.minute == 0


@pytest.mark.asyncio
async def test_parse_task_command_training_at_1530():
    today = datetime.now().date()
    parsed = parse_task_command("тренировку в 15:30")

    assert parsed.scheduled_at is not None
    assert parsed.scheduled_at.date() == today
    assert parsed.scheduled_at.hour == 15
    assert parsed.scheduled_at.minute == 30


@pytest.mark.asyncio
async def test_find_next_free_slot_bumps_conflicting_tasks(db_session):
    db_session.add(
        User(
            telegram_id=7777777,
            username="dev_local_user",
            first_name="Dev",
            email="dev_local_user@example.com",
        ),
    )
    await db_session.commit()

    base_time = datetime(2026, 4, 10, 10, 0, 0)
    db_session.add_all(
        [
            Task(
                user_id=7777777,
                title="Первая задача",
                category="general",
                scheduled_at=base_time,
                duration_minutes=30,
                status=TaskStatus.PLANNED,
                priority=TaskPriority.MEDIUM,
                source=TaskSource.MANUAL,
            ),
            Task(
                user_id=7777777,
                title="Вторая задача",
                category="general",
                scheduled_at=base_time + timedelta(minutes=30),
                duration_minutes=30,
                status=TaskStatus.PLANNED,
                priority=TaskPriority.MEDIUM,
                source=TaskSource.MANUAL,
            ),
        ],
    )
    await db_session.commit()

    service = TaskService(db_session)
    next_slot = await service._find_next_free_slot(
        scheduled_at=base_time,
        duration_minutes=30,
        user_id=7777777,
    )

    assert next_slot == base_time + timedelta(minutes=60)
