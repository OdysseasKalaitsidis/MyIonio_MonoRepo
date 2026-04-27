import json
from dataclasses import dataclass, field, asdict
from typing import List, Optional
from datetime import date

@dataclass
class MenuItems:
    main_courses: List[str] = field(default_factory=list)
    has_salad: bool = False
    has_dessert: bool = False
    notes: Optional[str] = ""

@dataclass
class DailyMenu:
    date_iso: str 
    day_name: str  
    lunch: MenuItems
    dinner: MenuItems

    def to_json(self):
        return json.dumps(asdict(self), ensure_ascii=False, indent=2)

@dataclass
class WeeklySchedule:
    week_start: str
    week_end: str
    days: List[DailyMenu] = field(default_factory=list)
    def to_dict(self):
        return asdict(self)