"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheckIcon, ShieldWarningIcon, SpinnerGapIcon, PaperPlaneTiltIcon, InfoIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ModeratorTestPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: "Failed to connect to API" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center"
      >
        <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <ShieldCheckIcon size={32} className="text-primary" weight="duotone" />
        </div>
        <h1 className="text-3xl font-black text-foreground tracking-tight mb-2">Content Moderator</h1>
        <p className="text-muted-foreground">Test our AI-powered moderation system using Hugging Face's BART model.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white border border-gray-100 p-1 rounded-[32px] shadow-sm mb-8"
      >
        <div className="bg-gray-50/50 rounded-[28px] p-6">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to analyze for inappropriateness..."
            className="w-full h-40 bg-transparent resize-none border-0 outline-none text-[15px] text-foreground placeholder:text-muted-foreground/30 leading-relaxed"
          />
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
              <InfoIcon size={14} />
              Zero-shot classification active
            </div>
            <Button
              variant="custom"
              onClick={handleCheck}
              disabled={loading || !text.trim()}
              className="h-10 px-6 rounded-2xl"
            >
              {loading ? (
                <SpinnerGapIcon size={18} className="animate-spin" />
              ) : (
                <>
                  <span>Analyze</span>
                  <PaperPlaneTiltIcon size={18} weight="bold" />
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "rounded-3xl p-6 border transition-all duration-300",
              result.error
                ? "bg-red-50 border-red-100 text-red-600"
                : result.isAppropriate
                ? "bg-green-50 border-green-100 text-green-700"
                : "bg-amber-50 border-amber-100 text-amber-700"
            )}
          >
            <div className="flex items-start gap-4">
              <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0",
                result.isAppropriate ? "bg-green-100" : "bg-amber-100"
              )}>
                {result.isAppropriate ? (
                  <ShieldCheckIcon size={24} weight="fill" />
                ) : (
                  <ShieldWarningIcon size={24} weight="fill" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">
                  {result.error ? "Analysis Failed" : result.isAppropriate ? "Content Approved" : "Content Flagged"}
                </h3>
                <p className="text-[14px] opacity-80 leading-relaxed mb-4">
                  {result.error || result.message}
                </p>
                
                {result.confidence && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/50 rounded-full text-[11px] font-black uppercase tracking-wider">
                    Confidence: {result.confidence}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
