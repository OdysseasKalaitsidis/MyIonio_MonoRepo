import requests
import json

BASE_URL = "http://localhost:8000"

def test_weekly_manual_insertion():
    print("\n--- Testing Manual Weekly Class Schedule Insertion ---")
    url = f"{BASE_URL}/schedule/weekly-manual"
    
    # Payload based on user's input (truncated for brevity but structure maintained)
    payload = {
      "department": "Ιόνιο Πανεπιστήμιο - Τμήμα Τεχνών Ήχου και Εικόνας",
      "semester": "Εαρινό 2026",
      "academic_year": "2025-2026",
      "period": "Φεβρουάριος-Ιούνιος",
      "courses": [
        {
          "course_name": "VIS231 - Εισαγωγή στη Φωτογραφία ΔΙΔ",
          "day": "Τρίτη",
          "time_start": "18:00",
          "time_end": "19:00",
          "room": "TABM 2.39",
          "professors": ["Ζήβας Αντώνης"],
          "major": "Photography", # Example optional field
          "optional": True # Example optional field
        },
        {
          "course_name": "TEC210 - Εισαγωγή στην Επιστήμη των Υπολογιστών ΙΙ ΔΙΔ",
          "day": "Παρασκευή",
          "time_start": "11:00",
          "time_end": "12:00",
          "room": "ΑΜΦΙ",
          "professors": ["Λάμπουρα Σταματέλλα", "Παναγόπουλος Μιχαήλ"]
        }
      ]
    }
    
    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
             print(f"Response: {response.json()}")
             if response.json().get("success"):
                print("✅ Weekly schedule insertion successful")
             else:
                print("❌ Weekly schedule insertion failed (API returned failure)")
        else:
             print(f"❌ Failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_weekly_manual_insertion()
