"""Canonical curriculum catalog schema extracted from the official programme of study.

This document is the source of truth for semester membership, major/minor roles,
toolbox membership, contact hours and ECTS. Timetable PDFs only describe when and
where a course is taught; they must not be used to infer curriculum eligibility.
"""

from __future__ import annotations

from typing import Literal
from pydantic import BaseModel, Field, field_validator
from google.genai import types


class CurriculumRole(BaseModel):
    pathway: str
    audience: Literal["MAJOR", "MINOR"]
    requirement: Literal["REQUIRED", "ELECTIVE"]

    @field_validator("pathway", mode="before")
    @classmethod
    def normalise_pathway(cls, value):
        text = str(value or "").strip().upper()
        mapping = {
            "ΒΥΝ": "BYN",
            "BYN": "BYN",
            "ΚΔΕ": "KDE",
            "KDE": "KDE",
            "ΨΜΑΔ": "PSMAD",
            "PSMAD": "PSMAD",
            "YMAD": "PSMAD",
        }
        return mapping.get(text, text)


class CurriculumCourse(BaseModel):
    semester: str
    course_name: str
    theory_hours: int = 0
    lab_hours: int = 0
    tutorial_hours: int = 0
    teaching_units: int = 0
    ects: int = 0
    roles: list[CurriculumRole] = Field(default_factory=list)
    toolboxes: list[str] = Field(default_factory=list)

    @field_validator("semester", "course_name", mode="before")
    @classmethod
    def strip_strings(cls, value):
        return str(value or "").strip()

    @field_validator("toolboxes", mode="before")
    @classmethod
    def normalise_toolboxes(cls, value):
        if not value:
            return []
        return sorted({str(item).strip().upper() for item in value if str(item).strip()})


class CurriculumCatalogOutput(BaseModel):
    department: str
    academic_year: str
    courses: list[CurriculumCourse]

    @field_validator("courses")
    @classmethod
    def must_have_courses(cls, value):
        if not value:
            raise ValueError("Curriculum extraction returned zero courses.")
        return value

    @field_validator("department", "academic_year", mode="before")
    @classmethod
    def strip_strings(cls, value):
        return str(value or "").strip()


ROLE_SCHEMA = types.Schema(
    type=types.Type.OBJECT,
    properties={
        "pathway": types.Schema(type=types.Type.STRING, description="BYN, KDE or PSMAD"),
        "audience": types.Schema(type=types.Type.STRING, enum=["MAJOR", "MINOR"]),
        "requirement": types.Schema(type=types.Type.STRING, enum=["REQUIRED", "ELECTIVE"]),
    },
    required=["pathway", "audience", "requirement"],
)

CURRICULUM_COURSE_SCHEMA = types.Schema(
    type=types.Type.OBJECT,
    properties={
        "semester": types.Schema(type=types.Type.STRING, description="Greek semester letter Α through Η"),
        "course_name": types.Schema(type=types.Type.STRING),
        "theory_hours": types.Schema(type=types.Type.INTEGER),
        "lab_hours": types.Schema(type=types.Type.INTEGER),
        "tutorial_hours": types.Schema(type=types.Type.INTEGER),
        "teaching_units": types.Schema(type=types.Type.INTEGER),
        "ects": types.Schema(type=types.Type.INTEGER),
        "roles": types.Schema(type=types.Type.ARRAY, items=ROLE_SCHEMA),
        "toolboxes": types.Schema(
            type=types.Type.ARRAY,
            items=types.Schema(type=types.Type.STRING),
            description="Zero or more toolbox codes TB1 through TB5",
        ),
    },
    required=[
        "semester", "course_name", "theory_hours", "lab_hours",
        "tutorial_hours", "teaching_units", "ects", "roles", "toolboxes",
    ],
)

CURRICULUM_CATALOG_SCHEMA = types.Schema(
    type=types.Type.OBJECT,
    properties={
        "department": types.Schema(type=types.Type.STRING),
        "academic_year": types.Schema(type=types.Type.STRING),
        "courses": types.Schema(type=types.Type.ARRAY, items=CURRICULUM_COURSE_SCHEMA),
    },
    required=["department", "academic_year", "courses"],
)


def build_curriculum_prompt(department: str = "Τμήμα Πληροφορικής") -> str:
    return f"""
You parse the official Greek university Programme of Study into a canonical course catalog.
Process every semester table and return one entry per course. Join course names that wrap
across table rows. Extract numeric theory, laboratory, tutorial, teaching-unit and ECTS values.
Use zero when a contact-hour cell is blank.

Interpret annotations as independent roles; a course may have multiple roles:
- Υ-ΒΥΝ / Y-BYN: pathway BYN, audience MAJOR, requirement REQUIRED
- Ε-ΒΥΝ / E-BYN: pathway BYN, audience MAJOR, requirement ELECTIVE
- MIN-ΒΥΝ / MIN-BYN: pathway BYN, audience MINOR, requirement REQUIRED
- Υ-ΚΔΕ: pathway KDE, audience MAJOR, requirement REQUIRED
- Ε-ΚΔΕ: pathway KDE, audience MAJOR, requirement ELECTIVE
- MIN-ΚΔΕ: pathway KDE, audience MINOR, requirement REQUIRED
- Υ-ΨΜΑΔ: pathway PSMAD, audience MAJOR, requirement REQUIRED
- Ε-ΨΜΑΔ: pathway PSMAD, audience MAJOR, requirement ELECTIVE
- MIN-ΨΜΑΔ: pathway PSMAD, audience MINOR, requirement REQUIRED
- TB1 through TB5 belong in the toolboxes array, not in roles.

Do not infer a MINOR role from a timetable column. Only emit roles explicitly printed next
to a course in the programme of study. Preserve the Greek course name without the role tags.
Map semesters 1/Α through 8/Η to Α, Β, Γ, Δ, Ε, ΣΤ, Ζ, Η.
Department context: {department}
Return only structured JSON.
"""
