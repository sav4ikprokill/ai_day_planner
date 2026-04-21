from datetime import time

import pytest

from app.db.models import Habit, Task, TaskPriority, TaskSource, TaskStatus, User


DEV_HEADERS = {"X-Telegram-Init-Data": "dev-mode-init-data"}


@pytest.mark.asyncio
async def test_post_tasks_parse_returns_task_object(client):
    response = await client.post(
        "/tasks/parse",
        headers=DEV_HEADERS,
        json={"text": "Напомни провести ревью кода завтра, приоритет высокий"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["id"] > 0
    assert payload["title"]
    assert payload["status"] == "planned"
    assert payload["source"] == "text"


@pytest.mark.asyncio
async def test_get_tasks_returns_only_authenticated_user_tasks(client, db_session):
    db_session.add_all(
        [
            User(
                telegram_id=7777777,
                username="dev_local_user",
                first_name="Dev",
                email="dev_local_user@example.com",
            ),
            User(
                telegram_id=9999999,
                username="other_user",
                first_name="Other",
                email="other@example.com",
            ),
        ],
    )
    await db_session.commit()

    db_session.add_all(
        [
            Task(
                user_id=7777777,
                title="Моя задача",
                category="general",
                duration_minutes=30,
                status=TaskStatus.PLANNED,
                priority=TaskPriority.MEDIUM,
                source=TaskSource.MANUAL,
            ),
            Task(
                user_id=9999999,
                title="Чужая задача",
                category="general",
                duration_minutes=30,
                status=TaskStatus.PLANNED,
                priority=TaskPriority.MEDIUM,
                source=TaskSource.MANUAL,
            ),
        ],
    )
    await db_session.commit()

    response = await client.get("/tasks/", headers=DEV_HEADERS)

    assert response.status_code == 200
    payload = response.json()
    assert len(payload) == 1
    assert payload[0]["title"] == "Моя задача"


@pytest.mark.asyncio
async def test_post_habits_creates_habit(client, db_session):
    db_session.add(
        User(
            telegram_id=7777777,
            username="dev_local_user",
            first_name="Dev",
            email="dev_local_user@example.com",
        ),
    )
    await db_session.commit()

    response = await client.post(
        "/habits/",
        headers=DEV_HEADERS,
        json={"category": "sport", "preferred_time": "19:00:00"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["id"] > 0
    assert payload["category"] == "sport"
    assert payload["preferred_time"] == "19:00:00"

    habits = await db_session.execute(
        Habit.__table__.select().where(Habit.user_id == 7777777),
    )
    assert len(habits.all()) == 1


@pytest.mark.asyncio
async def test_health_returns_ok(client):
    response = await client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
