import os
import sys
from pathlib import Path
import json

# Add project root to python path to allow imports
project_root = Path(__file__).resolve().parent.parent
sys.path.append(str(project_root))

from dotenv import load_dotenv
from loguru import logger
from db.supabase_client import create_client, get_all_class_schedules

# Load environment variables
load_dotenv(project_root / ".env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    logger.error("Supabase credentials not found in .env file or environment variables")
    sys.exit(1)

def verify_updates():
    logger.info("Starting verification process...")
    
    # Initialize Supabase client
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    except Exception as e:
        logger.error(f"Failed to create Supabase client: {e}")
        sys.exit(1)
    
    # Fetch all class schedules
    response = get_all_class_schedules(supabase)
    
    if not response or not response.data:
        logger.error("No schedules found to verify.")
        sys.exit(1)
        
    schedules = response.data
    logger.info(f"Fetched {len(schedules)} schedules for verification.")
    
    # Define some expected checks (Course Name -> Expected Type)
    checks = {
        "Δομές Δεδομένων": "Compulsory",
        "Γραφικά Η/Υ": "TB2",
        "Μηχανική Μάθηση": "Compulsory",
        "Τεχνητή Νοημοσύνη": "Υ-ΒΥΝ"
    }
    
    found_count = 0
    correct_count = 0
    
    for schedule in schedules:
        courses = schedule.get("courses", [])
        for course in courses:
            name = course.get("course_name")
            c_type = course.get("type")
            
            if name in checks:
                expected = checks[name]
                found_count += 1
                if c_type == expected:
                    print(f"✅ Verified: {name} in {schedule.get('department')}-{schedule.get('semester')}")
                    correct_count += 1
                else:
                    print(f"❌ Mismatch: {name} in {schedule.get('department')}-{schedule.get('semester')} -> Found '{c_type}', Expected '{expected}'")

    if found_count == 0:
        logger.warning("⚠️ No check courses found in the database.")
    elif correct_count == found_count:
        logger.info(f"✅ Verification PASSED ({correct_count}/{found_count} checks successful).")
    else:
        logger.error(f"❌ Verification FAILED ({correct_count}/{found_count} checks successful).")
        sys.exit(1)

if __name__ == "__main__":
    verify_updates()
