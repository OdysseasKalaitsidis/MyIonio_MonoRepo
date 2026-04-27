import { cn } from "../lib/utils";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
}

export function Button({ className, children, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        "transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] rounded-xl font-semibold",
        className
      )}
    >
      {children}
    </button>
  );
}
