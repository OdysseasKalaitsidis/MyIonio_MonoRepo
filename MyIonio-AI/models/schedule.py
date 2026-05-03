from pydantic import BaseModel
from typing import List

class Course(BaseModel):
    name: str
    code: str
    day: str
    time_start: str
    time_end: str
    room: str
    professor: str

class Schedule(BaseModel):
    department: str
    semester: str
    courses: List[Course]
