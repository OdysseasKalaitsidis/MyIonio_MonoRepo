from fastapi import APIRouter, UploadFile, File
from api.services.schedule_service import process_schedule_pdf

router = APIRouter()

@router.post("/upload-schedule")
async def upload_schedule(file: UploadFile = File(...)):
    return await process_schedule_pdf(file)
