import { Button } from "./Button";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  confirmLabel?: string;
}

export function TermsModal({ isOpen, onClose, confirmLabel = "Κατάλαβα" }: TermsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden bg-white dark:bg-deep-navy border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col text-slate-900 dark:text-white">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 backdrop-blur-md">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Όροι και προϋποθέσεις
          </h2>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 text-slate-600 dark:text-gray-300">
            <strong className="text-slate-900 dark:text-white">Τελευταία ενημέρωση: {new Date().toLocaleDateString("el-GR")}</strong>
          <p>
            Καλώς ήρθες στο MyIonio. Με την εγγραφή σου αποδέχεσαι τους παρακάτω όρους
            και προϋποθέσεις. Διάβασέ τους προσεκτικά.
          </p>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-4">1. Ηλικιακό όριο</h3>
          <p>
            Πρέπει να είσαι τουλάχιστον 16 ετών για να χρησιμοποιήσεις την υπηρεσία. Με τη δημιουργία λογαριασμού δηλώνεις ότι πληροίς αυτή την προϋπόθεση.
          </p>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-4">2. Μη εμπορική χρήση</h3>
          <p>
            Το MyIonio παρέχεται αποκλειστικά για <strong>εκπαιδευτική και προσωπική ακαδημαϊκή χρήση</strong>. Απαγορεύεται αυστηρά κάθε εμπορική χρήση, εταιρική ανάπτυξη ή μεταπώληση της υπηρεσίας.
          </p>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-4">3. Συμπεριφορά χρήστη</h3>
          <p>
            Συμφωνείς να μην τροποποιείς, παραβιάζεις ή επιχειρείς να θέσεις σε κίνδυνο την ασφάλεια της εφαρμογής. Η παρενόχληση, ο εκφοβισμός ή η ανάρτηση παράνομου περιεχομένου οδηγούν σε άμεση διακοπή του λογαριασμού σου.
          </p>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-4">4. Τερματισμός</h3>
          <p>
            Διατηρούμε το δικαίωμα να αναστείλουμε ή να τερματίσουμε τον λογαριασμό σου, κατά την απόλυτη κρίση μας και χωρίς προειδοποίηση, για συμπεριφορά που θεωρούμε ότι παραβιάζει τους όρους ή βλάπτει άλλους χρήστες, εμάς ή τρίτους.
          </p>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-4">5. Αποποίηση εγγυήσεων</h3>
          <p>
            Η υπηρεσία παρέχεται «ΩΣ ΕΧΕΙ» και «ΟΠΩΣ ΕΙΝΑΙ ΔΙΑΘΕΣΙΜΗ». Δεν παρέχουμε καμία ρητή ή έμμεση εγγύηση. Δεν εγγυόμαστε ότι η υπηρεσία θα είναι αδιάλειπτη, έγκαιρη, ασφαλής ή χωρίς σφάλματα. Τη χρησιμοποιείς με δική σου ευθύνη.
          </p>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 backdrop-blur-md flex justify-end">
          <Button
            onClick={onClose}
            className="bg-ionian-blue hover:bg-blue-600 text-white px-8 py-2.5 rounded-xl transition shadow-lg shadow-blue-500/20"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
