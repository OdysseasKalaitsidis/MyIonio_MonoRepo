import { Transition } from "@headlessui/react";
import { Fragment } from "react";
import { Link } from "react-router-dom";
import { Cookie } from "lucide-react";
import { useConsent } from "../context/ConsentContext";
export function CookieConsentBanner() {
  const { hasMadeChoice, acceptCookies } = useConsent();
  if (hasMadeChoice) return null;
  return <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 p-4"><Transition appear show={!hasMadeChoice} as={Fragment} enter="transition duration-300" enterFrom="translate-y-full opacity-0" enterTo="translate-y-0 opacity-100"><div className="pointer-events-auto mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl md:flex-row md:items-center dark:border-white/10 dark:bg-slate-900"><div className="flex flex-1 items-start gap-3"><Cookie className="mt-0.5 text-ionian-blue" size={20}/><div><h2 className="font-bold text-slate-900 dark:text-white">Αναγκαία αποθήκευση</h2><p className="mt-1 text-sm leading-6 text-slate-500">Χρησιμοποιούμε μόνο cookies συνεδρίας και τοπική αποθήκευση για να λειτουργεί η σύνδεση και να θυμόμαστε εξάμηνο, μαθήματα και θέμα. Δεν χρησιμοποιούμε διαφημιστικά cookies ή analytics. <Link to="/privacy" className="font-semibold text-ionian-blue hover:underline">Μάθε περισσότερα</Link>.</p></div></div><button onClick={acceptCookies} className="rounded-xl bg-ionian-blue px-5 py-2.5 text-sm font-bold text-white">Κατάλαβα</button></div></Transition></div>;
}
