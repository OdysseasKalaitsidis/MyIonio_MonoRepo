import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { signIn } from "../features/auth/authSlice";
import type { RootState, AppDispatch } from "../app/store";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { PageLayout } from "../components/layout/PageLayout";

export default function SignInPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = await dispatch(signIn({ email: email.trim(), password }));
    if (signIn.fulfilled.match(result)) navigate("/dashboard", { replace: true });
  };

  return (
    <PageLayout>
      <main className="mx-auto flex min-h-[calc(100vh-160px)] w-full max-w-md items-center px-5 py-10">
        <section className="w-full">
          <Link to="/" className="mb-8 inline-flex text-sm font-medium text-slate-500 hover:text-ionian-blue">← Αρχική</Link>
          <header className="mb-7">
            <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">Σύνδεση</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Οι επιλογές εξαμήνου και μαθημάτων αυτής της συσκευής παραμένουν αποθηκευμένες.</p>
          </header>

          <div className="mb-6"><GoogleSignInButton /></div>
          <div className="mb-6 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />ή με email<span className="h-px flex-1 bg-slate-200 dark:bg-white/10" /></div>

          <form onSubmit={handleLogin} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Email</span>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" inputMode="email" maxLength={254}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-ionian-blue focus:ring-4 focus:ring-blue-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:ring-blue-900/30" required />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Κωδικός</span>
              <span className="relative block">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" maxLength={128}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-slate-950 outline-none transition focus:border-ionian-blue focus:ring-4 focus:ring-blue-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:ring-blue-900/30" required />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-slate-400 hover:text-slate-700 dark:hover:text-white" aria-label={showPassword ? "Απόκρυψη κωδικού" : "Εμφάνιση κωδικού"}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>
            {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">Λάθος email ή κωδικός.</p>}
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-ionian-blue px-4 py-3 font-bold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-wait disabled:opacity-60">{loading ? "Σύνδεση…" : "Σύνδεση"}</button>
          </form>

          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-500"><ShieldCheck size={15} />Η συνεδρία προστατεύεται με HttpOnly cookies.</div>
          <p className="mt-7 text-center text-sm text-slate-500">Δεν έχεις λογαριασμό;{" "}<Link to="/sign-up" className="font-bold text-ionian-blue hover:underline">Εγγραφή</Link></p>
        </section>
      </main>
    </PageLayout>
  );
}
