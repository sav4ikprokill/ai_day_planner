import pytest

from app.core.config import settings


@pytest.mark.asyncio
async def test_dev_mode_bypass_is_allowed_for_staging_when_enabled(client):
    original_env = settings.env
    original_bypass = settings.allow_dev_init_data_bypass

    settings.env = "staging"
    settings.allow_dev_init_data_bypass = True

    try:
        response = await client.get(
            "/tasks/",
            headers={"X-Telegram-Init-Data": "dev-mode-init-data"},
        )
    finally:
        settings.env = original_env
        settings.allow_dev_init_data_bypass = original_bypass

    assert response.status_code == 200
