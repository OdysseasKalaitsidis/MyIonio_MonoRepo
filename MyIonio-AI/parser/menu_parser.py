import os
import json
import logging
import pypdf
import google.generativeai as genai
from typing import Optional
from models.Menu import WeeklySchedule, DailyMenu, MenuItems


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def parse_menu_from_pdf(file_path: str, api_key: str = None, model_name: str = "gemini-2.5-flash") -> WeeklySchedule:
    """
    Main entry point. Extracts text from a .pdf file and parses it using Gemini.
    
    Args:
        file_path: Path to the .pdf file.
        api_key: Google API Key.
        model_name: Gemini model version.
    """
    # 0. Validate File Type
    if not file_path.lower().endswith('.pdf'):
        raise ValueError(f"Invalid file format: {file_path}. Please provide a .pdf file.")

    # 1. Extract raw text from the PDF
    logger.info(f"Extracting text from: {file_path}")
    raw_text = _extract_text_from_pdf(file_path)
    
    if not raw_text or len(raw_text.strip()) < 10:
        raise ValueError("Failed to extract text from PDF. The file might be empty, password protected, or a scanned image (needs OCR).")

    # 2. Configure Gemini
    final_api_key = api_key or os.getenv("GEMINI_API_KEY")
    if not final_api_key:
        raise ValueError("API Key is missing. Set GOOGLE_API_KEY environment variable.")
    
    genai.configure(api_key=final_api_key)
    model = genai.GenerativeModel(
        model_name=model_name,
        generation_config={"response_mime_type": "application/json"}
    )

    # 3. Generate & Parse
    logger.info("Sending text to Gemini for parsing...")
    prompt = _build_specific_prompt(raw_text)
    
    try:
        response = model.generate_content(prompt)
        data = json.loads(response.text)
        return _map_json_to_objects(data)
    except Exception as e:
        logger.error(f"Error parsing with Gemini: {e}")
        raise e

def _extract_text_from_pdf(file_path: str) -> str:
    """
    Extracts text from a PDF file using pypdf.
    """
    text_content = []
    try:
        reader = pypdf.PdfReader(file_path)
        
        # Check if encrypted
        if reader.is_encrypted:
            logger.warning("PDF is encrypted. Attempting to read without password (works for some permissions)...")
            try:
                reader.decrypt("")
            except:
                raise ValueError("PDF is password protected and cannot be read.")

        number_of_pages = len(reader.pages)
        logger.info(f"PDF has {number_of_pages} pages.")

        for i, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                text_content.append(page_text)
            else:
                logger.warning(f"Page {i+1} yielded no text (might be an image).")
        
        return "\n".join(text_content)

    except FileNotFoundError:
        raise FileNotFoundError(f"The file {file_path} was not found.")
    except Exception as e:
        raise ValueError(f"Could not parse PDF. Error: {e}")

def _build_specific_prompt(raw_text: str) -> str:
    return f"""
    You are a specialized data extractor for the Ionian University Menu. 
    Analyze the raw text below, which was extracted from a PDF document.
    
    **NOTE ON PDF ARTIFACTS:** PDF extraction often results in merged columns or headers appearing in odd places. 
    Look for patterns like "MONDAY", "TUESDAY", or dates to orient yourself.

    RAW TEXT:
    {raw_text}

    DOCUMENT STRUCTURE KNOWLEDGE:
    1. The document is divided into two main sections: "ΓΕΥΜΑ" (Lunch) and "ΔΕΙΠΝΟ" (Dinner).
    2. Each section has a header row with days: "ΔΕΥΤΕΡΑ", "ΤΡΙΤΗ", "ΤΕΤΑΡΤΗ", etc.
    3. Below the days, there is a row usually labeled "ΚΥΡΙΩΣ ΠΙΑΤΟ" (Main Course). This contains the numbered list of dishes.
    4. Below the main course, there are rows for "ΠΡΩΤΟ ΠΙΑΤΟ" (Starter), "ΣΑΛΑΤΑ" (Salad), "ΕΠΙΔΟΡΠΙΟ" (Dessert).
    5. In these side-dish rows, the word "ΝΑΙ" (Yes) usually indicates availability.

    INSTRUCTIONS:
    1. **Dates**: Find the date range in the header (e.g., "17 έως 23-3-2025") and calculate the exact YYYY-MM-DD for each day (Monday to Sunday).
    2. **Dishes**: Extract the list of main courses for each day. Remove the numbering (1., 2.) and clean the text.
    3. **Sides**: 
       - If you see "ΝΑΙ" or "Επιλογή" under Salad/Starter/Dessert columns, set the corresponding boolean to true.
       - Default to true if uncertain, as this is a university cafeteria.
    4. **Formatting**: Return STRICT JSON matching the schema below.

    JSON SCHEMA:
    {{
      "week_start": "YYYY-MM-DD",
      "week_end": "YYYY-MM-DD",
      "days": [
        {{
          "date_iso": "YYYY-MM-DD",
          "day_name": "Greek Name (e.g. ΔΕΥΤΕΡΑ)",
          "lunch": {{ 
            "main_courses": ["Dish 1", "Dish 2"], 
            "has_salad": boolean, 
            "has_dessert": boolean 
          }},
          "dinner": {{ 
            "main_courses": ["Dish 1", "Dish 2"], 
            "has_salad": boolean, 
            "has_dessert": boolean 
          }}
        }}
      ]
    }}
    """

def _map_json_to_objects(data) -> WeeklySchedule:
    if isinstance(data, dict):
        data = [data]

    week = data[0] 
    days_objects = []

    for d in week.get("days", []):
        lunch_data = d.get("lunch", {})
        dinner_data = d.get("dinner", {})

        day_menu = DailyMenu(
            date_iso=d.get("date_iso"),
            day_name=d.get("day_name"),
            lunch=MenuItems(
                main_courses=lunch_data.get("main_courses", []),
                has_salad=lunch_data.get("has_salad", True),
                has_dessert=lunch_data.get("has_dessert", True),
                notes=lunch_data.get("notes", "")
            ),
            dinner=MenuItems(
                main_courses=dinner_data.get("main_courses", []),
                has_salad=dinner_data.get("has_salad", True),
                has_dessert=dinner_data.get("has_dessert", True),
                notes=dinner_data.get("notes", "")
            )
        )
        days_objects.append(day_menu)

    return WeeklySchedule(
        week_start=week.get("week_start"),
        week_end=week.get("week_end"),
        days=days_objects
    )


if __name__ == "__main__":
       print("Parser loaded. Import this function to use it.")