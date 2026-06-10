"""
PostgreSQL connection pool and DB writers for the AI pipeline.

Uses asyncpg to connect directly to the same PostgreSQL 15 cluster
that the C# backend (EF Core + Npgsql) uses.

Table schemas (from EF Core migration):

  class_schedules:
    id          SERIAL PRIMARY KEY
    created_at  TIMESTAMPTZ NOT NULL
    department  TEXT NOT NULL
    semester    TEXT NOT NULL
    academic_year TEXT NOT NULL
    period      TEXT NOT NULL
    courses     JSONB NOT NULL

  exam_schedules:
    id          SERIAL PRIMARY KEY
    department  TEXT NOT NULL
    semester    TEXT NOT NULL  
    period      TEXT NOT NULL
    exams       JSONB NOT NULL

Neither table has a UNIQUE constraint on (department, semester, period),
so we use DELETE + INSERT to replace an existing schedule cleanly.
"""

from __future__ import annotations
import json
import os
from datetime import datetime, timezone
from loguru import logger

import asyncpg
from asyncpg import Pool

from schemas.exam_schedule import ExamScheduleOutput
from schemas.class_schedule_simple import ClassScheduleOutput
from schemas.class_schedule_split import ClassScheduleSplitOutput


# ─── Connection Pool ──────────────────────────────────────────────────────────

_pool: Pool | None = None


async def get_pool() -> Pool:
    """Get or create the asyncpg connection pool."""
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "5432")),
            database=os.getenv("DB_NAME", "postgres"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "postgres"),
            min_size=2,
            max_size=10,
        )
        logger.info(
            f"PostgreSQL pool created | "
            f"host={os.getenv('DB_HOST', 'localhost')} "
            f"db={os.getenv('DB_NAME', 'postgres')}"
        )
    return _pool


async def close_pool() -> None:
    """Close the connection pool (called on app shutdown)."""
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
        logger.info("PostgreSQL pool closed")


# ─── DB Writers ───────────────────────────────────────────────────────────────

async def upsert_exam_schedule(
    data: ExamScheduleOutput,
    pool: Pool,
) -> int:
    """
    Replace any existing exam_schedule for (department, semester, period)
    with the newly extracted data.

    Returns number of rows inserted.
    """
    exams_json = json.dumps(
        [exam.model_dump() for exam in data.exams],
        ensure_ascii=False,
    )

    async with pool.acquire() as conn:
        async with conn.transaction():
            # Delete existing record for this dept/semester/period
            deleted = await conn.execute(
                """
                DELETE FROM exam_schedules
                WHERE department = $1 AND semester = $2 AND period = $3
                """,
                data.department,
                data.semester,
                data.period,
            )
            logger.info(f"Deleted existing exam schedule: {deleted}")

            # Insert new record
            await conn.execute(
                """
                INSERT INTO exam_schedules (department, semester, period, exams)
                VALUES ($1, $2, $3, $4::jsonb)
                """,
                data.department,
                data.semester,
                data.period,
                exams_json,
            )

    logger.info(
        f"Exam schedule saved | dept={data.department} | "
        f"semester={data.semester} | period={data.period} | "
        f"exams={len(data.exams)}"
    )
    return len(data.exams)


async def upsert_class_schedule(
    data: ClassScheduleOutput | ClassScheduleSplitOutput,
    pool: Pool,
) -> int:
    """
    Replace any existing class_schedule for (department, semester, academic_year, period)
    with the newly extracted data.

    Works for both ClassScheduleOutput (simple) and ClassScheduleSplitOutput (with major).
    Returns number of course entries inserted.
    """
    courses_json = json.dumps(
        [c.model_dump() for c in data.courses],
        ensure_ascii=False,
    )

    now = datetime.now(timezone.utc)

    async with pool.acquire() as conn:
        async with conn.transaction():
            # Delete existing record
            deleted = await conn.execute(
                """
                DELETE FROM class_schedules
                WHERE department = $1
                  AND semester = $2
                  AND academic_year = $3
                  AND period = $4
                """,
                data.department,
                data.semester,
                data.academic_year,
                data.period,
            )
            logger.info(f"Deleted existing class schedule: {deleted}")

            # Insert new record
            await conn.execute(
                """
                INSERT INTO class_schedules
                  (department, semester, academic_year, period, courses, created_at)
                VALUES ($1, $2, $3, $4, $5::jsonb, $6)
                """,
                data.department,
                data.semester,
                data.academic_year,
                data.period,
                courses_json,
                now,
            )

    logger.info(
        f"Class schedule saved | dept={data.department} | "
        f"semester={data.semester} | year={data.academic_year} | "
        f"period={data.period} | courses={len(data.courses)}"
    )
    return len(data.courses)
