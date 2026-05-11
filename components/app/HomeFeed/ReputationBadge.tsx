"use client";

import { cn } from "@/lib/utils";

export function ReputationBadge({ 
  reputation, 
  className 
}: { 
  reputation: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 text-[9px] sm:text-[10.5px] border px-1.5 sm:px-2 py-0.5 rounded-md transition-all duration-200 select-none font-medium whitespace-nowrap",
        reputation > 0 && "bg-green-600 text-white border-green-600",
        reputation < 0 && "bg-red-600 text-white border-red-600",
        reputation === 0 && "bg-blue-600 text-white border-blue-600",
        className
      )}
    >
      <span>{reputation.toLocaleString()}<span className="hidden md:inline ml-1">Reputation</span></span>
    </div>
  );
}
