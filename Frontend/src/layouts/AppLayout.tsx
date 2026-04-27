import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../app/store";
import UserGreeting from "../components/UserGreeting";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  return (
    <div className="bg-background text-white flex flex-col min-h-screen">
      {/* Header / Nav */}
      <div className="absolute top-0 left-0 right-0 z-40 p-6 flex justify-between items-center pointer-events-none">
        {/* Brand - Left */}
        <div className="pointer-events-auto flex items-center gap-4">
             {/* Home Button */}
             <button
                onClick={() => navigate("/")} 
                className="p-3 rounded-full bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white hover:scale-105 active:scale-95 transition-all shadow-sm backdrop-blur-md"
                title="Go Home"
             >
                <Home size={20} />
             </button>

             {/* Logo Text */}
             <div 
                className="cursor-pointer hidden sm:block"
                onClick={() => navigate("/")}
             >
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors">
                    My<span className="text-ionian-blue">Ionio</span>
                </h1>
             </div>
        </div>

        {/* Right Side */}
        <div className="pointer-events-auto">
             {isAuthenticated && <UserGreeting />}
        </div>
      </div>

      {/* Page content */}
      <main className="flex-1 pt-24 md:pt-0">{children}</main>
    </div>
  );
}
