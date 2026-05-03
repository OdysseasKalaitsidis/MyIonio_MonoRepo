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
MODEL_ID = "gemini-2.0-flash" 


COURSE_LIST_SCHEMA = types.Schema(
    type=types.Type.ARRAY,
    items=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "course_name": types.Schema(type=types.Type.STRING),
            "professor": types.Schema(type=types.Type.STRING),
            "time_start": types.Schema(type=types.Type.STRING, format="HH:MM", description="Start time in 24h format"),
            "time_end": types.Schema(type=types.Type.STRING, format="HH:MM", description="End time in 24h format"),
            "room": types.Schema(type=types.Type.STRING),
            "building": types.Schema(type=types.Type.STRING),
            "type": types.Schema(type=types.Type.STRING, description="Type of class: 'Θεωρία', 'Εργαστήριο', 'Φροντιστήριο', or 'Σεμινάριο'")
        },
        required=["course_name", "professor", "time_start", "time_end", "room", "building", "type"]
    )
)

SCHEDULE_SCHEMA = types.Schema(
    type=types.Type.OBJECT,
    properties={
        "department": types.Schema(type=types.Type.STRING, description="Standardized department name."),
        "semester": types.Schema(type=types.Type.STRING, description="Standardized semester letter: Α,Β,Γ,Δ,Ε,Ζ,Η,ΣΤ"),
        "academic_year": types.Schema(type=types.Type.STRING, description="e.g., 2024-2025"),
        
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
You are an advanced academic document parser for Greek Universities.
TASK: Extract EVERY course from the provided timetable into structured JSON.

CRITICAL RULES:
1. COURSE TYPE: Identify if a course is a Theory (Θεωρία), Laboratory (Εργαστήριο), or Tutorial (Φροντιστήριο). If unclear, default to 'Θεωρία'.
2. SEMESTER: Map any semester indicator (e.g., '1ο', 'A', '1st', 'Winter') to its corresponding Greek Letter (Α, Β, Γ, Δ, Ε, ΣΤ, Ζ, Η).
3. TIME SLOTS: Preserve exact hours. If a course spans multiple hours (e.g., 09:00-12:00), create ONE entry with the full start/end time.
4. GREEK LANGUAGE: Use Greek characters for all text fields except time.
5. NO DUPLICATES: Ensure each unique class session is captured exactly once.

DEPARTMENT CONTEXT: {dept_context}
"""

def parse_schedule_with_gemini(pdf_path: str, dept_context: str = "Standard Greek University Timetable") -> dict:
    
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
        prompt = GENERIC_EXTRACTION_PROMPT.format(dept_context=dept_context)
        
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=[
                uploaded_file,
                prompt
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