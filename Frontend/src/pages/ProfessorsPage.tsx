import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { PageLayout } from "../components/layout/PageLayout";
import { Search, User, MapPin, Building2, Clock, Calendar, ChevronRight } from "lucide-react";
import { getProfessors, getProfessorSchedule } from "../features/professors/api";
import { ScheduleResponseDto } from "../features/schedule/api";
import clsx from "clsx";

const WEEK_ORDER = ["Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή"];

export default function ProfessorsPage() {
    const [professors, setProfessors] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedProfessor, setSelectedProfessor] = useState<string | null>(null);
    const [professorSchedule, setProfessorSchedule] = useState<ScheduleResponseDto[]>([]);
    const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);

    useEffect(() => {
        const fetchProfessors = async () => {
            try {
                const data = await getProfessors();
                setProfessors(data);
            } catch (error) {
                console.error("Failed to fetch professors", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfessors();
    }, []);

    useEffect(() => {
        if (selectedProfessor) {
            const fetchSchedule = async () => {
                setIsLoadingSchedule(true);
                try {
                    const data = await getProfessorSchedule(selectedProfessor);
                    setProfessorSchedule(data);
                } catch (error) {
                    console.error("Failed to fetch professor schedule", error);
                } finally {
                    setIsLoadingSchedule(false);
                }
            };
            fetchSchedule();
        }
    }, [selectedProfessor]);

    const filteredProfessors = useMemo(() => {
        return professors.filter(p => 
            p.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [professors, searchQuery]);

    const groupedSchedule = useMemo(() => {
        const groups: Record<string, ScheduleResponseDto[]> = {};
        professorSchedule.forEach(course => {
            if (!groups[course.day]) groups[course.day] = [];
            groups[course.day].push(course);
        });
        
        // Sort courses within each day
        Object.keys(groups).forEach(day => {
            groups[day].sort((a, b) => a.time_start.localeCompare(b.time_start));
        });

        return groups;
    }, [professorSchedule]);

    return (
        <PageLayout>
            <div className="min-h-screen px-4 md:px-8 py-10 max-w-7xl mx-auto space-y-8">
                {/* Navigation Breadcrumb */}
                <Link to="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-ionian-blue dark:text-gray-400 dark:hover:text-white transition-colors group">
                    <span className="mr-1 group-hover:-translate-x-0.5 transition-transform">←</span> Back to Dashboard
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Professor List */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                                <div className="p-2 bg-blue-50 dark:bg-white/10 rounded-xl text-blue-600 dark:text-blue-400">
                                    <User size={24} />
                                </div>
                                Professors
                            </h1>
                            <p className="text-slate-500 dark:text-gray-400 font-medium">
                                Academic Program Directory
                            </p>
                        </div>

                        {/* Search Bar */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-ionian-blue transition-colors">
                                <Search size={18} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search professors..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-ionian-blue/20 focus:border-ionian-blue transition-all shadow-sm"
                            />
                        </div>

                        {/* List */}
                        <div className="bg-slate-50/50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm">
                            <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
                                {isLoading ? (
                                    <div className="p-8 space-y-4">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div key={i} className="h-12 bg-white dark:bg-white/5 rounded-xl animate-pulse" />
                                        ))}
                                    </div>
                                ) : filteredProfessors.length > 0 ? (
                                    <div className="divide-y divide-slate-100 dark:divide-white/5">
                                        {filteredProfessors.map((prof) => (
                                            <button
                                                key={prof}
                                                onClick={() => setSelectedProfessor(prof)}
                                                className={clsx(
                                                    "w-full text-left px-6 py-4 flex items-center justify-between transition-all group",
                                                    selectedProfessor === prof 
                                                    ? "bg-white dark:bg-white/10 text-ionian-blue font-bold shadow-sm" 
                                                    : "text-slate-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-white/5 hover:text-ionian-blue"
                                                )}
                                            >
                                                <span className="truncate">{prof}</span>
                                                <ChevronRight 
                                                    size={18} 
                                                    className={clsx(
                                                        "transition-transform", 
                                                        selectedProfessor === prof ? "translate-x-1 opacity-100" : "opacity-0 group-hover:opacity-50"
                                                    )} 
                                                />
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-12 text-center text-slate-500 dark:text-gray-400">
                                        No professors found matching your search.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Professor Schedule */}
                    <div className="lg:col-span-8">
                        <AnimatePresence mode="wait">
                            {!selectedProfessor ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="h-full min-h-[500px] flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-200 dark:border-white/10 p-12"
                                >
                                    <div className="w-20 h-20 bg-white dark:bg-white/10 rounded-full flex items-center justify-center mb-6 shadow-sm text-slate-400">
                                        <Calendar size={32} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Select a Professor</h2>
                                    <p className="text-slate-500 dark:text-gray-400 max-w-sm">Choose a professor from the list to view their weekly academic program.</p>
                                </motion.div>
                            ) : isLoadingSchedule ? (
                                <div className="space-y-6">
                                    <div className="h-20 bg-slate-100 dark:bg-white/5 rounded-3xl animate-pulse" />
                                    <div className="space-y-4">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-32 bg-slate-100 dark:bg-white/5 rounded-3xl animate-pulse" />
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <motion.div
                                    key={selectedProfessor}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-8"
                                >
                                    {/* Selected Header */}
                                    <div className="bg-gradient-to-br from-ionian-blue/10 to-blue-600/5 dark:from-blue-600/20 dark:to-transparent p-8 rounded-3xl border border-blue-100/50 dark:border-white/10 shadow-sm">
                                        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{selectedProfessor}</h2>
                                        <div className="flex items-center gap-4 mt-2 text-slate-500 dark:text-gray-400 font-medium">
                                            <span className="flex items-center gap-2">
                                                <Clock size={16} className="text-ionian-blue" />
                                                Weekly Program
                                            </span>
                                            <span className="w-1 h-1 bg-slate-300 dark:bg-gray-600 rounded-full" />
                                            <span>{professorSchedule.length} Courses Total</span>
                                        </div>
                                    </div>

                                    {/* Weekly Grid */}
                                    <div className="space-y-8">
                                        {WEEK_ORDER.map(day => {
                                            const dayCourses = groupedSchedule[day] || [];
                                            if (dayCourses.length === 0) return null;

                                            return (
                                                <div key={day} className="space-y-4">
                                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2 ml-2">
                                                        <span className="w-2 h-8 bg-ionian-blue rounded-full" />
                                                        {day}
                                                    </h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {dayCourses.map((course, idx) => (
                                                            <div 
                                                                key={idx}
                                                                className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 p-5 rounded-2xl hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-black/20 transition-all group"
                                                            >
                                                                <div className="flex justify-between items-start mb-3">
                                                                    <div className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-ionian-blue dark:text-blue-400 rounded-full text-xs font-bold uppercase tracking-wider">
                                                                        {course.time_start} - {course.time_end}
                                                                    </div>
                                                                    <span className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase">
                                                                        {course.type}
                                                                    </span>
                                                                </div>
                                                                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4 line-clamp-2 leading-tight group-hover:text-ionian-blue transition-colors">
                                                                    {course.course_name}
                                                                </h4>
                                                                <div className="flex flex-col gap-2 text-sm text-slate-500 dark:text-gray-400 font-medium">
                                                                    <div className="flex items-center gap-2">
                                                                        <MapPin size={14} className="text-ionian-blue/60" />
                                                                        {course.room}
                                                                    </div>
                                                                    {course.building && (
                                                                        <div className="flex items-center gap-2">
                                                                            <Building2 size={14} className="text-ionian-blue/60" />
                                                                            {course.building}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        
                                        {Object.keys(groupedSchedule).length === 0 && (
                                            <div className="p-12 text-center bg-slate-50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
                                                <p className="text-slate-500 dark:text-gray-400">No courses found for this professor in the current schedules.</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
