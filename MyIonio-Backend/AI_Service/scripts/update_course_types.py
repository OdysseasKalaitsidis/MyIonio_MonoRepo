import os
import json
import sys
from pathlib import Path

# Add project root to python path to allow imports
project_root = Path(__file__).resolve().parent.parent
sys.path.append(str(project_root))

from dotenv import load_dotenv
from loguru import logger
from db.supabase_client import create_client, get_all_class_schedules, upsert_class_schedule

# Load environment variables
load_dotenv(project_root / ".env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    logger.error("Supabase credentials not found in .env file or environment variables")
    # For local dev, maybe try loading from .env in AI_Service root explicitly if needed
    # But load_dotenv above should handle it if path is correct.

def load_course_types(json_path):
    """
    Loads the course types from the JSON file and returns a mapping of course_name -> type.
    """
    if not json_path.exists():
        logger.error(f"File not found: {json_path}")
        return {}

    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        logger.error(f"Error loading JSON: {e}")
        return {}

    course_types = {}
    
    curriculum = data.get("curriculum_by_semester", {})
    
    for semester_key, semester_data in curriculum.items():
        # Iterate over all categories (Core_Courses, Toolbox_Options, Major_Courses, Electives, Toolbox)
        for category, courses in semester_data.items():
            if isinstance(courses, list):
                for course in courses:
                    name = course.get("course")
                    c_type = course.get("type")
                    if name and c_type:
                        course_types[name] = c_type
    return course_types

def main():
    logger.info("Starting course type update process...")
    
    # 1. Load course types mapping
    json_path = project_root / "major_minor_electives.json"
    logger.info(f"Loading course types from: {json_path}")
    course_type_map = load_course_types(json_path)
    
    if not course_type_map:
        logger.error("No course types loaded. Exiting.")
        sys.exit(1)
        
    logger.info(f"Loaded {len(course_type_map)} course type mappings.")
    
    # 2. Initialize Supabase client
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    except Exception as e:
        logger.error(f"Failed to create Supabase client: {e}")
        sys.exit(1)
    
    # 3. Fetch all class schedules
    logger.info("Fetching class schedules from Supabase...")
    response = get_all_class_schedules(supabase)
    
    if not response or not response.data:
        logger.warning("No schedules found or failed to fetch schedules.")
        sys.exit(0)
        
    schedules = response.data
    logger.info(f"Found {len(schedules)} schedules.")
    
    updates_count = 0
    total_courses_updated = 0
    
    # 4. Iterate and update
    for schedule in schedules:
        courses = schedule.get("courses", [])
        if not courses:
            continue
            
        schedule_updated = False
        
        # Helper to normalize Greek text if needed?
        # For now, strict match.
        
        for course in courses:
            course_name = course.get("course_name")
            current_type = course.get("type")
            
            if course_name in course_type_map:
                new_type = course_type_map[course_name]
                if current_type != new_type:
                    course["type"] = new_type
                    schedule_updated = True
                    total_courses_updated += 1
                    # logger.info(f"Updated {course_name} -> {new_type}")
        
        # 5. Save if updated
        if schedule_updated:
            # logger.info(f"Updating schedule for {schedule.get('department')} - {schedule.get('semester')}")
            
            # We need to pass the arguments that upsert_class_schedule expects.
            # check the signature: 
            # def upsert_class_schedule(department: str, semester: str, academic_year: str, period: str, courses=None, supabase: Client = None):
            
            result = upsert_class_schedule(
                department=schedule.get("department"),
                semester=schedule.get("semester"),
                academic_year=schedule.get("academic_year"),
                period=schedule.get("period"),
                courses=courses,
                supabase=supabase
            )
            
            if result:
                updates_count += 1
            else:
                logger.error(f"Failed to update schedule ID: {schedule.get('id')}")

    logger.info(f"Update process completed.")
    logger.info(f"Total schedules updated: {updates_count}")
    logger.info(f"Total individual courses updated: {total_courses_updated}")

if __name__ == "__main__":
    main()
