import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { semesterIdFromValue } from './constants';
import { clearDevicePreferences, loadDevicePreferences, saveDevicePreferences } from './devicePreferences';

interface PreferencesState {
  department: string | null;
  departmentId: number | null;
  semester: string | number | null;
  semesterId: number | null;
  major: string | null;
  minor: string | null;
  toolbox: string[];
  hiddenCourses: string[];
  selectedCourses: string[];
  selectedCoursesSemesterId: number | null;
  selectedCoursesBySemester: Record<string, string[]>;
  onboardingCompleted: boolean;
  isFirstVisit: boolean;
  isOnboardingOpen: boolean;
}

const stored = loadDevicePreferences();
const initialState: PreferencesState = {
  ...stored,
  selectedCourses: stored.semesterId ? stored.selectedCoursesBySemester[String(stored.semesterId)] || [] : [],
  selectedCoursesSemesterId: stored.semesterId,
  isFirstVisit: !stored.department || !stored.semester,
  isOnboardingOpen: false,
};

const persist = (state: PreferencesState) => saveDevicePreferences({
  version: 1,
  department: state.department,
  departmentId: state.departmentId,
  semester: state.semester,
  semesterId: state.semesterId,
  major: state.major,
  minor: state.minor,
  toolbox: state.toolbox,
  hiddenCourses: state.hiddenCourses,
  selectedCoursesBySemester: state.selectedCoursesBySemester,
  onboardingCompleted: state.onboardingCompleted,
  updatedAt: new Date().toISOString(),
});

export const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    setPreferences: (state, action: PayloadAction<{ department: string; departmentId: number; semester: string | number; semesterId?: number }>) => {
      const nextSemesterId = action.payload.semesterId ?? semesterIdFromValue(action.payload.semester);
      state.department = action.payload.department;
      state.departmentId = action.payload.departmentId;
      state.semester = action.payload.semester;
      state.semesterId = nextSemesterId;
      state.selectedCourses = nextSemesterId ? state.selectedCoursesBySemester[String(nextSemesterId)] || [] : [];
      state.selectedCoursesSemesterId = nextSemesterId;
      state.isFirstVisit = false;
      state.onboardingCompleted = true;
      persist(state);
    },
    updateCoursePreferences: (state, action: PayloadAction<{ major?: string; minor?: string; toolbox?: string[] }>) => {
        if (action.payload.major !== undefined) state.major = action.payload.major;
        if (action.payload.minor !== undefined) state.minor = action.payload.minor;
        if (action.payload.toolbox !== undefined) state.toolbox = action.payload.toolbox;

        persist(state);
    },
    toggleHiddenCourse: (state, action: PayloadAction<string>) => {
        if (state.hiddenCourses.includes(action.payload)) {
            state.hiddenCourses = state.hiddenCourses.filter(c => c !== action.payload);
        } else {
            state.hiddenCourses.push(action.payload);
        }
        persist(state);
    },
    setSelectedCourses: (state, action: PayloadAction<string[]>) => {
        state.selectedCourses = action.payload;
        state.selectedCoursesSemesterId = state.semesterId;
        if (state.selectedCoursesSemesterId) {
          state.selectedCoursesBySemester[String(state.selectedCoursesSemesterId)] = [...state.selectedCourses];
        }
        persist(state);
    },
    toggleCourse: (state, action: PayloadAction<string>) => {
        if (state.selectedCourses.includes(action.payload)) {
            state.selectedCourses = state.selectedCourses.filter(c => c !== action.payload);
        } else {
            state.selectedCourses.push(action.payload);
        }
        if (state.semesterId) state.selectedCoursesBySemester[String(state.semesterId)] = [...state.selectedCourses];
        persist(state);
    },
    completeOnboarding: (state) => {
        state.onboardingCompleted = true;
        persist(state);
    },
    clearPreferences: (state) => {
        state.department = null;
        state.departmentId = null;
        state.semester = null;
        state.semesterId = null;
        state.major = null;
        state.minor = null;
        state.toolbox = [];
        state.hiddenCourses = [];
        state.selectedCourses = [];
        state.selectedCoursesSemesterId = null;
        state.selectedCoursesBySemester = {};
        state.onboardingCompleted = false;
        state.isFirstVisit = true;
        clearDevicePreferences();
    },
    restorePreferences: (state) => {
        const restored = loadDevicePreferences();
        Object.assign(state, restored, {
          selectedCourses: restored.semesterId ? restored.selectedCoursesBySemester[String(restored.semesterId)] || [] : [],
          selectedCoursesSemesterId: restored.semesterId,
          isFirstVisit: !restored.department || !restored.semester,
        });
    },
    openOnboarding: (state) => {
        state.isOnboardingOpen = true;
    },
    closeOnboarding: (state) => {
        state.isOnboardingOpen = false;
    }
  },
});

export const { setPreferences, updateCoursePreferences, toggleHiddenCourse, clearPreferences, restorePreferences, setSelectedCourses, toggleCourse, completeOnboarding, openOnboarding, closeOnboarding } = preferencesSlice.actions;

export default preferencesSlice.reducer;
