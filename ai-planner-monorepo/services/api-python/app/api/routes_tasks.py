from fastapi import APIRouter

from app.api.deps import DBSession
from app.schemas.parser import TextCommandRequest
from app.schemas.task import TaskCreate, TaskResponse, TaskStatusUpdate
from app.services.task_service import TaskService

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.post("/", response_model=TaskResponse)
def create_task_endpoint(
    task_data: TaskCreate,
    db: DBSession,
) -> TaskResponse:
    service = TaskService(db)
    task = service.create(task_data)
    return TaskResponse.model_validate(task)


@router.post("/parse", response_model=TaskResponse)
def create_task_from_text_endpoint(
    request: TextCommandRequest,
    db: DBSession,
) -> TaskResponse:
    service = TaskService(db)
    task = service.create_from_text(request.text)
    return TaskResponse.model_validate(task)


@router.get("/", response_model=list[TaskResponse])
def get_tasks_endpoint(db: DBSession) -> list[TaskResponse]:
    service = TaskService(db)
    tasks = service.list_all()
    return [TaskResponse.model_validate(task) for task in tasks]


@router.patch("/{task_id}/status", response_model=TaskResponse)
def update_task_status_endpoint(
    task_id: int,
    payload: TaskStatusUpdate,
    db: DBSession,
) -> TaskResponse:
    service = TaskService(db)
    task = service.update_status(task_id, payload)
    return TaskResponse.model_validate(task)