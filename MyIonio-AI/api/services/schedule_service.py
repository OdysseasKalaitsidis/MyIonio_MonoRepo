import json
import os
import tempfile
from fastapi import UploadFile
from loguru import logger
from dotenv import load_dotenv
from db.supabase_client import create_client, upsert_schedule
from parser.gemini_parser import parse_schedule_with_gemini

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

async def process_schedule_pdf(file: UploadFile):
    
    supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    tmp_path = None
    
    try:
       
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name
        
        logger.info(f"Saved uploaded PDF to {tmp_path}")

    
        logger.info("Parsing PDF with Gemini 2.5 Flash Vision...")
        
        parsed_schedule = parse_schedule_with_gemini(tmp_path)
        
        if not parsed_schedule or not parsed_schedule.get("schedule_by_day"):
            return {"success": False, "message": "Gemini returned empty or invalid schedule"}
            
        logger.info(f"Gemini parsed output preview: {list(parsed_schedule.keys())}")

        department = parsed_schedule.get("department", "Unknown Department")
        semester = parsed_schedule.get("semester", "Unknown Semester")
        
        all_courses = []
        for day, courses in parsed_schedule.get("schedule_by_day", {}).items():
            for course in courses:
                all_courses.append({
                    **course,
                    "day": day
                })
        
        logger.info(f"Extracted {len(all_courses)} total course entries")
        if parsed_schedule:
            logger.info("=" * 50)
            logger.info("GEMINI PARSED OUTPUT (PREVIEW):")
            logger.info("\n" + json.dumps(parsed_schedule, indent=2, ensure_ascii=False))
            logger.info("=" * 50)

        db_response = upsert_schedule(
            semester=semester,
            department=department,
            courses=all_courses,
            supabase=supabase_client
        )
        
        if db_response is None:
            return {"success": False, "message": "Failed to upsert schedule into database"}

        return {
            "success": True, 
            "db_response": db_response.data,
            "courses_count": len(all_courses),
            "schedule_preview": parsed_schedule
        }

    except Exception as e:
        logger.exception("Unexpected error in process_schedule_pdf")
        return {"success": False, "message": f"Unexpected error: {str(e)}"}
        
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
                logger.info(f"Cleaned up temporary local file: {tmp_path}")
            except Exception as e:
                logger.warning(f"Failed to delete local temp file {tmp_path}: {e}")