import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { CaretDownIcon } from "@phosphor-icons/react";

const RULES = [
  { label: "Answer upvoted", points: "+10" },
  { label: "Question upvoted", points: "+5" },
  { label: "Answer accepted", points: "+15" },
  { label: "Accept an answer", points: "+2" },
  { label: "Question downvoted", points: "-2" },
  { label: "You downvote", points: "-1" },
];

export function ReputationBadge({ reputation }: { reputation: number }) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShow(!show)}
        className={cn(
          "flex items-center gap-1 text-[9px] sm:text-[10.5px] border px-1.5 sm:px-2 py-0.5 rounded-md transition-all duration-200 cursor-pointer select-none font-medium",
          reputation > 0 && "bg-green-600 text-white hover:bg-green-700 border-green-600 hover:border-green-700",
          reputation < 0 && "bg-red-600 text-white hover:bg-red-700 border-red-600 hover:border-red-700",
          reputation === 0 && "bg-blue-600 text-white hover:bg-blue-700 border-blue-600 hover:border-blue-700",
          show && "rounded-b-none bg-white text-black border-gray-200/50"
        )}
      >
        <span>{reputation.toLocaleString()}<span className="hidden md:inline ml-1">Reputation</span></span>
        <CaretDownIcon 
          size={10} 
          className={cn("transition-transform duration-300", show && "rotate-180")} 
        />
      </button>

      <AnimatePresence>
        {show && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShow(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95, originX: 1, originY: 0 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ 
                duration: 0.25, 
                ease: [0.23, 1, 0.32, 1] 
              }}
              className="absolute top-3 right-0 mt-2 z-50 w-[200px] bg-white rounded-lg rounded-tr-none shadow-lg border border-gray-100 px-3 py-2"
            > 
              <div className="space-y-1">
                {RULES.map((r) => (
                  <div key={r.label} className="flex items-center justify-between gap-2">
                    <span className="text-[10.5px] text-muted-foreground/80 font-medium truncate">{r.label}</span>
                    <span
                      className={`text-[10.5px] font-bold tabular-nums ${
                        r.points.startsWith("-") ? "text-red-500" : "text-green-600"
                      }`}
                    >
                      {r.points}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
