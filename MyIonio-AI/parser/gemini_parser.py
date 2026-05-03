import os
import json
import time
from dotenv import load_dotenv
from loguru import logger
from pathlib import Path
from google import genai
from google.genai import types

load_dotenv()

# --- Configuration ---
API_KEY = os.getenv("GEMINI_API_KEY") 
MODEL_ID = "gemini-2.5-flash" 


COURSE_LIST_SCHEMA = types.Schema(
    type=types.Type.ARRAY,
    items=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "course_name": types.Schema(type=types.Type.STRING),
            "professor": types.Schema(type=types.Type.STRING),
            "time_start": types.Schema(type=types.Type.STRING, format="HH:MM"),
            "time_end": types.Schema(type=types.Type.STRING, format="HH:MM"),
            "room": types.Schema(type=types.Type.STRING),
            "building": types.Schema(type=types.Type.STRING)
        },
        required=["course_name", "professor", "time_start", "time_end", "room", "building"]
    )
)

SCHEDULE_SCHEMA = types.Schema(
    type=types.Type.OBJECT,
    properties={
        "department": types.Schema(type=types.Type.STRING, description="Extracted department name."),
        "semester": types.Schema(type=types.Type.STRING, description="Extracted semester."),
        "academic_year": types.Schema(type=types.Type.STRING, description="Extracted academic year."),
        
        "schedule_by_day": types.Schema(
            type=types.Type.OBJECT,
            properties={
                "Δευτέρα": COURSE_LIST_SCHEMA,
                "Τρίτη": COURSE_LIST_SCHEMA,
                "Τετάρτη": COURSE_LIST_SCHEMA,
                "Πέμπτη": COURSE_LIST_SCHEMA,
                "Παρασκευή": COURSE_LIST_SCHEMA,
            },
        )
    },
    required=["department", "semester", "academic_year", "schedule_by_day"]
)

# --- Prompt ---
GENERIC_EXTRACTION_PROMPT = """
You are an expert at extracting Greek university weekly course schedules from timetable PDFs.

TASK: Extract ALL courses from the provided document into structured JSON.
Crucial Rule: DO NOT merge consecutive time slots - keep each hour as a separate entry.

EXPECTED TABLE STRUCTURE:
- First column: Time slots (e.g., "09:00-10:00")
- Remaining columns: Days of the week.

OUTPUT REQUIREMENTS:
- Use the STRICT JSON Schema provided.
- Map columns to these exact keys: "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή".
- Extract EVERY course visible.
- Preserve all Greek characters exactly as shown.
- Time must be HH:MM format.
- The semester must refer to a greek letter Α,Β,Γ,Δ,Ε,Ζ,Η,ΣΤ,Ε
"""

def parse_schedule_with_gemini(pdf_path: str) -> dict:
    
    if not API_KEY:
        logger.error("GEMINI_API_KEY is missing from environment variables.")
        return {}

    client = None
    uploaded_file = None

    try:
        client = genai.Client(api_key=API_KEY)
        
        logger.info(f"Uploading {pdf_path} to Gemini Files API...")
        uploaded_file = client.files.upload(file=pdf_path)
        logger.info(f"File uploaded successfully: {uploaded_file.name}")

        while uploaded_file.state.name == "PROCESSING":
            time.sleep(1)
            uploaded_file = client.files.get(name=uploaded_file.name)

        if uploaded_file.state.name == "FAILED":
            raise ValueError("File processing failed on Gemini server.")

        logger.info(f"Calling {MODEL_ID} with structured output schema...")
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=[
                uploaded_file,
                GENERIC_EXTRACTION_PROMPT
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=SCHEDULE_SCHEMA, 
                temperature=0.0
            )
        )

        raw_json = response.text
        parsed_data = json.loads(raw_json)
        
        return parsed_data

    except Exception as e:
        logger.exception(f"Error in parse_schedule_with_gemini: {e}")
        return {}
        
    finally:
        if client and uploaded_file:
            try:
                client.files.delete(name=uploaded_file.name)
                logger.info(f"Deleted remote file: {uploaded_file.name}")
            except Exception as e:
                logger.warning(f"Failed to delete remote file: {e}")

if __name__ == "__main__":
    print("Parser loaded. Import this function to use it.")