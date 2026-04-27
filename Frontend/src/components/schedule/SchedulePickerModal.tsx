import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
    setPreferences,
    updateCoursePreferences,
    setSelectedCourses,
    completeOnboarding,
} from "../../features/preferences/preferencesSlice";
import { MajorsMap } from "../../data/UniData";
import { Check, X, Loader2, ChevronRight, ChevronLeft, Layers } from "lucide-react";
import { saveUserCourses } from "../../features/courses/api";
import { getSchedule, type ScheduleResponseDto } from "../../features/schedule/api";
import clsx from "clsx";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "SEMESTER" | "OPTIONAL_TB" | "MAJOR" | "MINOR" | "ELECTIVES";

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Restricted to "Summer" (Even) semesters as requested
const SEMESTERS = [
    { display: "Β", value: "B", label: "2nd Semester" },
    { display: "Δ", value: "D", label: "4th Semester" },
    { display: "ΣΤ", value: "ΣΤ", label: "6th Semester" },
    { display: "Η", value: "H", label: "8th Semester" },
];

const isEarly = (v: string) => ["A", "B"].includes(v);
const isMiddle = (v: string) => ["C", "D", "E"].includes(v);
const isAdvanced = (v: string) => ["ΣΤ", "Z", "H"].includes(v);

// ─── Helpers: parse the DB `type` field ───────────────────────────────────────

/** Get unique course names from a schedule, optionally filtered */
function uniqueCourseNames(
    schedule: ScheduleResponseDto[],
    filter?: (s: ScheduleResponseDto) => boolean
): string[] {
    const seen = new Set<string>();
    schedule.forEach((s) => {
        if (s.course_name && (!filter || filter(s))) seen.add(s.course_name);
    });
    return Array.from(seen);
}

/** Check if a type string contains a specific tag (Y-XXX, MIN-XXX, etc.) */
function typeContains(type: string | undefined, prefix: string, code: string): boolean {
    if (!type) return false;
    let regexPrefix = prefix;
    if (prefix === "Y") regexPrefix = "[YΥ]";
    else if (prefix === "E") regexPrefix = "[EΕ]";
    const pattern = new RegExp(`^${regexPrefix}-${code}$`);
    return type.split(",").some((t) => pattern.test(t.trim()));
}

/** Check if type starts with a prefix (e.g. "TB") */
function typeStartsWith(type: string | undefined, prefix: string): boolean {
    if (!type) return false;
    return type.split(",").some((t) => t.trim().startsWith(prefix));
}

/** Extract unique major codes found in schedule (from Y-XXX patterns) */
function extractMajorCodes(schedule: ScheduleResponseDto[]): string[] {
    const codes = new Set<string>();
    schedule.forEach((s) => {
        if (!s.type) return;
        s.type.split(",").forEach((t) => {
            const trimmed = t.trim();
            const match = trimmed.match(/^[YΥ]-(.+)$/);
            if (match) codes.add(match[1]);
        });
    });
    return Array.from(codes);
}

/** Extract unique minor codes found in schedule (from MIN-XXX patterns) */
function extractMinorCodes(schedule: ScheduleResponseDto[]): string[] {
    const codes = new Set<string>();
    schedule.forEach((s) => {
        if (!s.type) return;
        s.type.split(",").forEach((t) => {
            const trimmed = t.trim();
            const match = trimmed.match(/^MIN-(.+)$/);
            if (match) codes.add(match[1]);
        });
    });
    return Array.from(codes);
}

// ─── UI Components ────────────────────────────────────────────────────────────

const Badge = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <span className={clsx("px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide shadow-sm", className)}>
        {children}
    </span>
);

const TypeBadge = ({ type, major, minor }: { type: string | undefined; major: string; minor: string }) => {
    if (!type) return <Badge className="bg-slate-100 text-slate-500 border border-slate-200">Course</Badge>;
    const t = type.trim();

    if (new RegExp(`^[YΥ]-${major}$`).test(t)) return <Badge className="bg-blue-50 text-blue-600 border border-blue-100">Major</Badge>;
    if (major && typeContains(t, "MIN", minor)) return <Badge className="bg-purple-50 text-purple-600 border border-purple-100">Minor</Badge>;
    if (major && (new RegExp(`^[EΕ]-${major}$`).test(t) || t === `E-${major}`)) return <Badge className="bg-blue-50/50 text-blue-500 border border-blue-100/50">Major Elective</Badge>;
    if (minor && (new RegExp(`^[EΕ]-${minor}$`).test(t) || t === `E-${minor}`)) return <Badge className="bg-purple-50/50 text-purple-500 border border-purple-100/50">Minor Elective</Badge>;
    if (t.startsWith("TB")) return <Badge className="bg-amber-50 text-amber-600 border border-amber-100">Toolbox</Badge>;
    if (t === "Compulsory") return <Badge className="bg-slate-100 text-slate-600 border border-slate-200">Compulsory</Badge>;

    return <Badge className="bg-slate-50 text-slate-400 border border-slate-200/60">{t}</Badge>;
};

// ─── Main Component ───────────────────────────────────────────────────────────

export function SchedulePickerModal({ isOpen, onClose }: Props) {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { token } = useAppSelector((s: any) => s.auth);

    // Step state
    const [step, setStep] = useState<Step>("SEMESTER");

    // Selection state
    const [selectedSemester, setSelectedSemester] = useState("");
    const [selectedMajor, setSelectedMajor] = useState("");
    const [selectedMinor, setSelectedMinor] = useState("");
    const [selectedElectives, setSelectedElectives] = useState<string[]>([]);
    const [selectedTbCourses, setSelectedTbCourses] = useState<string[]>([]);

    // Data state
    const [scheduleData, setScheduleData] = useState<ScheduleResponseDto[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Middle semester optional TBs
    const [tbOptions, setTbOptions] = useState<ScheduleResponseDto[]>([]);

    // Reset on open
    useEffect(() => {
        if (isOpen) {
            setStep("SEMESTER");
            setSelectedSemester("");
            setSelectedMajor("");
            setSelectedMinor("");
            setSelectedElectives([]);
            setSelectedTbCourses([]);
            setSelectedTbCourses([]);
            setScheduleData([]);
        }
    }, [isOpen]);

    // ── Derived data ─────────────────────────────────────────────────────────

    /** TB courses */
    const tbCourses = useMemo(() => {
        const seen = new Set<string>();
        return scheduleData.filter((s) => {
            if (!typeStartsWith(s.type, "TB") || seen.has(s.course_name)) return false;
            seen.add(s.course_name);
            return true;
        });
    }, [scheduleData]);

    /** Major courses */
    const getMajorCourses = (code: string) => {
        const seen = new Set<string>();
        const pattern = new RegExp(`^[YΥ]-${code}$`);
        return scheduleData.filter((s) => {
            if (seen.has(s.course_name)) return false;
            const isMatch = s.type?.split(",").some((t) => pattern.test(t.trim()));
            if (isMatch) { seen.add(s.course_name); return true; }
            return false;
        });
    };



    /** Elective courses */
    const getElectiveCourses = (major: string, minor: string) => {
        const seen = new Set<string>();
        const electivePattern = new RegExp(`^[EΕ]-(${major}|${minor})$`);
        return scheduleData.filter((s) => {
            if (seen.has(s.course_name)) return false;
            
            // Filter "Elective/Other"
            if (s.type === 'Elective/Other' || s.type?.includes('Elective/Other')) return false;

            const isElective = s.type?.split(",").some((t) => {
                const trimmed = t.trim();
                return electivePattern.test(trimmed);
            });
            if (isElective) { seen.add(s.course_name); return true; }
            return false;
        });
    };

    /** Available major codes */
    const availableMajors = useMemo(() => extractMajorCodes(scheduleData), [scheduleData]);

    /** Available minor codes */
    const availableMinors = useMemo(() => {
        const allMinors = extractMinorCodes(scheduleData);
        return allMinors.filter(m => m !== selectedMajor);
    }, [scheduleData, selectedMajor]);

    // ── Handlers ─────────────────────────────────────────────────────────────



    const handleSemesterSelect = async (value: string) => {
        setSelectedSemester(value);
        setIsLoading(true);

        try {
            const schedule = await getSchedule({ department: "Department of Informatics", semester: value });
            setScheduleData(schedule);

            if (isEarly(value)) {
                await doFinalize({ sem: value, schedule, electives: [], major: "", minor: "", chosenTb: [] });
                return;
            } else if (isAdvanced(value)) {
                setIsLoading(false);
                setStep("MAJOR");
            } else {
                const seen = new Set<string>();
                const uniqueTb: ScheduleResponseDto[] = [];
                schedule.forEach((s) => {
                    if (typeStartsWith(s.type, "TB") && !seen.has(s.course_name)) {
                        seen.add(s.course_name);
                        uniqueTb.push(s);
                    }
                });
                setTbOptions(uniqueTb);
                setIsLoading(false);
                if (uniqueTb.length > 0) {
                    setStep("OPTIONAL_TB");
                } else {
                    await doFinalize({ sem: value, schedule: [], electives: [], major: "", minor: "", chosenTb: [] });
                }
            }
        } catch (err) {
            console.error("Failed to fetch schedule:", err);
            setIsLoading(false);
            if (isAdvanced(value)) {
                setStep("MAJOR");
            } else {
                await doFinalize({ sem: value, schedule: [], electives: [], major: "", minor: "", chosenTb: [] });
            }
        }
    };

    const doFinalize = async (opts: {
        sem: string;
        schedule: ScheduleResponseDto[];
        electives: string[];
        major: string;
        minor: string;
        chosenTb: string[];
    }) => {
        const { sem, schedule, electives, major, minor, chosenTb } = opts;
        let finalCourseNames: string[] = [];

        if (isEarly(sem)) {
            finalCourseNames = uniqueCourseNames(schedule);
        } else if (isMiddle(sem)) {
            const compulsory = uniqueCourseNames(schedule, (s) => !s.type?.startsWith("TB"));
            finalCourseNames = [...compulsory, ...chosenTb];
        } else {
            const majorPattern = new RegExp(`^[YΥ]-${major}$`);
            const majorNames = uniqueCourseNames(schedule, (s) =>
                s.type?.split(",").some((t) => majorPattern.test(t.trim())) ?? false
            );
            const minorNames = uniqueCourseNames(schedule, (s) =>
                typeContains(s.type, "MIN", minor)
            );
            finalCourseNames = Array.from(new Set([...majorNames, ...minorNames, ...electives]));
        }

        dispatch(setPreferences({ department: "Department of Informatics", semester: sem }));
        if (major || minor) {
            dispatch(updateCoursePreferences({ major: major || undefined, minor: minor || undefined }));
        }
        dispatch(setSelectedCourses(finalCourseNames));
        dispatch(completeOnboarding());

        console.log("[DEBUG] SchedulePickerModal.doFinalize: Token present?", !!token);
        if (token) {
            try {
                // Send names directly
                console.log("[DEBUG] Sending courses to backend:", finalCourseNames);
                await saveUserCourses({
                    semester: sem,
                    courses: finalCourseNames,
                    major: major || undefined,
                    minor: minor || undefined,
                });
                console.log("[DEBUG] Courses saved successfully.");
            } catch (e) {
                console.error("Failed to save courses:", e);
            }
        } else {
             console.warn("[DEBUG] No token found, skipping saveUserCourses.");
        }

        onClose();
        navigate("/schedule");
    };

    const handleFinalSubmit = () => {
        doFinalize({
            sem: selectedSemester,
            schedule: scheduleData,
            electives: selectedElectives,
            major: selectedMajor,
            minor: selectedMinor,
            chosenTb: selectedTbCourses
        });
    };

    // ─── Render Steps ────────────────────────────────────────────────────────

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
                    {/* Compact Modal Container - Apple Style */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                        className="relative w-full max-w-4xl h-[85vh] md:h-auto md:max-h-[85vh] bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/50 ring-1 ring-black/5"
                    >
                        {/* Header */}
                        <div className="h-16 flex items-center justify-between px-6 md:px-8 border-b border-slate-200/50 bg-white/40 backdrop-blur-md sticky top-0 z-20">
                            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Academic Preferences</h2>
                            
                            <div className="flex items-center gap-2">
                                {selectedSemester && <div className="hidden sm:inline-block px-3 py-1 bg-white/60 border border-slate-200 rounded-full text-xs font-semibold text-slate-600 shadow-sm">{selectedSemester}</div>}
                                {(selectedMajor || selectedMinor) && <div className="hidden sm:inline-block px-3 py-1 bg-white/60 border border-slate-200 rounded-full text-xs font-semibold text-slate-600 shadow-sm">Specialization</div>}
                                <button
                                    onClick={onClose}
                                    className="ml-2 w-8 h-8 flex items-center justify-center rounded-full bg-slate-200/50 text-slate-500 hover:bg-slate-300/50 hover:text-slate-700 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Loading State - Glass Overlay */}
                        {isLoading && (
                            <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center gap-3">
                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                <span className="text-sm font-medium text-slate-500">Updating...</span>
                            </div>
                        )}

                        {/* Body content */}
                        <div className="flex-1 overflow-y-auto px-6 py-8 md:px-10 relative scrollbar-hide">
                            <AnimatePresence mode="wait" custom={1}>
                                {step === "SEMESTER" && (
                                    <motion.div
                                        key="step-semester"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        className="h-full flex flex-col items-center justify-center space-y-8 min-h-[400px]"
                                    >
                                        <div className="text-center space-y-2">
                                            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">Select Semester</h3>
                                            <p className="text-slate-500 font-medium">Which semester are you currently in?</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
                                            {SEMESTERS.map((sem) => (
                                                <button
                                                    key={sem.value}
                                                    onClick={() => handleSemesterSelect(sem.value)}
                                                    className="group relative p-6 rounded-2xl border border-slate-200/60 bg-white/60 hover:bg-white transition-all text-left flex items-center justify-between hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/5 active:scale-[0.98] duration-200"
                                                >
                                                    <div>
                                                        <span className="text-3xl font-bold text-slate-900 block mb-1 tracking-tight">{sem.display}</span>
                                                        <p className="text-sm text-slate-500 font-semibold">{sem.label}</p>
                                                    </div>
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
                                                        <ChevronRight className="w-5 h-5 ml-0.5" />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {step === "OPTIONAL_TB" && (
                                    <motion.div
                                        key="step-tb"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="max-w-2xl mx-auto space-y-8"
                                    >
                                        <div className="text-center space-y-2">
                                            <h3 className="text-2xl font-bold text-slate-900">Toolbox Courses</h3>
                                            <p className="text-slate-500">Select any optional Toolboxes for this semester</p>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3">
                                            {tbOptions.map((tb) => {
                                                const isSelected = selectedTbCourses.includes(tb.course_name);
                                                return (
                                                    <button
                                                        key={tb.course_name}
                                                        onClick={() => {
                                                            setSelectedTbCourses(prev => 
                                                                isSelected 
                                                                    ? prev.filter(c => c !== tb.course_name)
                                                                    : [...prev, tb.course_name]
                                                            );
                                                        }}
                                                        className={clsx(
                                                            "p-4 rounded-xl border text-left transition-all duration-200 flex items-center gap-4 active:scale-[0.99]",
                                                            isSelected 
                                                                ? "bg-blue-600 border-blue-600 shadow-md shadow-blue-500/20" 
                                                                : "bg-white/60 border-slate-200/60 hover:bg-white hover:border-slate-300"
                                                        )}
                                                    >
                                                        <div className={clsx(
                                                            "w-6 h-6 rounded-full border flex items-center justify-center transition-colors",
                                                            isSelected ? "border-white bg-white/20 text-white" : "border-slate-300 bg-white"
                                                        )}>
                                                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                                        </div>
                                                        <div>
                                                            <div className={clsx("font-semibold text-base", isSelected ? "text-white" : "text-slate-700")}>{tb.course_name}</div>
                                                            <div className={clsx("text-xs font-mono uppercase tracking-wide mt-0.5", isSelected ? "text-blue-100" : "text-slate-400")}>{tb.type}</div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div className="flex justify-center pt-8">
                                            <button
                                                onClick={() => {
                                                    doFinalize({
                                                        sem: selectedSemester,
                                                        schedule: scheduleData,
                                                        electives: [],
                                                        major: "",
                                                        minor: "",
                                                        chosenTb: selectedTbCourses
                                                    });
                                                }}
                                                className="w-full md:w-auto px-10 py-3 bg-slate-900 text-white rounded-full font-bold shadow-lg shadow-slate-900/10 hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all text-sm tracking-wide"
                                            >
                                                Continue
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {step === "MAJOR" && (
                                    <motion.div
                                        key="step-major"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="max-w-4xl mx-auto space-y-8"
                                    >
                                        <div className="text-center space-y-2">
                                            <h3 className="text-2xl font-bold text-slate-900">Select Major</h3>
                                            <p className="text-slate-500">Choose your primary direction</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {availableMajors.filter(code => MajorsMap[code]).map((code) => (
                                                <button
                                                    key={code}
                                                    onClick={() => {
                                                        setSelectedMajor(code);
                                                        setStep("MINOR");
                                                    }}
                                                    className="group relative p-6 rounded-2xl border border-slate-200/60 bg-white/60 hover:bg-white hover:border-blue-200 transition-all flex flex-col items-center text-center gap-4 hover:shadow-xl hover:shadow-blue-500/5 active:scale-[0.98] duration-200"
                                                >
                                                    <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                                                        {code}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                                                            {MajorsMap[code]}
                                                        </div>
                                                        <div className="text-xs text-slate-400 mt-2 uppercase font-semibold tracking-wider">
                                                            {getMajorCourses(code).length} Core Courses
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {step === "MINOR" && (
                                    <motion.div
                                        key="step-minor"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="max-w-2xl mx-auto space-y-8"
                                    >
                                        <div className="flex items-center justify-between">
                                            <button onClick={() => setStep("MAJOR")} className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-900">
                                                <ChevronLeft className="w-5 h-5" />
                                            </button>
                                            <div className="text-center">
                                                <h3 className="text-2xl font-bold text-slate-900">Select Minor</h3>
                                                <p className="text-slate-500 text-sm">Secondary specialization</p>
                                            </div>
                                            <div className="w-9" /> {/* Spacer */}
                                        </div>
                                        
                                        <div className="grid grid-cols-1 gap-3">
                                            {availableMinors.filter(code => MajorsMap[code]).map((code) => (
                                                <button
                                                    key={code}
                                                    onClick={() => {
                                                        setSelectedMinor(code);
                                                        setStep("ELECTIVES");
                                                    }}
                                                    className="group relative p-4 rounded-xl border border-slate-200/60 bg-white/60 hover:bg-white hover:border-purple-200 transition-all flex items-center justify-between hover:shadow-lg hover:shadow-purple-500/5 active:scale-[0.99]"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                                            {code}
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="font-semibold text-slate-800 group-hover:text-purple-700 transition-colors">{MajorsMap[code]}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-slate-300 group-hover:text-purple-400 transition-colors">
                                                        <ChevronRight className="w-5 h-5" />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {step === "ELECTIVES" && (
                                    <motion.div
                                        key="step-electives"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="h-full flex flex-col"
                                    >
                                        <div className="flex items-center justify-between mb-6">
                                            <button onClick={() => setStep("MINOR")} className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-900">
                                                <ChevronLeft className="w-5 h-5" />
                                            </button>
                                            <div className="text-center">
                                                <h3 className="text-xl font-bold text-slate-900">Select Courses</h3>
                                                <p className="text-slate-500 text-sm">Review your plan & choose electives</p>
                                            </div>
                                            <div className="w-9" /> {/* Spacer */}
                                        </div>

                                        <div className="grid grid-cols-3 gap-3 mb-6">
                                            <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-center">
                                                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wide mb-0.5">MAJOR</div>
                                                <div className="font-bold text-blue-900 text-sm truncate">{selectedMajor}</div>
                                            </div>
                                            <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-xl text-center">
                                                <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wide mb-0.5">MINOR</div>
                                                <div className="font-bold text-purple-900 text-sm truncate">{selectedMinor}</div>
                                            </div>
                                            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col items-center justify-center text-center">
                                                <div className="text-lg font-bold text-slate-900 leading-none">{selectedElectives.length}</div>
                                                <div className="text-[9px] text-slate-400 uppercase font-bold tracking-wide">Electives</div>
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-y-auto pr-2 -mr-2 scrollbar-hide">
                                            <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2 sticky top-0 bg-white/95 py-2 z-10 backdrop-blur-sm border-b border-slate-100">
                                                <Layers className="w-4 h-4 text-slate-400" />
                                                Available Courses
                                            </h4>
                                            
                                            <div className="grid grid-cols-1 gap-2 pb-4">
                                                {[...getElectiveCourses(selectedMajor, selectedMinor), ...tbCourses].map((s) => {
                                                    const isSelected = selectedElectives.includes(s.course_name);
                                                    return (
                                                        <button
                                                            key={s.course_name}
                                                            onClick={() => {
                                                                setSelectedElectives((prev) =>
                                                                    isSelected
                                                                        ? prev.filter((c) => c !== s.course_name)
                                                                        : [...prev, s.course_name]
                                                                );
                                                            }}
                                                            className={clsx(
                                                                "p-3 rounded-xl border text-left transition-all duration-200 flex items-start gap-3 active:scale-[0.99]",
                                                                isSelected 
                                                                    ? "bg-blue-600 border-blue-600 shadow-md shadow-blue-500/20" 
                                                                    : "bg-white border-slate-200/60 hover:border-blue-200 hover:bg-slate-50/50"
                                                            )}
                                                        >
                                                            <div className={clsx(
                                                                "w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors mt-0.5 border",
                                                                isSelected ? "bg-white/20 border-white/50 text-white" : "border-slate-300 bg-white"
                                                            )}>
                                                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className={clsx("font-semibold text-sm leading-snug", isSelected ? "text-white" : "text-slate-700")}>
                                                                    {s.course_name}
                                                                </div>
                                                                <div className="flex flex-wrap gap-1.5 mt-1.5 opacity-90">
                                                                    <TypeBadge type={s.type} major={selectedMajor} minor={selectedMinor} />
                                                                </div>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                                {[...getElectiveCourses(selectedMajor, selectedMinor), ...tbCourses].length === 0 && (
                                                     <div className="text-center py-10 text-slate-400 italic border-2 border-dashed border-slate-100 rounded-xl text-sm">
                                                        No additional electives available.
                                                     </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="pt-4 mt-2 border-t border-slate-200/50 flex justify-center">
                                            <button
                                                onClick={handleFinalSubmit}
                                                className="w-full md:w-2/3 py-3.5 bg-blue-600 text-white rounded-full font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-500 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm tracking-wide"
                                            >
                                                Confirm Schedule <Check className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
