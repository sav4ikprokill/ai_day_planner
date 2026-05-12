from app.core.config import _normalize_database_url, _parse_cors_origins


def test_normalize_database_url_converts_render_postgres_scheme():
    raw_url = "postgresql://planner:planner@postgres:5432/planner"

    normalized_url = _normalize_database_url(raw_url)

    assert normalized_url == "postgresql+asyncpg://planner:planner@postgres:5432/planner"


def test_normalize_database_url_keeps_asyncpg_scheme():
    raw_url = "postgresql+asyncpg://planner:planner@postgres:5432/planner"

    normalized_url = _normalize_database_url(raw_url)

    assert normalized_url == raw_url


def test_parse_cors_origins_splits_trims_and_removes_trailing_slashes():
    raw_origins = (
        " https://ai-day-planner-rouge.vercel.app/, "
        "https://ai-day-planner-r4ujbqbof-liss-projects-ee16082b.vercel.app/ "
    )

    parsed_origins = _parse_cors_origins(raw_origins)

    assert parsed_origins == [
        "https://ai-day-planner-rouge.vercel.app",
        "https://ai-day-planner-r4ujbqbof-liss-projects-ee16082b.vercel.app",
    ]
