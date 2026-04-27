import { Button } from "./Button";

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden bg-white dark:bg-deep-navy border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col text-slate-900 dark:text-white">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 backdrop-blur-md">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Privacy Policy
          </h2>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 text-slate-600 dark:text-gray-300">
        
          <p>
            At Ionio Portal, we take your privacy seriously. This Privacy Policy explains how we collect, use, and store your personal information.
          </p>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-4">1. Data We Collect</h3>
          <ul className="list-disc pl-5 space-y-1">
             <li><strong>Identity Data:</strong> Name, Surname, Email address (provided via Google Sign-In or manual entry).</li>
             <li><strong>Academic Data:</strong> Department, Semester, and Quiz results/Learning Styles.</li>
             <li><strong>Usage Data:</strong> Preferences (Dark/Light mode) stored locally on your device.</li>
          </ul>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-4">2. Service Providers</h3>
          <p>We rely on trusted third-party services to operate:</p>
          <ul className="list-disc pl-5 space-y-1">
             <li><strong>Supabase:</strong> Used for our backend database and authentication management. Your data is securely stored on their servers.</li>
             <li><strong>Google Identity Services:</strong> Used to facilitate secure sign-in. We do not store your Google password.</li>
          </ul>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-4">3. Local Storage ("Cookies")</h3>
          <p>
            This site uses <strong>Local Storage</strong> to improve your experience. This is functionally equivalent to cookies.
          </p>
          <ul className="list-disc pl-5 space-y-1">
             <li><strong>Strictly Necessary:</strong> Authentication tokens (to keep you logged in).</li>
             <li><strong>Functional:</strong> Theme preferences and temporary quiz answers.</li>
          </ul>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-4">4. Data Location & Security</h3>
          <p>
            Your data is stored securely on <strong>Supabase</strong> servers. We prioritize data security and use industry-standard encryption.
          </p>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-4">5. Your Rights (GDPR)</h3>
          <p>
            Under the General Data Protection Regulation (GDPR), you have the right to:
          </p>
          <ul className="list-disc pl-5 space-y-1">
             <li><strong>Right to Access:</strong> You can request a copy of the personal data we hold about you.</li>
             <li><strong>Right to Correction:</strong> Request correction of any incorrect data.</li>
             <li><strong>Right to Deletion ("Right to be Forgotten"):</strong> You may request the complete deletion of your account and data at any time.</li>
             <li><strong>Withdraw Consent:</strong> You can change your cookie preferences at any time via the "Manage Cookies" link in the website footer.</li>
          </ul>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-4">5. Contact Us</h3>
          <p>
             To exercise any of your rights, including account deletion, please contact the administrator at:
             <br />
             <a href="mailto:admin@ionio-portal.gr" className="text-ionian-blue hover:underline">admin@ionio-portal.gr</a>
          </p>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 backdrop-blur-md flex justify-end">
          <Button
            onClick={onClose}
            className="bg-ionian-blue hover:bg-blue-600 text-white px-8 py-2.5 rounded-xl transition shadow-lg shadow-blue-500/20"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
