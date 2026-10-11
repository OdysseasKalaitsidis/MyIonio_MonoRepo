import { TERMS_VERSION } from "../../legal/versions";

const contact = "odysseaskalaitsides@gmail.com";

export function TermsContent() {
  return (
    <div className="space-y-6 text-sm leading-7 text-slate-600 dark:text-slate-300">
      <p className="font-semibold text-slate-900 dark:text-white">Έκδοση {TERMS_VERSION} · τελευταία ενημέρωση 11 Οκτωβρίου 2026</p>
      <p>Η υπηρεσία λειτουργεί από τον Odysseas Kalaitsidis. Το MyIonio είναι ανεξάρτητο φοιτητικό εργαλείο, όχι επίσημη υπηρεσία, ανακοίνωση ή συνεργάτης του Ιονίου Πανεπιστημίου.</p>
      <section><h2 className="text-lg font-bold text-slate-900 dark:text-white">Ακαδημαϊκές πληροφορίες</h2><p>Προγράμματα, εξετάσεις, μαθήματα, κατευθύνσεις και προτάσεις μπορεί να αλλάξουν ή να περιέχουν λάθη. Πριν από επιλογή μαθήματος, εξέταση ή άλλη σημαντική απόφαση έλεγξε τις επίσημες ανακοινώσεις του Πανεπιστημίου· αυτές υπερισχύουν πάντα.</p></section>
      <section><h2 className="text-lg font-bold text-slate-900 dark:text-white">Επιτρεπτή χρήση</h2><p>Χρησιμοποίησε την υπηρεσία νόμιμα και για προσωπικούς εκπαιδευτικούς σκοπούς. Απαγορεύονται παραβίαση ασφάλειας, αυτοματοποιημένη κατάχρηση, πλαστοπροσωπία, χειραγώγηση βαθμολογιών και προσπάθεια δημοσίευσης παράνομου ή προσβλητικού περιεχομένου. Μπορούμε να περιορίσουμε λογαριασμό για την προστασία χρηστών και υπηρεσίας.</p></section>
      <section><h2 className="text-lg font-bold text-slate-900 dark:text-white">Βαθμολογίες μαθημάτων</h2><p>Οι βαθμολογίες είναι προσωπικές γνώμες χρηστών και εμφανίζονται χωρίς δημόσιο όνομα. Δεν δεχόμαστε σχόλια ελεύθερου κειμένου. Ανακριβή στοιχεία ή ύποπτη χειραγώγηση μπορούν να αναφερθούν στη σελίδα Ασφάλεια και αναφορές.</p></section>
      <section><h2 className="text-lg font-bold text-slate-900 dark:text-white">Διαθεσιμότητα και ευθύνη</h2><p>Η υπηρεσία παρέχεται χωρίς εγγύηση αδιάλειπτης λειτουργίας ή απόλυτης ακρίβειας. Στον μέγιστο βαθμό που επιτρέπει ο νόμος, δεν ευθυνόμαστε για έμμεση ζημία που βασίζεται αποκλειστικά σε ανεπίσημη πληροφορία της εφαρμογής. Τίποτα στους όρους δεν αποκλείει ευθύνη ή δικαίωμα που δεν μπορεί νόμιμα να αποκλειστεί.</p></section>
      <section><h2 className="text-lg font-bold text-slate-900 dark:text-white">Επικοινωνία και αναφορές</h2><p>Για ερώτηση, ένσταση ή αναφορά: <a className="font-semibold text-ionian-blue hover:underline" href={"mailto:" + contact}>{contact}</a> ή <a className="font-semibold text-ionian-blue hover:underline" href="/safety">Ασφάλεια και αναφορές</a>.</p></section>
    </div>
  );
}
