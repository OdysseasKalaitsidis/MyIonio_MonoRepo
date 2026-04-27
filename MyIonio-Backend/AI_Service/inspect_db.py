
import os
import sys
from dotenv import load_dotenv

# Add the AI_Service directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from db.supabase_client import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

def check_db_content():
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("Error: Supabase credentials not found in env")
        return

    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    # Query all schedules
    response = supabase.table("class_schedules").select("*").execute()
    
    with open("db_output.txt", "w", encoding="utf-8") as f:
        f.write(f"Found {len(response.data)} schedules in class_schedules table:\n")
        f.write("-" * 50 + "\n")
        
        for item in response.data:
            dept = item.get('department')
            sem = item.get('semester')
            courses = item.get('courses', [])
            f.write(f"Dept: '{dept}' | Sem: '{sem}' | Courses: {len(courses)}\n")
            if dept:
                f.write(f"  Dept Hex: {dept.encode('utf-8').hex()}\n")
            if sem:
                f.write(f"  Sem Hex:  {sem.encode('utf-8').hex()}\n")
            f.write("-" * 50 + "\n")
    print("Output written to db_output.txt")

if __name__ == "__main__":
    check_db_content()
