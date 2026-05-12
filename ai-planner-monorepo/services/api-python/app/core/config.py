import os

from dotenv import load_dotenv
from pydantic import BaseModel, Field


load_dotenv()


def _normalize_database_url(raw_value: str | None) -> str:
    if not raw_value:
        return "postgresql+asyncpg://user:password@localhost:5432/ai_planner"

    if raw_value.startswith("postgresql+asyncpg://"):
        return raw_value

    if raw_value.startswith("postgresql://"):
        return raw_value.replace("postgresql://", "postgresql+asyncpg://", 1)

    return raw_value


def _parse_cors_origins(raw_value: str | None) -> list[str]:
    if not raw_value:
        return [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]

    origins: list[str] = []
    for origin in raw_value.split(","):
        normalized_origin = origin.strip().rstrip("/")
        if normalized_origin:
            origins.append(normalized_origin)

    return origins


def _parse_bool(raw_value: str | None, default: bool = False) -> bool:
    if raw_value is None:
        return default

    return raw_value.strip().lower() in {"1", "true", "yes", "on"}


class Settings(BaseModel):
    app_name: str = Field(default_factory=lambda: os.getenv("APP_NAME", "AI Day Planner"))
    env: str = Field(default_factory=lambda: os.getenv("ENV", "development"))
    database_url: str = Field(
        default_factory=lambda: _normalize_database_url(os.getenv("DATABASE_URL")),
    )
    scheduler_url: str = Field(
        default_factory=lambda: os.getenv(
            "SCHEDULER_URL",
            "http://scheduler-cpp:8080/optimize",
        ),
    )
    allow_dev_init_data_bypass: bool = Field(
        default_factory=lambda: _parse_bool(
            os.getenv("ALLOW_DEV_INIT_DATA_BYPASS"),
            default=False,
        ),
    )
    gemini_api_key: str | None = Field(default_factory=lambda: os.getenv("GEMINI_API_KEY"))
    telegram_bot_token: str | None = Field(default_factory=lambda: os.getenv("TELEGRAM_BOT_TOKEN"))
    cors_origins: list[str] = Field(
        default_factory=lambda: _parse_cors_origins(os.getenv("CORS_ORIGINS")),
    )


settings = Settings()

