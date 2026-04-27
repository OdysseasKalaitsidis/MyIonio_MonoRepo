import os
import json
import logging
from io import BytesIO
from typing import List, Optional

import fitz  # PyMuPDF
from PIL import Image
try:
    from google import genai
    from google.genai import types
except ImportError:
    import google.generativeai as genai
    # Fallback or different import depending on version, but let's assume google-genai is installed as seen in gemini_parser.py
    
from dotenv import load_dotenv
from models.Menu import WeeklySchedule, DailyMenu, MenuItems

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Constants ---
MODEL_ID = "gemini-2.5-flash"

MENU_SCHEMA = types.Schema(
    type=types.Type.OBJECT,
    properties={
        "week_start": types.Schema(type=types.Type.STRING, description="YYYY-MM-DD", format="date"),
        "week_end": types.Schema(type=types.Type.STRING, description="YYYY-MM-DD", format="date"),
        "days": types.Schema(
            type=types.Type.ARRAY,
            items=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "date_iso": types.Schema(type=types.Type.STRING, description="YYYY-MM-DD"),
                    "day_name": types.Schema(type=types.Type.STRING, description="Greek Name (e.g. ΔΕΥΤΕΡΑ)"),
                    "lunch": types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "main_courses": types.Schema(type=types.Type.ARRAY, items=types.Schema(type=types.Type.STRING)),
                            "has_salad": types.Schema(type=types.Type.BOOLEAN),
                            "has_dessert": types.Schema(type=types.Type.BOOLEAN),
                            "notes": types.Schema(type=types.Type.STRING)
                        },
                        required=["main_courses", "has_salad", "has_dessert"]
                    ),
                    "dinner": types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "main_courses": types.Schema(type=types.Type.ARRAY, items=types.Schema(type=types.Type.STRING)),
                            "has_salad": types.Schema(type=types.Type.BOOLEAN),
                            "has_dessert": types.Schema(type=types.Type.BOOLEAN),
                            "notes": types.Schema(type=types.Type.STRING)
                        },
                        required=["main_courses", "has_salad", "has_dessert"]
                    )
                },
                required=["date_iso", "day_name", "lunch", "dinner"]
            )
        )
    },
    required=["week_start", "week_end", "days"]
)

MENU_PROMPT = """
Analyze the provided weekly menu images from the Ionian University student restaurant.

**TASKS:**
1. **Identify the Date Range**: Look for the week's dates (e.g., "17 έως 23-3-2025") usually at the top. Calculate the exact YYYY-MM-DD for each day (Monday to Sunday).
   - week_start: Monday's date
   - week_end: Sunday's date
2. **Extract Daily Menus**:
   - For each day (columns usually: ΔΕΥΤΕΡΑ, ΤΡΙΤΗ, etc.):
     - **Lunch (ΓΕΥΜΑ)**: Extract main dishes (remove numbering like 1., 2.).
     - **Dinner (ΔΕΙΠΝΟ)**: Extract main dishes.
     - **SideDishes**: Check rows for Salad (ΣΑΛΑΤΑ), Dessert (ΕΠΙΔΟΡΠΙΟ/ΦΡΟΥΤΟ). If "ΝΑΙ" or similar text is present, set true. Default to true if unsure as it's standard.
3. **Handle Gaps**: If a day has no food (e.g., weekends might differ), return empty lists or skip, but usually the menu covers 7 days.
4. **Translate/Clean**: Keep dish names in Greek.

**OUTPUT FORMAT**:
Return STRICT JSON matching the schema.
"""

def pdf_to_images(pdf_path: str, dpi: int = 200) -> List[Image.Image]:
    """Convert PDF to list of PIL Images."""
    logger.info(f"Converting PDF to images: {pdf_path}")
    images = []
    try:
        doc = fitz.open(pdf_path)
        zoom = dpi / 72.0
        mat = fitz.Matrix(zoom, zoom)
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            pix = page.get_pixmap(matrix=mat)
            img_data = pix.tobytes("png")
            images.append(Image.open(BytesIO(img_data)))
        doc.close()
        logger.info(f"Converted {len(images)} pages.")
        return images
    except Exception as e:
        logger.error(f"Error converting PDF to images: {e}")
        return []

def parse_menu(file_path: str, api_key: str = None) -> Optional[WeeklySchedule]:
    """
    Parses a menu from a PDF or image file using Gemini Vision.
    """
    valid_extensions = ('.pdf', '.png', '.jpg', '.jpeg', '.webp')
    if not file_path.lower().endswith(valid_extensions):
        raise ValueError(f"Invalid file format: {file_path}. Supported: {valid_extensions}")

    images = []
    # 1. Load Images (PDF or Image file)
    if file_path.lower().endswith('.pdf'):
        images = pdf_to_images(file_path)
        if not images:
            raise ValueError("Failed to convert PDF to images.")
    else:
        try:
            # Open image directly
            img = Image.open(file_path)
            images.append(img)
            logger.info(f"Loaded image file: {file_path}")
        except Exception as e:
             logger.error(f"Error opening image file: {e}")
             raise ValueError("Failed to open image file.")

    # 2. Configure Gemini Client
    final_api_key = api_key or os.getenv("GEMINI_API_KEY")
    if not final_api_key:
        raise ValueError("API Key is missing.")
    
    try:
        client = genai.Client(api_key=final_api_key)
        
        content_parts = []
        for img in images:
            img_bytes = BytesIO()
            img.save(img_bytes, format='PNG')
            img_bytes.seek(0)
            content_parts.append(types.Part.from_bytes(
                data=img_bytes.read(),
                mime_type="image/png"
            ))
        
        content_parts.append(MENU_PROMPT)

        logger.info(f"Sending {len(images)} images to Gemini ({MODEL_ID})...")
        
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=content_parts,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=MENU_SCHEMA,
                temperature=0.0
            )
        )
        
        raw_json = response.text
        data = json.loads(raw_json)
        
        return _map_json_to_objects(data)

    except Exception as e:
        logger.error(f"Error parsing menu with Gemini: {e}")
        # Only raise if it's critical, otherwise return None? 
        # The service expects a return or raises. Let's raise to be handled by service.
        raise e

def _map_json_to_objects(data) -> WeeklySchedule:
    # Handle if Gemini returns a list or a dict
    if isinstance(data, list):
        week = data[0]
    else:
        week = data

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
    print("Menu Parser (Vision) loaded.")