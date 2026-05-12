"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XIcon, FlagIcon, CircleNotchIcon, ShieldCheckIcon, ArrowRightIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Image from "next/image";

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  referenceId: string;
  referenceType: "question" | "answer" | "comment" | "reply" | "others";
  reportedUserId: string;
  title?: string;
}

export function ReportModal({ open, onClose, referenceId, referenceType, reportedUserId, title }: ReportModalProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (open) {
      setReason("");
      setTimeout(() => textareaRef.current?.focus(), 150);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleSubmit = async () => {
    if (!reason.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referenceId,
          referenceType,
          reportedUserId,
          reason: reason.trim(),
        }),
      });

      if (response.ok) {
        toast.success("Report submitted successfully.");
        onClose();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to submit report");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-80 bg-black/25 backdrop-blur-[3px]"
          />

          <motion.div
            key="modal"
            initial={{ opacity: 0, y: -24, scale: 0.975 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 440, damping: 34, mass: 0.7 }}
            style={{ transformOrigin: "top center" }}
            className="fixed top-[10vh] sm:top-[14vh] left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-sm z-90"
          >
            <div className="bg-white overflow-hidden shadow-xl border border-gray-100">
              <div className="flex items-center justify-left gap-2 px-5 pt-5 pb-0">
                <div className="w-9 h-9 flex rounded-2xl items-center justify-center overflow-hidden">
                  <Image
                    src="/assets/logo.png"
                    alt="Logo"
                    width={24}
                    height={24}
                    className="object-contain invert"
                  />
                </div>
                <h2 className="text-[30px] text-black tracking-tight font-medium">Surrealbox</h2>
              </div>

              <div className="px-5 pt-5 pb-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-bold text-black tracking-tight">Report content</h2>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-50 rounded">
                    <FlagIcon size={12} className="text-red-600" weight="fill" />
                    <span className="text-[10px] font-black text-red-700 uppercase tracking-wider">{referenceType}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Help us keep Surrealbox safe. Please describe the issue with this content below.
                  </p>
                </div>

                {title && (
                  <div className="mb-4 p-3 bg-gray-50 border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 mb-1">Reporting Content</p>
                    <p className="text-[11px] font-bold text-black line-clamp-1 italic">"{title}"</p>
                  </div>
                )}

                <div className="mb-6">
                  <textarea
                    ref={textareaRef}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    placeholder="Provide details about the violation..."
                    className="w-full resize-none bg-gray-50 p-3 text-[13px] text-black placeholder:text-gray-300 outline-none border border-gray-100 focus:bg-white focus:border-gray-200 transition-all leading-relaxed"
                  />
                  <p className="text-[9px] text-gray-400 mt-1.5 font-medium italic">
                    Your report is anonymous and will be reviewed by moderator or our team.
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Button 
                    variant="custom" 
                    onClick={handleSubmit}
                    disabled={isSubmitting || !reason.trim()}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <>
                        <span>Reporting</span>
                        <CircleNotchIcon size={14} className="animate-spin" />
                      </>
                    ) : (
                      <>
                        <span>Report</span>
                        <ArrowRightIcon size={14} weight="bold" />
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="light" 
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
