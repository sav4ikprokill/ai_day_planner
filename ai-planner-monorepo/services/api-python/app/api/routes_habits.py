from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import DBSession, get_current_user
from app.db.models import User
from app.schemas.habit import HabitCreate, HabitResponse
from app.services.habit_service import HabitService

router = APIRouter(prefix="/habits", tags=["Habits"])
CurrentUser = Annotated[User, Depends(get_current_user)]


@router.post("/", response_model=HabitResponse)
async def create_or_update_habit_endpoint(
    habit_data: HabitCreate,
    db: DBSession,
    current_user: CurrentUser,
) -> HabitResponse:
    service = HabitService(db)
    habit = await service.create_or_update(habit_data, current_user.telegram_id)
    return HabitResponse.model_validate(habit)


@router.get("/", response_model=list[HabitResponse])
async def get_habits_endpoint(db: DBSession, current_user: CurrentUser) -> list[HabitResponse]:
    service = HabitService(db)
    habits = await service.list_all(current_user.telegram_id)
    return [HabitResponse.model_validate(habit) for habit in habits]
