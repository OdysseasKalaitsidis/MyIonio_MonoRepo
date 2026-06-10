"""
Schema, prompt, and Pydantic model for Class Schedule — Split by Major Track type.

Document format (from actual PDFs — ΣΤ΄ Εξαμήνου type):
  Header: ΩΡΟΛΟΓΙΟ ΠΡΟΓΡΑΜΜΑ / ΣΤ΄ ΕΑΡΙΝΟ ΕΞΑΜΗΝΟ 2025-2026
  Layout: MULTI-PAGE — each page = ONE weekday
           Within each page:
             Rows    = time slots
             Columns = Κορμού/Επιλογής | BYN | ΚΔΕ | ΨΜΑΔ
  Each cell: Professor / Course / Room / Building (same as simple)
  The major track column tells us which specialisation the course belongs to.
"""

from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, field_validator
from google.genai import types


# ─── Pydantic Models ──────────────────────────────────────────────────────────

class CourseEntryWithMajor(BaseModel):
    day: str
    time_start: str
    time_end: str
    course_name: str
    professor: str
    room: str
    building: str
    type: str = "Θεωρία"
    major: Optional[str] = None  # Κορμός, BYN, ΚΔΕ, ΨΜΑΔ

    @field_validator("type", mode="before")
    @classmethod
    def normalise_type(cls, v):
        if not v:
            return "Θεωρία"
        v_lower = str(v).lower()
        if "εργαστήριο" in v_lower or "εργαστηριο" in v_lower or "lab" in v_lower:
            return "Εργαστήριο"
        if "φροντιστήριο" in v_lower or "φροντιστηριο" in v_lower:
            return "Φροντιστήριο"
        return "Θεωρία"

    @field_validator("major", mode="before")
    @classmethod
    def normalise_major(cls, v):
        if not v:
            return None
        mapping = {
            "κορμ": "Κορμός",
            "byn": "BYN",
            "βυν": "BYN",
            "κδε": "ΚΔΕ",
            "kde": "ΚΔΕ",
            "ψμαδ": "ΨΜΑΔ",
            "ymad": "ΨΜΑΔ",
        }
        v_lower = str(v).lower()
        for key, val in mapping.items():
            if key in v_lower:
                return val
        return str(v).strip()

    @field_validator("day", "time_start", "time_end", "course_name", "professor", "room", "building", mode="before")
    @classmethod
    def strip_strings(cls, v):
        return str(v).strip() if v else ""


class ClassScheduleSplitOutput(BaseModel):
    department: str
    semester: str
    academic_year: str
    period: str
    courses: list[CourseEntryWithMajor]

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

COURSE_ENTRY_SPLIT_SCHEMA = types.Schema(
    type=types.Type.OBJECT,
    properties={
        "day":         types.Schema(type=types.Type.STRING, description="Greek weekday this entry belongs to"),
        "time_start":  types.Schema(type=types.Type.STRING, description="Start time HH:MM"),
        "time_end":    types.Schema(type=types.Type.STRING, description="End time HH:MM"),
        "course_name": types.Schema(type=types.Type.STRING, description="Full Greek course name"),
        "professor":   types.Schema(type=types.Type.STRING, description="Professor name"),
        "room":        types.Schema(type=types.Type.STRING, description="Room name"),
        "building":    types.Schema(type=types.Type.STRING, description="Building name"),
        "type":        types.Schema(type=types.Type.STRING, description="Θεωρία or Εργαστήριο or Φροντιστήριο"),
        "major":       types.Schema(type=types.Type.STRING, description="Track column: Κορμός, BYN, ΚΔΕ, or ΨΜΑΔ"),
    },
    required=["day", "time_start", "time_end", "course_name", "professor", "room", "building", "type", "major"],
)

CLASS_SCHEDULE_SPLIT_SCHEMA = types.Schema(
    type=types.Type.OBJECT,
    properties={
        "department":    types.Schema(type=types.Type.STRING),
        "semester":      types.Schema(type=types.Type.STRING, description="Greek letter: Α, Β, Γ, Δ, Ε, ΣΤ, Ζ, Η"),
        "academic_year": types.Schema(type=types.Type.STRING, description="e.g. 2025-2026"),
        "period":        types.Schema(type=types.Type.STRING, description="Χειμερινό or Εαρινό"),
        "courses":       types.Schema(
            type=types.Type.ARRAY,
            items=COURSE_ENTRY_SPLIT_SCHEMA,
            description="Every non-empty class session across ALL pages/days/major-columns",
        ),
    },
    required=["department", "semester", "academic_year", "period", "courses"],
)


# ─── Prompt ───────────────────────────────────────────────────────────────────

def build_class_split_prompt(department: str = "Τμήμα Πληροφορικής") -> str:
    return f"""
You are an expert parser for Greek university weekly class timetables split by major specialisation track.
This is a MULTI-PAGE document. Each page covers a SINGLE WEEKDAY.

LAYOUT PER PAGE:
  Page heading: the weekday (ΔΕΥΤΕΡΑ, ΤΡΙΤΗ, ΤΕΤΑΡΤΗ, ΠΕΜΠΤΗ, ΠΑΡΑΣΚΕΥΗ)
  Rows    = time slots (HH:MM-HH:MM)
  Columns = Κορμού/Επιλογής | BYN | ΚΔΕ | ΨΜΑΔ
    • Κορμού/Επιλογής = core/shared courses (major = "Κορμός")
    • BYN  = Βιοπληροφορική και Νοημοσύνη (major = "BYN")
    • ΚΔΕ  = Κυβερνοασφάλεια και Δίκτυα (major = "ΚΔΕ")
    • ΨΜΑΔ = Ψηφιακός Μετασχηματισμός (major = "ΨΜΑΔ")

EACH NON-EMPTY CELL CONTAINS:
  1. Professor name
  2. Course name (may be in «...» or plain)
  3. Room (Αίθουσα N, ΑΜΦ1/2, Εργαστήριο Γαληνός, etc.)
  4. Building (after room, often ending with * = Κτήριο Αρεταίος, ** = Κτήριο ΤΑΒΜ-ΤΙΣΤ)

EXTRACTION RULES:
1. Parse the document header (first page) for: department, semester, academic_year, period.
2. Process ALL pages — do not skip any page or day.
3. For each non-empty cell:
   - day: the weekday for this page
   - major: the column header (Κορμός / BYN / ΚΔΕ / ΨΜΑΔ)
   - time_start/time_end: from the row label. If a class spans two rows, use the full span.
   - type: Εργαστήριο if the cell says so, else Θεωρία
4. Do NOT create entries for empty cells.
5. Preserve all Greek characters exactly.
6. Semester mapping: Α΄/1→Α, Β΄/2→Β, Γ΄/3→Γ, Δ΄/4→Δ, Ε΄/5→Ε, ΣΤ΄/6→ΣΤ, Ζ΄/7→Ζ, Η΄/8→Η

Department context: {department}

Return ONLY the structured JSON — no explanation text.
"""
