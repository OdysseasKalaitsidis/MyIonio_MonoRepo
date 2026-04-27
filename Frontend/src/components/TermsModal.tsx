import { Button } from "./Button";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  confirmLabel?: string;
}

export function TermsModal({ isOpen, onClose, confirmLabel = "I Understand" }: TermsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden bg-white dark:bg-deep-navy border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col text-slate-900 dark:text-white">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 backdrop-blur-md">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Terms and Conditions
          </h2>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 text-slate-600 dark:text-gray-300">
            <strong className="text-slate-900 dark:text-white">Last Updated: {new Date().toLocaleDateString()}</strong>
          <p>
            Welcome to Ionio Portal. By signing up, you agree to the following terms
            and conditions. Please read them carefully.
          </p>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-4">1. Age Requirement</h3>
          <p>
            You must be at least 16 years old to use this service. By creating an account, you represent and warrant that you meet this age requirement.
          </p>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-4">2. Non-Commercial Use</h3>
          <p>
            The Ionio Portal is provided for <strong>educational and personal academic use only</strong>. Any commercial use, enterprise deployment, or resale of this service is strictly prohibited.
          </p>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-4">3. User Conduct</h3>
          <p>
            You agree not to modify, hack, or attempt to compromise the security of the application. Harassment, bullying, or uploading illegal content will result in immediate termination of your account.
          </p>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-4">4. Termination</h3>
          <p>
            We reserve the right to suspend or terminate your account at our sole discretion, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties, or for any other reason.
          </p>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-4">5. Disclaimer of Warranties</h3>
          <p>
            The service is provided on an "AS IS" and "AS AVAILABLE" basis. We disclaim all warranties of any kind, whether express or implied. We do not guarantee that the service will be uninterrupted, timely, secure, or error-free. You use the service at your own risk.
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
