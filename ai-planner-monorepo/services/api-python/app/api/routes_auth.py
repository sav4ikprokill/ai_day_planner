from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.core.security import create_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])


class GuestRequest(BaseModel):
    guest_id: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/guest", response_model=TokenResponse)
async def guest_login(request: GuestRequest):
    """Создаёт гостевой аккаунт и возвращает JWT-токен."""
    if not request.guest_id:
        raise HTTPException(status_code=400, detail="guest_id is required")

    # Используем guest_id как subject токена
    token = create_access_token(request.guest_id)
    return TokenResponse(access_token=token)