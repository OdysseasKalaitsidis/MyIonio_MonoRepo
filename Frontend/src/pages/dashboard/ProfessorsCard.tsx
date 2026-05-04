import { useNavigate } from "react-router-dom";
import { Users, ChevronRight, User } from "lucide-react";

export function ProfessorsCard() {
  const navigate = useNavigate();

  return (
    <div
      className="relative group overflow-hidden rounded-3xl bg-white dark:bg-glass-blue border border-blue-100 dark:border-white/10 p-5 flex flex-col md:flex-row items-center justify-between hover:border-ionian-blue/30 transition-all duration-300 cursor-pointer shadow-sm dark:shadow-none min-h-[80px]"
      onClick={() => navigate("/professors")}
    >
      {/* Background Decor */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-[0.03] text-slate-900 dark:text-white pointer-events-none">
        <Users size={120} />
      </div>

      <div className="flex items-center gap-4 w-full md:w-auto">
        <div className="p-3 md:p-4 rounded-full bg-blue-50 dark:bg-blue-900/20 text-ionian-blue dark:text-blue-400 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
          <User size={28} className="md:w-8 md:h-8" />
        </div>
        
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users size={14} className="text-ionian-blue dark:text-blue-400" />
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-ionian-blue dark:text-blue-400">Directory</span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
            Professors
          </h2>
          <p className="text-sm md:text-base text-slate-600 dark:text-gray-300 font-medium mt-1">
            View the academic program for each professor.
          </p>
        </div>
      </div>

      {/* CTA Section */}
      <div className="flex items-center gap-4 mt-4 md:mt-0 w-full md:w-auto justify-end border-t md:border-t-0 md:border-l border-gray-100 dark:border-white/5 pt-4 md:pt-0 md:pl-6">
        <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-ionian-blue dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider hidden md:block">
          New
        </span>
        <div className="flex items-center gap-1 text-sm font-semibold text-slate-500 dark:text-gray-400 group-hover:text-ionian-blue dark:group-hover:text-blue-400 transition-colors">
          <span>Explore Programs</span>
          <ChevronRight size={18} />
        </div>
      </div>
    </div>
  );
}
