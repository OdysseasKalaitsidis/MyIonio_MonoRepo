import { Compass, ArrowRight } from "lucide-react";

interface PathfinderCardProps {
    onClick?: () => void;
    className?: string;
}

export function PathfinderCard({ onClick, className = "" }: PathfinderCardProps) {
  // Navigation should be handled by the parent if specific logic (like Terms) is needed.
  // changing default behavior to just use the passed onClick.

  return (
    <div 
        className={`relative group overflow-hidden rounded-3xl bg-blue-40 dark:bg-glass-blue border border-blue-100 dark:border-white/10 p-1 flex flex-col h-[280px] cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-sm dark:shadow-none ${className}`}
        onClick={onClick}
    >
      {/* Gradient Border Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-ionian-blue via-red-500 to-blue-600 opacity-20 group-hover:opacity-40 transition-opacity" />
      
      <div className="relative h-full w-full bg-blue-50/50 dark:bg-[#0F172A]/90 backdrop-blur-xl rounded-[22px] p-6 flex flex-col justify-between transition-colors">
          
          <div className="flex justify-between items-start">
             <div className="flex items-center gap-2 text-slate-500 dark:text-gray-400 transition-colors">
                <Compass size={18} />
                <span className="text-sm font-medium uppercase tracking-widest">Pathfinder</span>
            </div>
            <div className="bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold px-2 py-1 rounded">Beta</div>
          </div>

          <div className="mt-4">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 transition-colors">Unsure about your major?</h3>
              <p className="text-slate-500 dark:text-gray-400 leading-relaxed transition-colors">
                  Take the 5-minute AI career path test to discover your ideal specialization.
              </p>
          </div>

          <div className="flex items-center gap-2 text-slate-800 dark:text-white font-medium group-hover:gap-4 transition-all">
              <span>Start Analysis</span>
              <ArrowRight size={18} />
          </div>

          {/* Decorative */}
          <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full pointer-events-none" />
      </div>
    </div>
  );
}
