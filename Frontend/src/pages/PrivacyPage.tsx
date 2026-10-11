import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Download, Trash2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { PageLayout } from "../components/layout/PageLayout";
import { PrivacyNoticeContent } from "../components/legal/PrivacyNoticeContent";
import { signOut } from "../features/auth/authSlice";
import { api } from "../lib/axios";

export default function PrivacyPage() {
  const authenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const exportData = async () => {
    setBusy(true); setMessage(null);
    try {
      const response = await api.get("/account/export", { responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = url; anchor.download = `myionio-data-${new Date().toISOString().slice(0, 10)}.json`; anchor.click();
      URL.revokeObjectURL(url);
    } catch { setMessage("Δεν ήταν δυνατή η εξαγωγή. Δοκίμασε ξανά."); } finally { setBusy(false); }
  };

  const deleteAccount = async () => {
    if (confirmation !== "DELETE") return;
    setBusy(true); setMessage(null);
    try {
      await api.delete("/account", { data: { confirmation } });
      await dispatch(signOut());
      navigate("/", { replace: true });
    } catch { setMessage("Δεν ήταν δυνατή η διαγραφή. Δοκίμασε ξανά."); setBusy(false); }
  };

  return <PageLayout><article className="mx-auto max-w-3xl px-5 py-12"><Link to="/" className="text-sm font-semibold text-ionian-blue">← Αρχική</Link><h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950 dark:text-white">Απόρρητο και δεδομένα</h1><div className="my-8 h-px bg-slate-200 dark:bg-white/10" /><PrivacyNoticeContent />
    <section className="mt-12 border-t border-slate-200 pt-8 dark:border-white/10"><h2 className="text-2xl font-black text-slate-950 dark:text-white">Τα δεδομένα του λογαριασμού σου</h2>{authenticated ? <div className="mt-5 space-y-6"><button onClick={exportData} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold hover:border-ionian-blue hover:text-ionian-blue disabled:opacity-50 dark:border-white/20"><Download size={17}/>Λήψη αντιγράφου JSON</button><div className="border-l-2 border-red-300 pl-5"><h3 className="font-bold text-red-700 dark:text-red-300">Οριστική διαγραφή</h3><p className="mt-1 text-sm text-slate-500">Γράψε DELETE για να αφαιρεθεί ο λογαριασμός και το συνδεδεμένο περιεχόμενο.</p><div className="mt-3 flex flex-col gap-3 sm:flex-row"><input value={confirmation} onChange={(e) => setConfirmation(e.target.value)} className="rounded-xl border border-slate-300 bg-transparent px-4 py-2.5 dark:border-white/20" aria-label="Επιβεβαίωση διαγραφής"/><button onClick={deleteAccount} disabled={busy || confirmation !== "DELETE"} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"><Trash2 size={17}/>Διαγραφή λογαριασμού</button></div></div>{message && <p role="alert" className="text-sm text-red-700">{message}</p>}</div> : <p className="mt-3 text-sm text-slate-500"><Link to="/signin" className="font-bold text-ionian-blue">Συνδέσου</Link> για εξαγωγή ή διαγραφή του λογαριασμού σου.</p>}</section>
  </article></PageLayout>;
}
