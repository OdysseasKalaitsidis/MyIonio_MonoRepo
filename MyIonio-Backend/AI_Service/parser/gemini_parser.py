import os
import json
from io import BytesIO
from dotenv import load_dotenv
from loguru import logger
from pathlib import Path
from typing import List, Union, Dict, Optional
from google import genai
from google.genai import types
import fitz  # PyMuPDF
from PIL import Image

load_dotenv()

# --- Token Tracking ---
class TokenMetrics:
    """Track token usage and costs for Gemini API calls"""
    
    # Pricing for Gemini 2.5 Flash (per 1M tokens)
    INPUT_COST_PER_1M = 0.075   # $0.075 per 1M input tokens
    OUTPUT_COST_PER_1M = 0.30   # $0.30 per 1M output tokens
    
    def __init__(self):
        self.input_tokens = 0
        self.output_tokens = 0
        self.total_requests = 0
    
    def add_usage(self, input_tokens: int, output_tokens: int):
        """Add token usage from a request"""
        self.input_tokens += input_tokens
        self.output_tokens += output_tokens
        self.total_requests += 1
    
    @property
    def total_tokens(self) -> int:
        """Total tokens used"""
        return self.input_tokens + self.output_tokens
    
    @property
    def input_cost(self) -> float:
        """Cost of input tokens in USD"""
        return (self.input_tokens / 1_000_000) * self.INPUT_COST_PER_1M
    
    @property
    def output_cost(self) -> float:
        """Cost of output tokens in USD"""
        return (self.output_tokens / 1_000_000) * self.OUTPUT_COST_PER_1M
    
    @property
    def total_cost(self) -> float:
        """Total cost in USD"""
        return self.input_cost + self.output_cost
    
    def get_summary(self) -> Dict[str, any]:
        """Get metrics summary"""
        return {
            "total_requests": self.total_requests,
            "input_tokens": self.input_tokens,
            "output_tokens": self.output_tokens,
            "total_tokens": self.total_tokens,
            "input_cost_usd": round(self.input_cost, 6),
            "output_cost_usd": round(self.output_cost, 6),
            "total_cost_usd": round(self.total_cost, 6),
            "avg_input_per_request": self.input_tokens // self.total_requests if self.total_requests > 0 else 0,
            "avg_output_per_request": self.output_tokens // self.total_requests if self.total_requests > 0 else 0,
        }
    
    def __str__(self) -> str:
        """Pretty print metrics"""
        s = self.get_summary()
        return (
            f"📊 Token Metrics:\n"
            f"  Requests: {s['total_requests']}\n"
            f"  Input: {s['input_tokens']:,} tokens (${s['input_cost_usd']:.6f})\n"
            f"  Output: {s['output_tokens']:,} tokens (${s['output_cost_usd']:.6f})\n"
            f"  Total: {s['total_tokens']:,} tokens (${s['total_cost_usd']:.6f})\n"
            f"  Avg/Request: {s['avg_input_per_request']:,} in / {s['avg_output_per_request']:,} out"
        )

# Global metrics tracker
_global_metrics = TokenMetrics()

# --- Configuration ---
API_KEY = os.getenv("GEMINI_API_KEY") 
MODEL_ID = "gemini-2.5-flash"  # Flash model for cost optimization 


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
            "building": types.Schema(type=types.Type.STRING),
            # Optional fields for Greek academic system
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

EXAM_LIST_SCHEMA = types.Schema(
    type=types.Type.ARRAY,
    items=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "course_name": types.Schema(type=types.Type.STRING),
            "date": types.Schema(type=types.Type.STRING, format="DD/MM/YYYY"),
            "time_start": types.Schema(type=types.Type.STRING, format="HH:MM"),
            "time_end": types.Schema(type=types.Type.STRING, format="HH:MM"),
            "room": types.Schema(type=types.Type.STRING),
            "professors": types.Schema(
                type=types.Type.ARRAY,
                items=types.Schema(type=types.Type.STRING)
            ),
        },
        required=["course_name", "date", "time_start", "time_end", "room", "professors"]
    )
)

EXAM_SCHEDULE_LIST_SCHEMA = types.Schema(
    type=types.Type.ARRAY,
    items=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "department": types.Schema(type=types.Type.STRING, description="Extracted department name (Translated to English)."),
            "semester": types.Schema(type=types.Type.STRING, description="Extracted semester (e.g. 'Α', 'Β')."),
            "academic_year": types.Schema(type=types.Type.STRING, description="Extracted academic year."),
            "period": types.Schema(type=types.Type.STRING, description="Exam period (e.g. 'January-February 2026')."),
            "exams": EXAM_LIST_SCHEMA
        },
        required=["department", "semester", "academic_year", "period", "exams"]
    )
)

# --- Optimized Prompts (shortened for cost reduction) ---
GENERIC_EXTRACTION_PROMPT = """
Extract ALL Greek university courses from this timetable into JSON.

CRITICAL RULES:
- **MERGE consecutive time slots** if they have the same course_name, professor, room, and building
  Example: If "Προγραμματισμός" runs 11:00-12:00 and 12:00-13:00 → merge to 11:00-13:00
- Extract department, semester (Α,Β,Γ,Δ,Ε,ΣΤ,Ζ,Η), academic_year
- Map days: "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή"
- Time format: HH:MM
- For each course, extract: course_name, professor, time_start, time_end, room, building

- Preserve all Greek text exactly as shown
"""

EXAM_SCHEDULE_PROMPT = """
Extract ALL Greek university EXAM schedules into JSON (may have multiple semesters - create SEPARATE list items).

REQUIREMENTS:
- Translate department name to English (e.g., "Τμήμα Πληροφορικής" → "Department of Informatics")
- Extract: semester, academic_year, period, all exams
- Date: DD/MM/YYYY, Time: HH:MM
- Professors: array of strings
- Preserve all Greek text (course names, professors)
"""

def pdf_to_images(pdf_path: str, dpi: int = 200) -> List[Image.Image]:
    """
    Convert PDF pages to PIL Images using PyMuPDF (fitz).
    
    No external dependencies required (poppler not needed!)
    
    Args:
        pdf_path: Path to the PDF file
        dpi: Resolution for conversion (default 200 for cost/quality balance)
    
    Returns:
        List of PIL Image objects
    """
    logger.info(f"Converting PDF to images: {pdf_path}")
    
    images = []
    # Open PDF with PyMuPDF
    doc = fitz.open(pdf_path)
    
    # Convert DPI to zoom factor (72 DPI is default in fitz)
    zoom = dpi / 72.0
    mat = fitz.Matrix(zoom, zoom)
    
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        # Render page to pixmap at specified DPI
        pix = page.get_pixmap(matrix=mat)
        
        # Convert pixmap to PIL Image
        img_data = pix.tobytes("png")
        img = Image.open(BytesIO(img_data))
        images.append(img)
        
        logger.debug(f"Converted page {page_num + 1}/{len(doc)}")
    
    doc.close()
    logger.info(f"Converted {len(images)} pages to images using PyMuPDF")
    return images


def parse_schedule_with_gemini(pdf_path: str, dpi: int = 200, track_metrics: bool = True) -> dict:
    """
    Parse class schedule from PDF using image-based extraction (COST OPTIMIZED).
    
    This approach:
    - Converts PDF to images locally
    - Passes images directly to model (no File API costs)
    - No upload/processing/deletion overhead
    - Faster and cheaper than File API
    
    Args:
        pdf_path: Path to the PDF schedule file
        dpi: Image resolution (default 200 balances cost vs quality)
        track_metrics: Whether to track token usage and costs (default True)
    
    Returns:
        Parsed schedule data as dict (with optional '_metrics' key if track_metrics=True)
    """
    if not API_KEY:
        logger.error("GEMINI_API_KEY is missing from environment variables.")
        return {}

    try:
        # Convert PDF to images (no upload needed!)
        logger.debug(f"Starting PDF to image conversion for: {pdf_path}")
        images = pdf_to_images(pdf_path, dpi=dpi)
        logger.debug(f"Successfully converted {len(images)} pages to images")
        
        # Initialize client
        client = genai.Client(api_key=API_KEY)
        
        # Build content parts: images + text prompt
        content_parts = []
        for idx, img in enumerate(images):
            # Convert PIL Image to bytes
            img_bytes = BytesIO()
            img.save(img_bytes, format='PNG')
            img_bytes.seek(0)
            content_parts.append(types.Part.from_bytes(
                data=img_bytes.read(),
                mime_type="image/png"
            ))
            logger.debug(f"Added image {idx + 1}/{len(images)} to content")
        
        content_parts.append(GENERIC_EXTRACTION_PROMPT)
        
        logger.info(f"Calling {MODEL_ID} with {len(images)} images...")
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=content_parts,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=SCHEDULE_SCHEMA, 
                temperature=0.0
            )
        )

        raw_json = response.text
        logger.debug(f"Received response from Gemini (length: {len(raw_json)} chars)")
        
        parsed_data = json.loads(raw_json)
        logger.debug(f"Successfully parsed JSON response with keys: {list(parsed_data.keys())}")
        
        # Track token usage
        if track_metrics and hasattr(response, 'usage_metadata'):
            usage = response.usage_metadata
            input_tokens = usage.prompt_token_count if hasattr(usage, 'prompt_token_count') else 0
            output_tokens = usage.candidates_token_count if hasattr(usage, 'candidates_token_count') else 0
            
            _global_metrics.add_usage(input_tokens, output_tokens)
            
            metrics = {
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "total_tokens": input_tokens + output_tokens,
                "input_cost_usd": round((input_tokens / 1_000_000) * TokenMetrics.INPUT_COST_PER_1M, 6),
                "output_cost_usd": round((output_tokens / 1_000_000) * TokenMetrics.OUTPUT_COST_PER_1M, 6),
                "total_cost_usd": round(
                    (input_tokens / 1_000_000) * TokenMetrics.INPUT_COST_PER_1M +
                    (output_tokens / 1_000_000) * TokenMetrics.OUTPUT_COST_PER_1M, 6
                )
            }
            parsed_data['_metrics'] = metrics
            
            logger.info(
                f"✅ Tokens: {input_tokens:,} input / {output_tokens:,} output "
                f"(${metrics['total_cost_usd']:.6f})"
            )
        
        logger.info("Successfully parsed schedule data")
        return parsed_data

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON response from Gemini: {e}")
        logger.error(f"Raw response: {raw_json if 'raw_json' in locals() else 'N/A'}")
        return {}
    except Exception as e:
        logger.exception(f"Error in parse_schedule_with_gemini: {e}")
        logger.error(f"Error type: {type(e).__name__}")
        logger.error(f"Error details: {str(e)}")
        return {}


def parse_exam_schedule_with_gemini(pdf_path: str, dpi: int = 200, track_metrics: bool = True) -> list:
    """
    Parse exam schedule from PDF using image-based extraction (COST OPTIMIZED).
    
    Args:
        pdf_path: Path to the PDF exam schedule file
        dpi: Image resolution (default 200 balances cost vs quality)
        track_metrics: Whether to track token usage and costs (default True)
    
    Returns:
        Parsed exam schedules as list of dicts (with optional '_metrics' key if track_metrics=True)
    """
    if not API_KEY:
        logger.error("GEMINI_API_KEY is missing from environment variables.")
        return []

    try:
        # Convert PDF to images (no File API needed!)
        images = pdf_to_images(pdf_path, dpi=dpi)
        
        # Initialize client
        client = genai.Client(api_key=API_KEY)
        
        # Build content parts: images + text prompt
        content_parts = []
        for idx, img in enumerate(images):
            img_bytes = BytesIO()
            img.save(img_bytes, format='PNG')
            img_bytes.seek(0)
            content_parts.append(types.Part.from_bytes(
                data=img_bytes.read(),
                mime_type="image/png"
            ))
            logger.debug(f"Added exam image {idx + 1}/{len(images)} to content")
        
        content_parts.append(EXAM_SCHEDULE_PROMPT)
        
        logger.info(f"Calling {MODEL_ID} with {len(images)} images for EXAMS...")
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=content_parts,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=EXAM_SCHEDULE_LIST_SCHEMA, 
                temperature=0.0
            )
        )

        raw_json = response.text
        parsed_data = json.loads(raw_json)
        
        # Track token usage
        if track_metrics and hasattr(response, 'usage_metadata'):
            usage = response.usage_metadata
            input_tokens = usage.prompt_token_count if hasattr(usage, 'prompt_token_count') else 0
            output_tokens = usage.candidates_token_count if hasattr(usage, 'candidates_token_count') else 0
            
            _global_metrics.add_usage(input_tokens, output_tokens)
            
            metrics = {
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "total_tokens": input_tokens + output_tokens,
                "input_cost_usd": round((input_tokens / 1_000_000) * TokenMetrics.INPUT_COST_PER_1M, 6),
                "output_cost_usd": round((output_tokens / 1_000_000) * TokenMetrics.OUTPUT_COST_PER_1M, 6),
                "total_cost_usd": round(
                    (input_tokens / 1_000_000) * TokenMetrics.INPUT_COST_PER_1M +
                    (output_tokens / 1_000_000) * TokenMetrics.OUTPUT_COST_PER_1M, 6
                )
            }
            
            # Add metrics to result (create wrapper object)
            result_with_metrics = {
                "schedules": parsed_data,
                "_metrics": metrics
            }
            
            logger.info(
                f"✅ Tokens: {input_tokens:,} input / {output_tokens:,} output "
                f"(${metrics['total_cost_usd']:.6f})"
            )
            
            logger.info("Successfully parsed exam schedule data")
            return result_with_metrics
        
        logger.info("Successfully parsed exam schedule data")
        return parsed_data

    except Exception as e:
        logger.exception(f"Error in parse_exam_schedule_with_gemini: {e}")
        return []


def get_global_metrics() -> TokenMetrics:
    """Get the global token metrics tracker"""
    return _global_metrics


def reset_global_metrics():
    """Reset the global metrics tracker"""
    global _global_metrics
    _global_metrics = TokenMetrics()
    logger.info("🔄 Global metrics reset")

if __name__ == "__main__":
    print("Parser loaded. Import this function to use it.")