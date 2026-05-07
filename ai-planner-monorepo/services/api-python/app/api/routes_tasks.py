from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.api.deps import DBSession, get_current_user
from app.core.config import settings
from app.db.models import TaskPriority, User
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


@router.post(
    "/",
    response_model=TaskResponse,
    summary="Create a new task",
    description="Creates a new task for the authenticated user based on provided data.",
    responses={
        201: {"description": "Task created successfully", "model": TaskResponse},
        400: {"description": "Invalid input data"},
        401: {"description": "Unauthorized"},
    },
    status_code=status.HTTP_201_CREATED,
)
async def create_task_endpoint(
    task_data: TaskCreate,
    db: DBSession,
    current_user: CurrentUser,
) -> TaskResponse:
    """Create a new task.

    This endpoint allows authenticated users to create a new task with specified
    details such as title, category, schedule, and priority.

    Args:
        task_data: The task creation data including title, category, etc.
        db: Database session dependency.
        current_user: The authenticated user from the request.

    Returns:
        The created task response with all task details.
    """
    service = TaskService(db)
    task = await service.create(
        task_data,
        current_user.telegram_id,
        user_email=current_user.email,
    )
    return TaskResponse.model_validate(task)


@router.post(
    "/parse",
    response_model=TaskResponse,
    summary="Create task from natural language text",
    description="Parses natural language text to create a task, with AI fallback for better parsing.",
    responses={
        201: {"description": "Task created from text successfully", "model": TaskResponse},
        400: {"description": "Invalid text or AI parsing error"},
        401: {"description": "Unauthorized"},
    },
    status_code=status.HTTP_201_CREATED,
)
async def create_task_from_text_endpoint(
    request: TaskParseRequest,
    db: DBSession,
    current_user: CurrentUser,
) -> TaskResponse:
    """Create a task from natural language text.

    Parses the provided text to extract task details. Uses AI parsing if available,
    otherwise falls back to basic text parsing.

    Args:
        request: The text parsing request containing the natural language text.
        db: Database session dependency.
        current_user: The authenticated user from the request.

    Returns:
        The created task response.
    """
    service = TaskService(db)

    if not settings.gemini_api_key:
        task = await service.create_from_text(
            request.text,
            current_user.telegram_id,
            user_email=current_user.email,
            source=request.source,
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
            source=request.source,
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
            source=request.source,
        ),
        current_user.telegram_id,
        user_email=current_user.email,
    )
    return TaskResponse.model_validate(task)


@router.get(
    "/",
    response_model=list[TaskResponse],
    summary="Get user's tasks",
    description="Retrieves all tasks for the authenticated user.",
    responses={
        200: {"description": "List of user's tasks", "model": list[TaskResponse]},
        401: {"description": "Unauthorized"},
    },
)
async def get_tasks_endpoint(db: DBSession, current_user: CurrentUser) -> list[TaskResponse]:
    """Get all tasks for the user.

    Fetches and returns a list of all tasks belonging to the authenticated user.

    Args:
        db: Database session dependency.
        current_user: The authenticated user from the request.

    Returns:
        List of task responses.
    """
    service = TaskService(db)
    tasks = await service.list_all(current_user.telegram_id)
    return [TaskResponse.model_validate(task) for task in tasks]


@router.get(
    "/optimized",
    response_model=list[TaskOptimizedResponse],
    summary="Get optimized task schedule",
    description="Retrieves an AI-optimized schedule of tasks for better productivity.",
    responses={
        200: {"description": "Optimized task schedule", "model": list[TaskOptimizedResponse]},
        401: {"description": "Unauthorized"},
    },
)
async def get_optimized_tasks_endpoint(
    db: DBSession,
    current_user: CurrentUser,
) -> list[TaskOptimizedResponse]:
    """Get optimized task schedule.

    Uses AI to optimize the order and timing of tasks for maximum productivity.

    Args:
        db: Database session dependency.
        current_user: The authenticated user from the request.

    Returns:
        List of optimized task responses.
    """
    service = TaskService(db)
    tasks = await service.get_optimized_schedule(current_user.telegram_id)
    return [TaskOptimizedResponse.model_validate(task) for task in tasks]


@router.patch(
    "/{task_id}/status",
    response_model=TaskResponse,
    summary="Update task status",
    description="Updates the status of a specific task (e.g., PLANNED to DONE).",
    responses={
        200: {"description": "Task status updated", "model": TaskResponse},
        404: {"description": "Task not found"},
        401: {"description": "Unauthorized"},
    },
)
async def update_task_status_endpoint(
    task_id: int,
    payload: TaskStatusUpdate,
    db: DBSession,
    current_user: CurrentUser,
) -> TaskResponse:
    """Update task status.

    Changes the status of the specified task for the authenticated user.

    Args:
        task_id: The ID of the task to update.
        payload: The status update data.
        db: Database session dependency.
        current_user: The authenticated user from the request.

    Returns:
        The updated task response.
    """
    service = TaskService(db)
    task = await service.update_status(task_id, payload, current_user.telegram_id)
    return TaskResponse.model_validate(task)


@router.put(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Update task details",
    description="Updates the full details of a specific task.",
    responses={
        200: {"description": "Task updated", "model": TaskResponse},
        404: {"description": "Task not found"},
        401: {"description": "Unauthorized"},
    },
)
async def update_task_endpoint(
    task_id: int,
    payload: TaskUpdate,
    db: DBSession,
    current_user: CurrentUser,
) -> TaskResponse:
    """Update task details.

    Modifies the details of the specified task for the authenticated user.

    Args:
        task_id: The ID of the task to update.
        payload: The task update data.
        db: Database session dependency.
        current_user: The authenticated user from the request.

    Returns:
        The updated task response.
    """
    service = TaskService(db)
    task = await service.update(task_id, current_user.telegram_id, payload)
    return TaskResponse.model_validate(task)


@router.delete(
    "/{task_id}",
    summary="Delete a task",
    description="Deletes a specific task for the authenticated user.",
    responses={
        204: {"description": "Task deleted successfully"},
        404: {"description": "Task not found"},
        401: {"description": "Unauthorized"},
    },
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_task_endpoint(
    task_id: int,
    db: DBSession,
    current_user: CurrentUser,
) -> Response:
    """Delete a task.

    Removes the specified task from the user's task list.

    Args:
        task_id: The ID of the task to delete.
        db: Database session dependency.
        current_user: The authenticated user from the request.

    Returns:
        Empty response with 204 status.
    """
    service = TaskService(db)
    await service.delete(task_id, current_user.telegram_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    "/stats/",
    response_model=TaskStatsResponse,
    summary="Get task statistics",
    description="Retrieves statistics about the user's tasks (e.g., completed, pending).",
    responses={
        200: {"description": "Task statistics", "model": TaskStatsResponse},
        401: {"description": "Unauthorized"},
    },
)
async def get_task_stats_endpoint(
    db: DBSession,
    current_user: CurrentUser,
) -> TaskStatsResponse:
    """Get task statistics.

    Provides aggregated statistics about the user's tasks.

    Args:
        db: Database session dependency.
        current_user: The authenticated user from the request.

    Returns:
        Task statistics response.
    """
    service = TaskService(db)
    stats = await service.get_stats(current_user.telegram_id)
    return TaskStatsResponse.model_validate(stats)
