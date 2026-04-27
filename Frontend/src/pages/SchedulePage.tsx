import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { PageLayout } from "../components/layout/PageLayout";
import { useCurrentSchedule } from "../hooks/useCurrentSchedule";
import type { CourseEntry } from "../features/schedule/models";
import { MapPin, User, Building2, Settings2, Calendar, ChevronRight } from "lucide-react";
import { SchedulePickerModal } from "../components/schedule/SchedulePickerModal";
import clsx from "clsx";

const WEEK_ORDER = ["Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή"];

export default function SchedulePage() {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Initialize selected day to today or Monday
  const [selectedDay, setSelectedDay] = useState<string>(() => {
      const dayIndex = new Date().getDay(); // 0 = Sunday, 1 = Monday, ...
      let index = dayIndex - 1;
      if (index < 0 || index > 4) {
          // It's weekend (Sun=0 -> -1, Sat=6 -> 5), default to Monday
          return "Δευτέρα";
      }
      return WEEK_ORDER[index] || "Δευτέρα";
  });

  const { courses, isLoading, currentCourse } = useCurrentSchedule();

  // Filter courses for the selected day in Daily view
  const displayCourses = courses.filter(c => c.day === selectedDay);

  return (
    <PageLayout>
      <SchedulePickerModal isOpen={isPickerOpen} onClose={() => setIsPickerOpen(false)} />
      <div className="min-h-screen px-4 md:px-8 py-10 max-w-5xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <Link to="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-ionian-blue dark:text-gray-400 dark:hover:text-white transition-colors group">
            <span className="mr-1 group-hover:-translate-x-0.5 transition-transform">←</span> Back
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-50 dark:bg-white/10 rounded-xl text-blue-600 dark:text-blue-400">
                    <Calendar size={24} />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Schedule</h1>
            </div>
            <p className="text-slate-500 dark:text-gray-400 font-medium ml-1">
              {selectedDay}'s Classes
            </p>
          </div>

          <button
            onClick={() => setIsPickerOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-slate-200 dark:border-white/10 bg-white/50 backdrop-blur-sm text-slate-600 dark:text-gray-300 hover:text-ionian-blue hover:border-ionian-blue/30 hover:bg-white transition-all shadow-sm active:scale-95"
          >
            <Settings2 size={16} />
            <span className="text-sm font-semibold">Configure</span>
          </button>
        </div>

        {/* Day Selector - Apple/iOS Segmented Control Style */}
        <div className="p-1.5 bg-slate-100/80 dark:bg-white/5 backdrop-blur-md rounded-2xl flex overflow-x-auto scrollbar-hide snap-x">
            {WEEK_ORDER.map(day => {
                const isSelected = selectedDay === day;
                return (
                    <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={clsx(
                            "flex-1 min-w-[100px] py-2.5 rounded-xl text-sm font-medium transition-all snap-center relative isolate",
                            isSelected 
                            ? "bg-white text-slate-900 shadow-sm shadow-black/5 z-10 font-semibold" 
                            : "text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200"
                        )}
                    >
                        {day}
                        {isSelected && (
                            <motion.div
                                layoutId="day-selector-bg"
                                className="absolute inset-0 bg-white dark:bg-white/10 rounded-xl -z-10 shadow-sm"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
                            />
                        )}
                    </button>
                );
            })}
        </div>

        {isLoading ? (
          <div className="space-y-4 py-10">
              {[1, 2, 3].map(i => (
                  <div key={i} className="h-32 bg-slate-100 dark:bg-white/5 rounded-3xl animate-pulse" />
              ))}
          </div>
        ) : (
          <div className="relative min-h-[400px]">
            <AnimatePresence mode="wait">
              <DailyView 
                key={selectedDay} 
                courses={displayCourses} 
                currentCourse={currentCourse}
              />
            </AnimatePresence>
          </div>
        )}
      </div>
    </PageLayout>
  );
}


function DailyView({ 
    courses, 
    currentCourse,
}: { 
    courses: CourseEntry[], 
    currentCourse: CourseEntry | null,
}) {
  if (courses.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", bounce: 0.3 }}
        className="flex flex-col items-center justify-center py-24 px-4 text-center rounded-3xl border border-dashed border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 backdrop-blur-sm"
      >
        <div className="w-16 h-16 bg-white dark:bg-white/10 rounded-full flex items-center justify-center mb-4 shadow-sm text-slate-400 dark:text-gray-500">
            <Calendar size={28} />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No classes scheduled</h3>
        <p className="text-slate-500 dark:text-gray-400 max-w-xs">Enjoy your free time or use it to catch up on assignments!</p>
      </motion.div>
    );
  }

  const sorted = [...courses].sort((a, b) =>
    a.time_start.localeCompare(b.time_start)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: "spring", bounce: 0.3, duration: 0.5, staggerChildren: 0.1 }}
      className="space-y-4"
    >
      {sorted.map((c, idx) => {
        // Simple equality check for current course highlighting
        const isCurrent = currentCourse && 
                          c.course_name === currentCourse.course_name && 
                          c.time_start === currentCourse.time_start && 
                          c.day === currentCourse.day;
        
        return (
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.1 }}
          className={clsx(
              "group relative flex flex-col sm:flex-row gap-5 p-6 md:p-8 rounded-3xl transition-all duration-300 border shadow-sm",
              isCurrent 
              ? "bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 border-blue-600 shadow-xl shadow-blue-500/25 ring-1 ring-blue-400/50 z-10 scale-[1.02]"
              : "bg-gradient-to-br from-blue-50/50 to-slate-100/80 dark:bg-white/5 dark:from-white/10 dark:to-white/5 backdrop-blur-xl border-white/60 dark:border-white/10 hover:shadow-lg hover:shadow-slate-200/50 hover:scale-[1.01]"
          )}
        >
          {isCurrent && (
             <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full backdrop-blur-md border border-white/10 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Now</span>
             </div>
          )}
          
          {/* Time Column - more prominent now */}
          <div className={clsx(
              "flex flex-row sm:flex-col items-center sm:items-start justify-between sm:justify-center min-w-[120px] sm:border-r pr-0 sm:pr-8 pb-4 sm:pb-0 border-b sm:border-b-0",
              isCurrent ? "border-white/20" : "border-slate-200 dark:border-white/10"
          )}>
             <div className="text-left">
                <span className={clsx("text-xl md:text-2xl font-bold block leading-none mb-1 tracking-tight", isCurrent ? "text-white" : "text-slate-900 dark:text-white")}>
                    {c.time_start}
                </span>
                <span className={clsx("text-sm font-medium transition-colors", isCurrent ? "text-blue-100" : "text-slate-500 dark:text-gray-400")}>
                    {c.time_end}
                </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-2 pl-0 sm:pl-2">
            <h3 className={clsx(
                "text-lg md:text-2xl font-bold leading-tight transition-colors tracking-tight",
                isCurrent ? "text-white" : "text-slate-800 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400"
            )}>
              {c.course_name}
            </h3>
            
            <div className={clsx(
                "flex flex-wrap items-center gap-x-6 gap-y-2 text-sm mt-1 font-medium", 
                isCurrent ? "text-blue-100" : "text-slate-600 dark:text-gray-400"
            )}>
              <span className="flex items-center gap-2 transition-transform group-hover:translate-x-0.5 duration-300">
                  <MapPin size={16} className={isCurrent ? "text-white" : "text-ionian-blue"} /> 
                  {c.room}
              </span>
              <span className="flex items-center gap-2 transition-transform group-hover:translate-x-0.5 duration-300 delay-75">
                  <User size={16} className={isCurrent ? "text-white/80" : "text-ionian-blue"} /> 
                  <span className="truncate max-w-[200px]">{c.professor}</span>
              </span>
              {c.building && (
                <span className="flex items-center gap-2 hidden sm:flex transition-transform group-hover:translate-x-0.5 duration-300 delay-100">
                    <Building2 size={16} className={isCurrent ? "text-white/80" : "text-ionian-blue"} /> 
                    {c.building}
                </span>
              )}
            </div>
          </div>

          {/* Cheat/Hint indicator */}
          {!isCurrent && (
             <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-slate-400 group-hover:translate-x-1 duration-300">
                <ChevronRight size={24} strokeWidth={2.5} />
             </div>
          )}
        </motion.div>
        );
      })}
    </motion.div>
  );
}



