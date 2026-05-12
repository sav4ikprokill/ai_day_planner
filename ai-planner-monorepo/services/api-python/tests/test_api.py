from datetime import datetime, time

import pytest

from app.api.deps import get_current_user
from app.db.models import Habit, Task, TaskPriority, TaskSource, TaskStatus, User


DEV_HEADERS = {"X-Telegram-Init-Data": "dev-mode-init-data"}
VERCEL_PREVIEW_ORIGIN = "https://ai-day-planner-r4ujbqbof-liss-projects-ee16082b.vercel.app"


def override_current_user(app, user: User) -> None:
    async def _override() -> User:
        return user

    app.dependency_overrides[get_current_user] = _override


def clear_current_user_override(app) -> None:
    app.dependency_overrides.pop(get_current_user, None)


@pytest.mark.asyncio
async def test_cors_preflight_allows_vercel_preview_origin(client):
    response = await client.options(
        "/tasks/",
        headers={
            "Origin": VERCEL_PREVIEW_ORIGIN,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "X-Telegram-Init-Data",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == VERCEL_PREVIEW_ORIGIN


@pytest.mark.asyncio
async def test_post_tasks_parse_returns_task_object(client):
    response = await client.post(
        "/tasks/parse",
        headers=DEV_HEADERS,
        json={"text": "Напомни провести ревью кода завтра, приоритет высокий"},
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["id"] > 0
    assert payload["title"]
    assert payload["status"] == "planned"
    assert payload["source"] == "text"


@pytest.mark.asyncio
async def test_post_tasks_parse_with_voice_source_returns_voice_task(client):
    response = await client.post(
        "/tasks/parse",
        headers=DEV_HEADERS,
        json={
            "text": "добавь тренировку завтра в 19:00",
            "source": "voice",
        },
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["id"] > 0
    assert payload["source"] == "voice"


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
async def test_post_habits_same_category_updates_existing_habit(client, db_session):
    db_session.add(
        User(
            telegram_id=7777777,
            username="dev_local_user",
            first_name="Dev",
            email="dev_local_user@example.com",
        ),
    )
    await db_session.commit()

    first_response = await client.post(
        "/habits/",
        headers=DEV_HEADERS,
        json={"category": "sport", "preferred_time": "19:00:00"},
    )
    second_response = await client.post(
        "/habits/",
        headers=DEV_HEADERS,
        json={"category": "sport", "preferred_time": "08:30:00"},
    )

    assert first_response.status_code == 200
    assert second_response.status_code == 200
    assert second_response.json()["id"] == first_response.json()["id"]
    assert second_response.json()["preferred_time"] == "08:30:00"

    habits = await db_session.execute(
        Habit.__table__.select().where(Habit.user_id == 7777777),
    )
    rows = habits.all()
    assert len(rows) == 1


@pytest.mark.asyncio
async def test_health_returns_ok(client):
    response = await client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_get_task_stats_returns_expected_aggregates(client, db_session):
    db_session.add(
        User(
            telegram_id=7777777,
            username="dev_local_user",
            first_name="Dev",
            email="dev_local_user@example.com",
        ),
    )
    await db_session.commit()

    db_session.add_all(
        [
            Task(
                user_id=7777777,
                title="Утренняя тренировка",
                category="sport",
                scheduled_at=datetime(2026, 4, 28, 9, 0, 0),
                duration_minutes=30,
                status=TaskStatus.DONE,
                priority=TaskPriority.HIGH,
                source=TaskSource.TEXT,
            ),
            Task(
                user_id=7777777,
                title="Подготовка к предзащите",
                category="study",
                duration_minutes=60,
                status=TaskStatus.PLANNED,
                priority=TaskPriority.MEDIUM,
                source=TaskSource.MANUAL,
            ),
        ],
    )
    await db_session.commit()

    response = await client.get("/tasks/stats/", headers=DEV_HEADERS)

    assert response.status_code == 200
    payload = response.json()
    assert payload["total_tasks"] == 2
    assert payload["completed_tasks"] == 1
    assert payload["top_category"] == "sport"


@pytest.mark.asyncio
async def test_update_and_delete_task_flow(client, db_session):
    db_session.add(
        User(
            telegram_id=7777777,
            username="dev_local_user",
            first_name="Dev",
            email="dev_local_user@example.com",
        ),
    )
    await db_session.commit()

    task = Task(
        user_id=7777777,
        title="Черновик задачи",
        category="general",
        duration_minutes=30,
        status=TaskStatus.PLANNED,
        priority=TaskPriority.MEDIUM,
        source=TaskSource.MANUAL,
    )
    db_session.add(task)
    await db_session.commit()
    await db_session.refresh(task)

    update_response = await client.put(
        f"/tasks/{task.id}",
        headers=DEV_HEADERS,
        json={
            "title": "Обновлённая задача",
            "category": "study",
            "duration_minutes": 45,
            "priority": "high",
        },
    )

    assert update_response.status_code == 200
    updated_payload = update_response.json()
    assert updated_payload["title"] == "Обновлённая задача"
    assert updated_payload["category"] == "study"
    assert updated_payload["duration_minutes"] == 45
    assert updated_payload["priority"] == "high"

    delete_response = await client.delete(f"/tasks/{task.id}", headers=DEV_HEADERS)

    assert delete_response.status_code == 204

    get_response = await client.get("/tasks/", headers=DEV_HEADERS)
    assert get_response.status_code == 200
    assert get_response.json() == []


@pytest.mark.asyncio
async def test_user_isolation_between_two_users_for_task_listing(client, app):
    user_a = User(
        telegram_id=1111111,
        username="user_a",
        first_name="UserA",
        email="a@example.com",
    )
    user_b = User(
        telegram_id=2222222,
        username="user_b",
        first_name="UserB",
        email="b@example.com",
    )

    try:
        override_current_user(app, user_a)
        create_a_response = await client.post(
            "/tasks/",
            json={"title": "Задача пользователя A", "category": "general"},
        )
        assert create_a_response.status_code == 201

        override_current_user(app, user_b)
        create_b_response = await client.post(
            "/tasks/",
            json={"title": "Задача пользователя B", "category": "general"},
        )
        assert create_b_response.status_code == 201

        override_current_user(app, user_a)
        user_a_tasks_response = await client.get("/tasks/")
        assert user_a_tasks_response.status_code == 200
        user_a_tasks = user_a_tasks_response.json()
        assert len(user_a_tasks) == 1
        assert user_a_tasks[0]["title"] == "Задача пользователя A"

        override_current_user(app, user_b)
        user_b_tasks_response = await client.get("/tasks/")
        assert user_b_tasks_response.status_code == 200
        user_b_tasks = user_b_tasks_response.json()
        assert len(user_b_tasks) == 1
        assert user_b_tasks[0]["title"] == "Задача пользователя B"
    finally:
        clear_current_user_override(app)


@pytest.mark.asyncio
async def test_user_isolation_blocks_cross_user_task_mutation(client, app):
    user_a = User(
        telegram_id=1111111,
        username="user_a",
        first_name="UserA",
        email="a@example.com",
    )
    user_b = User(
        telegram_id=2222222,
        username="user_b",
        first_name="UserB",
        email="b@example.com",
    )

    try:
        override_current_user(app, user_a)
        create_response = await client.post(
            "/tasks/",
            json={"title": "Только A может менять", "category": "general"},
        )
        assert create_response.status_code == 201
        task_id = create_response.json()["id"]

        override_current_user(app, user_b)
        status_response = await client.patch(
            f"/tasks/{task_id}/status",
            json={"status": "done"},
        )
        assert status_response.status_code == 404

        delete_response = await client.delete(f"/tasks/{task_id}")
        assert delete_response.status_code == 404
    finally:
        clear_current_user_override(app)


@pytest.mark.asyncio
async def test_user_isolation_scopes_stats_to_current_user(client, app):
    user_a = User(
        telegram_id=1111111,
        username="user_a",
        first_name="UserA",
        email="a@example.com",
    )
    user_b = User(
        telegram_id=2222222,
        username="user_b",
        first_name="UserB",
        email="b@example.com",
    )

    try:
        override_current_user(app, user_a)
        response_a1 = await client.post(
            "/tasks/",
            json={"title": "A done", "category": "sport", "priority": "high"},
        )
        assert response_a1.status_code == 201
        task_a_id = response_a1.json()["id"]

        status_a = await client.patch(
            f"/tasks/{task_a_id}/status",
            json={"status": "done"},
        )
        assert status_a.status_code == 200

        response_a2 = await client.post(
            "/tasks/",
            json={"title": "A planned", "category": "study"},
        )
        assert response_a2.status_code == 201

        override_current_user(app, user_b)
        response_b = await client.post(
            "/tasks/",
            json={"title": "B only", "category": "work"},
        )
        assert response_b.status_code == 201

        override_current_user(app, user_a)
        stats_response = await client.get("/tasks/stats/")
        assert stats_response.status_code == 200
        stats_payload = stats_response.json()
        assert stats_payload["total_tasks"] == 2
        assert stats_payload["completed_tasks"] == 1
        assert stats_payload["top_category"] == "sport"
    finally:
        clear_current_user_override(app)


@pytest.mark.asyncio
async def test_user_isolation_scopes_habits_to_current_user(client, app):
    user_a = User(
        telegram_id=1111111,
        username="user_a",
        first_name="UserA",
        email="a@example.com",
    )
    user_b = User(
        telegram_id=2222222,
        username="user_b",
        first_name="UserB",
        email="b@example.com",
    )

    try:
        override_current_user(app, user_a)
        create_habit_a = await client.post(
            "/habits/",
            json={"category": "sport", "preferred_time": "19:00:00"},
        )
        assert create_habit_a.status_code == 200

        override_current_user(app, user_b)
        create_habit_b = await client.post(
            "/habits/",
            json={"category": "reading", "preferred_time": "21:00:00"},
        )
        assert create_habit_b.status_code == 200

        override_current_user(app, user_a)
        habits_a_response = await client.get("/habits/")
        assert habits_a_response.status_code == 200
        habits_a = habits_a_response.json()
        assert len(habits_a) == 1
        assert habits_a[0]["category"] == "sport"

        override_current_user(app, user_b)
        habits_b_response = await client.get("/habits/")
        assert habits_b_response.status_code == 200
        habits_b = habits_b_response.json()
        assert len(habits_b) == 1
        assert habits_b[0]["category"] == "reading"
    finally:
        clear_current_user_override(app)
