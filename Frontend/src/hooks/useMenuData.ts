import { useState, useEffect } from "react";
import { getMenu } from "../features/menu/api";
import type { DailyMenu, WeeklyMenuResponse } from "../features/menu/models";

export const useMenuData = () => {
  const [weeks, setWeeks] = useState<WeeklyMenuResponse[]>([]);
  const [todaysMenu, setTodaysMenu] = useState<DailyMenu | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await getMenu();

        const safeData = Array.isArray(response)
          ? response
          : response
          ? [response]
          : [];
        setWeeks(safeData);

        const greekDate = new Date().toLocaleDateString("en-CA", {
          timeZone: "Europe/Athens",
        });

        const searchDate = greekDate;

        let found: DailyMenu | undefined;

        for (const week of safeData) {
          let parsedDays: DailyMenu[] = [];

          if (typeof week.days === "string") {
            try {
              parsedDays = JSON.parse(week.days);
            } catch (e) {
              console.error("Error parsing days JSON:", e);
              continue;
            }
          } else {
            parsedDays = week.days || [];
          }

          const match = parsedDays.find((d) =>
            d.date_iso.startsWith(searchDate)
          );

          if (match) {
            found = match;
            break;
          }
        }

        setTodaysMenu(found || null);
      } catch (error) {
        console.error("Failed to load menu page data", error);
        setWeeks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return { weeks, todaysMenu, isLoading };
};
