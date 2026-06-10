"""
Schema, prompt, and Pydantic model for the Exam Schedule document type.

Document format (from actual PDFs):
  Header: ΠΡΟΓΡΑΜΜΑ ΕΞΕΤΑΣΕΩΝ ΤΜΗΜΑΤΟΣ ΠΛΗΡΟΦΟΡΙΚΗΣ
          ΕΞΕΤΑΣΤΙΚΗΣ ΠΕΡΙΟΔΟΥ ...
          (ΣΤ ΕΞΑΜΗΝΟ)
  Table columns: ΗΜΕΡΟΜΗΝΙΑ | ΗΜΕΡΑ | ΩΡΑ | ΜΑΘΗΜΑ | ΕΞΕΤΑΣΤΗΣ | ΕΠΙΤΗΡΗΤΗΣ | ΑΙΘΟΥΣΑ
"""

from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, field_validator, model_validator
from google.genai import types


# ─── Pydantic Models ──────────────────────────────────────────────────────────

class ExamItem(BaseModel):
    date: str
    time_start: str
    time_end: str
    course_name: str
    professors: list[str]
    room: str

    @field_validator("professors", mode="before")
    @classmethod
    def coerce_professors(cls, v):
        """Handle cases where Gemini returns a comma-separated string instead of array."""
        if isinstance(v, str):
            return [p.strip() for p in v.replace(";", ",").split(",") if p.strip()]
        if v is None:
            return []
        return v

    @field_validator("date", mode="before")
    @classmethod
    def normalise_date(cls, v):
        return str(v).strip() if v else ""

    @field_validator("time_start", "time_end", mode="before")
    @classmethod
    def normalise_time(cls, v):
        return str(v).strip() if v else ""

    @field_validator("room", mode="before")
    @classmethod
    def normalise_room(cls, v):
        return str(v).strip() if v else ""


class ExamScheduleOutput(BaseModel):
    department: str
    semester: str
    period: str
    exams: list[ExamItem]

    @field_validator("exams")
    @classmethod
    def must_have_exams(cls, v):
        if not v:
            raise ValueError("Gemini returned zero exams — extraction failed.")
        return v

    @field_validator("department", "semester", "period", mode="before")
    @classmethod
    def strip_strings(cls, v):
        return str(v).strip() if v else ""


# ─── Gemini Structured Output Schema ─────────────────────────────────────────

EXAM_ITEM_SCHEMA = types.Schema(
    type=types.Type.OBJECT,
    properties={
        "date":        types.Schema(type=types.Type.STRING, description="Exam date e.g. 02-06-2026"),
        "time_start":  types.Schema(type=types.Type.STRING, description="Start time HH:MM or empty string"),
        "time_end":    types.Schema(type=types.Type.STRING, description="End time HH:MM or empty string"),
        "course_name": types.Schema(type=types.Type.STRING, description="Full Greek course name"),
        "professors":  types.Schema(
            type=types.Type.ARRAY,
            items=types.Schema(type=types.Type.STRING),
            description="All examiners listed in the ΕΞΕΤΑΣΤΗΣ column"
        ),
        "room":        types.Schema(type=types.Type.STRING, description="Room/hall identifier from ΑΙΘΟΥΣΑ column"),
    },
    required=["date", "time_start", "time_end", "course_name", "professors", "room"],
)

EXAM_SCHEDULE_SCHEMA = types.Schema(
    type=types.Type.OBJECT,
    properties={
        "department": types.Schema(type=types.Type.STRING, description="Greek department name e.g. Τμήμα Πληροφορικής"),
        "semester":   types.Schema(type=types.Type.STRING, description="Greek semester letter: Α, Β, Γ, Δ, Ε, ΣΤ, Ζ, Η"),
        "period":     types.Schema(type=types.Type.STRING, description="Exam period description e.g. Εξεταστική Ιουνίου 2026"),
        "exams":      types.Schema(
            type=types.Type.ARRAY,
            items=EXAM_ITEM_SCHEMA,
            description="Every exam row from the table",
        ),
    },
    required=["department", "semester", "period", "exams"],
)


# ─── Prompt ───────────────────────────────────────────────────────────────────

def build_exam_prompt(department: str = "Τμήμα Πληροφορικής") -> str:
    return f"""
You are an expert parser for Greek university exam schedule documents (Πρόγραμμα Εξετάσεων).
The document is written entirely in Greek and uses a tabular layout.

TABLE COLUMNS (in order left to right):
  ΗΜΕΡΟΜΗΝΙΑ  = exam date (format: DD-MM-YYYY)
  ΗΜΕΡΑ       = weekday name in Greek
  ΩΡΑ         = time range (format: HH:MM-HH:MM)
  ΜΑΘΗΜΑ      = course name (full Greek text, may span multiple lines in cell)
  ΕΞΕΤΑΣΤΗΣ   = examiner professor(s) — may be multiple names comma/newline separated
  ΕΠΙΤΗΡΗΤΗΣ  = supervisor(s) — IGNORE this column, do not extract
  ΑΙΘΟΥΣΑ     = exam room/hall identifier

EXTRACTION RULES:
1. Read the document HEADER to extract: department name, semester (map to Greek letter), exam period.
2. Extract EVERY row from the table — do not skip any row.
3. For the ΩΡΑ column: split "HH:MM-HH:MM" → time_start and time_end. If the cell is "-" or empty (take-home exam), use empty string for both.
4. For ΕΞΕΤΑΣΤΗΣ: if multiple names appear (comma, newline, or slash separated), put each as a separate entry in the professors array.
5. The ΜΑΘΗΜΑ cell may have a trailing asterisk (*) — include it as-is in course_name.
6. Use Greek characters exactly as they appear in the document.
7. Semester mapping: 1ο/Α/1st/Winter→Α, 2ο/Β→Β, 3ο/Γ→Γ, 4ο/Δ→Δ, 5ο/Ε→Ε, 6ο/ΣΤ→ΣΤ, 7ο/Ζ→Ζ, 8ο/Η→Η

Department context: {department}

Return ONLY the structured JSON — no explanation text.
"""
