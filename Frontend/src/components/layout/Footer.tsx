import { useState } from 'react';
import { useConsent } from '../../context/ConsentContext';
import { TermsModal } from '../TermsModal';
import { PrivacyPolicyModal } from '../PrivacyPolicyModal';

export function Footer() {
  const { resetConsent } = useConsent();
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  return (
    <>
      <footer className="w-full bg-slate-50 dark:bg-black/20 border-t border-slate-200 dark:border-white/5 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500 dark:text-gray-500">
          <div>
            &copy; {new Date().getFullYear()} Ionio Portal. Educational Use Only.
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsTermsOpen(true)}
              className="hover:text-ionian-blue dark:hover:text-white transition-colors"
            >
              Terms of Service
            </button>
            <button 
              onClick={() => setIsPrivacyOpen(true)}
              className="hover:text-ionian-blue dark:hover:text-white transition-colors"
            >
              Privacy Policy
            </button>
            <button 
              onClick={resetConsent}
              className="hover:text-ionian-blue dark:hover:text-white transition-colors"
            >
              Manage Cookies
            </button>
          </div>
        </div>
      </footer>

      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
      <PrivacyPolicyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
    </>
  );
}
