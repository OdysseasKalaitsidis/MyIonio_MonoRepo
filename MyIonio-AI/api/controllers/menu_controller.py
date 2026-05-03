from fastapi import APIRouter, UploadFile, File
from api.services.menu_service import process_menu_pdf

router = APIRouter()

@router.post("/upload-menu")
async def upload_menu(file: UploadFile = File(...)):
    return await process_menu_pdf(file)

from api.services.menu_service import insert_dummy_menu_service

@router.post("/dummy-menu")
async def dummy_menu():
    return await insert_dummy_menu_service()
