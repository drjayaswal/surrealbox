import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 604800)}w ago`;
}

export function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

export function getUserColor(name: string) {
  const colors = [
    "hsl(220, 75%, 55%)", // Vibrant Blue
    "hsl(280, 70%, 60%)", // Vibrant Indigo
    "hsl(340, 75%, 60%)", // Vibrant Pink
    "hsl(10, 80%, 60%)",  // Vibrant Red-Orange
    "hsl(160, 65%, 45%)", // Vibrant Emerald
    "hsl(190, 80%, 45%)", // Vibrant Cyan
    "hsl(45, 90%, 50%)",  // Vibrant Amber
    "hsl(210, 85%, 55%)", // Vibrant Sky
  ];

  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash = (name || "").charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}
