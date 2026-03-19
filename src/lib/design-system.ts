import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const glassClasses = "glass-dark rounded-2xl";
export const glassCardClasses = cn(glassClasses, "p-6 transition-all duration-500 hover:bg-white/15 hover:scale-[1.02]");
