import React from "react";
import { ArrowUpRightIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface LinkifiedTextProps {
  text: string;
  className?: string;
  linkClassName?: string;
}

export function LinkifiedText({ text, className, linkClassName }: LinkifiedTextProps) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  const parts = text.split(urlRegex);

  return (
    <span className={cn("inline-block", className)}>
      {parts.map((part, i) => {
        if (part.match(urlRegex)) {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center gap-0.5 text-blue-600 hover:text-blue-700 font-medium underline underline-offset-2 transition-colors",
                linkClassName
              )}
            >
              {part.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              <ArrowUpRightIcon size={12} weight="bold" className="mb-0.5" />
            </a>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </span>
  );
}
