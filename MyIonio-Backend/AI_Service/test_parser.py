"""
Test script for the optimized image-based Gemini parser.

Before running this test, ensure poppler is installed:
Windows: Download from https://github.com/oschwartz10612/poppler-windows/releases/
         Extract and add bin folder to PATH

OR use chocolatey: choco install poppler
"""

from parser.gemini_parser import parse_schedule_with_gemini, parse_exam_schedule_with_gemini
from parser.menu_parser import parse_menu
from pathlib import Path
import json

def test_schedule_parsing():
    """Test parsing a class schedule PDF"""
    
    pdf_path = Path("Ωρολόγιο Πρόγραμμα Δ΄ Εξαμήνου - Ακαδημαϊκό έτος 2025-2026.pdf")
    
    if not pdf_path.exists():
        print(f"❌ PDF not found: {pdf_path}")
        return
    
    print(f"📄 Testing schedule parser on: {pdf_path.name}")
    print("=" * 80)
    
    try:
        # Parse with default DPI (200)
        result = parse_schedule_with_gemini(str(pdf_path))
        
        print("\n✅ Parsing successful!")
        print(f"\nDepartment: {result.get('department', 'N/A')}")
        print(f"Semester: {result.get('semester', 'N/A')}")
        print(f"Academic Year: {result.get('academic_year', 'N/A')}")
        
        # Show sample courses from Monday
        schedule = result.get('schedule_by_day', {})
        monday_courses = schedule.get('Δευτέρα', [])
        
        print(f"\n📚 Sample Monday Courses ({len(monday_courses)} total):")
        for i, course in enumerate(monday_courses[:3], 1):  # Show first 3
            print(f"\n  {i}. {course.get('course_name', 'N/A')}")
            print(f"     Professor: {course.get('professor', 'N/A')}")
            print(f"     Time: {course.get('time_start', 'N/A')} - {course.get('time_end', 'N/A')}")
            print(f"     Location: {course.get('room', 'N/A')}, {course.get('building', 'N/A')}")
            print(f"     Majors: '{course.get('majors', '')}'")
            print(f"     Minors: '{course.get('minors', '')}'")
            print(f"     Epilogis: '{course.get('epilogis', '')}'")
        
        # Save full result
        output_path = "test_output_schedule.json"
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        print(f"\n💾 Full result saved to: {output_path}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()


def test_exam_parsing():
    """Test parsing an exam schedule PDF"""
    
    pdf_path = Path("Ωρολόγιο Πρόγραμμα ΣΤ΄ Εξαμήνου - Ακαδημαϊκό έτος 2025-2026.pdf")
    
    if not pdf_path.exists():
        print(f"❌ PDF not found: {pdf_path}")
        return
    
    print(f"\n\n📄 Testing exam parser on: {pdf_path.name}")
    print("=" * 80)
    
    try:
        result = parse_exam_schedule_with_gemini(str(pdf_path))
        
        print("\n✅ Parsing successful!")
        print(f"\nFound {len(result)} semester(s)")
        
        for semester_data in result[:1]:  # Show first semester
            print(f"\nDepartment: {semester_data.get('department', 'N/A')}")
            print(f"Semester: {semester_data.get('semester', 'N/A')}")
            print(f"Period: {semester_data.get('period', 'N/A')}")
            
            exams = semester_data.get('exams', [])
            print(f"\n📝 Sample Exams ({len(exams)} total):")
            for i, exam in enumerate(exams[:3], 1):
                print(f"\n  {i}. {exam.get('course_name', 'N/A')}")
                print(f"     Date: {exam.get('date', 'N/A')}")
                print(f"     Time: {exam.get('time_start', 'N/A')} - {exam.get('time_end', 'N/A')}")
                print(f"     Room: {exam.get('room', 'N/A')}")
                print(f"     Professors: {', '.join(exam.get('professors', []))}")
        
        # Save full result
        output_path = "test_output_exams.json"
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        print(f"\n💾 Full result saved to: {output_path}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    print("🚀 GEMINI PARSER TEST (Image-Based Optimization)")
    print("=" * 80)
    
    # Test both parsers
    test_schedule_parsing()
    # test_exam_parsing()  # Uncomment to test exam parsing
