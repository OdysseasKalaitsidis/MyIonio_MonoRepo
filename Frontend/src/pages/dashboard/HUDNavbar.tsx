import { User, Moon, Sun, LogOut } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../../app/store";
import { useEffect, useState, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Transition } from "@headlessui/react";
import { logout } from "../../features/auth/authSlice";

export function HUDNavbar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Default to light as per recent request, valid persistence check
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "dark") {
        setTheme("dark");
        document.documentElement.classList.add("dark");
    } else {
        setTheme("light");
        document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
      const newTheme = theme === "dark" ? "light" : "dark";
      setTheme(newTheme);
      localStorage.setItem("theme", newTheme);
      if (newTheme === "dark") {
          document.documentElement.classList.add("dark");
      } else {
          document.documentElement.classList.remove("dark");
      }
  };

  return (
    <header className="flex items-center justify-between py-6 px-1">
      {/* Brand */}
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors">
          My<span className="text-ionian-blue">Ionio</span>
        </h1>
      </div>

      {/* Profile / Status */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button 
            onClick={toggleTheme}
            className="p-2 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400 hover:text-ionian-blue transition-colors"
        >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {isAuthenticated ? (
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center gap-2 bg-white dark:bg-glass-blue border border-slate-200 dark:border-white/10 rounded-full pl-4 pr-1 py-1 backdrop-blur-md transition-colors shadow-sm hover:bg-slate-50 dark:hover:bg-white/10 outline-none">
              <span className="text-sm font-medium text-slate-700 dark:text-gray-200 hidden sm:block">
                {user?.email || "Student"}
              </span>
              <div className="w-8 h-8 rounded-full bg-ionian-blue/10 dark:bg-ionian-blue/20 flex items-center justify-center border border-ionian-blue/20 dark:border-ionian-blue/50 text-ionian-blue">
                 <User size={16} />
              </div>
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right divide-y divide-gray-100 dark:divide-gray-700 rounded-xl bg-white dark:bg-surface border border-slate-200 dark:border-white/10 shadow-lg ring-1 ring-black/5 focus:outline-none z-50">
                <div className="px-1 py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => {
                          dispatch(logout());
                          navigate("/");
                        }}
                        className={`${
                          active ? "bg-ionian-blue text-white" : "text-slate-900 dark:text-gray-200"
                        } group flex w-full items-center rounded-lg px-2 py-2 text-sm transition-colors`}
                      >
                        <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                        Sign Out
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        ) : (
          <div className="flex items-center gap-3">
             <button 
                onClick={() => navigate("/signin")}
                className="text-sm font-medium text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-colors"
             >
                Sign In
             </button>
             <button 
                onClick={() => navigate("/sign-up")}
                className="px-4 py-2 rounded-full bg-ionian-blue text-white text-sm font-medium hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
             >
                Sign Up
             </button>
          </div>
        )}
      </div>
    </header>
  );
}
