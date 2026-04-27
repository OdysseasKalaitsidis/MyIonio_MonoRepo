import { motion } from "framer-motion";
import { Calendar, Clock, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../Button";
import type { CourseEntry } from "../../features/schedule/models";

export interface TimelineItem extends CourseEntry {
  status: "past" | "current" | "future";
  start: Date;
  end: Date;
}

export interface ScheduleHeroProps {
  timeline: TimelineItem[] | null;
  isLoading: boolean;
  activeHeroClass: TimelineItem | null;
}

export function ScheduleHero({ timeline, isLoading, activeHeroClass }: ScheduleHeroProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      className="lg:col-span-3 rounded-3xl bg-[#18181b] border border-white/10 p-6 md:p-8 flex flex-col relative overflow-hidden min-h-[400px]"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Decorative Gradient */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />

      <div className="flex items-center gap-2 mb-6 text-primary">
        <Calendar className="w-5 h-5" />
        <h2 className="text-sm font-bold uppercase tracking-wider">
          Today's Schedule
        </h2>
      </div>

      {isLoading ? (
        <SkeletonLoader count={3} />
      ) : !timeline || timeline.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-surface/50 flex items-center justify-center mb-4 text-text-muted">
            <Calendar className="w-8 h-8" />
          </div>
          <p className="text-2xl font-semibold text-white">No classes today</p>
          <p className="text-text-muted">Enjoy your free time!</p>
          <Button
            onClick={() => navigate("/schedule")}
            className="mt-6 bg-surface hover:bg-white/10 text-white border border-white/5"
          >
            View Calendar
          </Button>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-8 h-full">
          {/* LEFT: HERO (Current Class) */}
          {activeHeroClass && (
            <div className="flex-1 flex flex-col justify-center border-b md:border-b-0 md:border-r border-white/10 pb-6 md:pb-0 md:pr-8">
              <span
                className={`inline-block w-fit px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 ${
                  activeHeroClass.status === "current"
                    ? "bg-accent/20 text-accent ring-1 ring-accent/50"
                    : "bg-primary/20 text-primary ring-1 ring-primary/50"
                }`}
              >
                {activeHeroClass.status === "current"
                  ? "Happening Now"
                  : "Up Next"}
              </span>
              <h3 className="text-3xl md:text-5xl font-bold text-white mb-2 leading-tight">
                {activeHeroClass.course_name}
              </h3>
              <div className="flex items-center gap-2 text-xl text-text-muted mb-6">
                <Clock className="w-5 h-5" />
                <span>
                  {activeHeroClass.time_start} - {activeHeroClass.time_end}
                </span>
              </div>

              <div className="flex items-center gap-2 text-white/60">
                <MapPin className="w-4 h-4" />
                <span>Main Campus, Room A-12</span>
              </div>
            </div>
          )}

          {/* RIGHT: TIMELINE LIST */}
          {timeline.length > 1 && (
            <div className="w-full md:w-1/3 flex flex-col gap-4 overflow-y-auto pr-2 max-h-[300px] custom-scrollbar">
              <p className="text-sm text-text-muted uppercase tracking-wider font-semibold">
                Timeline
              </p>
              {timeline.map((c, idx) => {
                const isHero = c === activeHeroClass;
                if (isHero) return null;

                const isPast = c.status === "past";

                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-4 p-3 rounded-xl transition-all ${
                      isPast
                        ? "opacity-40 grayscale"
                        : "bg-surface/30 hover:bg-surface/50"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1 min-w-[3rem]">
                      <span className="text-xs font-bold text-white">
                        {c.time_start}
                      </span>
                      <div
                        className={`w-0.5 h-full ${
                          isPast ? "bg-white/10" : "bg-primary/30"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-white line-clamp-1">
                        {c.course_name}
                      </p>
                      <p className="text-xs text-text-muted">{c.time_end}</p>
                    </div>
                  </div>
                );
              })}

              <Button
                onClick={() => navigate("/schedule")}
                className="mt-auto w-full text-xs bg-transparent border border-white/10 text-text-muted hover:text-white"
              >
                View Full Schedule
              </Button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function SkeletonLoader({
  count = 1,
  className = "h-4",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className="space-y-3 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`bg-white/5 animate-pulse rounded ${className}`}
        />
      ))}
    </div>
  );
}
