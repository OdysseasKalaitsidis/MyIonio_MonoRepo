import { Link } from "react-router-dom";
import { PageLayout } from "../components/layout/PageLayout";
import { TermsContent } from "../components/legal/TermsContent";

export default function TermsPage() {
  return <PageLayout><article className="mx-auto max-w-3xl px-5 py-12"><Link to="/" className="text-sm font-semibold text-ionian-blue">← Αρχική</Link><h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950 dark:text-white">Όροι χρήσης</h1><div className="my-8 h-px bg-slate-200 dark:bg-white/10" /><TermsContent /></article></PageLayout>;
}
