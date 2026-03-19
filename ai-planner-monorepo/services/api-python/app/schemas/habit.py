from datetime import time

from pydantic import BaseModel, Field


class HabitCreate(BaseModel):
    category: str = Field(..., min_length=1, max_length=100)
    preferred_time: time


class HabitResponse(BaseModel):
    id: int
    category: str
    preferred_time: time

    model_config = {"from_attributes": True}