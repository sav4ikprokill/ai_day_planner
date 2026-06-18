from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status, Security
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import validate_telegram_data, verify_token
from app.db.models import User
from app.db.session import SessionLocal

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/guest", auto_error=False)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        await db.close()

DBSession = Annotated[AsyncSession, Depends(get_db)]

async def get_current_user(
    session: DBSession,
    token: str = Security(oauth2_scheme),
    x_telegram_init_data: str | None = Header(default=None, alias="X-Telegram-Init-Data"),
) -> User:
    # 1. Attempt JWT Authentication
    if token:
        user_id = verify_token(token)
        if user_id:
            # Try as telegram_id (int), otherwise look up by username (UUID guest_id)
            try:
                uid = int(user_id)
                result = await session.scalars(select(User).where(User.telegram_id == uid))
            except ValueError:
                result = await session.scalars(select(User).where(User.username == user_id))
            
            user = result.first()
            if user:
                return user

    # 2. Fallback to Telegram WebApp authentication
    if not x_telegram_init_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
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