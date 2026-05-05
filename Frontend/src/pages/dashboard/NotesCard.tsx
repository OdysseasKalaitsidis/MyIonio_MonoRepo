import { useNavigate } from "react-router-dom";
import { FileText, ArrowRight, Sparkles } from "lucide-react";

export function NotesCard() {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate("/notes")}
      className="group relative bg-white dark:bg-surface border border-slate-200 dark:border-white/10 rounded-3xl p-8 shadow-sm hover:shadow-xl hover:border-ionian-blue transition-all duration-300 cursor-pointer overflow-hidden"
    >
      {/* Background Icon */}
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <FileText size={120} className="text-slate-900 dark:text-white" />
      </div>

      <div className="flex flex-col h-full justify-between relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
              <FileText size={24} />
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
              <Sparkles size={12} /> AI POWERED
            </div>
          </div>
          
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Notes Hub
          </h3>
          <p className="text-slate-500 dark:text-gray-400 max-w-xs">
            Upload course notes and get AI-generated summaries instantly.
          </p>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <span className="text-sm font-semibold text-ionian-blue group-hover:translate-x-1 transition-transform inline-flex items-center gap-2">
            Explore Notes <ArrowRight size={16} />
          </span>
        </div>
      </div>
    </div>
  );
}
