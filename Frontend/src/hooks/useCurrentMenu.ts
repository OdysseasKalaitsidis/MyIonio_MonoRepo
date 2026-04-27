import { useState, useEffect } from "react";
import { getMenu } from "../features/menu/api";
import type { DailyMenu, MealDetails } from "../features/menu/models";

export const useCurrentMenu = () => {
  const [todaysMenu, setTodaysMenu] = useState<DailyMenu | null>(null);
  const [currentMeal, setCurrentMeal] = useState<MealDetails | null>(null);
  const [mealLabel, setMealLabel] = useState<"ΓΕΥΜΑ" | "ΔΕΙΠΝΟ" | "LOADING">(
    "LOADING"
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMenu = async () => {
      try {
        setIsLoading(true);

        // 1. Fetch weekly menus (array)
        const weeklyMenus = await getMenu();

        if (!weeklyMenus || weeklyMenus.length === 0) {
          setError("No weekly menu returned");
          return;
        }

        // 2. Get Greece time instead of system time
        const greekDate = new Date().toLocaleDateString("en-CA", {
          timeZone: "Europe/Athens",
        });
        // → "2025-12-05"

        // 3. Search for today's day inside ALL weeks
        let foundDay: DailyMenu | undefined = undefined;

        for (const week of weeklyMenus) {
          const match = week.days.find((d) => d.date_iso === greekDate);
          if (match) {
            foundDay = match;
            break;
          }
        }

        if (!foundDay) {
          setError("No menu found for today");
          return;
        }

        setTodaysMenu(foundDay);

        // 4. Meal selection logic: Greece time + cutoff 15:30
        const now = new Date(
          new Date().toLocaleString("en-US", { timeZone: "Europe/Athens" })
        );

        const cutoff = new Date(now);
        cutoff.setHours(15, 30, 0, 0);

        if (now < cutoff) {
          setMealLabel("ΓΕΥΜΑ");
          setCurrentMeal(foundDay.lunch);
        } else {
          setMealLabel("ΔΕΙΠΝΟ");
          setCurrentMeal(foundDay.dinner);
        }
      } catch (err) {
        console.error(err);
        setError("Menu unavailable");
      } finally {
        setIsLoading(false);
      }
    };

    loadMenu();
  }, []);

  return { todaysMenu, currentMeal, mealLabel, isLoading, error };
};
