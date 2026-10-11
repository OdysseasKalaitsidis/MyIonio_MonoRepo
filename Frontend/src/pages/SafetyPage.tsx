import { Link } from "react-router-dom";
import { AlertTriangle, LockKeyhole, Scale, ShieldCheck } from "lucide-react";
import { PageLayout } from "../components/layout/PageLayout";

const email = "odysseaskalaitsides@gmail.com";
const reportHref = "mailto:" + email + "?subject=MyIonio%20report&body=URL%20or%20screen%3A%0AType%20of%20issue%3A%0AWhy%20it%20should%20be%20reviewed%3A%0AHow%20we%20can%20contact%20you%3A";

export default function SafetyPage() {
  return <PageLayout><main className="mx-auto max-w-3xl px-5 py-12">
    <Link to="/" className="text-sm font-semibold text-ionian-blue">← Αρχική</Link>
    <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950 dark:text-white">Ασφάλεια και αναφορές</h1>
    <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">Ανάφερε πρόβλημα ιδιωτικότητας, ασφάλειας, πνευματικών δικαιωμάτων, ανακριβή ακαδημαϊκά στοιχεία ή ύποπτη χειραγώγηση βαθμολογιών.</p>
    <div className="my-8 h-px bg-slate-200 dark:bg-white/10" />
    <div className="space-y-8 text-sm leading-7 text-slate-600 dark:text-slate-300">
      <section className="flex gap-4"><ShieldCheck className="mt-1 shrink-0 text-ionian-blue"/><div><h2 className="text-lg font-bold text-slate-950 dark:text-white">Κάνε αναφορά</h2><p>Στείλε το URL ή την οθόνη, το είδος του προβλήματος και μια σύντομη αιτιολόγηση. Μην στέλνεις κωδικούς, tokens ή περιττά προσωπικά δεδομένα.</p><a href={reportHref} className="mt-3 inline-flex rounded-xl bg-ionian-blue px-4 py-2.5 font-bold text-white hover:bg-blue-700">Αποστολή αναφοράς</a></div></section>
      <section className="flex gap-4"><AlertTriangle className="mt-1 shrink-0 text-amber-600"/><div><h2 className="text-lg font-bold text-slate-950 dark:text-white">Τι συμβαίνει μετά</h2><p>Στόχος μας είναι επιβεβαίωση παραλαβής μέσα σε 48 ώρες. Εξετάζουμε το αίτημα, μπορεί να ζητήσουμε διευκρινίσεις και περιορίζουμε ή διορθώνουμε περιεχόμενο όταν χρειάζεται. Ενημερώνουμε τον αναφέροντα για το αποτέλεσμα, εκτός αν αυτό θα έθετε σε κίνδυνο ασφάλεια ή δικαιώματα τρίτων.</p></div></section>
      <section className="flex gap-4"><LockKeyhole className="mt-1 shrink-0 text-ionian-blue"/><div><h2 className="text-lg font-bold text-slate-950 dark:text-white">Ευπάθεια ασφάλειας</h2><p>Μην αποκτήσεις πρόσβαση σε δεδομένα άλλων και μην διακόψεις την υπηρεσία. Στείλε βήματα αναπαραγωγής ιδιωτικά στο <a className="font-semibold text-ionian-blue hover:underline" href={"mailto:" + email + "?subject=MyIonio%20security%20report"}>{email}</a>.</p></div></section>
      <section className="flex gap-4"><Scale className="mt-1 shrink-0 text-ionian-blue"/><div><h2 className="text-lg font-bold text-slate-950 dark:text-white">Αίτημα δεδομένων</h2><p>Για πρόσβαση, διόρθωση, διαγραφή ή εναντίωση χρησιμοποίησε τη <Link to="/privacy" className="font-semibold text-ionian-blue hover:underline">σελίδα απορρήτου</Link> ή γράψε στο ίδιο email. Για ακαδημαϊκές αποφάσεις, συμβουλεύσου αποκλειστικά τις επίσημες πηγές του Ιονίου Πανεπιστημίου.</p></div></section>
    </div>
  </main></PageLayout>;
}
