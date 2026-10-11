import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import type { AxiosError } from "axios";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import type { AppDispatch, RootState } from "../app/store";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { registerUser, registerUserWithTest } from "../features/auth/api";
import { registerWithGoogle, signIn } from "../features/auth/authSlice";
import type { RegisterRequest } from "../features/auth/models";
import { QuickPickerModal } from "./dashboard/QuickPickerModal";
import { ACTIVE_SEMESTERS, DEPARTMENTS_LIST } from "../features/preferences/constants";
import { useQuizData } from "../hooks/useQuizData";
import { PageLayout } from "../components/layout/PageLayout";
import { PRIVACY_VERSION, TERMS_VERSION } from "../legal/versions";

const allowPasswordRegistration = import.meta.env.VITE_ALLOW_PASSWORD_REGISTRATION === "true";

export default function SignUpPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const preferences = useSelector((state: RootState) => state.preferences);
  const { quizRecommendation, quizUserAnswers, clearQuizData } = useQuizData();
  const activeSemesters = ACTIVE_SEMESTERS.map(({ code }) => code);

  const [form, setForm] = useState<RegisterRequest>({
    name: "",
    surname: "",
    email: "",
    department: preferences.department || DEPARTMENTS_LIST[0],
    semester: preferences.semester ? String(preferences.semester) : activeSemesters[0],
    password: "",
    confirmPassword: "",
    acceptTerms: false,
    acknowledgePrivacy: false,
    termsVersion: TERMS_VERSION,
    privacyVersion: PRIVACY_VERSION,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showQuickPicker, setShowQuickPicker] = useState(false);
  const [googleCredential, setGoogleCredential] = useState<{ idToken: string; nonce: string } | null>(null);

  const shouldSubmitWithTest = Boolean(quizRecommendation && quizUserAnswers?.length);
  const hasDeviceProfile = Boolean(preferences.department && preferences.semester);

  const finishGoogleRegistration = async (idToken: string, nonce: string, department: string, semester: string) => {
    setLoading(true);
    setError(null);
    const result = await dispatch(registerWithGoogle({
      idToken,
      nonce,
      department,
      semester,
      recommendation: quizRecommendation,
      acceptTerms: form.acceptTerms,
      acknowledgePrivacy: form.acknowledgePrivacy,
      termsVersion: TERMS_VERSION,
      privacyVersion: PRIVACY_VERSION,
    }));
    setLoading(false);
    if (registerWithGoogle.fulfilled.match(result)) {
      clearQuizData();
      navigate("/dashboard", { replace: true });
    } else {
      setError(result.payload || "Η εγγραφή με Google απέτυχε.");
    }
  };

  const handleGoogleSuccess = async (idToken: string, nonce: string) => {
    if (!form.acceptTerms || !form.acknowledgePrivacy) { setError("Αποδέξου τους όρους και επιβεβαίωσε ότι διάβασες την ενημέρωση απορρήτου."); return; }
    if (hasDeviceProfile) {
      await finishGoogleRegistration(idToken, nonce, preferences.department!, String(preferences.semester));
      return;
    }
    setGoogleCredential({ idToken, nonce });
    setShowQuickPicker(true);
  };

  const handleQuickPickerComplete = async (department: string, semester: string) => {
    setForm((current) => ({ ...current, department, semester }));
    setShowQuickPicker(false);
    if (googleCredential) await finishGoogleRegistration(googleCredential.idToken, googleCredential.nonce, department, semester);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((current) => name === "password"
      ? { ...current, password: value, confirmPassword: value }
      : { ...current, [name]: value });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.acceptTerms || !form.acknowledgePrivacy) {
      setError("Αποδέξου τους όρους και επιβεβαίωσε ότι διάβασες την ενημέρωση απορρήτου.");
      return;
    }
    const passwordRule = /^(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,128}$/;
    if (!passwordRule.test(form.password)) {
      setError("Ο κωδικός χρειάζεται 8 χαρακτήρες, ένα κεφαλαίο γράμμα και ένα σύμβολο.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const payload = { ...form, email: form.email.trim(), name: form.name.trim(), surname: form.surname.trim() };
      if (shouldSubmitWithTest && quizRecommendation && quizUserAnswers) {
        await registerUserWithTest({
          UserData: payload,
          Recommendation: quizRecommendation,
          UserAnswers: quizUserAnswers.map((answer) => ({
            QuestionId: answer.QuestionId,
            AnswerIds: answer.AnswerIds,
            SliderValue: answer.SliderValue ?? null,
            Ranking: answer.Ranking ?? null,
          })),
        });
        clearQuizData();
      } else {
        await registerUser(payload);
      }

      const loginResult = await dispatch(signIn({ email: payload.email, password: payload.password }));
      if (signIn.fulfilled.match(loginResult)) navigate("/dashboard", { replace: true });
      else setError("Ο λογαριασμός δημιουργήθηκε. Συνδέσου για να συνεχίσεις.");
    } catch (reason) {
      const axiosError = reason as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || "Δεν ήταν δυνατή η δημιουργία λογαριασμού.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-ionian-blue focus:ring-4 focus:ring-blue-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:ring-blue-900/30";

  return (
    <PageLayout>
      <main className="mx-auto w-full max-w-xl px-5 py-10">
        <Link to="/" className="mb-8 inline-flex text-sm font-medium text-slate-500 hover:text-ionian-blue">← Αρχική</Link>
        <header className="mb-7">
          <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">Δημιουργία λογαριασμού</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Το ακαδημαϊκό προφίλ της συσκευής θα χρησιμοποιηθεί αυτόματα — δεν χρειάζεται νέο onboarding.</p>
        </header>

        <label className="mb-4 flex items-start gap-3 rounded-xl border border-slate-200 p-4 text-sm leading-6 text-slate-600 dark:border-white/10 dark:text-slate-300"><input type="checkbox" checked={form.acceptTerms && form.acknowledgePrivacy} onChange={(event) => setForm((current) => ({ ...current, acceptTerms: event.target.checked, acknowledgePrivacy: event.target.checked }))} className="mt-1 h-4 w-4 accent-ionian-blue"/><span>Αποδέχομαι τους <Link to="/terms" target="_blank" rel="noreferrer" className="font-bold text-ionian-blue hover:underline">Όρους χρήσης</Link> και επιβεβαιώνω ότι διάβασα την <Link to="/privacy" target="_blank" rel="noreferrer" className="font-bold text-ionian-blue hover:underline">Ενημέρωση απορρήτου</Link>.</span></label>

        <div className="mb-4"><GoogleSignInButton onSuccess={handleGoogleSuccess} disabled={!form.acceptTerms || !form.acknowledgePrivacy} mode="signup" /></div>
        {!allowPasswordRegistration && <p className="mb-6 flex items-start gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900 dark:bg-blue-950/30 dark:text-blue-200"><ShieldCheck className="mt-1 shrink-0" size={16}/>Οι νέες εγγραφές γίνονται με Google ώστε το email να είναι επαληθευμένο. Υπάρχοντες λογαριασμοί email μπορούν να συνδεθούν κανονικά.</p>}
        {allowPasswordRegistration && <>
        <div className="mb-6 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />ή με email<span className="h-px flex-1 bg-slate-200 dark:bg-white/10" /></div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label><span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Όνομα</span><input name="name" value={form.name} onChange={handleChange} autoComplete="given-name" maxLength={80} className={inputClass} required /></label>
            <label><span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Επώνυμο</span><input name="surname" value={form.surname} onChange={handleChange} autoComplete="family-name" maxLength={80} className={inputClass} required /></label>
          </div>

          <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Email</span><input type="email" name="email" value={form.email} onChange={handleChange} autoComplete="email" inputMode="email" maxLength={254} className={inputClass} required /></label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Κωδικός</span>
            <span className="relative block"><input type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange} autoComplete="new-password" maxLength={128} className={`${inputClass} pr-12`} required />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-slate-400 hover:text-slate-700 dark:hover:text-white" aria-label={showPassword ? "Απόκρυψη κωδικού" : "Εμφάνιση κωδικού"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </span>
            <span className="mt-1.5 block text-xs text-slate-500">8+ χαρακτήρες, ένα κεφαλαίο γράμμα και ένα σύμβολο.</span>
          </label>

          <fieldset className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
            <legend className="px-2 text-sm font-bold text-slate-700 dark:text-slate-200">Αποθηκευμένο ακαδημαϊκό προφίλ</legend>
            <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
              <select name="department" value={form.department} onChange={handleChange} className={inputClass} aria-label="Τμήμα">
                {DEPARTMENTS_LIST.map((department) => <option key={department} value={department}>{department}</option>)}
              </select>
              <select name="semester" value={form.semester} onChange={handleChange} className={inputClass} aria-label="Εξάμηνο">
                {activeSemesters.map((semester) => <option key={semester} value={semester}>{semester} εξάμηνο</option>)}
              </select>
            </div>
            <p className="mt-2 text-xs text-slate-500">Μπορείς να το αλλάξεις αργότερα από το Πρόγραμμα.</p>
          </fieldset>

          {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-ionian-blue px-4 py-3 font-bold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-wait disabled:opacity-60">{loading ? "Δημιουργία…" : "Δημιουργία λογαριασμού"}</button>
        </form>
        </>}

        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-500"><ShieldCheck size={15} />Η σύνδεση χρησιμοποιεί ασφαλή HttpOnly cookies που δεν είναι προσβάσιμα από JavaScript.</div>
        <p className="mt-5 text-center text-sm text-slate-500">Έχεις ήδη λογαριασμό;{" "}<Link to="/signin" className="font-bold text-ionian-blue hover:underline">Σύνδεση</Link></p>

        <QuickPickerModal isOpen={showQuickPicker} onClose={() => setShowQuickPicker(false)} onComplete={handleQuickPickerComplete} />
      </main>
    </PageLayout>
  );
}
