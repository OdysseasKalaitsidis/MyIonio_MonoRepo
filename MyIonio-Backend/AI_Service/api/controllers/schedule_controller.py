from fastapi import APIRouter, UploadFile, File, Query, Body
from api.services.schedule_service import process_schedule_pdf, process_exam_schedule_pdf, get_exam_schedule_service
from models.exam_schedule import ExamSchedule
from models.schedule import Schedule as ClassSchedule # Rename to avoid conflict if needed, or just import
from db.supabase_client import upsert_exam_schedule, upsert_class_schedule, create_client
from loguru import logger
import os
from dotenv import load_dotenv

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

router = APIRouter()

@router.post("/upload-schedule")
async def upload_schedule(file: UploadFile = File(...), dpi: int = Query(200, description="Image resolution (150=cheaper, 200=balanced, 300=higher quality)")):
    """
    Upload and parse a class schedule PDF.
    
    - **file**: PDF file to parse
    - **dpi**: Image resolution for parsing (default 200, lower=cheaper/faster, higher=better quality)
    
    Returns parsed schedule with token usage metrics.
    """
    logger.info(f"📥 Received schedule upload request: {file.filename} (DPI={dpi})")
    logger.info(f"   Content type: {file.content_type}")
    logger.info(f"   File size: {file.size if hasattr(file, 'size') else 'unknown'} bytes")
    
    result = await process_schedule_pdf(file, dpi=dpi)
    
    if result.get("success"):
        logger.info(f"✅ Schedule upload successful: {result.get('message', 'OK')}")
    else:
        logger.error(f"❌ Schedule upload failed: {result.get('message', 'Unknown error')}")
    
    return result

@router.post("/upload-exam-schedule")
async def upload_exam_schedule(file: UploadFile = File(...), dpi: int = Query(200, description="Image resolution (150=cheaper, 200=balanced, 300=higher quality)")):
    """
    Upload and parse an exam schedule PDF.
    
    - **file**: PDF file to parse
    - **dpi**: Image resolution for parsing (default 200)
    
    Returns parsed exam schedules with token usage metrics.
    """
    return await process_exam_schedule_pdf(file, dpi=dpi)

@router.get("/exam-schedule")
async def get_exam_schedule(department: str = Query(..., description="Department name"), semester: str = Query(..., description="Semester")):
    return await get_exam_schedule_service(department, semester)

@router.post("/manual")
async def manual_insert_schedule(schedule: ExamSchedule = Body(...)):
    supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    response = upsert_exam_schedule(
        semester=schedule.semester,
        department=schedule.department,
        period=schedule.period,
        exams=[exam.dict() for exam in schedule.exams], # Convert Pydantic models to dicts
        supabase=supabase_client
    )
    if response:
        return {"success": True, "message": "Schedule inserted successfully", "data": response.data}
    else:
        return {"success": False, "message": "Failed to insert schedule"}

@router.post("/weekly-manual")
async def manual_insert_weekly_schedule(schedule: ClassSchedule = Body(...)):
    supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    response = upsert_class_schedule(
        department=schedule.department,
        semester=schedule.semester,
        academic_year=schedule.academic_year,
        period=schedule.period,
        courses=[course.dict() for course in schedule.courses],
        supabase=supabase_client
    )
    if response:
        return {"success": True, "message": "Weekly class schedule inserted successfully", "data": response.data}
    else:
        return {"success": False, "message": "Failed to insert weekly class schedule"}
