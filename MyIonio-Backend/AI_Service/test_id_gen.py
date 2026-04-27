# import asyncio
# import json
import uuid

# Logic copied from schedule_service.py for testing
# Mock parsed schedule to test ID generation logic in isolation
# We can't easily mock the PDF upload without a file, so let's just test the logic snippet.

def test_id_generation():
    department = "Department of Informatics"
    semester = "Semester_ST"
    courses = [
        {"course_name": "Artificial Intelligence"},
        {"course_name": "Bioinformatics"}
    ]
    
    print("Testing ID Generation Stability...")
    
    results = {}
    
    for i in range(2): # Run twice to ensure stability
        print(f"Run {i+1}:")
        run_ids = []
        for course in courses:
            course_name = course.get("course_name", "")
            unique_string = f"{department}_{semester}_{course_name}".replace(" ", "").lower()
            course_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, unique_string))
            print(f"  Course: {course_name} -> ID: {course_id}")
            run_ids.append(course_id)
        results[i] = run_ids
        
    if results[0] == results[1]:
        print("\n✅ SUCCESS: IDs are deterministic!")
    else:
        print("\n❌ FAILURE: IDs changed between runs!")
        print(f"Run 1: {results[0]}")
        print(f"Run 2: {results[1]}")

if __name__ == "__main__":
    test_id_generation()
