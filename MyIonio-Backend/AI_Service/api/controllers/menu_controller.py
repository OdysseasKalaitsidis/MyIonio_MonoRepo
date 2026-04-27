from fastapi import APIRouter, UploadFile, File, Body
from api.services.menu_service import process_menu_file
from models.menu_pydantic import WeeklyScheduleRequest
from models.Menu import WeeklySchedule, DailyMenu, MenuItems
from db.supabase_client import upsert_menu, create_client
import os
from dotenv import load_dotenv

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

router = APIRouter()

@router.post("/upload-menu")
async def upload_menu(file: UploadFile = File(...)):
    return await process_menu_file(file)

from api.services.menu_service import insert_dummy_menu_service

@router.post("/dummy-menu")
async def dummy_menu():
    return await insert_dummy_menu_service()

@router.post("/manual")
async def manual_insert_menu(schedule_request: WeeklyScheduleRequest = Body(...)):
    # Convert Pydantic model to Dataclass
    days_dataclasses = []
    for day_req in schedule_request.days:
        lunch = MenuItems(
            main_courses=day_req.lunch.main_courses,
            has_salad=day_req.lunch.has_salad,
            has_dessert=day_req.lunch.has_dessert,
            notes=day_req.lunch.notes
        )
        dinner = MenuItems(
            main_courses=day_req.dinner.main_courses,
            has_salad=day_req.dinner.has_salad,
            has_dessert=day_req.dinner.has_dessert,
            notes=day_req.dinner.notes
        )
        daily_menu = DailyMenu(
            date_iso=day_req.date_iso,
            day_name=day_req.day_name,
            lunch=lunch,
            dinner=dinner
        )
        days_dataclasses.append(daily_menu)

    schedule_dataclass = WeeklySchedule(
        week_start=schedule_request.week_start,
        week_end=schedule_request.week_end,
        days=days_dataclasses
    )

    supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    response = upsert_menu(schedule=schedule_dataclass, client=supabase_client)
    
    if response:
         return {"success": True, "message": "Menu inserted successfully", "data": response.data}
    else:
        return {"success": False, "message": "Failed to insert menu"}
