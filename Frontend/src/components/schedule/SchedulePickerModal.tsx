import { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, Loader2, X } from "lucide-react";
import clsx from "clsx";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { completeOnboarding, setPreferences, setSelectedCourses, updateCoursePreferences } from "../../features/preferences/preferencesSlice";
import { saveUserCourses } from "../../features/courses/api";
import { getCourseOptions, getSchedule, type CourseOption, type CourseOptionsResponse, type ScheduleResponseDto } from "../../features/schedule/api";
import { ACTIVE_SEMESTERS, DEPARTMENT_ID_MAP, semesterIdFromValue } from "../../features/preferences/constants";
import { MajorsMap, ToolboxesMap } from "../../data/UniData";

type Step = "semester" | "toolbox" | "major" | "minor" | "electives";
interface Props { isOpen: boolean; onClose: () => void; }

const DEPARTMENT = "Department of Informatics";
const middle = (s: string) => ["Γ", "Δ", "Ε"].includes(s);
const advanced = (s: string) => ["ΣΤ", "Ζ", "Η"].includes(s);
const emptyOptions = (semester: string): CourseOptionsResponse => ({
  academicYear: null, semesterId: semesterIdFromValue(semester) ?? 0, semester, availableMajors: [], availableMinors: [], common: [],
  requiredMajor: [], requiredMinor: [], majorElectives: [], toolboxElectives: [],
  constraints: { selectionMode: "NONE", minimumElectives: 0, maximumElectives: 0 },
});

const merge = (...groups: CourseOption[][]) => {
  const result = new Map<string, CourseOption>();
  groups.flat().forEach((course) => result.set(course.courseId, course));
  return [...result.values()];
};

const legacyCatalog = (rows: ScheduleResponseDto[], semester: string, major = "", minor = "") => {
  const byName = new Map<string, ScheduleResponseDto>();
  rows.forEach((row) => byName.set(row.course_name, row));
  const tags = (row: ScheduleResponseDto) => (row.type || "").split(",").map((tag) => tag.trim());
  const option = (row: ScheduleResponseDto): CourseOption => ({
    courseId: row.course_id || `legacy:${row.course_name}`, courseName: row.course_name,
    semester, ects: 0, roles: row.roles || [],
    toolboxes: row.toolboxes || tags(row).filter((tag) => tag.startsWith("TB")),
  });
  const options = [...byName.values()].map(option);
  const rowFor = (course: CourseOption) => byName.get(course.courseName)!;
  const hasTag = (course: CourseOption, values: string[]) => tags(rowFor(course)).some((tag) => values.includes(tag));
  const hasRole = (course: CourseOption, pathway: string, audience: string, requirement: string) =>
    course.roles.some((role) => role.pathway === pathway && role.audience === audience && role.requirement === requirement);
  const majors = new Set<string>(), minors = new Set<string>();
  options.forEach((course) => {
    course.roles.forEach((role) => (role.audience === "MINOR" ? minors : majors).add(role.pathway));
    tags(rowFor(course)).forEach((tag) => {
      const m = tag.match(/^(?:Y|Υ)-(.+)$/); const n = tag.match(/^MIN-(.+)$/);
      if (m) majors.add(m[1]); if (n) minors.add(n[1]);
    });
  });
  return {
    ...emptyOptions(semester),
    availableMajors: [...majors],
    availableMinors: [...minors].filter((code) => code !== major),
    common: options.filter((course) => course.roles.length === 0 && course.toolboxes.length === 0 &&
      !tags(rowFor(course)).some((tag) => /^(?:Y|Υ|E|Ε|MIN|TB)-?/.test(tag))),
    requiredMajor: options.filter((course) => hasRole(course, major, "MAJOR", "REQUIRED") || hasTag(course, [`Y-${major}`, `Υ-${major}`])),
    requiredMinor: options.filter((course) => hasRole(course, minor, "MINOR", "REQUIRED") || hasTag(course, [`MIN-${minor}`])),
    majorElectives: options.filter((course) => hasRole(course, major, "MAJOR", "ELECTIVE") || hasTag(course, [`E-${major}`, `Ε-${major}`])),
    toolboxElectives: options.filter((course) => course.toolboxes.length > 0),
  };
};

export function SchedulePickerModal({ isOpen, onClose }: Props) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const token = useAppSelector((state: any) => state.auth.token);
  const [step, setStep] = useState<Step>("semester");
  const [semester, setSemester] = useState("");
  const [major, setMajor] = useState("");
  const [minor, setMinor] = useState("");
  const [rows, setRows] = useState<ScheduleResponseDto[]>([]);
  const [options, setOptions] = useState<CourseOptionsResponse>(emptyOptions(""));
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setStep("semester"); setSemester(""); setMajor(""); setMinor(""); setRows([]);
    setOptions(emptyOptions("")); setSelected([]); setError("");
  }, [isOpen]);

  const choices = useMemo(() => middle(semester)
    ? options.toolboxElectives
    : merge(options.majorElectives, options.toolboxElectives), [semester, options]);

  const loadCatalog = async (sem: string, nextMajor = "", nextMinor = "", scheduleRows = rows) => {
    try {
      const result = await getCourseOptions({ department: DEPARTMENT, semesterId: semesterIdFromValue(sem) ?? undefined, semester: sem, major: nextMajor || undefined, minor: nextMinor || undefined });
      if (result.academicYear) return result;
    } catch (reason) {
      console.warn("Using schedule fallback because curriculum catalog is unavailable.", reason);
    }
    return legacyCatalog(scheduleRows, sem, nextMajor, nextMinor);
  };

  const finish = async (
    catalog: CourseOptionsResponse,
    selectedIds: string[],
    nextMajor = major,
    nextMinor = minor,
    targetSemester = semester,
  ) => {
    const { selectionMode, minimumElectives, maximumElectives } = catalog.constraints;
    const invalidExact = selectionMode === "EXACTLY" && selectedIds.length !== minimumElectives;
    const invalidMinimum = selectionMode === "AT_LEAST" && selectedIds.length < minimumElectives;
    const invalidMaximum = maximumElectives != null && selectedIds.length > maximumElectives;
    if (invalidExact || invalidMinimum || invalidMaximum) {
      setError(selectionMode === "EXACTLY"
        ? `Επίλεξε ακριβώς ${minimumElectives} μαθήματα.`
        : `Επίλεξε τουλάχιστον ${minimumElectives} μαθήματα.`);
      return;
    }
    const targetSemesterId = semesterIdFromValue(targetSemester);
    if (!targetSemesterId) {
      setError("Δεν έχει επιλεγεί έγκυρο εξάμηνο."); return;
    }
    const required = merge(catalog.common, catalog.requiredMajor, catalog.requiredMinor);
    const chosen = merge(catalog.majorElectives, catalog.toolboxElectives).filter((course) => selectedIds.includes(course.courseId));
    const courses = merge(required, chosen);
    const courseIds = courses.map((course) => course.courseId);
    const names = courses.map((course) => course.courseName);
    const stableIds = courseIds.every((id) => !id.startsWith("legacy:")) ? courseIds : undefined;
    const departmentId = DEPARTMENT_ID_MAP[DEPARTMENT] || 1;

    dispatch(setPreferences({ department: DEPARTMENT, departmentId, semester: targetSemester, semesterId: targetSemesterId }));
    dispatch(updateCoursePreferences({ major: nextMajor || undefined, minor: nextMinor || undefined }));
    dispatch(setSelectedCourses(names)); dispatch(completeOnboarding());
    if (token) await saveUserCourses({ semester: targetSemester, courses: names, courseIds: stableIds, major: nextMajor || undefined, minor: nextMinor || undefined });
    onClose(); navigate("/schedule");
  };

  const chooseSemester = async (sem: string) => {
    setLoading(true); setError(""); setSemester(sem); setSelected([]);
    try {
      const departmentId = DEPARTMENT_ID_MAP[DEPARTMENT] || 1;
      const scheduleRows = await getSchedule({ department: DEPARTMENT, departmentId, semesterId: semesterIdFromValue(sem) ?? undefined, semester: sem });
      setRows(scheduleRows);
      const catalog = await loadCatalog(sem, "", "", scheduleRows);
      setOptions(catalog);
      if (advanced(sem)) setStep("major");
      else if (middle(sem)) setStep("toolbox");
      else await finish(catalog, [], "", "", sem);
    } catch (reason) {
      console.error(reason); setError("Δεν ήταν δυνατή η φόρτωση του προγράμματος.");
    } finally { setLoading(false); }
  };

  const chooseMinor = async (code: string) => {
    setMinor(code); setLoading(true); setError("");
    try {
      const catalog = await loadCatalog(semester, major, code);
      setOptions(catalog); setSelected([]); setStep("electives");
    } finally { setLoading(false); }
  };

  if (!isOpen) return null;
  const { selectionMode, minimumElectives: min, maximumElectives: max } = options.constraints;
  const validSelection = selectionMode === "EXACTLY"
    ? selected.length === min
    : selectionMode === "AT_LEAST"
      ? selected.length >= min
      : selected.length === 0;
  const toggle = (id: string) => setSelected((current) => {
    if (current.includes(id)) return current.filter((value) => value !== id);
    if (max != null && current.length >= max) return current;
    return [...current, id];
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-sm">
      <div className="relative max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl md:p-8">
        <button onClick={onClose} className="absolute right-5 top-5 rounded-full bg-slate-100 p-2"><X className="h-5 w-5" /></button>
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Academic plan</p>
        <h2 className="mb-7 mt-1 text-2xl font-black text-slate-900">
          {step === "semester" ? "Επίλεξε εξάμηνο" : step === "major" ? "Κύρια κατεύθυνση" : step === "minor" ? "Δευτερεύουσα κατεύθυνση" : "Επίλεξε μαθήματα"}
        </h2>
        {loading && <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-white/80"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>}
        {error && <p className="mb-5 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}

        {step === "semester" && <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {ACTIVE_SEMESTERS.map(({ id, code }) => <button key={id} onClick={() => chooseSemester(code)}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left hover:border-blue-400 hover:bg-blue-50">
            <b className="text-3xl">{code}</b><span className="mt-2 block text-sm text-slate-500">{id}ο εξάμηνο</span>
          </button>)}
        </div>}

        {(step === "major" || step === "minor") && <div>
          <Back onClick={() => setStep(step === "major" ? "semester" : "major")} />
          <div className="grid gap-3 md:grid-cols-3">
            {(step === "major" ? options.availableMajors : options.availableMinors.filter((code) => code !== major)).map((code) =>
              <button key={code} onClick={() => step === "major" ? (setMajor(code), setStep("minor")) : chooseMinor(code)}
                className="rounded-2xl border border-slate-200 p-5 text-left hover:border-blue-400 hover:bg-blue-50">
                <b className="text-blue-700">{code}</b><p className="mt-2 text-sm font-semibold">{MajorsMap[code] || code}</p>
              </button>)}
          </div>
          {(step === "major" ? options.availableMajors : options.availableMinors).length === 0 &&
            <p className="rounded-2xl border-2 border-dashed p-8 text-center text-slate-500">Δεν βρέθηκαν κατευθύνσεις. Ανέβασε πρώτα το πρόγραμμα σπουδών.</p>}
        </div>}

        {(step === "toolbox" || step === "electives") && <div>
          <div className="mb-5 flex items-center justify-between"><Back onClick={() => setStep(step === "toolbox" ? "semester" : "minor")} />
            <span className={clsx("rounded-full px-3 py-1 text-xs font-bold", validSelection ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>{selected.length}/{min} {selectionMode === "EXACTLY" ? "ακριβώς" : "ελάχιστα"}</span>
          </div>
          {step === "electives" && <p className="mb-4 rounded-xl bg-slate-50 p-3 text-sm"><b>Major:</b> {MajorsMap[major] || major} · <b>Minor:</b> {MajorsMap[minor] || minor} · <b>Υποχρεωτικά:</b> {merge(options.common, options.requiredMajor, options.requiredMinor).length}</p>}
          <div className="grid gap-3 md:grid-cols-2">{choices.map((course) => {
            const active = selected.includes(course.courseId);
            return <button key={course.courseId} onClick={() => toggle(course.courseId)}
              className={clsx("flex gap-3 rounded-2xl border p-4 text-left", active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 hover:border-blue-300")}>
              <span className="mt-0.5 h-5 w-5 rounded border p-0.5">{active && <Check className="h-4 w-4" />}</span>
              <span><b className="block">{course.courseName}</b><small className={active ? "text-blue-100" : "text-slate-400"}>{course.toolboxes.map((id) => ToolboxesMap[id] || id).join(" · ") || "Επιλογής κύριας κατεύθυνσης"}</small></span>
            </button>;
          })}</div>
          {choices.length === 0 && <p className="rounded-2xl border-2 border-dashed p-8 text-center text-slate-500">Δεν βρέθηκαν διαθέσιμα μαθήματα.</p>}
          <button disabled={!validSelection} onClick={() => finish(options, selected)}
            className="mx-auto mt-7 flex w-full max-w-md justify-center rounded-full bg-blue-600 px-6 py-3 font-bold text-white disabled:bg-slate-300">Αποθήκευση προγράμματος</button>
        </div>}
      </div>
    </div>
  );
}

function Back({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick} className="flex items-center gap-1 text-sm font-semibold text-slate-500"><ChevronLeft className="h-4 w-4" />Πίσω</button>;
}
