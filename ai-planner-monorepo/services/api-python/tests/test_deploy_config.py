from app.core.config import _normalize_database_url


def test_normalize_database_url_converts_render_postgres_scheme():
    raw_url = "postgresql://planner:planner@postgres:5432/planner"

    normalized_url = _normalize_database_url(raw_url)

    assert normalized_url == "postgresql+asyncpg://planner:planner@postgres:5432/planner"


def test_normalize_database_url_keeps_asyncpg_scheme():
    raw_url = "postgresql+asyncpg://planner:planner@postgres:5432/planner"

    normalized_url = _normalize_database_url(raw_url)

    assert normalized_url == raw_url
