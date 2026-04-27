from pydantic import BaseModel
from typing import List

class Exam(BaseModel):
    course_name: str
    date: str
    time_start: str
    time_end: str
    room: str
    professors: List[str]

class ExamSchedule(BaseModel):
    department: str
    semester: str
    academic_year: str
    period: str
    exams: List[Exam]
