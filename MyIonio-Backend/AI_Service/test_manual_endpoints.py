import requests
import json
from datetime import date, timedelta

BASE_URL = "http://localhost:8000"

def test_manual_schedule_insertion():
    print("\n--- Testing Manual Exam Schedule Insertion ---")
    url = f"{BASE_URL}/schedule/manual"
    
    payload = {
        "department": "Department of Informatics",
        "semester": "Winter 2026",
        "academic_year": "2025-2026",
        "period": "Jan-Feb",
        "exams": [
            {
                "course_name": "Artificial Intelligence",
                "date": "2026-02-20",
                "time_start": "09:00",
                "time_end": "12:00",
                "room": "Room A",
                "professors": ["Dr. Smith"]
            }
        ]
    }
    
    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200 and response.json().get("success"):
            print("✅ Schedule insertion successful")
        else:
            print("❌ Schedule insertion failed")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def test_manual_menu_insertion():
    print("\n--- Testing Manual Menu Insertion ---")
    url = f"{BASE_URL}/menu/manual"
    
    today = date.today()
    start_of_week = today - timedelta(days=today.weekday())
    end_of_week = start_of_week + timedelta(days=6)
    
    payload = {
        "week_start": start_of_week.isoformat(),
        "week_end": end_of_week.isoformat(),
        "days": [
            {
                "date_iso": start_of_week.isoformat(),
                "day_name": "Monday",
                "lunch": {
                    "main_courses": ["Test Lunch"],
                    "has_salad": True,
                    "has_dessert": True,
                    "notes": "Test Note"
                },
                "dinner": {
                    "main_courses": ["Test Dinner"],
                    "has_salad": False,
                    "has_dessert": False,
                    "notes": ""
                }
            }
        ]
    }
    
    try:
        # Pass json=payload directly, requests handles serialization
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200 and response.json().get("success"):
            print("✅ Menu insertion successful")
        else:
            print("❌ Menu insertion failed")

    except Exception as e:
         print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_manual_schedule_insertion()
    test_manual_menu_insertion()
