import { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { PageLayout } from "../components/layout/PageLayout";
import { useExaminationSchedule } from "../hooks/useExaminationSchedule";
import { MapPin, User } from "lucide-react";
import type { RootState } from "../app/store";

export default function ExaminationPage() {
  // Define the weeks
  const weeks = [
    { id: 1, label: "Week 1", range: "Jan 19 - Jan 25", start: new Date(2026, 0, 19), end: new Date(2026, 0, 25) },
    { id: 2, label: "Week 2", range: "Jan 26 - Feb 1", start: new Date(2026, 0, 26), end: new Date(2026, 1, 1) },
    { id: 3, label: "Week 3", range: "Feb 2 - Feb 12", start: new Date(2026, 1, 2), end: new Date(2026, 1, 12) },
  ];

  const { schedule, isLoading, hasPreferences } = useExaminationSchedule();
  const { department, semester } = useSelector((state: RootState) => state.preferences);
  
  const [selectedWeekId, setSelectedWeekId] = useState(() => {
     const now = new Date();
     now.setHours(0, 0, 0, 0);
     const current = weeks.find(w => now >= w.start && now <= w.end);
     return current ? current.id : 1;
  });

  // Helper to parse date string DD-MM-YYYY or DD/MM/YYYY
  const parseDate = (dateStr: string) => {
    const parts = dateStr.includes('/') ? dateStr.split('/') : dateStr.split('-');
    const [d, m, y] = parts.map(Number);
    return new Date(y, m - 1, d);
  };

  // Get current week's data
  const currentWeek = weeks.find(w => w.id === selectedWeekId) || weeks[0];
  
  const currentWeekExams = schedule.filter(exam => {
      const examDate = parseDate(exam.date);
      // Reset hours to compare dates only
      examDate.setHours(0, 0, 0, 0);
      const start = new Date(currentWeek.start);
      const end = new Date(currentWeek.end);
      
      return examDate >= start && examDate <= end;
    }).sort((a, b) => {
        const dateA = parseDate(a.date);
        const dateB = parseDate(b.date);
        return dateA.getTime() - dateB.getTime();
    });

  return (
    <PageLayout>
      <div className="min-h-screen px-4 md:px-6 py-10 max-w-4xl mx-auto space-y-8">
        {/* Header Section - Always Rendered */}
        <div className="space-y-6">
            <Link to="/" className="inline-flex items-center text-sm text-slate-500 hover:text-ionian-blue dark:text-gray-400 dark:hover:text-white transition-colors">
                <span className="mr-2">←</span> Back to Home
            </Link>
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Examination Schedule</h1>
                    <p className="text-slate-500 dark:text-gray-400 mt-2 text-lg">
                        Select a week to view your upcoming exams.
                    </p>
                </div>
                
                {/* Persistent Info Badge */}
                {department && semester && (
                    <div className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-600 dark:text-gray-300">
                        <span className="text-slate-900 dark:text-white font-bold">{department}</span>
                        <span className="mx-2 opacity-30">|</span>
                        <span>Semester {semester}</span>
                    </div>
                )}
            </div>

            {/* Week Selection Mini Menu */}
            <div className="flex p-1 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 overflow-x-auto">
                {weeks.map((week) => (
                    <button
                        key={week.id}
                        onClick={() => setSelectedWeekId(week.id)}
                        className={`
                            flex-1 min-w-[120px] px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                            flex flex-col items-center justify-center gap-1
                            ${selectedWeekId === week.id 
                                ? 'bg-white dark:bg-white/10 text-ionian-blue dark:text-white shadow-sm ring-1 ring-black/5' 
                                : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5'}
                        `}
                    >
                        <span className="font-bold">{week.label}</span>
                        <span className="text-xs opacity-80">{week.range}</span>
                    </button>
                ))}
            </div>
        </div>

        {/* Content Section - Conditionally Rendered */}
        <div className="relative min-h-[400px]">
            {!hasPreferences ? (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-8 max-w-md bg-slate-50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
                        <p className="text-lg text-slate-600 dark:text-gray-300">
                            Please select your department and semester in settings to view your exam schedule.
                        </p>
                    </div>
                </div>
            ) : isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                     <div className="animate-pulse flex flex-col items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-white/10" />
                        <div className="h-4 w-48 bg-slate-200 dark:bg-white/10 rounded" />
                     </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Week Stats */}
                    <div className="flex items-center justify-between px-2 text-sm text-slate-500 dark:text-gray-400 mb-2">
                        <span>Showing exams for <span className="font-semibold text-slate-900 dark:text-white">{currentWeek.label}</span></span>
                        <span>{currentWeekExams.length} Exams</span>
                    </div>

                    {currentWeekExams.length > 0 ? (
                        <div className="space-y-4">
                            {currentWeekExams.map((exam, idx) => (
                                <div 
                                    key={idx}
                                    className="group relative overflow-hidden bg-white dark:bg-surface border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-ionian-blue/30 transition-all duration-300"
                                >
                                    <div className="flex flex-col md:flex-row gap-6 relative z-10">
                                        {/* Date & Time Box */}
                                        <div className="flex md:flex-col items-center justify-center text-center gap-1 min-w-[120px] bg-slate-50 dark:bg-white/5 rounded-xl p-4 border border-slate-100 dark:border-white/5">
                                            <span className="text-xs font-bold uppercase text-ionian-blue tracking-wider">{exam.date}</span>
                                            <div className="text-xl font-black text-slate-800 dark:text-white mt-1">
                                                {exam.time_start}
                                            </div>
                                            <div className="text-xs font-medium text-slate-400">
                                                To {exam.time_end}
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 flex flex-col justify-center space-y-3">
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-ionian-blue transition-colors">
                                                {exam.course_name}
                                            </h3>
                                            
                                            <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-gray-400">
                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                                    <MapPin size={16} className="text-emerald-500" />
                                                    <span className="font-medium">{exam.room}</span>
                                                </div>
                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                                    <User size={16} className="text-purple-500" />
                                                    <span className="font-medium">{exam.professors?.join(", ") || "N/A"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
                            <div className="w-16 h-16 mb-4 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-400">
                                <span className="text-2xl">📅</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No exams this week</h3>
                            <p className="text-slate-500 dark:text-gray-400 mt-1 max-w-xs">
                                You can use this time to study for upcoming exams in other weeks!
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </PageLayout>
  );
}

