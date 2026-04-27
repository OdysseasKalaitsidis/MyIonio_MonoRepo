import os
from dotenv import load_dotenv
from supabase import create_client
from loguru import logger
import sys

# Add project root to python path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

try:
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
except Exception as e:
    logger.error(f"Failed to create Supabase client: {e}")
    sys.exit(1)

dummy_courses = [
    {
        "course_name": "Test Course 101",
        "day": "Monday",
        "time": "10:00-12:00",
        "instructor": "Dr. Test",
        "room": "Room A"
    },
    {
        "course_name": "Test Course 102",
        "day": "Wednesday",
        "time": "14:00-16:00",
        "instructor": "Prof. Debug",
        "room": "Lab 1"
    }
]

logger.info("Attempting to upsert dummy schedule using 'upsert_schedule' logic...")

try:
    # Direct upsert to mimic what the service does, but keeping it simple for the test script
    # Replicating the data structure from upsert_schedule
    data = {
        "semester": "Test Semester",
        "department": "Test Department",
        "courses": dummy_courses,
    }
    
    response = supabase.table("schedules").upsert(data).execute()
    logger.info("Success!")
    logger.info(response)

except Exception as e:
    logger.exception("Upsert Failed:")
