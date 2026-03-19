from pydantic import BaseModel


class Settings(BaseModel):
    app_name: str = "AI Day Planner"
    database_url: str = "sqlite:///./planner.db"


settings = Settings()

