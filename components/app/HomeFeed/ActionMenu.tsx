"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  DotsThreeIcon, 
  FlagIcon, 
  UserIcon, 
  SealCheckIcon 
} from "@phosphor-icons/react";
import { ReputationBadge } from "./ReputationBadge";
import { cn } from "@/lib/utils";

interface ActionMenuProps {
  author: {
    name: string;
    username?: string;
    emailVerified?: boolean;
  };
  onFlag: () => void | Promise<void>;
  label?: string;
  verifiedLabel?: string;
  className?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
}

export function ActionMenu({
  author,
  onFlag,
  label = "Flag",
  verifiedLabel = "Verified",
  className,
  buttonClassName,
  dropdownClassName,
}: ActionMenuProps) {
  const [show, setShow] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShow(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const username = author.username || author.name.toLowerCase().replace(/\s/g, "");

  return (
    <div ref={menuRef} className={cn("relative", className)}>
      <button
        onClick={() => setShow((prev) => !prev)}
        className={cn(
          "p-1 rounded-md hover:bg-gray-100 transition-all text-muted-foreground/50 hover:text-foreground",
          buttonClassName
        )}
      >
        <DotsThreeIcon size={18} weight="bold" />
      </button>

      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute right-0 top-full mt-1 z-50 bg-white border border-gray-100 rounded-xl shadow-lg w-[180px] sm:w-[150px] overflow-hidden",
              dropdownClassName
            )}
          >
            <div className="px-3 py-2 border-b border-gray-50 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <UserIcon size={10} weight="fill" className="text-black shrink-0" />
                  <span className="text-[10px] sm:text-[11px] text-black truncate">
                    @{username}
                  </span>
                </div>
              </div>
              {author.emailVerified && (
                <div className="flex items-center gap-1.5">
                  <SealCheckIcon size={10} weight="fill" className="text-blue-500 shrink-0" />
                  <span className="text-[10px] sm:text-[11px] text-blue-500 font-medium">
                    {verifiedLabel}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={async () => {
                await onFlag();
                setShow(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[11px] sm:text-[12px] text-red-500 hover:bg-red-500/5 transition-colors text-left"
            >
              <FlagIcon size={12} weight="fill" />
              {label}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
