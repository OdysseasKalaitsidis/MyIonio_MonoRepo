import json
import os
import tempfile
from pathlib import Path
from fastapi import UploadFile
from loguru import logger
from dotenv import load_dotenv
from db.supabase_client import create_client, upsert_schedule, upsert_exam_schedule, upsert_class_schedule, get_exam_schedule
from parser.gemini_parser import parse_schedule_with_gemini, parse_exam_schedule_with_gemini

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# --- Helper Functions ---
def load_course_metadata() -> dict:
    """Load course metadata from major_minor_electives.json"""
    try:
        # Get absolute path relative to project root (assuming this file is in api/services)
        # We need to go up from api/services to project root
        project_root = Path(__file__).resolve().parent.parent.parent
        json_path = project_root / "major_minor_electives.json"
        
        if not json_path.exists():
            logger.warning(f"Metadata file not found at {json_path}")
            logger.warning(f"Current working dir: {os.getcwd()}")
            return {}
            
        logger.info(f"Loading metadata from {json_path}")
        with open(json_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Failed to load course metadata: {e}")
        return {}

def normalize_greek(text: str) -> str:
    """Normalize Greek text for comparison (remove accents, lowercase)"""
    if not text: 
        return ""
    
    # Simple normalization mapping
    replacements = {
        'ά': 'α', 'έ': 'ε', 'ή': 'η', 'ί': 'ι', 'ό': 'ο', 'ύ': 'υ', 'ώ': 'ω',
        'Ά': 'α', 'Έ': 'ε', 'Ή': 'η', 'Ί': 'ι', 'Ό': 'ο', 'Ύ': 'υ', 'Ώ': 'ω',
        'ϊ': 'ι', 'ϋ': 'υ', 'ΐ': 'ι', 'ΰ': 'υ',
        'Α': 'α', 'Β': 'β', 'Γ': 'γ', 'Δ': 'δ', 'Ε': 'ε', 'Ζ': 'ζ', 'Η': 'η', 'Θ': 'θ',
        'Ι': 'ι', 'Κ': 'κ', 'Λ': 'λ', 'Μ': 'μ', 'Ν': 'ν', 'Ξ': 'ξ', 'Ο': 'ο', 'Π': 'π',
        'Ρ': 'ρ', 'Σ': 'σ', 'Τ': 'τ', 'Υ': 'υ', 'Φ': 'φ', 'Χ': 'χ', 'Ψ': 'ψ', 'Ω': 'ω',
        'ς': 'σ'
    }
    
    normalized = text.lower()
    for char, repl in replacements.items():
        normalized = normalized.replace(char, repl)
        
    return normalized.strip()

def enrich_schedule_with_metadata(schedule_data: dict, metadata: dict) -> dict:
    """
    Enrich parsed schedule with course types from metadata.
    Matches courses by name (fuzzy/normalized match) and adds 'type' field.
    """
    if not metadata or not schedule_data:
        return schedule_data
        
    # Map semester from PDF to JSON key
    # PDF usually returns Greek numerals like "ΣΤ", "Δ", etc.
    semester_map = {
        "Α": "Semester_A", "1": "Semester_A",
        "Β": "Semester_B", "2": "Semester_B",
        "Γ": "Semester_C", "3": "Semester_C",
        "Δ": "Semester_D", "4": "Semester_D",
        "Ε": "Semester_E", "5": "Semester_E",
        "ΣΤ": "Semester_ST", "6": "Semester_ST",
        "Ζ": "Semester_Z", "7": "Semester_Z",
        "Η": "Semester_H", "8": "Semester_H",
    }
    
    pdf_semester = schedule_data.get("semester", "").replace("΄", "").strip() # Remove tonus if present
    json_semester_key = semester_map.get(pdf_semester)
    
    if not json_semester_key:
        logger.warning(f"Could not map PDF semester '{pdf_semester}' to JSON keys")
        return schedule_data
        
    semester_data = metadata.get("curriculum_by_semester", {}).get(json_semester_key, {})
    if not semester_data:
        logger.warning(f"No metadata found for {json_semester_key}")
        return schedule_data
        
    # Build a lookup table from JSON: Normalized Name -> Type
    course_type_lookup = {}
    
    # helper to process category lists
    def process_category(category_key):
        items = semester_data.get(category_key, [])
        for item in items:
            name = item.get("course", "")
            if name:
                norm_name = normalize_greek(name)
                course_type_lookup[norm_name] = item.get("type", "")
                
    process_category("Major_Courses")
    process_category("Electives")
    process_category("Toolbox")
    
    logger.info(f"Built lookup table with {len(course_type_lookup)} courses for {json_semester_key}")
    
    # Iterate through schedule and enrich
    enriched_count = 0
    schedule_by_day = schedule_data.get("schedule_by_day", {})
    
    for day, courses in schedule_by_day.items():
        for course in courses:
            course_name = course.get("course_name", "")
            norm_name = normalize_greek(course_name)
            
            # Try exact match first
            course_type = course_type_lookup.get(norm_name)
            
            # If not found, try simple containment (e.g. if PDF has "Lesson I" and JSON has "Lesson")
            if not course_type:
                for lookup_name, type_val in course_type_lookup.items():
                    if lookup_name in norm_name or norm_name in lookup_name:
                         # meaningful overlap (>50% length match? simple check for now)
                         if len(lookup_name) > 5 and len(norm_name) > 5:
                             course_type = type_val
                             break
            
            if course_type:
                course["type"] = course_type
                enriched_count += 1
            else:
                course["type"] = "" # explicit empty string if not found
                
    logger.info(f"Enriched {enriched_count} courses with type information")
    return schedule_data

async def process_schedule_pdf(file: UploadFile, dpi: int = 200):
    """
    Process uploaded class schedule PDF using optimized PyMuPDF parser.
    
    Args:
        file: Uploaded PDF file
        dpi: Image resolution for PDF conversion (default 200, lower=cheaper, higher=better quality)
    
    Returns:
        Dict with success status, parsed data, metrics, and database response
    """
    supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    tmp_path = None
    
    try:
        # Save uploaded file to temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name
        
        logger.info(f"Saved uploaded PDF to {tmp_path}")
        
        # Validate API key is configured
        import os
        if not os.getenv("GEMINI_API_KEY"):
            logger.error("❌ GEMINI_API_KEY not found in environment variables")
            return {
                "success": False,
                "message": "Gemini API key not configured - check .env file",
                "metrics": None,
                "debug_info": {"error": "GEMINI_API_KEY missing from environment"}
            }

        # Parse PDF with Gemini (includes token metrics)
        logger.info(f"Parsing PDF with Gemini 2.5 Flash (DPI={dpi})...")
        
        parsed_schedule = parse_schedule_with_gemini(tmp_path, dpi=dpi, track_metrics=True)
        
        # Extract metrics if present (handle empty responses safely)
        metrics = None
        if isinstance(parsed_schedule, dict):
            metrics = parsed_schedule.pop("_metrics", None)
        else:
            logger.error(f"Parser returned unexpected type: {type(parsed_schedule)}")
            return {
                "success": False,
                "message": f"Parser returned invalid data type: {type(parsed_schedule).__name__}",
                "metrics": None
            }
        
        if metrics:
            logger.info(
                f"✅ Parsing Cost: ${metrics['total_cost_usd']:.6f} "
                f"({metrics['input_tokens']:,} in / {metrics['output_tokens']:,} out)"
            )
        else:
            logger.warning("⚠️  No metrics returned from parser")
        
        # Log the raw parsed data for debugging
        logger.info(f"📋 Parsed schedule keys: {list(parsed_schedule.keys()) if parsed_schedule else 'EMPTY'}")
        
        # Validate parser output
        if not parsed_schedule:
            logger.error("❌ Parser returned empty dictionary")
            return {
                "success": False, 
                "message": "Gemini returned empty schedule - check API key and PDF format",
                "metrics": metrics,
                "debug_info": {
                    "parsed_data_type": type(parsed_schedule).__name__,
                    "is_empty": True
                }
            }
        
        if not parsed_schedule.get("schedule_by_day"):
            logger.error(f"❌ Missing schedule_by_day field. Available keys: {list(parsed_schedule.keys())}")
            return {
                "success": False, 
                "message": "Gemini returned schedule without course data",
                "metrics": metrics,
                "debug_info": {
                    "available_keys": list(parsed_schedule.keys()),
                    "has_schedule_by_day": False
                }
            }
            
        logger.info(f"Gemini parsed output preview: {list(parsed_schedule.keys())}")

        # Extract metadata
        department = parsed_schedule.get("department", "Unknown Department")
        semester = parsed_schedule.get("semester", "Unknown Semester")
        academic_year = parsed_schedule.get("academic_year", "Unknown Year")
        
        # --- Enrichment Step ---
        try:
            metadata = load_course_metadata()
            if metadata:
                parsed_schedule = enrich_schedule_with_metadata(parsed_schedule, metadata)
            else:
                logger.warning("Skipping enrichment: No metadata loaded")
        except Exception as e:
            logger.error(f"Enrichment failed: {e}")
            # Continue without enrichment rather than failing the whole request
        
        # Flatten courses with day information
        all_courses = []
        import uuid
        
        for day, courses in parsed_schedule.get("schedule_by_day", {}).items():
            for course in courses:
                # Generate deterministic ID
                course_name = course.get("course_name", "")
                time_start = course.get("time_start", "")
                # Include day and time_start so each slot gets a unique ID even for the same course
                unique_string = f"{department}_{semester}_{course_name}_{day}_{time_start}".replace(" ", "").lower()
                course_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, unique_string))
                
                all_courses.append({
                    **course,
                    "day": day,
                    "id": course_id
                })
        
        logger.info(f"Extracted {len(all_courses)} total course entries")
        
        # Log full parsed output for debugging
        if parsed_schedule:
            logger.info("=" * 50)
            logger.info("GEMINI PARSED OUTPUT (PREVIEW):")
            logger.info("\n" + json.dumps(parsed_schedule, indent=2, ensure_ascii=False))
            logger.info("=" * 50)

        # Store in database using class_schedules table
        db_response = upsert_class_schedule(
            department=department,
            semester=semester,
            academic_year=academic_year,
            period="Regular",  # Default period - could be extracted from PDF if needed
            courses=all_courses,
            supabase=supabase_client
        )
        
        if db_response is None:
            return {
                "success": False, 
                "message": "Failed to upsert schedule into database",
                "metrics": metrics
            }

        # Return comprehensive response
        return {
            "success": True,
            "message": f"Successfully parsed and stored {len(all_courses)} courses",
            "data": {
                "department": department,
                "semester": semester,
                "academic_year": academic_year,
                "courses_count": len(all_courses),
                "db_response": db_response.data
            },
            "metrics": metrics,  # Include parsing cost info
            "schedule_preview": parsed_schedule
        }

    except Exception as e:
        logger.exception("Unexpected error in process_schedule_pdf")
        return {
            "success": False, 
            "message": f"Unexpected error: {str(e)}",
            "error_type": type(e).__name__
        }
        
    finally:
        # Clean up temporary file
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
                logger.info(f"Cleaned up temporary local file: {tmp_path}")
            except Exception as e:
                logger.warning(f"Failed to delete local temp file {tmp_path}: {e}")

async def process_exam_schedule_pdf(file: UploadFile, dpi: int = 200):
    """
    Process uploaded exam schedule PDF using optimized PyMuPDF parser.
    
    Args:
        file: Uploaded PDF file
        dpi: Image resolution for PDF conversion (default 200)
    
    Returns:
        Dict with success status, parsed schedules, metrics, and database responses
    """
    supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    tmp_path = None
    
    try:
        # Save uploaded file to temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name
        
        logger.info(f"Saved uploaded Exam PDF to {tmp_path}")

        # Parse PDF with Gemini
        logger.info(f"Parsing Exam PDF with Gemini 2.5 Flash (DPI={dpi})...")
        
        parsed_schedules = parse_exam_schedule_with_gemini(tmp_path, dpi=dpi, track_metrics=True)
        
        # Handle metrics wrapper if present
        metrics = None
        if isinstance(parsed_schedules, dict) and "schedules" in parsed_schedules and "_metrics" in parsed_schedules:
            metrics = parsed_schedules.get("_metrics", {})
            logger.info(
                f"✅ Exam Parsing Cost: ${metrics.get('total_cost_usd', 0):.6f} "
                f"({metrics.get('input_tokens', 0):,} in / {metrics.get('output_tokens', 0):,} out)"
            )
            parsed_schedules = parsed_schedules["schedules"]
        
        # Handle both list and single dict (backward compatibility/safety)
        if isinstance(parsed_schedules, dict):
             parsed_schedules = [parsed_schedules]

        if not parsed_schedules:
            return {
                "success": False, 
                "message": "Gemini returned empty or invalid exam schedule",
                "metrics": metrics
            }
            
        logger.info(f"Gemini parsed {len(parsed_schedules)} schedule(s)")
        
        results = []
        total_exams = 0
        
        for parsed_schedule in parsed_schedules:
            if not parsed_schedule.get("exams"):
                continue

            department = parsed_schedule.get("department", "Unknown Department")
            semester = parsed_schedule.get("semester", "Unknown Semester")
            period = parsed_schedule.get("period", "Unknown Period")
            
            exams = parsed_schedule.get("exams", [])
            total_exams += len(exams)
            
            logger.info(f"Processing schedule for {department} - {semester}: {len(exams)} exams")

            db_response = upsert_exam_schedule(
                semester=semester,
                department=department,
                period=period,
                exams=exams,
                supabase=supabase_client
            )
            
            if db_response:
                results.append({
                    "department": department,
                    "semester": semester,
                    "period": period,
                    "exams_count": len(exams),
                    "status": "success"
                })
            else:
                 results.append({
                    "department": department,
                    "semester": semester,
                    "exams_count": len(exams),
                    "status": "failed"
                })
        
        return {
            "success": True,
            "message": f"Successfully processed {len(results)} schedule(s) with {total_exams} total exams",
            "data": {
                "schedules_processed": len(results),
                "total_exams": total_exams,
                "results": results
            },
            "metrics": metrics
        }

    except Exception as e:
        logger.exception("Unexpected error in process_exam_schedule_pdf")
        return {
            "success": False, 
            "message": f"Unexpected error: {str(e)}",
            "error_type": type(e).__name__
        }
        
    finally:
        # Clean up temporary file
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
                logger.info(f"Cleaned up temporary local file: {tmp_path}")
            except Exception as e:
                logger.warning(f"Failed to delete local temp file {tmp_path}: {e}")

async def get_exam_schedule_service(department: str, semester: str):
    supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    response = get_exam_schedule(department, semester, supabase_client)
    
    if response and response.data:
        # Assuming we want to return the most recently updated one or just the list
        # If the user expects a single schedule, we might grab the first one.
        # But let's return all matching for now.
        return {"success": True, "data": response.data}
    elif response and not response.data:
        return {"success": True, "data": [], "message": "No exams found for this department/semester"}
    else:
        return {"success": False, "message": "Failed to fetch exam schedule"}
