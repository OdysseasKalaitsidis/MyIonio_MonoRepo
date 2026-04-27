import { clsx, type ClassValue } from "clsx";

/**
 * Combines multiple class names into a single string.
 * Currently uses clsx. If you need tailwind-merge, install it and wrap clsx with twMerge.
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
