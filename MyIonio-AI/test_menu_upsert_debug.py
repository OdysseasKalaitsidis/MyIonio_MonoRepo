import asyncio
import sys
import os
sys.path.append(os.getcwd()) # Ensure root is in path

from api.services.menu_service import insert_dummy_menu_service
from db.supabase_client import supabase

# Add a logger sink to stdout to ensure we see logs
from loguru import logger
logger.remove()
logger.add(sys.stdout)

async def main():
    print("Running insert_dummy_menu_service...")
    try:
        result = await insert_dummy_menu_service()
        print(f"Result: {result}")
    except Exception as e:
        print(f"Exception: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
