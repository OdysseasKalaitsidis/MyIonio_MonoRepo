import { Button } from "./Button";
import { PrivacyNoticeContent } from "./legal/PrivacyNoticeContent";
interface PrivacyPolicyModalProps { isOpen: boolean; onClose: () => void; }
export function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><div role="dialog" aria-modal="true" aria-labelledby="privacy-title" className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-deep-navy"><header className="border-b border-slate-200 p-6 dark:border-white/10"><h2 id="privacy-title" className="text-2xl font-bold">Απόρρητο και δεδομένα</h2></header><div className="flex-1 overflow-y-auto p-6"><PrivacyNoticeContent /></div><footer className="flex justify-end border-t border-slate-200 p-5 dark:border-white/10"><Button onClick={onClose} className="rounded-xl bg-ionian-blue px-6 py-2.5 text-white">Κλείσιμο</Button></footer></div></div>;
}
