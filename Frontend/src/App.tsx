import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./app/store";
import { ConsentProvider } from "./context/ConsentContext";
import { CookieConsentBanner } from "./components/CookieConsentBanner";


import DashboardPage from "./pages/dashboard/DashboardPage";
import QuizPage from "./pages/QuizPage";
import ResultsPage from "./pages/ResultsPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import SchedulePage from "./pages/SchedulePage";
import MenuPage from "./pages/MenuPage";
import LibraryPage from "./pages/LibraryPage";
import ExaminationPage from "./pages/ExaminationPage";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "./app/hooks";
import { setPreferences, updateCoursePreferences } from "./features/preferences/preferencesSlice";

import { Toaster } from "react-hot-toast";

function AuthSync() {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Sync preferences from User Profile to Redux State
      if (user.semester || user.department) {
        dispatch(setPreferences({
          department: user.department || "",
          semester: user.semester || ""
        }));
      }
      
      if (user.major || user.minor) {
        dispatch(updateCoursePreferences({
          major: user.major || undefined,
          minor: user.minor || undefined
        }));
      }
    }
  }, [dispatch, isAuthenticated, user]);

  return null;
}

export function App() {
  return (
    <Provider store={store}>
      <ConsentProvider>
        <CookieConsentBanner />
        <AuthSync /> 
        <Toaster position="top-right" toastOptions={{
          duration: 4000,
          style: {
            background: '#333',
            color: '#fff',
          },
          success: {
            style: {
              background: '#10B981',
            },
          },
          error: {
            style: {
              background: '#EF4444',
            },
          },
        }} />
        <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/login" element={<SignInPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/exams" element={<ExaminationPage />} />
        </Routes>
        </Router>
      </ConsentProvider>
    </Provider>
  );
}
