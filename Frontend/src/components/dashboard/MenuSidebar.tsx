import { motion } from "framer-motion";
import { Utensils } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../Button";
import type { ReactNode } from "react";

export interface Meal {
  main_courses: string[];
  has_salad: boolean;
  has_dessert: boolean;
}

export interface MenuSidebarProps {
  currentMeal: Meal | null;
  isLoading: boolean;
  error: string | null;
}

export function MenuSidebar({ currentMeal, isLoading, error }: MenuSidebarProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      className="lg:col-span-2 flex flex-col"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1, duration: 0.4 }}
    >
      <div className="flex-1 rounded-3xl bg-[#18181b] border border-white/10 p-6 flex flex-col shadow-xl">
        <div className="flex items-center gap-2 mb-4 text-green-400">
          <Utensils className="w-5 h-5" />
          <span className="text-sm font-bold uppercase tracking-wider">
            Today's Menu
          </span>
        </div>

        {isLoading ? (
          <SkeletonLoader count={1} className="h-20" />
        ) : currentMeal ? (
          <div className="flex-1 flex flex-col gap-3">
            {currentMeal.main_courses
              .slice(0, 3)
              .map((dish: string, i: number) => (
                <div
                  key={i}
                  className="flex items-start gap-3 border-b border-white/5 pb-3 last:border-0 last:pb-0"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500/50 mt-2 shrink-0" />
                  <p className="text-lg text-white font-medium leading-tight">
                    {dish}
                  </p>
                </div>
              ))}
            {(currentMeal.has_salad || currentMeal.has_dessert) && (
              <div className="mt-auto pt-4 flex gap-2">
                {currentMeal.has_salad && <Badge>Salad</Badge>}
                {currentMeal.has_dessert && <Badge color="pink">Dessert</Badge>}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-text-muted italic">
            {error || "Menu unavailable"}
          </div>
        )}

        <Button
          onClick={() => navigate("/menu")}
          className="mt-6 w-full bg-surface hover:bg-white/10 text-white"
        >
          See Full Menu
        </Button>
      </div>
    </motion.div>
  );
}

function Badge({
  children,
  color = "green",
}: {
  children: ReactNode;
  color?: "green" | "pink";
}) {
  const colors = {
    green: "bg-green-500/10 text-green-400 border-green-500/20",
    pink: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${colors[color]}`}
    >
      {children}
    </span>
  );
}

function SkeletonLoader({
  count = 1,
  className = "h-4",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className="space-y-3 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`bg-white/5 animate-pulse rounded ${className}`}
        />
      ))}
    </div>
  );
}
