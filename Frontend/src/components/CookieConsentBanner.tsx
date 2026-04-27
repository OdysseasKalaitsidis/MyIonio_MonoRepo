import { Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useConsent } from '../context/ConsentContext';
import { Cookie } from 'lucide-react';

export function CookieConsentBanner() {
  const { hasMadeChoice, acceptCookies, declineCookies } = useConsent();

  // If the user has already made a choice, don't show the banner
  if (hasMadeChoice) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none">
      <Transition
        appear={true}
        show={!hasMadeChoice}
        as={Fragment}
        enter="transform transition ease-out duration-300"
        enterFrom="translate-y-full opacity-0"
        enterTo="translate-y-0 opacity-100"
        leave="transform transition ease-in duration-200"
        leaveFrom="translate-y-0 opacity-100"
        leaveTo="translate-y-full opacity-0"
      >
        <div className="max-w-4xl mx-auto pointer-events-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-6 md:flex items-center gap-6">
            
            <div className="flex items-start gap-4 flex-1">
              <div className="min-w-10 min-h-10 rounded-full bg-ionian-blue/10 flex items-center justify-center text-ionian-blue">
                <Cookie size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  We value your privacy
                </h3>
                <p className="text-sm text-slate-500 dark:text-gray-400 leading-relaxed">
                  We use cookies and local storage to enhance your experience, remember your preferences, and ensure the site functions correctly. 
                  By continuing, you agree to our use of these technologies.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4 md:mt-0 shrink-0">
               <button
                onClick={declineCookies}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
               >
                 Decline All
               </button>
               <button
                onClick={acceptCookies}
                className="px-6 py-2.5 rounded-xl text-sm font-medium bg-ionian-blue hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20 transition-all"
               >
                 Accept Cookies
               </button>
            </div>

          </div>
        </div>
      </Transition>
    </div>
  );
}
