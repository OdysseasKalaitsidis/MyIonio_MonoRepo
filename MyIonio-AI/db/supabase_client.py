from supabase import create_client
import os
from dotenv import load_dotenv
from loguru import logger
from supabase import Client

from models.Menu import WeeklySchedule
from dataclasses import asdict

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def upsert_schedule( semester: str, department: str, courses=None,  supabase: Client = None):
    if courses is None:
        courses = []

    if supabase is None:
        logger.error("Supabase client not provided")
        return

    data = {
        "semester": semester,
        "department": department,
        "courses": courses,
    }

    try:
        response = supabase.table("schedules").upsert(data).execute()
        logger.info(f"Upsert successful: {response}")
        return response  
    except Exception as e:
        logger.error(f"Error upserting schedule: {e}")
        return None


from datetime import datetime

def upsert_menu(schedule: WeeklySchedule, client: Client = supabase):
   
    if not schedule:
        logger.error("No schedule data provided to upsert.")
        return

    data_payload = asdict(schedule)
    # Fix for NOT NULL constraint on created_at
    data_payload["created_at"] = datetime.now().isoformat()

    try:
        # Just insert since on_conflict requires a constraint that missing, and select is forbidden (RLS).
        # This might create duplicates but it allows adding the dummy menu.
        logger.info(f"Inserting new menu for week {schedule.week_start}")
        response = client.table("weekly_menus").insert(data_payload).execute()
        
        logger.info(f"Menu operation successful for week {schedule.week_start}")
        return response
    except Exception as e:
        logger.error(f"Error handling menu for week {schedule.week_start}: {e}")
        return None