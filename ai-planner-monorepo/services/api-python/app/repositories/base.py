from typing import Generic, TypeVar

from sqlalchemy.ext.asyncio import AsyncSession


ModelT = TypeVar("ModelT")


class BaseRepository(Generic[ModelT]):
    """Базовый репозиторий с общей логикой сохранения."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def save(self, obj: ModelT, *, commit: bool = True) -> ModelT:
        """Сохраняет объект в БД и возвращает обновлённую сущность."""
        self.db.add(obj)
        if commit:
            await self.db.commit()
            await self.db.refresh(obj)
        else:
            await self.db.flush()
        return obj
