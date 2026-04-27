import type { ReactNode } from "react";
import { HUDNavbar } from "../../pages/dashboard/HUDNavbar";
import { Footer } from "./Footer";

interface PageLayoutProps {
  children: ReactNode;
  hideNavbar?: boolean;
  className?: string;
}

export function PageLayout({ children, hideNavbar = false, className = "" }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-deep-navy text-slate-900 dark:text-white font-sans selection:bg-ionian-blue selection:text-white flex flex-col transition-colors duration-300">
      
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 relative z-10">
        {!hideNavbar && <HUDNavbar />}
        
        <main className={`pb-10 ${className}`}>
            {children}
        </main>
      </div>

      <Footer />
    </div>
  );
}
