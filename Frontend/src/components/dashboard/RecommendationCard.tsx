import { type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export interface RecommendationCardProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  isLoading: boolean;
  emptyLabel: string;
  isEmpty: boolean;
  onAction: () => void;
  actionLabel: string;
  secondaryAction?: ReactNode;
}

export function RecommendationCard({
  title,
  icon: Icon,
  children,
  isLoading,
  emptyLabel,
  isEmpty,
  onAction,
  actionLabel,
  secondaryAction,
}: RecommendationCardProps) {
  return (
    <div className="rounded-3xl bg-[#18181b] border border-white/10 p-5 flex flex-col justify-between min-h-[180px] h-full relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-5 opacity-10 group-hover:opacity-20 transition-opacity">
        <Icon className="w-20 h-20" />
      </div>

      <div className="flex items-center gap-2 mb-4 text-white/60">
        <Icon className="w-5 h-5" />
        <span className="text-sm font-bold uppercase tracking-wider">
          {title}
        </span>
      </div>

      <div className="flex-1">
        {isLoading ? (
          <div className="flex flex-col gap-2 animate-pulse">
            <div className="h-8 w-3/4 bg-white/10 rounded" />
            <div className="h-4 w-1/2 bg-white/5 rounded" />
          </div>
        ) : isEmpty ? (
          <p className="text-text-muted">{emptyLabel}</p>
        ) : (
          children
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={onAction}
          className="text-sm font-medium text-white/50 hover:text-white transition-colors flex items-center gap-1"
        >
          {actionLabel} &rarr;
        </button>
        {secondaryAction}
      </div>
    </div>
  );
}
