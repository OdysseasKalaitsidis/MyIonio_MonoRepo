import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../app/store";
import { getExaminationSchedule, type ExamItem } from "../features/schedule/api";
import { DEPARTMENT_MAP } from "../features/preferences/constants";

export function useExaminationSchedule() {
  const { department, semester } = useSelector((state: RootState) => state.preferences);
  
  const [schedule, setSchedule] = useState<ExamItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchSchedule = async () => {
      try {
        setIsLoading(true);
        const data = await getExaminationSchedule();
        
        console.log('📚 Examination Schedule - Raw API Response:', data);
        console.log('📚 Current Preferences:', { department, semester });
        
        if (isMounted) {
            // Filter based on preferences if available
            if (department && semester) {
                // Map the user-friendly department name to the backend string
                // Map the user-friendly department name to the backend string
                // The examination schedule API uses English names inconsistently compared to other endpoints
                const EXAM_DEPARTMENT_MAP: Record<string, string> = {
                    "Informatics": "INFORMATICS",
                    "Tourism": "Department of Tourism - Ionian University",
                    "Translation": "Department of Foreign Languages, Translation and Interpreting"
                };

                const backendDept = EXAM_DEPARTMENT_MAP[department] || DEPARTMENT_MAP[department] || department; 
                
                // The API returns semesters as Greek letters matching our preference, so no conversion needed
                const targetSemester = semester;
                
                console.log('📚 Mapped Department:', backendDept);
                console.log('📚 Target Semester:', targetSemester);
                console.log('📚 Looking for match with:', { department: backendDept, semester: targetSemester });
                
                // Find the matching schedule
                const match = data.find(s => {
                    // Log mismatch details for debugging if needed, but reducing noise
                    // console.log('Checking:', s.department, s.semester);
                    return s.department === backendDept && s.semester == targetSemester;
                });

                console.log('📚 Match found:', match);
                setSchedule(match ? match.exams : []);
            } else {
                setSchedule([]);
            }
            setError(null);
        }
      } catch (err) {
        console.error("Exam schedule fetch failed:", err);
        if (isMounted) setError("Could not load examination schedule.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchSchedule();

    return () => {
      isMounted = false;
    };
  }, [department, semester]);

  return {
    schedule,
    isLoading,
    error,
    hasPreferences: !!(department && semester)
  };
}
