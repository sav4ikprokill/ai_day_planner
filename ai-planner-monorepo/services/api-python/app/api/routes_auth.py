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

    result = await db.scalars(select(User).where(User.username == request.guest_id))
    user = result.first()

    if user is None:
        user = User(
            telegram_id=0,
            username=request.guest_id,
            first_name="Guest",
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    token = create_access_token(request.guest_id)
    return TokenResponse(access_token=token)