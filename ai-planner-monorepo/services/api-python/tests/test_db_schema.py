from sqlalchemy import Index, UniqueConstraint

from app.db.models import Habit, Task


def test_habits_have_unique_user_category_constraint():
    constraints = [
        constraint
        for constraint in Habit.__table__.constraints
        if isinstance(constraint, UniqueConstraint)
    ]

    assert any(
        {column.name for column in constraint.columns} == {"user_id", "category"}
        for constraint in constraints
    )


def test_tasks_have_common_lookup_indexes():
    indexes = {
        tuple(column.name for column in index.columns)
        for index in Task.__table__.indexes
        if isinstance(index, Index)
    }

    assert ("user_id", "status") in indexes
    assert ("user_id", "scheduled_at") in indexes
