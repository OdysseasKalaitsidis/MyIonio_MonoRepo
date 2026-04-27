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

def upsert_exam_schedule(semester: str, department: str, period: str, exams=None, supabase: Client = None):
    if exams is None:
        exams = []

    if supabase is None:
        logger.error("Supabase client not provided")
        return

    data = {
        "semester": semester,
        "department": department,
        "period": period,
        "exams": exams,
    }

    try:
        # Assuming table name is 'exam_schedules'
        response = supabase.table("exam_schedules").upsert(data).execute()
        logger.info(f"Exam schedule upsert successful: {response}")
        return response  
    except Exception as e:
        logger.error(f"Error upserting exam schedule: {e}")
        return None

def upsert_class_schedule(department: str, semester: str, academic_year: str, period: str, courses=None, supabase: Client = None):
    if courses is None:
        courses = []
    
    if supabase is None:
        logger.error("Supabase client not provided")
        return None

    data = {
        "department": department,
        "semester": semester,
        "academic_year": academic_year,
        "period": period,
        "courses": courses
    }

    try:
        response = supabase.table("class_schedules").upsert(data).execute()
        logger.info(f"Class schedule upsert successful: {response}")
        return response
    except Exception as e:
        logger.error(f"Error upserting class schedule: {e}")
        return None

def get_all_class_schedules(supabase: Client = None):
    if supabase is None:
        logger.error("Supabase client not provided")
        return None

    try:
        # Fetch all records from class_schedules
        # Note: If the table is very large, pagination might be needed.
        # For now, assuming it fits in one response or default limit is enough (usually 1000).
        response = supabase.table("class_schedules").select("*").execute()
        return response
    except Exception as e:
        logger.error(f"Error fetching all class schedules: {e}")
        return None

def get_exam_schedule(department: str, semester: str, supabase: Client = None):
    if supabase is None:
        logger.error("Supabase client not provided")
        return None

    try:
        response = supabase.table("exam_schedules")\
            .select("*")\
            .eq("department", department)\
            .eq("semester", semester)\
            .execute()
        return response
    except Exception as e:
        logger.error(f"Error fetching exam schedule: {e}")
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