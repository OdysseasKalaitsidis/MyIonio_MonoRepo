import { useEffect, useState } from "react";
import { HUDNavbar } from "./HUDNavbar";
import { FuelCard } from "./RestaurantCard";
import { ScheduleCard } from "./ScheduleCard";
import { PathfinderCard } from "./PathfinderCard";
import { useDispatch, useSelector } from "react-redux";
import { restorePreferences } from "../../features/preferences/preferencesSlice";
import { TermsModal } from "../../components/TermsModal";
import { useNavigate } from "react-router-dom";
import { LockKeyholeOpen, ArrowRight, BookOpen, Globe, GraduationCap } from "lucide-react";
import type { RootState } from "../../app/store";
import { QuickPickerModal } from "./QuickPickerModal";
import { ExamCard } from "./ExamCard";
import { LibraryCard } from "./LibraryCard";

export default function DashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  
  const [greeting, setGreeting] = useState("Good Day");
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [showQuickPicker, setShowQuickPicker] = useState(false);



  // Initialize Preferences
  useEffect(() => {
    dispatch(restorePreferences());
  }, [dispatch]);

  // Dynamic Greeting
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-deep-navy text-slate-900 dark:text-white font-sans selection:bg-ionian-blue selection:text-white pb-10 transition-colors duration-300">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <HUDNavbar />

        {/* Hero / Greeting */}
        <div className="mt-8 mb-12">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-2 text-slate-900 dark:text-white transition-colors">
                {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-ionian-blue to-blue-400">{isAuthenticated && user?.firstName ? user.firstName : "Student"}.</span>
            </h2>
            <p className="text-slate-500 dark:text-gray-400 text-lg transition-colors">Here is what's happening at IU today.</p>
        </div>

        {/* The Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
            <ScheduleCard />
            <FuelCard />
            
            {/* Split Row: Pathfinder (3/4) & Results (1/4) */}
            <div className="lg:col-span-2 flex flex-col lg:flex-row gap-6">
                {/* 3/4 Width Pathfinder */}
                <div className="lg:basis-3/4">
                    <PathfinderCard 
                        onClick={() => {
                            // Always allow opening terms/quiz
                            setIsTermsOpen(true);
                        }}
                        className="" // Removed grayscale/disabled class
                    />
                </div>
                
                {/* 1/4 Width Results Card */}
                <div className="lg:basis-1/4">
                   <div 
                     onClick={() => {
                         // Always navigate to results/quiz
                         // If user meant "Quiz Card" -> maybe they want to go to /quiz directly?
                         // But usually results are different. Let's send to /results for now as per original code structure
                         // The user said "quiz card unlocked" - typically leads to quiz or results.
                         // But wait, the Pathfinder card *starts* the quiz (via terms).
                         // The Results card shows *results*.
                         // The user said "quiz card". The Pathfinder card is likely the "Quiz Card".
                         // I unlocked both just in case.
                         navigate("/results");
                     }}
                     className={`
                        relative w-full h-full min-h-[300px] lg:min-h-0 rounded-3xl p-8 flex flex-col justify-between overflow-hidden border transition-all duration-300
                        bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-500/30 cursor-pointer hover:border-ionian-blue group
                     `}
                   >
                     {/* Lock Icon / Status - Always Unlocked */}
                     <div className="flex justify-between items-start">
                         <div className="p-3 rounded-full bg-blue-100 text-ionian-blue dark:bg-blue-500/20 dark:text-blue-400">
                             <LockKeyholeOpen size={24} />
                         </div>
                     </div>

                     <div className="mt-8">
                         <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">
                             View Results
                         </h3>
                         <p className="text-sm text-slate-600 dark:text-gray-300">
                             Check your personalized academic path.
                         </p>
                     </div>

                     {/* CTA Arrow - Always visible */}
                     <div className="mt-8 self-end p-2 rounded-full bg-ionian-blue text-white opacity-0 transform translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                         <ArrowRight size={20} />
                     </div>
                   </div>
                </div>
            </div>

            {/* Exam & Library Row */}
            <div className="lg:col-span-2 flex flex-col lg:flex-row gap-6">
                {/* Schedule Card - Reduced width (~60%) */}
                <div className="lg:basis-3/5">
                    <ExamCard />
                </div>
                
                {/* Library Card - Increased width (~40%) */}
                <div className="lg:basis-2/5">
                    <LibraryCard />
                </div>
            </div>

            {/* Quick Links Row (Dias, E-Class, Eudoxus) - Approx 70% height/size */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Dias */}
                <a 
                    href="https://dias.ionio.gr" 
                    target="_blank" 
                    rel="noreferrer"
                    className="relative block group h-[200px] rounded-3xl p-6 overflow-hidden bg-white dark:bg-surface border border-slate-200 dark:border-white/10 hover:border-ionian-blue/50 dark:hover:border-ionian-blue/50 transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-ionian-blue/10"
                >
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                         <Globe size={80} className="text-slate-900 dark:text-white" />
                    </div>
                    
                    <div className="flex flex-col justify-between h-full relative z-10">
                        <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 w-fit text-ionian-blue dark:text-blue-400">
                             <Globe size={24} />
                        </div>
                        <div>
                             <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 group-hover:text-ionian-blue transition-colors">Dias</h3>
                             <p className="text-sm text-slate-500 dark:text-gray-400">Student Services</p>
                        </div>
                    </div>
                </a>

                {/* E-Class (OpenCourses) */}
                <a 
                    href="https://opencourses.ionio.gr/" 
                    target="_blank" 
                    rel="noreferrer"
                    className="relative block group h-[200px] rounded-3xl p-6 overflow-hidden bg-white dark:bg-surface border border-slate-200 dark:border-white/10 hover:border-ionian-blue/50 dark:hover:border-ionian-blue/50 transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-ionian-blue/10"
                >
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                         <GraduationCap size={80} className="text-slate-900 dark:text-white" />
                    </div>
                    
                    <div className="flex flex-col justify-between h-full relative z-10">
                        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 w-fit text-emerald-600 dark:text-emerald-400">
                             <GraduationCap size={24} />
                        </div>
                        <div>
                             <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">OpenCourses</h3>
                             <p className="text-sm text-slate-500 dark:text-gray-400">Asynchronous Education</p>
                        </div>
                    </div>
                </a>

                {/* Eudoxus */}
                <a 
                    href="https://service.eudoxus.gr/student" 
                    target="_blank" 
                    rel="noreferrer"
                    className="relative block group h-[200px] rounded-3xl p-6 overflow-hidden bg-white dark:bg-surface border border-slate-200 dark:border-white/10 hover:border-ionian-blue/50 dark:hover:border-ionian-blue/50 transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-ionian-blue/10"
                >
                     <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                         <BookOpen size={80} className="text-slate-900 dark:text-white" />
                    </div>
                    
                    <div className="flex flex-col justify-between h-full relative z-10">
                        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 w-fit text-amber-600 dark:text-amber-400">
                             <BookOpen size={24} />
                        </div>
                        <div>
                             <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">Eudoxus</h3>
                             <p className="text-sm text-slate-500 dark:text-gray-400">University Books</p>
                        </div>
                    </div>
                </a>

            </div>
        </div>
      </div>
       
       <TermsModal
        isOpen={isTermsOpen}
        onClose={() => navigate("/quiz")}
        confirmLabel="Start Assessment"
       />
       <QuickPickerModal 
        isOpen={showQuickPicker} 
        onClose={() => setShowQuickPicker(false)} 
       />
    </div>
  );
}