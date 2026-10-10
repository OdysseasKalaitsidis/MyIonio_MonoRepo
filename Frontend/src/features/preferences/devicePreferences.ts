import { semesterIdFromValue } from "./constants";

export const DEVICE_PREFERENCES_KEY = "myionio.devicePreferences.v1";

export interface DevicePreferences {
  version: 1;
  department: string | null;
  departmentId: number | null;
  semester: string | number | null;
  semesterId: number | null;
  major: string | null;
  minor: string | null;
  toolbox: string[];
  hiddenCourses: string[];
  selectedCoursesBySemester: Record<string, string[]>;
  onboardingCompleted: boolean;
  updatedAt: string;
}

const emptyPreferences = (): DevicePreferences => ({
  version: 1,
  department: null,
  departmentId: null,
  semester: null,
  semesterId: null,
  major: null,
  minor: null,
  toolbox: [],
  hiddenCourses: [],
  selectedCoursesBySemester: {},
  onboardingCompleted: false,
  updatedAt: new Date(0).toISOString(),
});

const stringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const safeJson = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const sanitize = (value: Partial<DevicePreferences>): DevicePreferences => {
  const semesterId = Number(value.semesterId) || semesterIdFromValue(value.semester) || null;
  const selections = Object.fromEntries(
    Object.entries(value.selectedCoursesBySemester || {})
      .filter(([key]) => /^\d+$/.test(key))
      .map(([key, courses]) => [key, stringArray(courses)]),
  );

  return {
    version: 1,
    department: typeof value.department === "string" ? value.department : null,
    departmentId: Number(value.departmentId) || null,
    semester: typeof value.semester === "string" || typeof value.semester === "number" ? value.semester : null,
    semesterId,
    major: typeof value.major === "string" ? value.major : null,
    minor: typeof value.minor === "string" ? value.minor : null,
    toolbox: stringArray(value.toolbox),
    hiddenCourses: stringArray(value.hiddenCourses),
    selectedCoursesBySemester: selections,
    onboardingCompleted: value.onboardingCompleted === true,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : new Date().toISOString(),
  };
};

const migrateLegacyPreferences = (): DevicePreferences => {
  const semester = localStorage.getItem("hud_semester");
  const semesterId = Number(localStorage.getItem("hud_semesterId")) || semesterIdFromValue(semester);
  const selectedCourses = stringArray(safeJson(localStorage.getItem("hud_selectedCourses"), []));
  const selectedSemesterId = Number(localStorage.getItem("hud_selectedCoursesSemesterId")) || semesterId;

  return sanitize({
    department: localStorage.getItem("hud_department"),
    departmentId: Number(localStorage.getItem("hud_departmentId")) || null,
    semester,
    semesterId,
    major: localStorage.getItem("hud_major"),
    minor: localStorage.getItem("hud_minor"),
    toolbox: stringArray(safeJson(localStorage.getItem("hud_toolbox"), [])),
    hiddenCourses: stringArray(safeJson(localStorage.getItem("hud_hiddenCourses"), [])),
    selectedCoursesBySemester: selectedSemesterId && selectedCourses.length
      ? { [String(selectedSemesterId)]: selectedCourses }
      : {},
    onboardingCompleted: localStorage.getItem("hud_onboardingCompleted") === "true" || Boolean(semester),
  });
};

export const loadDevicePreferences = (): DevicePreferences => {
  if (typeof localStorage === "undefined") return emptyPreferences();
  const stored = safeJson<Partial<DevicePreferences> | null>(
    localStorage.getItem(DEVICE_PREFERENCES_KEY),
    null,
  );
  if (stored?.version === 1) return sanitize(stored);

  const migrated = migrateLegacyPreferences();
  if (migrated.department || migrated.semester) saveDevicePreferences(migrated);
  return migrated;
};

export const saveDevicePreferences = (preferences: DevicePreferences): void => {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(DEVICE_PREFERENCES_KEY, JSON.stringify({
    ...sanitize(preferences),
    updatedAt: new Date().toISOString(),
  }));
};

const LEGACY_PREFERENCE_KEYS = [
  "hud_department",
  "hud_departmentId",
  "hud_semester",
  "hud_semesterId",
  "hud_major",
  "hud_minor",
  "hud_toolbox",
  "hud_hiddenCourses",
  "hud_selectedCourses",
  "hud_selectedCoursesSemesterId",
  "hud_onboardingCompleted",
];

export const clearDevicePreferences = (): void => {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(DEVICE_PREFERENCES_KEY);
  LEGACY_PREFERENCE_KEYS.forEach((key) => localStorage.removeItem(key));
};
