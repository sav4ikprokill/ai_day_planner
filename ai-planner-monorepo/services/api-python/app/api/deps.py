from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import validate_telegram_data
from app.db.models import User
from app.db.session import SessionLocal


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        await db.close()


DBSession = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user(
    session: DBSession,
    x_telegram_init_data: str | None = Header(default=None, alias="X-Telegram-Init-Data"),
) -> User:
    if not x_telegram_init_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X-Telegram-Init-Data header is required",
        )

    if (
        x_telegram_init_data == "dev-mode-init-data"
        and settings.allow_dev_init_data_bypass
        and settings.env in {"development", "staging"}
    ):
        user_payload = {
            "id": 7777777,
            "username": "dev_local_user",
            "first_name": "Dev",
            "email": "dev_local_user@example.com",
        }
    else:
        user_payload = validate_telegram_data(
            init_data=x_telegram_init_data,
            bot_token=settings.telegram_bot_token or "",
        )
    telegram_id = int(user_payload["id"])

    result = await session.scalars(
        select(User).where(User.telegram_id == telegram_id),
    )
    user = result.first()

    if user is None:
        user = User(
            telegram_id=telegram_id,
            username=user_payload.get("username"),
            first_name=user_payload.get("first_name"),
            email=user_payload.get("email"),
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user

    user.username = user_payload.get("username")
    user.first_name = user_payload.get("first_name")
    user.email = user_payload.get("email") or user.email
    await session.commit()
    await session.refresh(user)
    return user
