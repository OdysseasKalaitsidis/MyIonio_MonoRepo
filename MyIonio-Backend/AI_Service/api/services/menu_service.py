import json
import os
import tempfile
from fastapi import UploadFile
from loguru import logger
from dotenv import load_dotenv
from dataclasses import asdict

from db.supabase_client import upsert_menu, supabase 
from parser.menu_parser import parse_menu
load_dotenv()

async def process_menu_file(file: UploadFile):
    """
    Orchestrates the flow: Receive File (PDF/Image) -> Save Temp -> Parse (Gemini) -> Save to DB.
    """
    tmp_path = None
    
    try:
        # Determine file extension
        filename = file.filename or "file"
        ext = os.path.splitext(filename)[1].lower()
        if not ext:
            ext = ".pdf" # Default fallback
            
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name
        
        logger.info(f"Saved uploaded file to {tmp_path}")

        logger.info("Parsing Menu with Gemini...")
        
        parsed_schedule = parse_menu(tmp_path)
        
        if not parsed_schedule:
            return {"success": False, "message": "Gemini returned empty or invalid menu data"}
            
        schedule_dict = asdict(parsed_schedule)
        logger.info(f"Gemini parsed week: {parsed_schedule.week_start} to {parsed_schedule.week_end}")
        logger.info("=" * 50)
        logger.info("GEMINI PARSED OUTPUT (PREVIEW):")
        logger.info("\n" + json.dumps(schedule_dict, indent=2, default=str, ensure_ascii=False))
        logger.info("=" * 50)

        
        logger.info(f"Upserting menu for week starting {parsed_schedule.week_start}...")

        db_response = upsert_menu(
            schedule=parsed_schedule, 
            client=supabase
        )
        
        if db_response is None:
            return {"success": False, "message": "Failed to upsert menu into database"}

        return {
            "success": True, 
            "week_start": parsed_schedule.week_start,
            "week_end": parsed_schedule.week_end,
            "db_response": db_response.data,
            "menu_preview": schedule_dict
        }

    except ValueError as ve:
        logger.error(f"Validation error: {ve}")
        return {"success": False, "message": str(ve)}

    except Exception as e:
        logger.exception("Unexpected error in process_menu_pdf")
        return {"success": False, "message": f"Unexpected error: {str(e)}"}
        
    finally:
        
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
                logger.info(f"Cleaned up temporary local file: {tmp_path}")
            except Exception as e:
                logger.warning(f"Failed to delete local temp file {tmp_path}: {e}")

from models.Menu import WeeklySchedule, DailyMenu, MenuItems
from datetime import date, timedelta

async def insert_dummy_menu_service():
    """
    Inserts a dummy menu into the database.
    """
    logger.info("Inserting dummy menu...")
    
    # Create a dummy week starting from today (or adjacent Monday)
    today = date.today()
    # Find the most recent Monday
    start_of_week = today - timedelta(days=today.weekday())
    end_of_week = start_of_week + timedelta(days=6)
    
    days_data = []
    
    # Create 7 days of dummy data
    for i in range(7):
        current_day = start_of_week + timedelta(days=i)
        
        lunch = MenuItems(
            main_courses=["Dummy Lunch A", "Dummy Lunch B"],
            has_salad=True,
            has_dessert=True,
            notes="Contains allergens"
        )
        
        dinner = MenuItems(
            main_courses=["Dummy Dinner A", "Dummy Dinner B"],
            has_salad=True,
            has_dessert=False,
            notes=""
        )
        
        daily_menu = DailyMenu(
            date_iso=current_day.isoformat(),
            day_name=current_day.strftime("%A"),
            lunch=lunch,
            dinner=dinner
        )
        days_data.append(daily_menu)

    dummy_schedule = WeeklySchedule(
        week_start=start_of_week.isoformat(),
        week_end=end_of_week.isoformat(),
        days=days_data
    )
    
    logger.info(f"Generated dummy schedule for week: {dummy_schedule.week_start} - {dummy_schedule.week_end}")
    
    db_response = upsert_menu(schedule=dummy_schedule, client=supabase)
    
    if db_response is None:
        return {"success": False, "message": "Failed to upsert dummy menu into database"}
        
    return {
        "success": True, 
        "message": "Dummy menu inserted successfully",
        "data": asdict(dummy_schedule),
        "db_response": db_response.data
    }