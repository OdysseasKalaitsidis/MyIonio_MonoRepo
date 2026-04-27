import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { signIn } from "../features/auth/authSlice";
import type { RootState, AppDispatch } from "../app/store";
import { Button } from "../components/Button";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { PageLayout } from "../components/layout/PageLayout";

export default function SignInPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(signIn({ email, password }));

    if (signIn.fulfilled.match(result)) {
      navigate("/dashboard");
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  return (
    <PageLayout>
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4">
        {/* Decorative elements - Optional, kept lighter */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
             <div className="absolute -left-[20%] top-[20%] w-[500px] h-[500px] rounded-full bg-ionian-blue/5 dark:bg-ionian-blue/10 blur-[120px]" />
             <div className="absolute -right-[20%] bottom-[20%] w-[500px] h-[500px] rounded-full bg-blue-400/5 dark:bg-blue-400/10 blur-[120px]" />
        </div>

        <div className="relative w-full max-w-md z-10">
          <Link to="/" className="inline-flex items-center text-sm text-slate-500 hover:text-ionian-blue dark:text-gray-400 dark:hover:text-white mb-6 transition-colors">
             <span className="mr-2">←</span> Back to Home
          </Link>
          <div className="text-center mb-8 space-y-3">
            <p className="text-slate-500 dark:text-gray-400 uppercase tracking-[0.3em] text-xs font-semibold">
              Welcome to
            </p>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white transition-colors">Ionio Portal</h1>
            <p className="text-slate-500 dark:text-gray-400 transition-colors">
              Sign in to continue your personalized academic journey.
            </p>
          </div>

          <form
            onSubmit={handleLogin}
            className="bg-white/50 dark:bg-surface/50 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl backdrop-blur-md p-8 space-y-6 transition-all"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-gray-300 transition-colors">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-gray-500 group-focus-within:text-ionian-blue transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-600 pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-ionian-blue/50 focus:border-transparent transition-all"
                  required
                />
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            </div>

            {error && (
              <p className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 rounded-lg px-3 py-2">
                {String(error)}
              </p>
            )}

            <Button
              type="submit"
              className="w-full bg-ionian-blue hover:bg-blue-600 text-white font-semibold py-3 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 transition-all"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>

            <div className="flex items-center gap-4 my-2">
              <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
              <span className="text-xs uppercase text-slate-500 dark:text-gray-400 font-medium">
                Or continue with
              </span>
              <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
            </div>

            <GoogleSignInButton />

            <p className="text-center text-sm text-slate-500 dark:text-gray-400 transition-colors">
              Don’t have an account?{" "}
              <Link
                to="/sign-up"
                className="text-ionian-blue font-semibold hover:text-blue-600 transition"
              >
                Create one
              </Link>
            </p>
          </form>
        </div>
      </div>
    </PageLayout>
  );
}
