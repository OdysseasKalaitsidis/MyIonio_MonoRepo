export interface MealDetails {
  main_courses: string[];
  has_salad: boolean;
  has_dessert: boolean;
  notes: string | null;
}

export interface DailyMenu {
  date_iso: string;
  day_name: string;
  lunch: MealDetails;
  dinner: MealDetails;
}

export interface WeeklyMenuResponse {
  success: boolean;
  week_range: string;
  days: DailyMenu[];
}

export const MealType = {
  Lunch: "lunch",
  Dinner: "dinner",
} as const;

export type MealType = (typeof MealType)[keyof typeof MealType];
