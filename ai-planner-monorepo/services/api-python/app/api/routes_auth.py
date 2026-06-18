from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.core.security import create_access_token
from app.api.deps import DBSession
from app.db.models import User
from sqlalchemy import select

router = APIRouter(prefix="/auth", tags=["Auth"])


class GuestRequest(BaseModel):
    guest_id: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/guest", response_model=TokenResponse)
async def guest_login(request: GuestRequest, db: DBSession):
    """Создаёт гостевой аккаунт и возвращает JWT-токен."""
    if not request.guest_id:
        raise HTTPException(status_code=400, detail="guest_id is required")

    # Ищем пользователя по username (guest_id)
    result = await db.scalars(select(User).where(User.username == request.guest_id))
    user = result.first()

    if user is None:
        # Генерируем уникальный telegram_id для гостя
        import uuid
        fake_telegram_id = abs(hash(request.guest_id)) % (10 ** 12)  # уникальный ID из UUID
        
        # Проверяем, не занят ли уже такой telegram_id
        existing = await db.scalars(select(User).where(User.telegram_id == fake_telegram_id))
        if existing.first():
            # Если занят — добавляем случайное смещение
            fake_telegram_id = fake_telegram_id + 1

        user = User(
            telegram_id=fake_telegram_id,
            username=request.guest_id,
            first_name="Guest",
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    token = create_access_token(str(user.telegram_id))
    return TokenResponse(access_token=token)