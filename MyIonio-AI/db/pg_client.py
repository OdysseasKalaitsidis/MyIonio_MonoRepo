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
import hashlib
import json
import os
import re
import unicodedata
from datetime import datetime, timezone
from loguru import logger

import asyncpg
from asyncpg import Pool

from schemas.curriculum_catalog import CurriculumCatalogOutput
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


# ─── Canonical course identity and catalog helpers ───────────────────────────


def _normalise_course_name(value: str) -> str:
    text = unicodedata.normalize("NFD", value or "")
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    text = text.casefold().replace("ς", "σ")
    return re.sub(r"[^a-zα-ω0-9]+", " ", text).strip()


def _course_id(department: str, course_name: str) -> str:
    identity = f"{_normalise_course_name(department)}|{_normalise_course_name(course_name)}"
    return hashlib.sha256(identity.encode("utf-8")).hexdigest()[:24]


def _semester_id(value: str) -> int:
    text = str(value or "").strip().upper().replace("΄", "").replace("'", "")
    aliases = {
        "1": 1, "A": 1, "Α": 1, "2": 2, "B": 2, "Β": 2,
        "3": 3, "C": 3, "Γ": 3, "4": 4, "D": 4, "Δ": 4,
        "5": 5, "E": 5, "Ε": 5, "6": 6, "F": 6, "ΣΤ": 6,
        "7": 7, "G": 7, "Z": 7, "Ζ": 7, "8": 8, "H": 8, "Η": 8,
    }
    semester_id = aliases.get(text)
    if semester_id is None:
        raise ValueError(f"Unsupported semester value: {value!r}")
    return semester_id


def _department_id(value: str) -> int:
    key = _normalise_course_name(value)
    if "πληροφορικησ" in key or "informatics" in key:
        return 1
    if "τουρισ" in key or "tourism" in key:
        return 2
    if "μεταφρασ" in key or "translation" in key:
        return 3
    raise ValueError(f"Unsupported department value: {value!r}")


def _json_value(value, fallback):
    if value is None:
        return fallback
    if isinstance(value, str):
        return json.loads(value)
    return value


async def _catalog_for_schedule(conn, department: str, semester: str, academic_year: str):
    rows = await conn.fetch(
        """
        SELECT course_id, department, course_name, academic_year, roles, toolboxes
        FROM course_catalog
        WHERE semester = $1
        """,
        semester,
    )
    department_key = _normalise_course_name(department)
    matching = [
        row for row in rows
        if _normalise_course_name(row["department"]) == department_key
        or ("informatics" in department_key and "πληροφορικησ" in _normalise_course_name(row["department"]))
        or ("πληροφορικησ" in department_key and "informatics" in _normalise_course_name(row["department"]))
    ]
    available_years = {row["academic_year"] for row in matching}
    selected_year = academic_year if academic_year in available_years else (max(available_years) if available_years else None)
    if selected_year and selected_year != academic_year:
        logger.warning(
            "No curriculum catalog for year {}; using latest available year {}",
            academic_year, selected_year,
        )
    return {
        _normalise_course_name(row["course_name"]): {
            "course_id": row["course_id"],
            "roles": _json_value(row["roles"], []),
            "toolboxes": _json_value(row["toolboxes"], []),
        }
        for row in matching
        if row["academic_year"] == selected_year
    }


async def _latest_catalog(conn, department: str, semester: str):
    rows = await conn.fetch(
        """
        SELECT course_id, department, course_name
        FROM course_catalog
        WHERE semester = $1
        ORDER BY academic_year DESC
        """, semester,
    )
    department_key = _normalise_course_name(department)
    return {
        _normalise_course_name(row["course_name"]): row["course_id"]
        for row in rows
        if _normalise_course_name(row["department"]) == department_key
        or ("informatics" in department_key and "πληροφορικησ" in _normalise_course_name(row["department"]))
        or ("πληροφορικησ" in department_key and "informatics" in _normalise_course_name(row["department"]))
    }


# ─── DB Writers ───────────────────────────────────────────────────────────────

async def upsert_course_catalog(data: CurriculumCatalogOutput, pool: Pool) -> int:
    """Replace one academic year's canonical catalog atomically."""
    async with pool.acquire() as conn:
        async with conn.transaction():
            await conn.execute(
                "DELETE FROM course_catalog WHERE UPPER(department) = UPPER($1) AND academic_year = $2",
                data.department, data.academic_year,
            )
            for course in data.courses:
                await conn.execute(
                    """
                    INSERT INTO course_catalog (
                        course_id, department, semester, semester_id, academic_year, course_name,
                        theory_hours, lab_hours, tutorial_hours, teaching_units, ects,
                        roles, toolboxes
                    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb)
                    """,
                    _course_id(data.department, course.course_name),
                    data.department, course.semester, _semester_id(course.semester), data.academic_year, course.course_name,
                    course.theory_hours, course.lab_hours, course.tutorial_hours,
                    course.teaching_units, course.ects,
                    json.dumps([role.model_dump() for role in course.roles], ensure_ascii=False),
                    json.dumps(course.toolboxes, ensure_ascii=False),
                )
    logger.info("Course catalog saved | dept={} | year={} | courses={}", data.department, data.academic_year, len(data.courses))
    return len(data.courses)

async def upsert_exam_schedule(
    data: ExamScheduleOutput,
    pool: Pool,
) -> int:
    """
    Replace any existing exam_schedule for (department, semester, period)
    with the newly extracted data.

    Returns number of rows inserted.
    """
    async with pool.acquire() as conn:
        async with conn.transaction():
            catalog = await _latest_catalog(conn, data.department, data.semester)
            enriched_exams = []
            for exam in data.exams:
                entry = exam.model_dump()
                entry["course_id"] = catalog.get(
                    _normalise_course_name(exam.course_name),
                    _course_id(data.department, exam.course_name),
                )
                enriched_exams.append(entry)
            exams_json = json.dumps(enriched_exams, ensure_ascii=False)
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
                INSERT INTO exam_schedules (department, department_id, semester, semester_id, period, exams)
                VALUES ($1, $2, $3, $4, $5, $6::jsonb)
                """,
                data.department,
                _department_id(data.department),
                data.semester,
                _semester_id(data.semester),
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
    now = datetime.now(timezone.utc)

    async with pool.acquire() as conn:
        async with conn.transaction():
            catalog = await _catalog_for_schedule(
                conn, data.department, data.semester, data.academic_year
            )
            enriched_courses = []
            for course in data.courses:
                entry = course.model_dump()
                metadata = catalog.get(_normalise_course_name(course.course_name), {})
                entry["course_id"] = metadata.get(
                    "course_id", _course_id(data.department, course.course_name)
                )
                entry["delivery_type"] = entry.get("type", "Θεωρία")
                entry["schedule_track"] = entry.get("major") or "COMMON"
                entry["roles"] = metadata.get("roles", [])
                entry["toolboxes"] = metadata.get("toolboxes", [])
                enriched_courses.append(entry)

            courses_json = json.dumps(enriched_courses, ensure_ascii=False)
            # Delete existing record
            deleted = await conn.execute(
                """
                DELETE FROM class_schedules
                WHERE department_id = $1
                  AND semester_id = $2
                  AND academic_year = $3
                  AND period = $4
                """,
                _department_id(data.department),
                _semester_id(data.semester),
                data.academic_year,
                data.period,
            )
            logger.info(f"Deleted existing class schedule: {deleted}")

            # Insert new record
            await conn.execute(
                """
                INSERT INTO class_schedules
                  (department, department_id, semester, semester_id, academic_year, period, courses, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
                """,
                data.department,
                _department_id(data.department),
                data.semester,
                _semester_id(data.semester),
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
