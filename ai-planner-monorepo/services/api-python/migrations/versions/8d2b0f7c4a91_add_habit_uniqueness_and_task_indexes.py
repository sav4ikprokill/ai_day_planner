"""Add habit uniqueness and task lookup indexes

Revision ID: 8d2b0f7c4a91
Revises: 5357483f5920
Create Date: 2026-05-07 00:00:00.000000
"""
from __future__ import annotations

from alembic import op


revision = "8d2b0f7c4a91"
down_revision = "5357483f5920"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        DELETE FROM habits
        WHERE id IN (
            SELECT id
            FROM (
                SELECT
                    id,
                    ROW_NUMBER() OVER (
                        PARTITION BY user_id, category
                        ORDER BY created_at DESC NULLS LAST, id DESC
                    ) AS row_number
                FROM habits
            ) ranked_habits
            WHERE ranked_habits.row_number > 1
        )
        """,
    )
    op.create_unique_constraint(
        "uq_habits_user_id_category",
        "habits",
        ["user_id", "category"],
    )
    op.create_index(
        "ix_tasks_user_id_status",
        "tasks",
        ["user_id", "status"],
        unique=False,
    )
    op.create_index(
        "ix_tasks_user_id_scheduled_at",
        "tasks",
        ["user_id", "scheduled_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_tasks_user_id_scheduled_at", table_name="tasks")
    op.drop_index("ix_tasks_user_id_status", table_name="tasks")
    op.drop_constraint("uq_habits_user_id_category", "habits", type_="unique")
