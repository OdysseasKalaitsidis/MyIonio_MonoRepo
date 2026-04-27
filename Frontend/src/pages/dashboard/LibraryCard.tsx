import { useNavigate } from "react-router-dom";
import { Book } from "lucide-react";

export function LibraryCard() {
  const navigate = useNavigate();

  return (
    <div 
        onClick={() => navigate("/library")}
        className="relative group h-[200px] rounded-3xl p-6 overflow-hidden bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-white/10 p-6 flex flex-col justify-between cursor-pointer transition-all hover:border-violet-400 hover:shadow-lg hover:shadow-violet-500/10"
    >
        {/* Background Icon Effect */}
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Book size={80} className="text-violet-800 dark:text-violet-400" />
        </div>

        {/* Start (Icon) */}
        <div className="relative z-10 w-fit p-3 rounded-2xl bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400">
            <Book size={24} />
        </div>

        {/* End (Text) */}
        <div className="relative z-10">
             <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 group-hover:text-violet-600 transition-colors">Library</h3>
             <p className="text-sm text-slate-500 dark:text-gray-400">Books & Study Space</p>
        </div>
    </div>
  );
}
