import { useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import type { AxiosError } from "axios";
import type { AppDispatch, RootState } from "../app/store";
import { Button } from "../components/Button";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { registerUser, registerUserWithTest } from "../features/auth/api";
import { signIn, registerWithGoogle } from "../features/auth/authSlice";
import type { RegisterRequest } from "../features/auth/models";
import { TermsModal } from "../components/TermsModal";
import { PrivacyPolicyModal } from "../components/PrivacyPolicyModal";
import { QuickPickerModal } from "./dashboard/QuickPickerModal";
import { DEPARTMENTS_LIST } from "../features/preferences/constants";
import { useQuizData } from "../hooks/useQuizData";
import { User, Mail, GraduationCap, Lock, Eye, EyeOff, Briefcase } from "lucide-react";
import { PageLayout } from "../components/layout/PageLayout";

export default function SignUpPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { quizRecommendation, quizUserAnswers, clearQuizData } = useQuizData();
  const { department, semester } = useSelector((state: RootState) => state.preferences);

  const availableSemesters = useMemo(() => {
      // Force Summer/Spring semester (Even) as requested
      return ["Β", "Δ", "ΣΤ", "Η"];
  }, []);

  const [form, setForm] = useState<RegisterRequest>({
    name: "",
    surname: "",
    email: "",
    department: DEPARTMENTS_LIST[0],
    semester: availableSemesters[0],
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showQuickPicker, setShowQuickPicker] = useState(false);
  const [googleToken, setGoogleToken] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const shouldSubmitWithTest =
    !!quizRecommendation && (quizUserAnswers?.length ?? 0) > 0;

    const handleGoogleSuccess = (idToken: string) => {
        setGoogleToken(idToken);
        
        // If we already have preferences (dept/semester), use them
        if (department && semester) {
             handleQuickPickerComplete(department, semester.toString(), idToken);
        } else {
             setShowQuickPicker(true);
        }
    };

    const handleQuickPickerComplete = async (dept: string, sem: string, tokenOverride?: string) => {
        const tokenToUse = tokenOverride || googleToken;
        if (!tokenToUse) return;
        
        setShowQuickPicker(false);
        setLoading(true); 

 
      
        let recommendationPayload = null;
        if (shouldSubmitWithTest && quizRecommendation) {
             recommendationPayload = quizRecommendation;
        }

        try {
            const result = await dispatch(registerWithGoogle({
                idToken: tokenToUse,
                department: dept,
                semester: sem, 
                recommendation: recommendationPayload
            }));

            if (registerWithGoogle.fulfilled.match(result)) {
                 setSuccessMessage("Google registration successful! Redirecting...");
                 setTimeout(() => navigate("/dashboard"), 1500);
            } else {
                 if (result.payload) {
                    setError(result.payload as string);
                 } else {
                     setError("Google registration failed.");
                 }
            }

        } catch (err) {
             console.error("Google register unexpected error:", err);
             setError("An unexpected error occurred during Google registration.");
        } finally {
            setLoading(false);
            if (!tokenOverride) setGoogleToken(null);
        }
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const passwordRule =
      /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!passwordRule.test(form.password)) {
      setError(
        "Password must be at least 8 characters, include one uppercase letter and one symbol."
      );
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const payload: RegisterRequest = { ...form };

      if (shouldSubmitWithTest && quizRecommendation && quizUserAnswers) {
        const userAnswersPayload = quizUserAnswers.map((a) => ({
          QuestionId: a.QuestionId,
          AnswerIds: a.AnswerIds,
          SliderValue: a.SliderValue ?? null,
          Ranking: a.Ranking ?? null,
        }));



        const registerResponse = await registerUserWithTest({
          UserData: payload,
          Recommendation: quizRecommendation,
          UserAnswers: userAnswersPayload,
        });

        localStorage.setItem(
          "user",
          JSON.stringify({
            token: registerResponse.token,
            userId: registerResponse.userid,
          })
        );
        
        clearQuizData();
      } else {

        await registerUser(payload);
      }

      setSuccessMessage("Account created successfully. Signing you in...");

      const loginResult = await dispatch(
        signIn({ email: form.email, password: form.password })
      );

      if (signIn.fulfilled.match(loginResult)) {
        navigate("/dashboard");
      } else {
        setError("Account created but auto sign-in failed. Please log in.");
      }
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const message =
        axiosError.response?.data?.message ??
        axiosError.message ??
        "Registration failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4 py-8">
            {/* Background elements */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute -left-[10%] top-[40%] w-[500px] h-[500px] rounded-full bg-ionian-blue/5 dark:bg-ionian-blue/10 blur-[120px]" />
            </div>

            <div className="relative w-full max-w-2xl z-10">
                <Link to="/" className="inline-flex items-center text-sm text-slate-500 hover:text-ionian-blue dark:text-gray-400 dark:hover:text-white mb-6 transition-colors">
                    <span className="mr-2">←</span> Back to Home
                </Link>
                <div className="text-center mb-8 space-y-3">
                <p className="text-slate-500 dark:text-gray-400 uppercase tracking-[0.3em] text-xs font-semibold">
                    Join the portal
                </p>
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white transition-colors">
                    Create Your Account
                </h1>
                <p className="text-slate-500 dark:text-gray-400 max-w-md mx-auto transition-colors">
                    Set up your profile to access personalized recommendations.
                </p>
                </div>

                <form
                onSubmit={handleSubmit}
                className="bg-white/50 dark:bg-surface/50 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl backdrop-blur-md p-8 space-y-6 transition-all"
                >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-gray-300 transition-colors">
                        Name
                    </label>
                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-gray-500 group-focus-within:text-ionian-blue transition-colors" />
                        <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="John"
                        className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-600 pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-ionian-blue/50 focus:border-transparent transition-all"
                        required
                        />
                    </div>
                    </div>

                    <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-gray-300 transition-colors">
                        Surname
                    </label>
                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-gray-500 group-focus-within:text-ionian-blue transition-colors" />
                        <input
                        type="text"
                        name="surname"
                        value={form.surname}
                        onChange={handleChange}
                        placeholder="Doe"
                        className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-600 pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-ionian-blue/50 focus:border-transparent transition-all"
                        required
                        />
                    </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-gray-300 transition-colors">Email</label>
                    <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-gray-500 group-focus-within:text-ionian-blue transition-colors" />
                    <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-600 pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-ionian-blue/50 focus:border-transparent transition-all"
                        required
                    />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-gray-300 transition-colors">
                        Semester
                    </label>
                    <div className="relative group">
                        <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-gray-500 group-focus-within:text-ionian-blue transition-colors" />
                        <select
                        name="semester"
                        value={form.semester}
                        onChange={handleChange}
                        className="dark-select w-full bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 pl-12 pr-8 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-ionian-blue/50 focus:border-transparent transition-all appearance-none"
                        >
                        {availableSemesters.map((semester) => (
                            <option
                            key={semester}
                            value={semester}
                            className="bg-white dark:bg-surface text-slate-900 dark:text-white"
                            >
                            {semester}
                            </option>
                        ))}
                        </select>
                    </div>
                    </div>

                    <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-gray-300 transition-colors">
                        Department
                    </label>
                    <div className="relative group">
                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-gray-500 group-focus-within:text-ionian-blue transition-colors" />
                        <select
                        name="department"
                        value={form.department}
                        onChange={handleChange}
                        className="dark-select w-full bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 pl-12 pr-8 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-ionian-blue/50 focus:border-transparent transition-all appearance-none"
                        >
                        {DEPARTMENTS_LIST.map((dept) => (
                            <option
                            key={dept}
                            value={dept}
                            className="bg-white dark:bg-surface text-slate-900 dark:text-white"
                            >
                            {dept}
                            </option>
                        ))}
                        </select>
                    </div>
                    </div>


                    <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-gray-300 transition-colors">
                        Password
                    </label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-gray-500 group-focus-within:text-ionian-blue transition-colors" />
                        <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-600 pl-12 pr-12 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-ionian-blue/50 focus:border-transparent transition-all"
                        required
                        />
                        <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 hover:text-slate-700 dark:hover:text-white transition-colors"
                        >
                        {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                        ) : (
                            <Eye className="w-5 h-5" />
                        )}
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-gray-500 mt-1">
                        Must contain at least 8 characters, 1 uppercase letter, and 1
                        symbol.
                    </p>
                    </div>

                    <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-gray-300 transition-colors">
                        Confirm Password
                    </label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-gray-500 group-focus-within:text-ionian-blue transition-colors" />
                        <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        placeholder="••••••••••"
                        className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-600 pl-12 pr-12 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-ionian-blue/50 focus:border-transparent transition-all"
                        required
                        />
                        <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 hover:text-slate-700 dark:hover:text-white transition-colors"
                        >
                        {showConfirmPassword ? (
                            <EyeOff className="w-5 h-5" />
                        ) : (
                            <Eye className="w-5 h-5" />
                        )}
                        </button>
                    </div>
                    </div>
                </div>

                {error && (
                    <p className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 rounded-lg px-3 py-2">
                    {error}
                    </p>
                )}

                {successMessage && (
                    <p className="text-green-600 dark:text-green-400 text-sm bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-500/20 rounded-lg px-3 py-2">
                    {successMessage}
                    </p>
                )}

                <Button
                    type="submit"
                    className="w-full bg-ionian-blue hover:bg-blue-600 text-white font-semibold py-3 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 transition-all"
                    disabled={loading}
                >
                    {loading ? "Creating account..." : "Create Account"}
                </Button>

                <div className="relative mt-4">
                    <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200 dark:border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-50 dark:bg-surface/50 px-2 text-slate-500 dark:text-gray-400 rounded-full">
                        Or continue with
                    </span>
                    </div>
                </div>

                <div className="mt-4">
                    <GoogleSignInButton onSuccess={handleGoogleSuccess} />
                </div>

                <p className="text-center text-xs text-slate-500 dark:text-gray-400 mt-4 transition-colors">
                    By pressing sign up you accept the{" "}
                    <span
                    onClick={() => setIsTermsOpen(true)}
                    className="text-ionian-blue hover:underline cursor-pointer font-medium"
                    >
                    terms
                    </span>
                    {" "}and{" "}
                    <span
                    onClick={() => setIsPrivacyOpen(true)}
                    className="text-ionian-blue hover:underline cursor-pointer font-medium"
                    >
                    privacy policy
                    </span>
                </p>

                <p className="text-center text-sm text-slate-500 dark:text-gray-400 transition-colors">
                    Already have an account?{" "}
                    <Link
                    to="/login"
                    className="text-ionian-blue font-semibold hover:text-blue-600 transition"
                    >
                    Sign in
                    </Link>
                </p>
                </form>
            </div>
            <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
            <PrivacyPolicyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
            <QuickPickerModal 
                isOpen={showQuickPicker}
                onClose={() => setShowQuickPicker(false)}
                onComplete={handleQuickPickerComplete}
            />
        </div>
    </PageLayout>
  );
}
