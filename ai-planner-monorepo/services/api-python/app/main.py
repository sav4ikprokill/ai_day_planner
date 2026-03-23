from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes_habits import router as habits_router
from app.api.routes_tasks import router as tasks_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine


@asynccontextmanager
async def lifespan(_: FastAPI):
    if settings.database_url.startswith("sqlite+aiosqlite://"):
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)

    yield


app = FastAPI(
    title="AI Day Planner",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tasks_router)
app.include_router(habits_router)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "AI Day Planner API is running"}
