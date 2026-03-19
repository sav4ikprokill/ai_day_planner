from typing import Generic, TypeVar

from sqlalchemy.orm import Session


ModelT = TypeVar("ModelT")


class BaseRepository(Generic[ModelT]):
    """Базовый репозиторий с общей логикой сохранения."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def save(self, obj: ModelT) -> ModelT:
        """Сохраняет объект в БД и возвращает обновлённую сущность."""
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj