import os
import sys
from pathlib import Path
from collections import Counter

project_root = Path(__file__).resolve().parent.parent
sys.path.append(str(project_root))

from dotenv import load_dotenv
from loguru import logger
from db.supabase_client import create_client, get_all_class_schedules

load_dotenv(project_root / ".env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

def check_duplicates():
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    response = get_all_class_schedules(supabase)
    schedules = response.data
    
    keys = []
    for s in schedules:
        key = (s.get("department"), s.get("semester"), s.get("academic_year"), s.get("period"))
        keys.append(key)
        
    counts = Counter(keys)
    duplicates = {k: v for k, v in counts.items() if v > 1}
    
    if duplicates:
        print(f"Found {len(duplicates)} duplicate sets:")
        for k, v in duplicates.items():
            print(f"  {k}: {v} records")
    else:
        print("No duplicates found based on (dept, sem, year, period).")

    # Also check if any schedules have the 'Type' field populated
    populated = 0
    total_courses = 0
    for s in schedules:
        courses = s.get("courses", [])
        for c in courses:
            total_courses += 1
            if c.get("type"):
                populated += 1
    
    print(f"Total courses checked: {total_courses}")
    print(f"Courses with 'type' populated: {populated}")

if __name__ == "__main__":
    check_duplicates()
