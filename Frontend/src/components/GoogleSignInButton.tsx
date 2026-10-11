import { useCallback, useEffect, useState } from "react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { AppDispatch } from "../app/store";
import { loginWithGoogle } from "../features/auth/authSlice";
import { getGoogleNonce } from "../features/auth/api";

interface GoogleSignInButtonProps { onSuccess?: (credential: string, nonce: string) => void | Promise<void>; disabled?: boolean; mode?: "signin" | "signup"; }
export const GoogleSignInButton = ({ onSuccess, disabled = false, mode = "signin" }: GoogleSignInButtonProps) => {
  const dispatch = useDispatch<AppDispatch>(); const navigate = useNavigate(); const [nonce, setNonce] = useState<string | null>(null);
  const loadNonce = useCallback(async () => { try { setNonce(await getGoogleNonce()); } catch { setNonce(null); } }, []);
  useEffect(() => { if (!disabled) void loadNonce(); }, [disabled, loadNonce]);
  const handleSuccess = async (response: CredentialResponse) => {
    if (!response.credential || !nonce) return;
    try {
      if (onSuccess) await onSuccess(response.credential, nonce);
      else {
        const result = await dispatch(loginWithGoogle({ idToken: response.credential, nonce }));
        if (loginWithGoogle.fulfilled.match(result)) navigate("/dashboard");
      }
    } finally { void loadNonce(); }
  };
  if (disabled) return <button type="button" disabled className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-400 dark:border-white/10 dark:bg-white/5">Αποδέξου πρώτα τους όρους για εγγραφή με Google</button>;
  if (!nonce) return <div className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-sm text-slate-400 dark:border-white/10">Προετοιμασία ασφαλούς σύνδεσης…</div>;
  return <div className="flex w-full justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-0.5 shadow-sm dark:border-white/10 dark:bg-slate-900"><GoogleLogin key={nonce} onSuccess={handleSuccess} onError={() => void loadNonce()} nonce={nonce} context={mode} theme={document.documentElement.classList.contains("dark") ? "filled_black" : "outline"} shape="rectangular" width="100%" text={mode === "signup" ? "signup_with" : "signin_with"} logo_alignment="left" /></div>;
};
