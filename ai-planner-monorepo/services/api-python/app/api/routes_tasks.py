from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.api.deps import DBSession, get_current_user
from app.core.config import settings
from app.db.models import TaskPriority, TaskSource, User
from app.schemas.task import (
    TaskCreate,
    TaskOptimizedResponse,
    TaskParsedData,
    TaskParseRequest,
    TaskResponse,
    TaskStatsResponse,
    TaskStatusUpdate,
    TaskUpdate,
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
    task = await service.create(
        task_data,
        current_user.telegram_id,
        user_email=current_user.email,
    )
    return TaskResponse.model_validate(task)


@router.post("/parse", response_model=TaskResponse)
async def create_task_from_text_endpoint(
    request: TaskParseRequest,
    db: DBSession,
    current_user: CurrentUser,
) -> TaskResponse:
    service = TaskService(db)

    if not settings.gemini_api_key:
        task = await service.create_from_text(
            request.text,
            current_user.telegram_id,
            user_email=current_user.email,
        )
        return TaskResponse.model_validate(task)

    try:
        parsed_dict = await parse_task_from_text(request.text, settings.gemini_api_key)
        parsed_data = TaskParsedData.model_validate(parsed_dict)
    except AIParseError as error:
        task = await service.create_from_text(
            request.text,
            current_user.telegram_id,
            user_email=current_user.email,
        )
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
        user_email=current_user.email,
    )
    return TaskResponse.model_validate(task)


@router.get("/", response_model=list[TaskResponse])
async def get_tasks_endpoint(db: DBSession, current_user: CurrentUser) -> list[TaskResponse]:
    service = TaskService(db)
    tasks = await service.list_all(current_user.telegram_id)
    return [TaskResponse.model_validate(task) for task in tasks]


@router.get("/optimized", response_model=list[TaskOptimizedResponse])
async def get_optimized_tasks_endpoint(
    db: DBSession,
    current_user: CurrentUser,
) -> list[TaskOptimizedResponse]:
    service = TaskService(db)
    tasks = await service.get_optimized_schedule(current_user.telegram_id)
    return [TaskOptimizedResponse.model_validate(task) for task in tasks]


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


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task_endpoint(
    task_id: int,
    payload: TaskUpdate,
    db: DBSession,
    current_user: CurrentUser,
) -> TaskResponse:
    service = TaskService(db)
    task = await service.update(task_id, current_user.telegram_id, payload)
    return TaskResponse.model_validate(task)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task_endpoint(
    task_id: int,
    db: DBSession,
    current_user: CurrentUser,
) -> Response:
    service = TaskService(db)
    await service.delete(task_id, current_user.telegram_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/stats/", response_model=TaskStatsResponse)
async def get_task_stats_endpoint(
    db: DBSession,
    current_user: CurrentUser,
) -> TaskStatsResponse:
    service = TaskService(db)
    stats = await service.get_stats(current_user.telegram_id)
    return TaskStatsResponse.model_validate(stats)
