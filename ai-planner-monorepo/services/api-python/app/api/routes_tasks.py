from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import DBSession, get_current_user
from app.core.config import settings
from app.db.models import TaskPriority, TaskSource, User
from app.schemas.task import (
    TaskCreate,
    TaskParsedData,
    TaskParseRequest,
    TaskResponse,
    TaskStatusUpdate,
)
from app.services.ai_service import AIParseError, parse_task_from_text
from app.services.text_parser import detect_category
from app.services.task_service import TaskService

router = APIRouter(prefix="/tasks", tags=["Tasks"])
CurrentUser = Annotated[User, Depends(get_current_user)]


def _map_priority(value: int) -> TaskPriority:
    if value == 3:
        return TaskPriority.HIGH
    if value == 2:
        return TaskPriority.MEDIUM
    return TaskPriority.LOW


@router.post("/", response_model=TaskResponse)
async def create_task_endpoint(
    task_data: TaskCreate,
    db: DBSession,
    current_user: CurrentUser,
) -> TaskResponse:
    service = TaskService(db)
    task = await service.create(task_data, current_user.telegram_id)
    return TaskResponse.model_validate(task)


@router.post("/parse", response_model=TaskResponse)
async def create_task_from_text_endpoint(
    request: TaskParseRequest,
    db: DBSession,
    current_user: CurrentUser,
) -> TaskResponse:
    service = TaskService(db)

    if not settings.gemini_api_key:
        task = await service.create_from_text(request.text, current_user.telegram_id)
        return TaskResponse.model_validate(task)

    try:
        parsed_dict = await parse_task_from_text(request.text, settings.gemini_api_key)
        parsed_data = TaskParsedData.model_validate(parsed_dict)
    except AIParseError as error:
        task = await service.create_from_text(request.text, current_user.telegram_id)
        return TaskResponse.model_validate(task)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid AI task payload: {error}",
        ) from error

    task = await service.create(
        TaskCreate(
            title=parsed_data.title,
            category=detect_category(request.text),
            scheduled_at=parsed_data.due_date,
            duration_minutes=30,
            priority=_map_priority(parsed_data.priority),
            source=TaskSource.TEXT,
        ),
        current_user.telegram_id,
    )
    return TaskResponse.model_validate(task)


@router.get("/", response_model=list[TaskResponse])
async def get_tasks_endpoint(db: DBSession, current_user: CurrentUser) -> list[TaskResponse]:
    service = TaskService(db)
    tasks = await service.list_all(current_user.telegram_id)
    return [TaskResponse.model_validate(task) for task in tasks]


@router.patch("/{task_id}/status", response_model=TaskResponse)
async def update_task_status_endpoint(
    task_id: int,
    payload: TaskStatusUpdate,
    db: DBSession,
    current_user: CurrentUser,
) -> TaskResponse:
    service = TaskService(db)
    task = await service.update_status(task_id, payload, current_user.telegram_id)
    return TaskResponse.model_validate(task)
