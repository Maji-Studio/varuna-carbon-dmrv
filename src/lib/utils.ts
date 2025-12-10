import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return "Edited just now";
  } else if (diffMinutes < 60) {
    return `Edited ${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `Edited ${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `Edited ${diffDays}d ago`;
  } else {
    return `Edited ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  }
}
