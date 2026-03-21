from fastapi import APIRouter

from app.api.deps import DBSession
from app.schemas.habit import HabitCreate, HabitResponse
from app.services.habit_service import HabitService

router = APIRouter(prefix="/habits", tags=["Habits"])


@router.post("/", response_model=HabitResponse)
async def create_or_update_habit_endpoint(
    habit_data: HabitCreate,
    db: DBSession,
) -> HabitResponse:
    service = HabitService(db)
    habit = await service.create_or_update(habit_data)
    return HabitResponse.model_validate(habit)


@router.get("/", response_model=list[HabitResponse])
async def get_habits_endpoint(db: DBSession) -> list[HabitResponse]:
    service = HabitService(db)
    habits = await service.list_all()
    return [HabitResponse.model_validate(habit) for habit in habits]
