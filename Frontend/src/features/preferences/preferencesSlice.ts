import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface PreferencesState {
  department: string | null;
  semester: string | number | null;
  major: string | null;
  minor: string | null;
  toolbox: string[];
  hiddenCourses: string[];
  selectedCourses: string[]; 
  onboardingCompleted: boolean;
  isFirstVisit: boolean;
  isOnboardingOpen: boolean;
}

const initialState: PreferencesState = {
  department: localStorage.getItem('hud_department'),
  semester: localStorage.getItem('hud_semester') || null,
  major: localStorage.getItem('hud_major'),
  minor: localStorage.getItem('hud_minor'),
  toolbox: JSON.parse(localStorage.getItem('hud_toolbox') || '[]'),
  hiddenCourses: JSON.parse(localStorage.getItem('hud_hiddenCourses') || '[]'),
  selectedCourses: JSON.parse(localStorage.getItem('hud_selectedCourses') || '[]'),
  onboardingCompleted: localStorage.getItem('hud_onboardingCompleted') === 'true',
  isFirstVisit: !localStorage.getItem('hud_department'), // If no dept set, assume first visit or guest
  isOnboardingOpen: false,
};

export const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    setPreferences: (state, action: PayloadAction<{ department: string; semester: string | number }>) => {
      state.department = action.payload.department;
      state.semester = action.payload.semester;
      state.isFirstVisit = false;
      
      localStorage.setItem('hud_department', action.payload.department);
      localStorage.setItem('hud_semester', String(action.payload.semester));
    },
    updateCoursePreferences: (state, action: PayloadAction<{ major?: string; minor?: string; toolbox?: string[] }>) => {
        if (action.payload.major !== undefined) state.major = action.payload.major;
        if (action.payload.minor !== undefined) state.minor = action.payload.minor;
        if (action.payload.toolbox !== undefined) state.toolbox = action.payload.toolbox;

        if (state.toolbox) localStorage.setItem('hud_toolbox', JSON.stringify(state.toolbox));
    },
    toggleHiddenCourse: (state, action: PayloadAction<string>) => {
        if (state.hiddenCourses.includes(action.payload)) {
            state.hiddenCourses = state.hiddenCourses.filter(c => c !== action.payload);
        } else {
            state.hiddenCourses.push(action.payload);
        }
        localStorage.setItem('hud_hiddenCourses', JSON.stringify(state.hiddenCourses));
    },
    setSelectedCourses: (state, action: PayloadAction<string[]>) => {
        state.selectedCourses = action.payload;
        localStorage.setItem('hud_selectedCourses', JSON.stringify(state.selectedCourses));
    },
    toggleCourse: (state, action: PayloadAction<string>) => {
        if (state.selectedCourses.includes(action.payload)) {
            state.selectedCourses = state.selectedCourses.filter(c => c !== action.payload);
        } else {
            state.selectedCourses.push(action.payload);
        }
        localStorage.setItem('hud_selectedCourses', JSON.stringify(state.selectedCourses));
    },
    completeOnboarding: (state) => {
        state.onboardingCompleted = true;
        localStorage.setItem('hud_onboardingCompleted', 'true');
    },
    clearPreferences: (state) => {
        state.department = null;
        state.semester = null;
        state.major = null;
        state.minor = null;
        state.toolbox = [];
        state.hiddenCourses = [];
        state.isFirstVisit = true;
        localStorage.removeItem('hud_department');
        localStorage.removeItem('hud_semester');
        localStorage.removeItem('hud_major');
        localStorage.removeItem('hud_minor');
        localStorage.removeItem('hud_toolbox');
        localStorage.removeItem('hud_hiddenCourses');
        localStorage.removeItem('hud_selectedCourses');
        localStorage.removeItem('hud_onboardingCompleted');
    },
    restorePreferences: (state) => {
        const dept = localStorage.getItem('hud_department');
        const sem = localStorage.getItem('hud_semester');
        if (dept && sem) {
            state.department = dept;
            state.semester = sem;
            state.isFirstVisit = false;
        }
        
        const major = localStorage.getItem('hud_major');
        const minor = localStorage.getItem('hud_minor');
        const toolbox = localStorage.getItem('hud_toolbox');
        const hidden = localStorage.getItem('hud_hiddenCourses');
        const selected = localStorage.getItem('hud_selectedCourses');
        const completed = localStorage.getItem('hud_onboardingCompleted');

        if (major) state.major = major;
        if (minor) state.minor = minor;
        if (toolbox) state.toolbox = JSON.parse(toolbox);
        if (hidden) state.hiddenCourses = JSON.parse(hidden);
        if (selected) state.selectedCourses = JSON.parse(selected);
        if (completed) state.onboardingCompleted = completed === 'true';
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
