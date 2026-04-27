from pydantic import BaseModel
from typing import List, Optional

class MenuItemsRequest(BaseModel):
    main_courses: List[str] = []
    has_salad: bool = False
    has_dessert: bool = False
    notes: Optional[str] = ""

class DailyMenuRequest(BaseModel):
    date_iso: str 
    day_name: str  
    lunch: MenuItemsRequest
    dinner: MenuItemsRequest

class WeeklyScheduleRequest(BaseModel):
    week_start: str
    week_end: str
    days: List[DailyMenuRequest] = []
