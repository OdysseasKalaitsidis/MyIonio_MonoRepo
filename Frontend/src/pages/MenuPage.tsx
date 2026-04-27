import { useState, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Dialog, Transition } from "@headlessui/react";
import { X } from "lucide-react";
import { PageLayout } from "../components/layout/PageLayout";
import { useMenuData } from "../hooks/useMenuData";
import type { DailyMenu, MealDetails } from "../features/menu/models";

export default function MenuPage() {
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("daily");
  const { weeks, todaysMenu, isLoading } = useMenuData();
  const [selectedDay, setSelectedDay] = useState<DailyMenu | null>(null);

  // Flatten all weeks into one list of days for the grid view
  const allDays = weeks.flatMap((w) => w?.days || []);

  // Fallback Logic: If todaysMenu is null, find the most recent previous day
  const displayDay = (() => {
      if (isLoading) return null;
      if (todaysMenu) return todaysMenu;
      
      // Sort descending by date
      const sorted = [...allDays].sort((a, b) => b.date_iso.localeCompare(a.date_iso));
      // Return the first one (latest)
      return sorted[0] || null;
  })();



  return (
    <PageLayout>
      <div className="min-h-screen px-4 md:px-6 py-10 max-w-6xl mx-auto space-y-8">
        <Link to="/" className="inline-flex items-center text-sm text-slate-500 hover:text-ionian-blue dark:text-gray-400 dark:hover:text-white mb-2 transition-colors">
            <span className="mr-2">←</span> Back to Home
        </Link>

        {/* Header & Toggle */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors">Campus Dining</h1>
            <p className="text-slate-500 dark:text-gray-400 mt-1 transition-colors">
              {viewMode === "daily"
                ? "Today's meal plan."
                : "Overview of the upcoming week."}
            </p>
          </div>

          <div className="relative flex p-1 bg-slate-100 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-full w-fit self-start md:self-auto transition-colors">
            <ToggleButton
              label="Today"
              isActive={viewMode === "daily"}
              onClick={() => setViewMode("daily")}
            />
            <ToggleButton
              label="Weekly"
              isActive={viewMode === "weekly"}
              onClick={() => setViewMode("weekly")}
            />
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-ionian-blue border-t-transparent" />
            <p className="mt-4 text-sm text-slate-500 dark:text-gray-400">Loading menu...</p>
          </div>
        ) : (
          <div className="relative min-h-[500px]">
            <AnimatePresence mode="wait">
              {viewMode === "daily" ? (
                <div key="daily-container">

                    <DailyView key="daily" day={displayDay} />
                </div>
              ) : (
                <WeeklyView key="weekly" days={allDays} onSelectDay={setSelectedDay} />
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Modal */}
        <MenuModal 
            isOpen={!!selectedDay} 
            onClose={() => setSelectedDay(null)} 
            day={selectedDay} 
        />

      </div>
    </PageLayout>
  );
}

// --- SUB COMPONENTS ---

/* 1. Toggle Button */
function ToggleButton({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative px-6 py-2 rounded-full text-sm font-medium transition-colors z-10 ${
        isActive ? "text-slate-900" : "text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
      }`}
    >
      {isActive && (
        <motion.div
          layoutId="active-pill-menu"
          className="absolute inset-0 bg-white shadow-sm rounded-full border border-slate-200"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{ zIndex: -1 }}
        />
      )}
      {label}
    </button>
  );
}

/* 2. Daily View (Detailed Split) */
function DailyView({ day }: { day: DailyMenu | null }) {
  if (!day) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-300 dark:border-white/10 rounded-3xl"
      >
        <p className="text-xl font-medium text-slate-900 dark:text-white transition-colors">
          No menu available.
        </p>
        <p className="text-slate-500 dark:text-gray-400 transition-colors">Check back later.</p>
      </motion.div>
    );
  }

  // Calculate generic time to highlight Dinner if it's late afternoon
  const currentHour = new Date().getHours();
  const isDinnerTime = currentHour >= 16;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6"
    >
      <MealCard label="LUNCH" data={day.lunch} isHighlighted={!isDinnerTime} />
      <MealCard label="DINNER" data={day.dinner} isHighlighted={isDinnerTime} />
    </motion.div>
  );
}

function MealCard({
  label,
  data,
  isHighlighted,
}: {
  label: string;
  data: MealDetails;
  isHighlighted: boolean;
  minimal?: boolean; // Optional flag if we want simpler card anywhere
}) {
  return (
    <div
      className={`flex flex-col p-4 md:p-8 rounded-3xl border transition-all duration-300 ${
        isHighlighted
          ? "bg-blue-50 dark:bg-surface border-blue-100 dark:border-white/20 shadow-lg dark:shadow-xl"
          : "bg-slate-50 dark:bg-surface/30 border-slate-200 dark:border-white/5 opacity-80 hover:opacity-100 hover:border-slate-300 dark:hover:border-white/10"
      }`}
    >
      <div className="flex justify-between items-center mb-3 md:mb-6 border-b border-slate-200 dark:border-white/10 pb-2 md:pb-4">
        <h2 className="text-sm md:text-lg font-bold tracking-widest text-slate-900 dark:text-white transition-colors">
          {label}
        </h2>
        {isHighlighted && (
          <span className="text-[10px] uppercase font-bold bg-ionian-blue text-white px-2 py-1 rounded">
            Current
          </span>
        )}
      </div>

      <div className="space-y-4 flex-1">
        {data.main_courses.map((dish, i) => (
          <div key={i} className="flex gap-2 md:gap-4">
            {/* Simple bullet point styling instead of emoji */}
            <span className="block w-1.5 h-1.5 mt-1.5 md:mt-2 rounded-full bg-ionian-blue/70 shrink-0" />
            <p className="text-sm md:text-lg font-medium leading-relaxed text-slate-800 dark:text-white/90 transition-colors">
              {dish}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 md:mt-8 pt-2 md:pt-4 border-t border-slate-200 dark:border-white/5 flex flex-col md:flex-row gap-2 md:gap-4 font-sans text-[10px] md:text-xs uppercase tracking-wider transition-colors">
        {data.has_salad && (
            <div className="flex flex-col gap-1">
                 <span className="font-bold text-slate-400 dark:text-gray-500">Salad Bar</span>
                 <span className="text-slate-700 dark:text-gray-300 font-semibold text-sm" style={{ fontFamily: '"Inter Tight", sans-serif' }}>Available</span>
            </div>
        )}
        {data.has_dessert && (
             <div className="flex flex-col gap-1">
                 <span className="font-bold text-slate-400 dark:text-gray-500">Dessert</span>
                 <span className="text-slate-700 dark:text-gray-300 font-semibold text-sm" style={{ fontFamily: '"Inter Tight", sans-serif' }}>Available</span>
            </div>
        )}
      </div>

      {data.notes && (
        <p className="mt-4 text-sm text-red-500 dark:text-red-400 italic transition-colors">Note: {data.notes}</p>
      )}
    </div>
  );
}

/* 3. Weekly View (Grid) */
function WeeklyView({ days, onSelectDay }: { days: DailyMenu[], onSelectDay: (day: DailyMenu) => void }) {
  if (days.length === 0)
    return <div className="text-slate-500 dark:text-gray-400">No weekly data found.</div>;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
    >
      {days.map((day) => {
        const todayIso = new Date().toLocaleDateString("en-CA", {
          timeZone: "Europe/Athens",
        });
        const isToday = day.date_iso === todayIso;

        return (
          <div
            key={day.date_iso}
            onClick={() => onSelectDay(day)}
            className={`cursor-pointer flex flex-col p-5 rounded-2xl border h-full transition-all hover:scale-[1.02] ${
              isToday
                ? "bg-blue-50 dark:bg-surface border-blue-200 dark:border-white/30 relative shadow-md"
                : "bg-slate-50 dark:bg-surface/30 border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-surface/40 hover:border-ionian-blue/30"
            }`}
          >
            {isToday && (
              <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-ionian-blue shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            )}

            <div className="mb-4 pb-3 border-b border-slate-200 dark:border-white/10">
              <h3
                className={`font-bold text-lg transition-colors ${
                  isToday ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-white/80"
                }`}
              >
                {day.day_name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-gray-400 font-mono transition-colors">
                {day.date_iso}
              </p>
            </div>

            <div className="space-y-6 flex-1 pointer-events-none"> 
              {/* Pointer events none so click goes to parent card */}
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-white/40 font-bold transition-colors">
                  Lunch
                </p>
                <ul className="space-y-1">
                  {day.lunch.main_courses.slice(0, 2).map((dish, i) => (
                    <li
                      key={i}
                      className="text-sm text-slate-600 dark:text-white/80 truncate pl-2 border-l-2 border-slate-200 dark:border-white/10 transition-colors"
                    >
                      {dish}
                    </li>
                  ))}
                  {day.lunch.main_courses.length > 2 && (
                    <li className="text-xs text-slate-400 dark:text-gray-400 pl-2">+ more</li>
                  )}
                </ul>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-white/40 font-bold transition-colors">
                  Dinner
                </p>
                <ul className="space-y-1">
                  {day.dinner.main_courses.slice(0, 2).map((dish, i) => (
                    <li
                      key={i}
                      className="text-sm text-slate-600 dark:text-white/80 truncate pl-2 border-l-2 border-slate-200 dark:border-white/10 transition-colors"
                    >
                      {dish}
                    </li>
                  ))}
                  {day.dinner.main_courses.length > 2 && (
                    <li className="text-xs text-slate-400 dark:text-gray-400 pl-2">+ more</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}

/* 4. Menu Modal */
function MenuModal({ isOpen, onClose, day }: { isOpen: boolean; onClose: () => void; day: DailyMenu | null }) {
    if (!day) return null;

    return (
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          </Transition.Child>
  
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 text-left align-middle shadow-2xl transition-all">
                  <div className="flex justify-between items-center mb-8 border-b border-slate-100 dark:border-white/5 pb-4">
                    <div>
                        <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-slate-900 dark:text-white">
                            {day.day_name}
                        </Dialog.Title>
                        <p className="text-sm text-slate-500 dark:text-gray-400 mt-1 font-mono">{day.date_iso}</p>
                    </div>
                    
                    <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-gray-400 transition-colors">
                        <X size={24} />
                    </button>
                  </div>
                  
                  {/* Reuse MealCard logic or DailyView logic but inside modal */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                     <MealCard label="LUNCH" data={day.lunch} isHighlighted={false} />
                     <MealCard label="DINNER" data={day.dinner} isHighlighted={false} />
                  </div>
  
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    )
  }
