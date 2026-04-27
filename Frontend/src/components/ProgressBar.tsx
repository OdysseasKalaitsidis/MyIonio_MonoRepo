import { motion } from "framer-motion";

interface ProgressBarProps {
  progress: number; // 0 - 100
  className?: string;
}

export function ProgressBar({ progress, className }: ProgressBarProps) {
  return (
    <div className={`w-full bg-white/20 rounded-full h-4 ${className || ""}`}>
      <motion.div
        className="bg-cyan-400 h-4 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5 }}
      />
    </div>
  );
}
