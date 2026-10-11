import { Button } from "./Button";
import { TermsContent } from "./legal/TermsContent";
interface TermsModalProps { isOpen: boolean; onClose: () => void; confirmLabel?: string; }
export function TermsModal({ isOpen, onClose, confirmLabel = "Κλείσιμο" }: TermsModalProps) {
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><div role="dialog" aria-modal="true" aria-labelledby="terms-title" className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-deep-navy"><header className="border-b border-slate-200 p-6 dark:border-white/10"><h2 id="terms-title" className="text-2xl font-bold">Όροι χρήσης</h2></header><div className="flex-1 overflow-y-auto p-6"><TermsContent /></div><footer className="flex justify-end border-t border-slate-200 p-5 dark:border-white/10"><Button onClick={onClose} className="rounded-xl bg-ionian-blue px-6 py-2.5 text-white">{confirmLabel}</Button></footer></div></div>;
}
