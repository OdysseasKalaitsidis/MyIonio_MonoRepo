import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { User } from "lucide-react";
import type { RootState } from "../app/store";
import LogoutButton from "./LogoutButton";

export default function UserGreeting() {
  const { isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth
  );
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!isAuthenticated || !user) return null;

  return (
    <div ref={dropdownRef} className="relative z-50">
      {/* Icon Trigger */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="group flex items-center justify-center w-10 h-10 rounded-full bg-surface/80 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-all shadow-lg hover:shadow-primary/20"
      >
         <User className="w-5 h-5 text-white/80 group-hover:text-white transition-colors" />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
           <div className="px-4 py-3 border-b border-white/5 bg-white/5">
              <p className="text-sm font-medium text-white truncate">
                 {user.firstName || "User"}
              </p>
              <p className="text-xs text-text-muted truncate">
                 {user.email}
              </p>
           </div>
           <div className="p-2">
              <LogoutButton className="w-full justify-start text-sm hover:bg-white/5" iconSize={16} />
           </div>
        </div>
      )}
    </div>
  );
}

