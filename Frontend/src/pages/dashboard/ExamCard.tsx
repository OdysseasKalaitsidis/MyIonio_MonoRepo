import { Calendar, Lock } from "lucide-react";

export function ExamCard() {
  return (
    <div aria-disabled="true" className="relative h-[200px] rounded-3xl p-6 overflow-hidden bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 transition-all duration-300 shadow-sm opacity-80 flex flex-col justify-between cursor-not-allowed grayscale-[0.5]">
      
      {/* Top Row: Icon (Left) & Countdown (Right) */}
      <div className="flex justify-between items-start z-10">
          {/* Icon */}
          <div className="p-3 rounded-2xl bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-gray-400 shadow-sm flex items-center justify-center gap-1.5 min-w-[50px]">
                <Calendar size={24} />
          </div>

          {/* Countdown Badge */}
          <div className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-sm font-bold shadow-sm border border-white/50 dark:border-white/5 flex items-center gap-2">
            <Lock size={14} />
            <span>Κλειδωμένο</span>
          </div>
      </div>
      
      {/* Spacer */}
      <div className="h-4"></div>

      {/* Bottom Content */}
      <div className="relative z-10">
        <h3 className="text-xl font-bold text-slate-700 dark:text-white mb-1">
            Πρόγραμμα εξεταστικής
        </h3>
        <p className="text-sm text-slate-500 dark:text-gray-400">
            Θα είναι διαθέσιμο κοντά στην εξεταστική περίοδο
        </p>
      </div>
      
      {/* Abstract Background Decoration */}
      <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-slate-300/20 dark:bg-white/5 rounded-full blur-2xl pointer-events-none" />

    </div>
  );
}
