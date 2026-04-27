
import os
import sys
from dotenv import load_dotenv

# Add the AI_Service directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from db.supabase_client import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

def check_course_types():
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("Error: Supabase credentials not found in env")
        return

    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    # Query all schedules
    response = supabase.table("class_schedules").select("*").execute()
    
    unique_types = set()
    
    print(f"Scanning {len(response.data)} schedules for course types...")
    
    with open("db_types.txt", "w", encoding="utf-8") as f:
        for item in response.data:
            sem = item.get('semester', 'Unknown')
            courses = item.get('courses', [])
            f.write(f"\nSemester: {sem}\n")
            for c in courses:
                c_type = c.get('type')
                c_name = c.get('course_name')
                if c_type:
                    unique_types.add(c_type)
                    # Print type and its hex representation to catch hidden chars
                    f.write(f"  Course: {c_name[:30]:<30} | Type: '{c_type}' | Hex: {c_type.encode('utf-8').hex()}\n")
                else:
                    f.write(f"  Course: {c_name[:30]:<30} | Type: (None/Empty)\n")
                    
    print(f"Found {len(unique_types)} unique types. Written to db_types.txt")

if __name__ == "__main__":
    check_course_types()
