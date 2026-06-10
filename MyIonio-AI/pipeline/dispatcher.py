"""
Dispatcher — maps document_type string to the correct schema config.

To add a new document type:
  1. Create a new file in schemas/
  2. Add an entry to SCHEMA_REGISTRY below.
"""

from schemas.exam_schedule import (
    EXAM_SCHEDULE_SCHEMA,
    ExamScheduleOutput,
    build_exam_prompt,
)
from schemas.class_schedule_simple import (
    CLASS_SCHEDULE_SIMPLE_SCHEMA,
    ClassScheduleOutput,
    build_class_simple_prompt,
)
from schemas.class_schedule_split import (
    CLASS_SCHEDULE_SPLIT_SCHEMA,
    ClassScheduleSplitOutput,
    build_class_split_prompt,
)
from db.pg_client import upsert_exam_schedule, upsert_class_schedule

SCHEMA_REGISTRY: dict[str, dict] = {
    "exam_schedule": {
        "description": "Πρόγραμμα Εξετάσεων (flat table)",
        "prompt_builder": build_exam_prompt,
        "gemini_schema": EXAM_SCHEDULE_SCHEMA,
        "pydantic_model": ExamScheduleOutput,
        "db_writer": upsert_exam_schedule,
    },
    "class_schedule_simple": {
        "description": "Ωρολόγιο Πρόγραμμα — simple grid (Α–Ε εξάμηνο)",
        "prompt_builder": build_class_simple_prompt,
        "gemini_schema": CLASS_SCHEDULE_SIMPLE_SCHEMA,
        "pydantic_model": ClassScheduleOutput,
        "db_writer": upsert_class_schedule,
    },
    "class_schedule_split": {
        "description": "Ωρολόγιο Πρόγραμμα — split by major track (ΣΤ–Η εξάμηνο)",
        "prompt_builder": build_class_split_prompt,
        "gemini_schema": CLASS_SCHEDULE_SPLIT_SCHEMA,
        "pydantic_model": ClassScheduleSplitOutput,
        "db_writer": upsert_class_schedule,
    },
}

ALLOWED_TYPES = list(SCHEMA_REGISTRY.keys())
