"use client";

import {
  PlusIcon,
  ClockIcon,
  FireIcon,
  MagnifyingGlassIcon,
  ChatCircleDotsIcon,
  CaretLeftIcon,
  CaretRightIcon,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Question } from "@/app/types/home.type";
import { QuestionCard } from "@/components/app/HomeFeed/QuestionCard";
import { AskQuestionModal } from "@/components/app/HomeFeed/AskQuestionCard";
import { Button } from "@/components/ui/button";
import { QuestionSkeleton } from "@/components/app/HomeFeed/QuestionSkeleton";
import { AuthModal } from "@/components/app/AuthModal";
import { useSession } from "@/app/lib/auth-client";
import { useUser } from "@/context/UserContext";
import { ReputationRestrictionModal } from "@/components/app/HomeFeed/ReputationRestrictionModal";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

type SortTab = "trending" | "newest";

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  nextPage: number | null;
}

export default function HomePage() {
  const { data: session } = useSession();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalConfig, setAuthModalConfig] = useState({
    title: "Sign in to continue",
    description:
      "Join the community to ask questions, share answers, and take part in discussions that matter.",
  });

  const [activeTab, setActiveTab] = useState<SortTab>("trending");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);

  const [askOpen, setAskOpen] = useState(false);
  const [repModalOpen, setRepModalOpen] = useState(false);
  const { user: userProfile } = useUser();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    nextPage: null,
  });

  function triggerAuthModal(config?: { title: string; description: string }) {
    setAuthModalConfig(
      config ?? {
        title: "Sign in to continue",
        description:
          "Join the community to ask questions, share answers, and take part in discussions that matter.",
      }
    );
    setAuthModalOpen(true);
  }

  const fetchQuestions = useCallback(async (page = 1, q = "", sort = "newest") => {
    setLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
        q: q.trim(),
        sort,
      });
      const res = await fetch(`/api/questions?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch questions");
      setQuestions(data.items ?? []);
      setPagination({
        currentPage: data.currentPage,
        totalPages: data.totalPages,
        totalItems: data.totalItems,
        nextPage: data.nextPage,
      });
    } catch (err: any) {
      setFetchError(err.message || "Something went wrong. Please try again.");
      toast.error(err.message || "Could not load questions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions(1, debouncedSearch, activeTab);
  }, [debouncedSearch, activeTab, fetchQuestions]);

  async function handleAskSubmit(data: { title: string; body: string; tags: string[] }) {
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.details) {
          toast.error(json.error || "Inappropriate content", {
            description: `Flagged for: ${json.details} (${json.confidence})`,
          });
          return;
        }
        throw new Error(json.error || "Failed to post question");
      }
      toast.success("Question posted!", { description: "Your voice has been added." });
      setQuestions((prev) => [json, ...prev]);
      setPagination((prev) => ({ ...prev, totalItems: prev.totalItems + 1 }));
      setAskOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to post question");
    }
  }

  return (
    <div className="relative">
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title={authModalConfig.title}
        description={authModalConfig.description}
      />

      <AskQuestionModal
        open={askOpen}
        onClose={() => setAskOpen(false)}
        onSubmit={handleAskSubmit}
      />

      <ReputationRestrictionModal
        open={repModalOpen}
        onClose={() => setRepModalOpen(false)}
        currentReputation={userProfile?.reputation ?? 0}
        requiredReputation={100}
      />

      <AnimatePresence>
        {isSearchFocused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 bg-black/25 backdrop-blur-[3px] h-screen z-30"
          />
        )}
      </AnimatePresence>

      <div className="mx-auto sm:p-10 p-5">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 sm:gap-4 relative z-40 mb-6 sm:mb-8"
        >
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-tight">
              Explore Feed
            </h2>
            <p className="text-[13px] sm:text-[14px] text-muted-foreground mt-1">
              Discover what the community is debating about...
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            <div className="relative flex items-center h-10 w-full sm:w-[220px] transition-all duration-300">
              <MagnifyingGlassIcon
                className={cn(
                  "absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300",
                  isSearchFocused ? "text-primary" : "text-muted-foreground/50"
                )}
                size={15}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder="Search..."
                className={cn(
                  "w-full h-full pl-9 pr-4 rounded-4xl bg-gray-100 shadow-inner text-[14px] outline-none transition-all duration-300",
                  isSearchFocused && "bg-white shadow-sm"
                )}
              />
            </div>
          </div>
        </motion.div>

        <div className="flex items-center gap-1 mb-6 p-1 bg-gray-200/50 shadow-inner rounded-4xl w-full sm:w-fit relative overflow-x-auto no-scrollbar">
          {(["trending", "newest", "ask"] as const).map((tab) => {
            const isActive = activeTab === (tab as SortTab);
            return (
              <button
                key={tab}
                onClick={() => {
                  if (tab === "ask") {
                    if (!session) {
                      triggerAuthModal({
                        title: "Want to ask questions?",
                        description:
                          "Create an account to start your own debate and get expert insights from the community.",
                      });
                    } else {
                      setAskOpen(true);
                    }
                  } else {
                    setActiveTab(tab as SortTab);
                  }
                }}
                className={cn(
                  "relative h-8 px-5 rounded-full text-[13px] font-medium transition-colors duration-200 flex items-center justify-center gap-1.5 capitalize z-10 flex-1 sm:flex-initial",
                  isActive || "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="tab-active-pill"
                    className={`${
                      isActive && "bg-white shadow-md"
                    } absolute inset-0 rounded-full`}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative flex items-center gap-1.5">
                  {tab === "trending" ? (
                    <FireIcon
                      size={14}
                      weight={isActive ? "fill" : "regular"}
                    />
                  ) : tab === "ask" ? (
                    <PlusIcon
                      size={14}
                      weight="regular"
                    />
                  ) : (
                    <ClockIcon
                      size={14}
                      weight={isActive ? "fill" : "regular"}
                    />
                  )}
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="space-y-4">
          {loading ? (
            <>
              <QuestionSkeleton />
              <QuestionSkeleton />
              <QuestionSkeleton />
            </>
          ) : fetchError ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 px-4 text-center"
            >
              <p className="text-muted-foreground mb-4">{fetchError}</p>
              <Button
                variant="outline"
                onClick={() => fetchQuestions(pagination.currentPage, searchQuery, activeTab)}
              >
                Try again
              </Button>
            </motion.div>
          ) : questions.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {questions.map((q, idx) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  idx={idx}
                  onAuthRequired={triggerAuthModal}
                />
              ))}
            </AnimatePresence>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 px-4 text-center"
            >
              <div className="w-20 h-20 flex items-center justify-center mb-6">
                <ChatCircleDotsIcon size={40} className="text-primary/30" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No questions yet</h3>
              <p className="text-muted-foreground max-w-sm mb-8 leading-relaxed">
                Be the one to spark the conversation. Ask a question and start a debate with the
                community.
              </p>
            </motion.div>
          )}

          {!loading && !fetchError && pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 pb-10 border-t border-gray-100">
              <div className="text-[13px] text-muted-foreground font-medium">
                Showing{" "}
                <span className="text-foreground">{questions.length}</span> of{" "}
                <span className="text-foreground">{pagination.totalItems}</span> questions
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-xl border-gray-100 disabled:opacity-30"
                  onClick={() =>
                    fetchQuestions(pagination.currentPage - 1, searchQuery, activeTab)
                  }
                  disabled={pagination.currentPage === 1 || loading}
                >
                  <CaretLeftIcon size={16} weight="bold" />
                </Button>

                <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter(
                      (p) =>
                        p === 1 ||
                        p === pagination.totalPages ||
                        Math.abs(p - pagination.currentPage) <= 1
                    )
                    .map((page, index, array) => {
                      const showEllipsis = index > 0 && page - array[index - 1] > 1;
                      return (
                        <div key={page} className="flex items-center gap-1">
                          {showEllipsis && (
                            <span className="text-muted-foreground/30 px-1 text-xs">...</span>
                          )}
                          <button
                            onClick={() => fetchQuestions(page, searchQuery, activeTab)}
                            className={cn(
                              "h-7 min-w-[28px] px-2 rounded-lg text-[12.5px] font-bold transition-all",
                              pagination.currentPage === page
                                ? "bg-white text-primary shadow-sm ring-1 ring-gray-100"
                                : "text-muted-foreground/50 hover:text-foreground hover:bg-white"
                            )}
                          >
                            {page}
                          </button>
                        </div>
                      );
                    })}
                </div>

                <Button
                  variant="light"
                  size="icon"
                  className="h-9 w-9 rounded-xl border-gray-100 disabled:opacity-30"
                  onClick={() =>
                    fetchQuestions(pagination.currentPage + 1, searchQuery, activeTab)
                  }
                  disabled={pagination.currentPage === pagination.totalPages || loading}
                >
                  <CaretRightIcon size={16} weight="bold" />
                </Button>
              </div>
              <div className="text-[12px] text-muted-foreground/40 font-medium sm:hidden">
                Page {pagination.currentPage} of {pagination.totalPages}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}