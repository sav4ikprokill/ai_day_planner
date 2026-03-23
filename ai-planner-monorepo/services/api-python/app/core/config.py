import os

from dotenv import load_dotenv
from pydantic import BaseModel, Field


load_dotenv()


def _parse_cors_origins(raw_value: str | None) -> list[str]:
    if not raw_value:
        return [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]

    return [origin.strip() for origin in raw_value.split(",") if origin.strip()]


class Settings(BaseModel):
    app_name: str = Field(default_factory=lambda: os.getenv("APP_NAME", "AI Day Planner"))
    database_url: str = Field(
        default_factory=lambda: os.getenv(
            "DATABASE_URL",
            "postgresql+asyncpg://user:password@localhost:5432/ai_planner",
        ),
    )
    gemini_api_key: str | None = Field(default_factory=lambda: os.getenv("GEMINI_API_KEY"))
    telegram_bot_token: str | None = Field(default_factory=lambda: os.getenv("TELEGRAM_BOT_TOKEN"))
    cors_origins: list[str] = Field(
        default_factory=lambda: _parse_cors_origins(os.getenv("CORS_ORIGINS")),
    )


settings = Settings()

