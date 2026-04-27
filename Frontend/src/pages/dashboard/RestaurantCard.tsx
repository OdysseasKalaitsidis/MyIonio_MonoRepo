import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Utensils } from "lucide-react";
import { cn } from "../../lib/utils";

export function FuelCard() {
    const navigate = useNavigate();
    // Hours: 13:00-15:30 (Lunch) AND 18:30-21:00 (Dinner)
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const checkStatus = () => {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            const totalMinutes = hours * 60 + minutes;

            // Lunch: 13:00 (780) - 15:30 (930)
            const isLunch = totalMinutes >= 780 && totalMinutes < 930;
            // Dinner: 18:30 (1110) - 21:00 (1260)
            const isDinner = totalMinutes >= 1110 && totalMinutes < 1260;

            if (isLunch || isDinner) {
                setIsOpen(true);
            } else {
                setIsOpen(false);
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 60000); // Check every min
        return () => clearInterval(interval);
    }, []);

    return (
        <div 
            className="relative group overflow-hidden rounded-3xl bg-white dark:bg-glass-blue border border-blue-100 dark:border-white/10 p-3 md:p-8 flex flex-col justify-between h-[160px] md:h-[340px] hover:border-ionian-blue/30 transition-all duration-300 shadow-sm dark:shadow-none cursor-pointer"
            onClick={() => navigate("/menu")}
        >
            {/* Background Decor */}
             <div className="absolute -right-10 -bottom-10 opacity-[0.03] text-slate-900 dark:text-white">
                <Utensils size={240} />
             </div>

            {/* Header */}
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 text-slate-500 dark:text-gray-400">
                    <Utensils size={20} />
                    <span className="text-[10px] md:text-sm font-medium uppercase tracking-widest">FOOD</span>
                </div>
                
                {/* Live Pill */}
                <div className={cn(
                    "flex items-center gap-1.5 px-2 py-0.5 md:px-3 md:py-1 rounded-full border text-[10px] md:text-xs font-bold uppercase tracking-wider z-10",
                    isOpen 
                        ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400" 
                        : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
                )}>
                    <div className={cn("w-1.5 h-1.5 rounded-full", isOpen ? "bg-green-500 dark:bg-green-400 animate-pulse" : "bg-red-500 dark:bg-red-400")} />
                    {isOpen ? "Open" : "Closed"}
                </div>
            </div>

            {/* Central Content */}
            <div className="flex-1 flex flex-col items-center justify-center text-center -mt-6">
                <h3 className="text-xl md:text-5xl font-bold text-slate-900 dark:text-white mb-1 md:mb-2 transition-colors tracking-tight">
                    Restaurant
                </h3>
                 <p className="text-xs md:text-base text-slate-500 dark:text-gray-400 font-medium">{isOpen ? "Serving Now" : "Currently Closed"}</p>
            </div>

            {/* Footer / Action */}
             <div className="flex items-center gap-2 text-xs md:text-sm text-slate-500 dark:text-gray-500 group-hover:text-ionian-blue transition-colors cursor-pointer justify-center">
                <span>View weekly menu</span>
                <span className="text-lg">→</span>
            </div>
        </div>
    );
}
