import { useNavigate } from "react-router-dom";
import { Users, ChevronRight, User } from "lucide-react";

export function ProfessorsCard() {
  const navigate = useNavigate();

  return (
    <div
      className="relative group overflow-hidden rounded-3xl bg-white dark:bg-glass-blue border border-blue-100 dark:border-white/10 p-5 md:p-6 flex flex-col h-[300px] hover:border-ionian-blue/30 transition-all duration-300 cursor-pointer shadow-sm dark:shadow-none"
      onClick={() => navigate("/professors")}
    >
      {/* Background Decor */}
      <div className="absolute -right-10 -bottom-10 opacity-[0.03] text-slate-900 dark:text-white">
        <Users size={200} />
      </div>

      {/* Header Row */}
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-center gap-2 text-ionian-blue dark:text-blue-400">
          <Users size={20} />
          <span className="text-sm font-bold uppercase tracking-widest text-ionian-blue dark:text-blue-400">Directory</span>
        </div>
      </div>

      {/* Large Title */}
      <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-4">
        Professors
      </h2>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center text-center -mt-4">
        <div className="mx-auto p-4 rounded-full bg-blue-50 dark:bg-blue-900/20 text-ionian-blue dark:text-blue-400 mb-4 transition-transform group-hover:scale-110 duration-300">
            <User size={48} />
        </div>
        <p className="text-base text-slate-600 dark:text-gray-300 font-medium max-w-[200px] mx-auto">
          View the academic program for each professor.
        </p>
      </div>

      {/* Footer Link */}
      <div className="mt-auto pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm font-semibold text-slate-500 dark:text-gray-400 group-hover:text-ionian-blue dark:group-hover:text-blue-400 transition-colors">
            <span>Explore Programs</span>
            <ChevronRight size={16} />
          </div>
          <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-ionian-blue dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider">
            New
          </span>
      </div>
    </div>
  );
}
