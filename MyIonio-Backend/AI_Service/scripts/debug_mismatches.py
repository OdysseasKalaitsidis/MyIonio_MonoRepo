import os
import sys
from pathlib import Path
import json

project_root = Path(__file__).resolve().parent.parent
sys.path.append(str(project_root))

from dotenv import load_dotenv
from db.supabase_client import create_client, get_all_class_schedules

load_dotenv(project_root / ".env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

def debug_mismatches():
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    response = get_all_class_schedules(supabase)
    schedules = response.data
    
    # Load expectations
    json_path = project_root / "major_minor_electives.json"
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    expected_types = {}
    curriculum = data.get("curriculum_by_semester", {})
    for semester_key, semester_data in curriculum.items():
        for category, courses in semester_data.items():
            if isinstance(courses, list):
                for course in courses:
                    name = course.get("course")
                    c_type = course.get("type")
                    if name and c_type:
                        expected_types[name] = c_type

    with open("mismatches.txt", "w", encoding="utf-8") as out:
        for schedule in schedules:
            courses = schedule.get("courses", [])
            for course in courses:
                name = course.get("course_name")
                current_type = course.get("type")
                
                if name in expected_types:
                    expected = expected_types[name]
                    if current_type != expected:
                        out.write(f"MISMATCH: '{name}' (Schedule: {schedule.get('id')})\n")
                        out.write(f"  Current: '{current_type}'\n")
                        out.write(f"  Expected: '{expected}'\n")
                        # Also check if name has hidden chars
                        out.write(f"  Name repr: {repr(name)}\n")
                        out.write("-" * 20 + "\n")

if __name__ == "__main__":
    debug_mismatches()
