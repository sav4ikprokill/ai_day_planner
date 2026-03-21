"""init

Revision ID: 20260322_000001
Revises:
Create Date: 2026-03-22 00:00:01
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260322_000001"
down_revision = None
branch_labels = None
depends_on = None


task_status = sa.Enum("planned", "done", "cancelled", name="task_status")
task_priority = sa.Enum("low", "medium", "high", name="task_priority")
task_source = sa.Enum("manual", "text", "voice", name="task_source")


def upgrade() -> None:
    bind = op.get_bind()
    task_status.create(bind, checkfirst=True)
    task_priority.create(bind, checkfirst=True)
    task_source.create(bind, checkfirst=True)

    op.create_table(
        "tasks",
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False, server_default="general"),
        sa.Column("scheduled_at", sa.DateTime(), nullable=True),
        sa.Column("duration_minutes", sa.Integer(), nullable=False, server_default="30"),
        sa.Column("status", task_status, nullable=False, server_default="planned"),
        sa.Column("priority", task_priority, nullable=False, server_default="medium"),
        sa.Column("source", task_source, nullable=False, server_default="manual"),
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "habits",
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("preferred_time", sa.Time(), nullable=False),
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("category", name="uq_habits_category"),
    )

    op.create_table(
        "jobs",
        sa.Column("task_type", sa.String(length=100), nullable=False),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="pending"),
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_index("ix_jobs_status_created_at", "jobs", ["status", "created_at"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()

    op.drop_index("ix_jobs_status_created_at", table_name="jobs")
    op.drop_table("jobs")
    op.drop_table("habits")
    op.drop_table("tasks")

    task_source.drop(bind, checkfirst=True)
    task_priority.drop(bind, checkfirst=True)
    task_status.drop(bind, checkfirst=True)
