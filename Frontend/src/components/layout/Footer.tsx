import { Link } from "react-router-dom";
import { useConsent } from "../../context/ConsentContext";
export function Footer() {
  const { resetConsent } = useConsent();
  return <footer className="mt-12 w-full border-t border-slate-200 bg-slate-50 py-8 dark:border-white/5 dark:bg-black/20"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-slate-500 sm:px-6 md:flex-row"><p>© {new Date().getFullYear()} MyIonio · Ανεξάρτητο φοιτητικό project</p><nav aria-label="Νομικές πληροφορίες" className="flex flex-wrap justify-center gap-5"><Link to="/terms" className="hover:text-ionian-blue">Όροι</Link><Link to="/privacy" className="hover:text-ionian-blue">Απόρρητο</Link><Link to="/safety" className="hover:text-ionian-blue">Ασφάλεια & αναφορές</Link><button onClick={resetConsent} className="hover:text-ionian-blue">Ενημέρωση αποθήκευσης</button></nav></div></footer>;
}
