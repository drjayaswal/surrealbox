"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XIcon, PlusIcon, HashIcon, CaretRightIcon, SpinnerGapIcon, SealCheckIcon, CaretLeftIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AskQuestionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: (data: { title: string; body: string; tags: string[] }) => Promise<void> | void;
}

const MAX_TAGS = 5;
const MAX_TITLE = 255;
const SUGGESTED_TAGS = ["react", "nextjs", "typescript", "css", "nodejs", "database", "auth", "api", "ui", "performance"];

export function AskQuestionModal({ open, onClose, onSubmit }: AskQuestionModalProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagError, setTagError] = useState("");

  const titleRef = useRef<HTMLTextAreaElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const tagRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setTitle("");
        setBody("");
        setTags([]);
        setTagInput("");
        setStep(1);
        setIsSubmitting(false);
        setTagError("");
      }, 300);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (step === 1) titleRef.current?.focus();
        if (step === 2) bodyRef.current?.focus();
        if (step === 3) tagRef.current?.focus();
      }, 120);
    }
  }, [open, step]);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const addTag = (raw: string) => {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (!tag) return;
    if (tags.includes(tag)) { setTagError("Tag already added"); return; }
    if (tags.length >= MAX_TAGS) { setTagError(`Max ${MAX_TAGS} tags`); return; }
    setTags((prev) => [...prev, tag]);
    setTagInput("");
    setTagError("");
  };

  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));

  const handleTagKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    }
    if (e.key === "Backspace" && !tagInput && tags.length) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const canProceed = step === 1 ? title.trim().length >= 10 : step === 2 ? body.trim().length >= 20 : true;

  const handleNext = () => {
    if (!canProceed) return;
    if (step < 3) setStep((s) => (s + 1) as 1 | 2 | 3);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit?.({ title: title.trim(), body: body.trim(), tags });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { n: 1, label: "Question" },
    { n: 2, label: "Details" },
    { n: 3, label: "Tags" },
  ];

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
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.99 }}
            transition={{ type: "spring", stiffness: 450, damping: 32, mass: 0.8 }}
            style={{ transformOrigin: "top center" }}
            className="fixed top-[6vh] sm:top-[12vh] left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[480px] z-90 h-fit"
          >
            <div className="bg-white overflow-hidden h-fit shadow-2xl">
              <div className="px-6 pt-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-[17px] font-bold text-foreground tracking-tight">Ask a question</h2>
                  <Button variant="light" size="icon-sm" onClick={onClose} className="rounded-full">
                    <XIcon size={14} weight="bold" />
                  </Button>
                </div>

                <div className="flex items-center gap-1">
                  {steps.map(({ n, label }) => {
                    const done = step > n;
                    const active = step === n;

                    let progressWidth = "0%";
                    let progressColor = "#f4f4f5";

                    if (done) {
                      progressWidth = "100%";
                      progressColor = "#21917b";
                    } else if (active) {
                      if (n === 1) {
                        const percent = Math.min(100, (title.trim().length / 10) * 100);
                        progressWidth = `${percent}%`;
                        progressColor = percent < 50 ? "#ef4444" : percent < 100 ? "#f59e0b" : "#21917b";
                      } else if (n === 2) {
                        const percent = Math.min(100, (body.trim().length / 20) * 100);
                        progressWidth = `${percent}%`;
                        progressColor = percent < 50 ? "#ef4444" : percent < 100 ? "#f59e0b" : "#21917b";
                      } else if (n === 3) {
                        const percent = (tags.length / MAX_TAGS) * 100;
                        progressWidth = `${percent}%`;
                        progressColor = tags.length > 0 ? "#21917b" : "#f4f4f5";
                      }
                    }

                    return (
                      <div key={n} className="flex-1 flex items-center gap-2 group">
                        <div className="flex flex-col gap-1.5 w-full">
                          <div className="flex items-center justify-between px-0.5">
                            <span className={cn(
                              "text-[10px] font-bold uppercase tracking-wider transition-colors",
                              active ? "text-primary" : "text-muted-foreground/40"
                            )}>
                              Step 0{n}
                            </span>
                            {done && <SealCheckIcon size={12} weight="fill" className="text-primary" />}
                          </div>
                          <div className="h-1 rounded-full bg-gray-100 overflow-hidden relative">
                            <motion.div
                              initial={false}
                              animate={{
                                width: progressWidth,
                                backgroundColor: progressColor
                              }}
                              className="absolute inset-0 h-full rounded-full"
                            />
                          </div>
                          <span className={cn(
                            "text-[12px] font-semibold transition-colors mt-0.5",
                            active ? "text-foreground" : "text-muted-foreground/50"
                          )}>
                            {label}
                          </span>
                        </div>
                        {n < 3 && <div className="w-2" />}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="px-6 py-2">
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="flex flex-col gap-4"
                    >
                      <div className="space-y-1">
                        <div className="relative">
                          <textarea
                            ref={titleRef}
                            value={title}
                            onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE))}
                            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleNext(); } }}
                            rows={3}
                            placeholder="e.g. How do I implement optimistic updates in React Query?"
                            className={cn(
                              "w-full resize-none bg-gray-50/40 p-4 text-[15px] text-foreground placeholder:text-muted-foreground/30 outline-none border-0 ring-0 transition-all leading-relaxed",
                              title.trim().length >= 10 && "bg-white"
                            )}
                          />
                          <div className="absolute bottom-3 right-4 flex items-center gap-2">
                            <span className={cn(
                              "text-[10px] font-bold tabular-nums",
                              title.length >= MAX_TITLE ? "text-red-500" : "text-muted-foreground/30"
                            )}>
                              {title.length}/{MAX_TITLE}
                            </span>
                          </div>
                        </div>
                        {title.length > 0 && title.trim().length < 10 && (
                          <p className={cn(
                            "text-[11px] font-medium pl-1",
                            title.trim().length < 5 ? "text-red-500/80" : "text-amber-600/80"
                          )}>
                            {title.trim().length < 5 ? "Type at least 10 characters." : "Almost there, a few more characters."}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="flex flex-col gap-4"
                    >
                      <div className="space-y-1">
                        <textarea
                          ref={bodyRef}
                          value={body}
                          onChange={(e) => setBody(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                              e.preventDefault();
                              handleNext();
                            }
                          }}
                          rows={7}
                          placeholder="Provide context, what you've tried, and what you're expecting..."
                          className={cn(
                            "w-full h-21.5 resize-none bg-gray-50/40 p-4 text-[15px] text-foreground placeholder:text-muted-foreground/30 outline-none border-0 ring-0 transition-all leading-relaxed",
                            body.trim().length >= 20 && "bg-white"
                          )}
                        />
                        <div className="flex items-center justify-between px-1">
                          {body.length > 0 && body.trim().length < 20 ? (
                            <p className={cn(
                              "text-[11px] font-medium",
                              body.trim().length < 10 ? "text-red-500/80" : "text-amber-600/80"
                            )}>
                              {body.trim().length < 10 ? "Please provide more details." : "Just a bit more context."}
                            </p>
                          ) : <div />}
                          <span className="text-[10px] text-muted-foreground/40 font-medium">⌘ + Enter to continue</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="flex flex-col"
                    >
                      <div className="space-y-1.5">
                        <div className={cn(
                          "flex flex-wrap gap-2 px-4 py-3 bg-gray-50/40 transition-all border-0 outline-none ring-0 focus-within:bg-white rounded-2xl"
                        )}>
                          {tags.map((tag) => (
                            <motion.span
                              key={tag}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="flex items-center gap-1.5 h-7 pl-2.5 pr-2 bg-primary/10 text-primary text-[11.5px] font-bold rounded-lg"
                            >
                              <HashIcon size={10} weight="bold" />
                              {tag}
                              <button onClick={() => removeTag(tag)} className="ml-0.5 hover:bg-white/20 rounded-md transition-colors cursor-pointer">
                                <XIcon size={10} weight="bold" />
                              </button>
                            </motion.span>
                          ))}
                          {tags.length < MAX_TAGS && (
                            <input
                              ref={tagRef}
                              value={tagInput}
                              onChange={(e) => { setTagInput(e.target.value); setTagError(""); }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  if (tagInput.trim()) {
                                    e.preventDefault();
                                    addTag(tagInput);
                                  } else if (tags.length > 0) {
                                    e.preventDefault();
                                    handleSubmit();
                                  }
                                } else {
                                  handleTagKey(e as any);
                                }
                              }}
                              onBlur={() => { if (tagInput.trim()) addTag(tagInput); }}
                              placeholder={tags.length === 0 ? "Add a tag..." : ""}
                              className="flex-1 text-[14px] text-foreground placeholder:text-muted-foreground/30 outline-none border-0 ring-0"
                            />
                          )}
                        </div>
                        {tagError && <p className="text-[11px] font-medium text-red-500 pl-1">{tagError}</p>}
                      </div>

                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).slice(0, 8).map((t) => (
                            <button
                              key={t}
                              onClick={() => addTag(t)}
                              className="flex items-center gap-1.5 h-8 px-3.5 group border border-gray-100 bg-white text-[12px] font-semibold text-muted-foreground hover:border-primary/30 hover:text-primary transition-all cursor-pointer"
                            >
                              <PlusIcon size={12} weight="bold" className="opacity-40 group-hover:opacity-100" />
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {step > 1 && (
                      <Button
                        variant="light"
                        size="sm"
                        onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                      >
                        <CaretLeftIcon size={14} weight="bold" />
                        Back
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {step < 3 ? (
                      <Button
                        variant="custom"
                        size="sm"
                        onClick={handleNext}
                        disabled={!canProceed}
                      >
                        Continue
                        <CaretRightIcon size={14} weight="bold" />
                      </Button>
                    ) : (
                      <Button
                        variant="custom"
                        size="sm"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <SpinnerGapIcon size={14} className="animate-spin" />
                        ) : (
                          <PlusIcon size={14} weight="bold" />
                        )}
                        {isSubmitting ? "Posting..." : "Post question"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}