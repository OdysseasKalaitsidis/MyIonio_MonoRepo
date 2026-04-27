import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Calendar, ChevronRight, Edit2, BookOpen } from "lucide-react";
import { useSelector } from "react-redux";
import type { RootState } from "../../app/store";
import { SchedulePickerModal } from "../../components/schedule/SchedulePickerModal";
import { useCurrentSchedule } from "../../hooks/useCurrentSchedule";

export function ScheduleCard() {
  const navigate = useNavigate();
  const { department, semester } = useSelector((state: RootState) => state.preferences);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const { todaysCourses, isLoading, error } = useCurrentSchedule();

  const hasPreferences = department && semester;

  const handleCardClick = () => {
    if (hasPreferences) {
      navigate("/schedule");
    } else {
      setIsPickerOpen(true);
    }
  };

  return (
    <>
      <div
        className="relative group overflow-hidden rounded-3xl bg-white dark:bg-glass-blue border border-blue-100 dark:border-white/10 p-5 md:p-6 flex flex-col h-[380px] hover:border-ionian-blue/30 transition-all duration-300 cursor-pointer shadow-sm dark:shadow-none"
        onClick={handleCardClick}
      >
        {/* Background Decor */}
        <div className="absolute -right-10 -bottom-10 opacity-[0.03] text-slate-900 dark:text-white">
          <Calendar size={240} />
        </div>

        {/* Header Row */}
        <div className="flex justify-between items-start mb-1">
          <div className="flex items-center gap-2 text-ionian-blue dark:text-blue-400">
            <Calendar size={20} />
            <span className="text-sm font-bold uppercase tracking-widest text-ionian-blue dark:text-blue-400">Today's Classes</span>
          </div>
          {hasPreferences && (
            <button
              onClick={(e) => { e.stopPropagation(); setIsPickerOpen(true); }}
              className="p-1 text-slate-400 dark:text-gray-500 hover:text-ionian-blue dark:hover:text-white transition-colors z-10"
            >
              <Edit2 size={18} />
            </button>
          )}
        </div>

        {/* Large Title */}
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-6">
          Today's Classes
        </h2>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          {!hasPreferences ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center -mt-6">
              <p className="text-base text-slate-500 dark:text-gray-400 font-medium mb-6">No semester selected</p>
              <button
                onClick={(e) => { e.stopPropagation(); setIsPickerOpen(true); }}
                className="bg-ionian-blue hover:bg-blue-600 text-white px-6 py-3 text-base rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/20"
              >
                Set up Schedule
              </button>
            </div>
          ) : (
            <div className="w-full flex flex-col gap-4">
              {isLoading ? (
                <p className="text-slate-500 dark:text-gray-400 text-sm animate-pulse">Loading schedule...</p>
              ) : error ? (
                <p className="text-slate-500 dark:text-gray-400 text-sm">Could not load classes</p>
              ) : todaysCourses.length > 0 ? (
                <>
                  {todaysCourses.slice(0, 2).map((course, idx) => (
                    <div key={idx} className="flex items-start gap-4">
                      <div className="p-2.5 rounded-full bg-blue-50 text-ionian-blue dark:bg-blue-500/20 dark:text-blue-400 shrink-0 mt-0.5">
                        <BookOpen size={20} />
                      </div>
                      <div className="min-w-0 flex-1 border-b border-gray-100 dark:border-white/5 pb-4 last:border-0 last:pb-0">
                        <p className="font-bold text-slate-900 dark:text-white text-base leading-tight mb-1">{course.course_name}</p>
                        <p className="text-sm text-slate-500 dark:text-gray-400 font-medium">{course.time_start} - {course.time_end} • {course.room}</p>
                      </div>
                    </div>
                  ))}
                  
                  {todaysCourses.length > 2 && (
                    <div className="mt-2 bg-gray-50 dark:bg-white/5 rounded-xl p-3 text-center border border-dashed border-gray-200 dark:border-white/10">
                       <p className="text-xs font-semibold text-slate-400 dark:text-gray-400">+{todaysCourses.length - 2} more classes</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-4">
                  <p className="text-slate-500 dark:text-gray-400 text-base font-medium">No classes scheduled for today.</p>
                  <p className="text-slate-400 dark:text-gray-500 text-sm mt-1">Enjoy your free time!</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Link */}
        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-white/5 flex justify-center">
            <div className="flex items-center gap-1 text-sm font-semibold text-slate-500 dark:text-gray-400 group-hover:text-ionian-blue dark:group-hover:text-blue-400 transition-colors">
              <span>View Full Schedule</span>
              <ChevronRight size={16} />
            </div>
        </div>
      </div>

      <SchedulePickerModal isOpen={isPickerOpen} onClose={() => setIsPickerOpen(false)} />
    </>
  );
}
