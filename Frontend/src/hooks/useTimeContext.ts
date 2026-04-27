import { useState, useEffect, useMemo } from "react";

export function useTimeContext() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // Update every minute to keep UI fresh without over-rendering
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const isLunchTime = useMemo(() => {
    const hours = now.getHours();
    const minutes = now.getMinutes();
    // Lunch time is before 15:30
    return hours < 15 || (hours === 15 && minutes < 30);
  }, [now]);

  return { now, isLunchTime };
}
