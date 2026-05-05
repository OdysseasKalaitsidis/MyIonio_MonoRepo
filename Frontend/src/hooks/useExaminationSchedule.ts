import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../app/store";
import { getExaminationSchedule, type ExamItem } from "../features/schedule/api";
import { DEPARTMENT_MAP } from "../features/preferences/constants";

export function useExaminationSchedule() {
  const { department, semester, departmentId } = useSelector((state: RootState) => state.preferences);
  
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
        console.log('📚 Current Preferences:', { department, semester, departmentId });
        
        if (isMounted) {
            // Filter based on preferences if available
            if (departmentId && semester) {
                // Find the matching schedule by DepartmentId
                const match = data.find(s => {
                    return s.departmentId === departmentId && s.semester == semester;
                });

                console.log('📚 Match found by ID:', match);
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
