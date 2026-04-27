from pydantic import BaseModel, Field
from typing import List, Optional

class Course(BaseModel):
    course_name: str
    code: Optional[str] = None
    day: str
    time_start: str
    time_end: str
    room: str
    professors: List[str]
    major: Optional[str] = None
    minor: Optional[str] = None
    optional: Optional[bool] = False
    type: Optional[str] = None

class Schedule(BaseModel):
    department: str
    semester: str
    academic_year: str
    period: str
    courses: List[Course]
