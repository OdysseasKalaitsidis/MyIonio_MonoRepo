"""
Schema, prompt, and Pydantic model for Class Schedule — Simple Grid type.

Document format (from actual PDFs — Β΄ Εξαμήνου type):
  Header: ΙΟΝΙΟ ΠΑΝΕΠΙΣΤΗΜΙΟ / ΤΜΗΜΑ ΠΛΗΡΟΦΟΡΙΚΗΣ / ΩΡΟΛΟΓΙΟ ΠΡΟΓΡΑΜΜΑ
          Β΄ ΕΑΡΙΝΟ ΕΞΑΜΗΝΟ 2025-2026
  Layout: rows = time slots (09:00-10:00 ... 20:00-21:00)
           cols = ΔΕΥΤΕΡΑ | ΤΡΙΤΗ | ΤΕΤΑΡΤΗ | ΠΕΜΠΤΗ | ΠΑΡΑΣΚΕΥΗ
  Each cell: Professor name / Course name / Room / Building
  Note: Some cells span two time-slot rows (1hr or 2hr blocks).
"""

from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, field_validator
from google.genai import types


# ─── Pydantic Models ──────────────────────────────────────────────────────────

class CourseEntry(BaseModel):
    day: str
    time_start: str
    time_end: str
    course_name: str
    professor: str
    room: str
    building: str
    type: str = "Θεωρία"

    @field_validator("type", mode="before")
    @classmethod
    def normalise_type(cls, v):
        if not v:
            return "Θεωρία"
        v_lower = str(v).lower()
        if "εργαστήριο" in v_lower or "εργαστηριο" in v_lower or "lab" in v_lower:
            return "Εργαστήριο"
        if "φροντιστήριο" in v_lower or "φροντιστηριο" in v_lower or "tutorial" in v_lower:
            return "Φροντιστήριο"
        return "Θεωρία"

    @field_validator("day", "time_start", "time_end", "course_name", "professor", "room", "building", mode="before")
    @classmethod
    def strip_strings(cls, v):
        return str(v).strip() if v else ""


class ClassScheduleOutput(BaseModel):
    department: str
    semester: str
    academic_year: str
    period: str
    courses: list[CourseEntry]

    @field_validator("courses")
    @classmethod
    def must_have_courses(cls, v):
        if not v:
            raise ValueError("Gemini returned zero course entries — extraction failed.")
        return v

    @field_validator("department", "semester", "academic_year", "period", mode="before")
    @classmethod
    def strip_strings(cls, v):
        return str(v).strip() if v else ""


# ─── Gemini Structured Output Schema ─────────────────────────────────────────

COURSE_ENTRY_SCHEMA = types.Schema(
    type=types.Type.OBJECT,
    properties={
        "day":         types.Schema(type=types.Type.STRING, description="Greek weekday: Δευτέρα, Τρίτη, Τετάρτη, Πέμπτη, Παρασκευή"),
        "time_start":  types.Schema(type=types.Type.STRING, description="Start time HH:MM"),
        "time_end":    types.Schema(type=types.Type.STRING, description="End time HH:MM"),
        "course_name": types.Schema(type=types.Type.STRING, description="Full Greek course name"),
        "professor":   types.Schema(type=types.Type.STRING, description="Professor last name and initials"),
        "room":        types.Schema(type=types.Type.STRING, description="Room name e.g. Γαληνός, ΑΜΦ1, Αίθουσα 3"),
        "building":    types.Schema(type=types.Type.STRING, description="Building name e.g. Κτήριο Γαληνός, Κτήριο ΤΑΒΜ-ΤΙΣΤ"),
        "type":        types.Schema(type=types.Type.STRING, description="Θεωρία or Εργαστήριο or Φροντιστήριο"),
    },
    required=["day", "time_start", "time_end", "course_name", "professor", "room", "building", "type"],
)

CLASS_SCHEDULE_SIMPLE_SCHEMA = types.Schema(
    type=types.Type.OBJECT,
    properties={
        "department":   types.Schema(type=types.Type.STRING),
        "semester":     types.Schema(type=types.Type.STRING, description="Greek letter: Α, Β, Γ, Δ, Ε, ΣΤ, Ζ, Η"),
        "academic_year": types.Schema(type=types.Type.STRING, description="e.g. 2025-2026"),
        "period":       types.Schema(type=types.Type.STRING, description="Χειμερινό or Εαρινό"),
        "courses":      types.Schema(
            type=types.Type.ARRAY,
            items=COURSE_ENTRY_SCHEMA,
            description="Every non-empty class session in the timetable",
        ),
    },
    required=["department", "semester", "academic_year", "period", "courses"],
)


# ─── Prompt ───────────────────────────────────────────────────────────────────

def build_class_simple_prompt(department: str = "Τμήμα Πληροφορικής") -> str:
    return f"""
You are an expert parser for Greek university weekly class timetables (Ωρολόγιο Πρόγραμμα).
The document is in Greek and uses a grid layout.

GRID LAYOUT:
  Rows    = time slots (format: HH:MM-HH:MM), typically from 09:00 to 21:00
  Columns = weekdays: ΔΕΥΤΕΡΑ, ΤΡΙΤΗ, ΤΕΤΑΡΤΗ, ΠΕΜΠΤΗ, ΠΑΡΑΣΚΕΥΗ

EACH NON-EMPTY CELL CONTAINS (top to bottom):
  1. Professor name (surname + initials)
  2. Course name in Greek quotation marks «...» or plain text
  3. Room name (Αίθουσα N, ΑΜΦ1/2, Εργαστήριο Γαληνός, etc.)
  4. Building name — look for Κτήριο ... or ΤΑΒΜ-ΤΙΣΤ etc. followed by * or **

EXTRACTION RULES:
1. Extract the header: department, semester letter, academic year, period (Χειμερινό/Εαρινό).
2. For each non-empty cell, create ONE CourseEntry.
3. day: use the Greek column header (Δευτέρα, Τρίτη, Τετάρτη, Πέμπτη, Παρασκευή).
4. time_start / time_end: from the row label. If a class occupies two consecutive rows (e.g., 09:00-10:00 AND 10:00-11:00), use 09:00 and 11:00 as the span.
5. type: if the cell contains "Εργαστήριο" → "Εργαστήριο", if "Φροντιστήριο" → "Φροντιστήριο", else → "Θεωρία".
6. building: the text after the room, often ending in * (one star = Κτήριο Αρεταίος, two stars = Κτήριο ΤΑΒΜ-ΤΙΣΤ). Extract the actual building name.
7. Do NOT create entries for empty cells.
8. Do NOT duplicate entries — each unique class session appears exactly once.
9. Preserve Greek characters exactly.

Semester mapping: Α΄/1ο→Α, Β΄/2ο→Β, Γ΄/3ο→Γ, Δ΄/4ο→Δ, Ε΄/5ο→Ε, ΣΤ΄/6ο→ΣΤ, Ζ΄/7ο→Ζ, Η΄/8ο→Η

Department context: {department}

Return ONLY the structured JSON — no explanation text.
"""
