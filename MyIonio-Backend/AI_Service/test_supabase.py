import os
from dotenv import load_dotenv
from supabase import create_client
from loguru import logger

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

def test_connection():
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("❌ Error: SUPABASE_URL or SUPABASE_SERVICE_KEY not found in .env")
        return

    print(f"Testing connection to: {SUPABASE_URL}")
    
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        
        # Try to fetch something simple. 
        # If 'exam_schedules' table doesn't exist yet, this might fail with a specific error.
        # We can try to list tables or select from a known table if possible, but we don't know many.
        # We'll try the 'exam_schedules' table since we need it.
        
        print("Attempting to select from 'weekly_menus'...")
        response = supabase.table("weekly_menus").select("*").limit(1).execute()
        
        print("✅ Connection successful!")
        print(f"Response data: {response.data}")
        
    except Exception as e:
        print(f"❌ Connection or Query failed: {e}")

if __name__ == "__main__":
    test_connection()
