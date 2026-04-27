import { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../app/store";
import type { CourseEntry } from "../features/schedule/models";
import { getSchedule } from "../features/schedule/api";
import { DEPARTMENT_MAP } from "../features/preferences/constants";

const DAY_MAP: Record<number, string> = {
  0: "Κυριακή",
  1: "Δευτέρα",
  2: "Τρίτη",
  3: "Τετάρτη",
  4: "Πέμπτη",
  5: "Παρασκευή",
  6: "Σάββατο",
};

export function useCurrentSchedule() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { department, semester, selectedCourses } = useSelector((state: RootState) => state.preferences);
  const [courses, setCourses] = useState<CourseEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If not authenticated or missing preferences, we simply don't fetch. 
    if (!department || !semester) {
        setIsLoading(false);
        return;
    }

    let isMounted = true;

    const fetchCourses = async () => {
      try {
        const deptParam = DEPARTMENT_MAP[department] || department;
        
        const semesterMap: Record<string, string> = {
          "1": "Α",
          "2": "Β",
          "3": "Γ",
          "4": "Δ",
          "5": "Ε",
          "6": "ΣΤ",
          "7": "Ζ",
          "8": "Η",
        };

        // Ensure we map string or number input to the Greek letter
        const semKey = String(semester);
        const semParam = semesterMap[semKey];

        // If for some reason we can't map it (e.g. it's already Greek or invalid), use it as is? 
        // Or should we enforce it? The user is very strict "always pass these greek words".
        // Let's assume if it's not in the map, it might already be correct or we default to it to fail safely?
        // But let's log specifically what we are sending.
        const finalSemester = semParam || String(semester);

        console.log("📅 Fetching Schedule with:", { department: deptParam, semester: finalSemester, isAuthenticated });

        let data: import("../features/schedule/api").ScheduleResponseDto[];
        if (isAuthenticated) {
             console.log("[DEBUG] Fetching authenticated schedule (Using public API + client-side filter)");
        }

        const publicSchedule = await getSchedule({ department: deptParam, semester: finalSemester });
        
        if (selectedCourses && selectedCourses.length > 0) {
             // Only show selected courses
             data = publicSchedule.filter(c => selectedCourses.includes(c.course_name));
        } else {
             // Show all courses if no selection made
             data = publicSchedule;
        }
        
        if (isMounted) {
            // Map DTO to CourseEntry
            const mapped: CourseEntry[] = data.map(d => ({
                day: d.day,
                room: d.room,
                building: d.building,
                time_start: d.time_start?.slice(0, 5) ?? "", 
                time_end: d.time_end?.slice(0, 5) ?? "",
                professor: d.professor,
                course_name: d.course_name,
                type: d.type
            }));
            setCourses(mapped);
            setError(null);
        }
      } catch (err) {
        console.error("Schedule fetch failed:", err);
        if (isMounted) setError("Could not load schedule.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchCourses();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, department, semester, selectedCourses]);

  const todaysCourses = useMemo(() => {
    const todayIndex = new Date().getDay();
    const todayLabel = DAY_MAP[todayIndex];

    return courses.filter(
      (c) => c.day.toLowerCase() === todayLabel.toLowerCase()
    );
  }, [courses]);

  const currentCourse = useMemo(() => {
    if (todaysCourses.length === 0) return null;

    const now = new Date();

    return (
      todaysCourses.find((c) => {
        const [startH, startM] = c.time_start.split(":").map(Number);
        const [endH, endM] = c.time_end.split(":").map(Number);

        const startTime = new Date();
        startTime.setHours(startH, startM, 0, 0);

        const endTime = new Date();
        endTime.setHours(endH, endM, 0, 0);

        return now >= startTime && now < endTime;
      }) || null
    );
  }, [todaysCourses]);

  return {
    courses,
    todaysCourses,
    currentCourse,
    isLoading,
    error,
  };
}
