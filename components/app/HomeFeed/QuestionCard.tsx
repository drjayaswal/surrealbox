"use client";

import { Question, VoteDirection, Answer, Comment } from "@/app/types/home.type";
import { Avatar } from "./Avatar";
import { AnswerCard } from "./AnswerCard";
import { CommentItem } from "./CommentItem";
import { timeAgo, cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowFatUpIcon,
  ArrowFatDownIcon,
  ChatCircleDotsIcon,
  CaretDownIcon,
  PaperPlaneIcon,
  SpinnerGapIcon,
  SealCheckIcon,
  PlusCircleIcon,
  LightbulbIcon,
  TagIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useEffect, useState, useRef } from "react";
import { useSession } from "@/app/lib/auth-client";
import { useUser } from "@/context/UserContext";
import { ReputationBadge } from "./ReputationBadge";
import { LinkifiedText } from "./LinkifiedText";

export function QuestionCard({
  question,
  idx,
  onAuthRequired,
}: {
  question: Question;
  idx: number;
  onAuthRequired: (config?: { title: string; description: string }) => void;
}) {
  const { data: session } = useSession();
  const { user, adjustReputation } = useUser();
  const isAuthor = session?.user?.id === question.authorId;

  const [showComments, setShowComments] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [showTags, setShowTags] = useState(false);

  const [localComments, setLocalComments] = useState<Comment[]>([]);
  const [localAnswers, setLocalAnswers] = useState<Answer[]>([]);
  const [commentPage, setCommentPage] = useState(1);
  const [answerPage, setAnswerPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [hasMoreAnswers, setHasMoreAnswers] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isLoadingAnswers, setIsLoadingAnswers] = useState(false);
  const [commentsFetched, setCommentsFetched] = useState(false);
  const [answersFetched, setAnswersFetched] = useState(false);

  const [localScore, setLocalScore] = useState(question.score);
  const [vote, setVote] = useState<VoteDirection>(question.userVote);
  const [localCommentCount, setLocalCommentCount] = useState(question.commentCount);
  const [localAnswerCount, setLocalAnswerCount] = useState(question.answerCount);
  const [localAuthorReputation, setLocalAuthorReputation] = useState(question.author.reputation);
  const [localViewCount, setLocalViewCount] = useState(question.viewCount);
  const viewTracked = useRef(false);

  const [answerBody, setAnswerBody] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isBodyExpanded, setIsBodyExpanded] = useState(false);
  const [isTitleExpanded, setIsTitleExpanded] = useState(false);
  const [isVoteShaking, setIsVoteShaking] = useState(false);
  const [isAnswerShaking, setIsAnswerShaking] = useState(false);
  const [isCommentShaking, setIsCommentShaking] = useState(false);
  const lastActionTime = useRef<number>(0);

  function checkCooldown(type: "vote" | "answer" | "comment") {
    const now = Date.now();
    if (now - lastActionTime.current < 5000) {
      if (type === "vote") {
        setIsVoteShaking(true);
        setTimeout(() => setIsVoteShaking(false), 400);
      } else if (type === "answer") {
        setIsAnswerShaking(true);
        setTimeout(() => setIsAnswerShaking(false), 400);
      } else if (type === "comment") {
        setIsCommentShaking(true);
        setTimeout(() => setIsCommentShaking(false), 400);
      }
      toast.error(`Please wait ${Math.ceil((5000 - (now - lastActionTime.current)) / 1000)}s before next action`, {
        id: "cooldown-toast",
      });
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(200);
      }
      return true;
    }
    lastActionTime.current = now;
    return false;
  }

  useEffect(() => {
    setLocalCommentCount(question.commentCount);
    setLocalAnswerCount(question.answerCount);
    setLocalScore(question.score);
    setVote(question.userVote);
    setLocalComments([]);
    setLocalAnswers([]);
    setCommentsFetched(false);
    setAnswersFetched(false);
    setShowComments(false);
    setShowAnswers(false);
    setShowTags(false);
    setIsBodyExpanded(false);
    setIsTitleExpanded(false);
    setLocalAuthorReputation(question.author.reputation);
    setLocalViewCount(question.viewCount);
    viewTracked.current = false;
  }, [question.id, question.author.reputation, question.viewCount]);

  useEffect(() => {
    const handleRep = (e: CustomEvent<{ userId: string, delta: number }>) => {
      if (e.detail.userId === question.authorId) {
        setLocalAuthorReputation(prev => prev + e.detail.delta);
      }
    };
    window.addEventListener('reputationUpdate', handleRep as EventListener);
    return () => window.removeEventListener('reputationUpdate', handleRep as EventListener);
  }, [question.authorId]);

  async function trackView() {
    if (viewTracked.current || !session) return;
    console.log(`[VIEW_TRACK] Triggered for question ${question.id}`);
    viewTracked.current = true;
    setLocalViewCount(v => v + 1);
    try {
      const res = await fetch(`/api/questions/${question.id}/view`, { method: "POST" });
      const data = await res.json();
      if (data.alreadyViewed) {
        console.log(`[VIEW_TRACK] User already viewed question ${question.id}, reverting local count`);
        setLocalViewCount(v => v - 1);
      }
    } catch (error) {
      console.error("[VIEW_TRACK] Error:", error);
      setLocalViewCount(v => v - 1);
      viewTracked.current = false;
    }
  }

  async function fetchComments(page: number) {
    setIsLoadingComments(true);
    try {
      const res = await fetch(
        `/api/comments?parentId=${question.id}&parentType=question&page=${page}&limit=5`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load comments");
      if (page === 1) setLocalComments(data.items);
      else setLocalComments((prev) => [...prev, ...data.items]);
      setHasMoreComments(!!data.nextPage);
      setCommentPage(page);
      setCommentsFetched(true);
    } catch (err: any) {
      toast.error(err.message || "Could not load comments");
    } finally {
      setIsLoadingComments(false);
    }
  }

  async function fetchAnswers(page: number) {
    setIsLoadingAnswers(true);
    try {
      const res = await fetch(
        `/api/answers?questionId=${question.id}&page=${page}&limit=5`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load answers");
      if (page === 1) setLocalAnswers(data.items);
      else setLocalAnswers((prev) => [...prev, ...data.items]);
      setHasMoreAnswers(!!data.nextPage);
      setAnswerPage(page);
      setAnswersFetched(true);
    } catch (err: any) {
      toast.error(err.message || "Could not load answers");
    } finally {
      setIsLoadingAnswers(false);
    }
  }

  function handleToggleComments() {
    if (!session) {
      onAuthRequired({
        title: "Join the conversation",
        description: "Sign in to view comments and engage with the community.",
      });
      return;
    }
    const nextOpen = !showComments;
    setShowComments(nextOpen);
    setShowAnswers(false);
    setIsBodyExpanded(false);
    setShowTags(false);
    trackView();
    if (nextOpen && !commentsFetched) {
      fetchComments(1);
    }
  }

  function handleToggleAnswers() {
    if (!session) {
      onAuthRequired({
        title: "Explore insights",
        description: "Sign in to see expert answers and community solutions.",
      });
      return;
    }
    const nextOpen = !showAnswers;
    setShowAnswers(nextOpen);
    setShowComments(false);
    setIsBodyExpanded(false);
    setShowTags(false);
    trackView();
    if (nextOpen && !answersFetched) {
      fetchAnswers(1);
    }
  }

  function handleToggleContext() {
    const nextOpen = !isBodyExpanded;
    setIsBodyExpanded(nextOpen);
    setShowComments(false);
    setShowAnswers(false);
    setShowTags(false);
    trackView();
  }

  function handleToggleTags() {
    const nextOpen = !showTags;
    setShowTags(nextOpen);
    setShowComments(false);
    setShowAnswers(false);
    setIsBodyExpanded(false);
    trackView();
  }

  function handleToggleTitle() {
    setIsTitleExpanded(!isTitleExpanded);
    trackView();
  }

  async function handleVote(dir: "up" | "down") {
    if (checkCooldown("vote")) return;

    if (!session) {
      onAuthRequired({
        title: "Voice your opinion",
        description: "Join the community to upvote great questions and help surface the best content.",
      });
      return;
    }

    if (isAuthor) {
      setIsVoteShaking(true);
      setTimeout(() => setIsVoteShaking(false), 400);
      return;
    }

    trackView();

    const prevVote = vote;
    const prevScore = localScore;
    let authorDelta = 0;
    let userDelta = 0;

    if (vote === dir) {
      setVote(null);
      setLocalScore((s) => s + (dir === "up" ? -1 : 1));
      if (dir === "up") {
        authorDelta = -5;
      } else {
        authorDelta = 2;
        userDelta = 1;
      }
    } else {
      const prev = vote;
      setVote(dir);
      setLocalScore((s) => s + (dir === "up" ? 1 : -1) + (prev ? (prev === "up" ? -1 : 1) : 0));

      if (prev === "up") {
        authorDelta -= 5;
      } else if (prev === "down") {
        authorDelta += 2;
        userDelta += 1;
      }

      if (dir === "up") {
        authorDelta += 5;
      } else {
        authorDelta -= 2;
        userDelta -= 1;
      }
    }

    if (authorDelta !== 0) {
      window.dispatchEvent(new CustomEvent('reputationUpdate', { detail: { userId: question.authorId, delta: authorDelta } }));
    }
    if (userDelta !== 0 && session?.user?.id) {
      window.dispatchEvent(new CustomEvent('reputationUpdate', { detail: { userId: session.user.id, delta: userDelta } }));
      adjustReputation(userDelta);
    }

    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ votableId: question.id, votableType: "question", direction: dir }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to vote");
    } catch (err: any) {
      setVote(prevVote);
      setLocalScore(prevScore);
      if (authorDelta !== 0) {
        window.dispatchEvent(new CustomEvent('reputationUpdate', { detail: { userId: question.authorId, delta: -authorDelta } }));
      }
      if (userDelta !== 0 && session?.user?.id) {
        window.dispatchEvent(new CustomEvent('reputationUpdate', { detail: { userId: session.user.id, delta: -userDelta } }));
        adjustReputation(-userDelta);
      }
      toast.error(err.message || "Failed to vote");
    }
  }

  async function handlePostComment() {
    if (checkCooldown("comment")) return;

    if (!session) {
      onAuthRequired({
        title: "Join the discussion",
        description: "Sign in to share your thoughts, ask follow-up questions, and engage with others.",
      });
      return;
    }
    if (!commentBody.trim()) return;
    trackView();
    const tempId = Math.random().toString(36).substring(7);
    const tempComment: Comment = {
      id: tempId,
      authorId: session.user.id,
      author: {
        id: session.user.id,
        name: session.user.name || "You",
        username: session.user.name?.toLowerCase().replace(/\s/g, "") || "you",
        reputation: 0,
        gender: "other",
      },
      content: commentBody.trim(),
      createdAt: new Date().toISOString(),
    };

    const prevComments = localComments;
    const prevCount = localCommentCount;

    setLocalComments((prev) => [tempComment, ...prev]);
    setLocalCommentCount((c) => c + 1);
    setCommentBody("");
    setIsSubmittingComment(true);

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId: question.id, parentType: "question", content: tempComment.content }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.details) {
          toast.error(data.error || "Inappropriate content", {
            description: `Flagged for: ${data.details} (${data.confidence})`,
          });
          throw new Error("moderated");
        }
        throw new Error(data.error || "Failed to post comment");
      }

      setLocalComments((prev) => prev.map(c => c.id === tempId ? data : c));
      setCommentsFetched(true);
      toast.success("Comment added!");
    } catch (err: any) {
      setLocalComments(prevComments);
      setLocalCommentCount(prevCount);
      setCommentBody(tempComment.content);
      if (err.message !== "moderated") {
        toast.error(err.message);
      }
    } finally {
      setIsSubmittingComment(false);
    }
  }

  async function handlePostAnswer() {
    if (checkCooldown("answer")) return;

    if (!session) {
      onAuthRequired({
        title: "Share your expertise",
        description: "Create an account to provide detailed answers and help others in the community.",
      });
      return;
    }
    if (isAuthor) {
      setIsAnswerShaking(true);
      setTimeout(() => setIsAnswerShaking(false), 400);
      return;
    }
    if (!answerBody.trim()) return;
    trackView();
    const tempId = Math.random().toString(36).substring(7);
    const tempAnswer: Answer = {
      id: tempId,
      questionId: question.id,
      authorId: session.user.id,
      author: {
        id: session.user.id,
        name: session.user.name || "You",
        username: session.user.name?.toLowerCase().replace(/\s/g, "") || "you",
        reputation: 0,
        gender: "other",
      },
      body: answerBody.trim(),
      score: 0,
      isAccepted: false,
      commentCount: 0,
      createdAt: new Date().toISOString(),
      userVote: null,
    };

    const prevAnswers = localAnswers;
    const prevCount = localAnswerCount;

    setLocalAnswers((prev) => [tempAnswer, ...prev]);
    setLocalAnswerCount((c) => c + 1);
    setAnswerBody("");
    setIsSubmittingAnswer(true);

    try {
      const res = await fetch("/api/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id, body: tempAnswer.body }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.details) {
          toast.error(data.error || "Inappropriate content", {
            description: `Flagged for: ${data.details} (${data.confidence})`,
          });
          throw new Error("moderated");
        }
        throw new Error(data.error || "Failed to post answer");
      }

      setLocalAnswers((prev) => prev.map(a => a.id === tempId ? data : a));
      setAnswersFetched(true);
      toast.success("Answer posted!");
    } catch (err: any) {
      setLocalAnswers(prevAnswers);
      setLocalAnswerCount(prevCount);
      setAnswerBody(tempAnswer.body);
      if (err.message !== "moderated") {
        toast.error(err.message);
      }
    } finally {
      setIsSubmittingAnswer(false);
    }
  }

  function handleAcceptAnswer(answerId: string, isAccepted: boolean) {
    setLocalAnswers((prev) =>
      prev.map((a) => ({
        ...a,
        isAccepted: a.id === answerId ? isAccepted : isAccepted ? false : a.isAccepted,
      }))
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.07, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="group bg-white rounded-xl border border-gray-100 shadow-sm transition-all duration-300"
    >
      <div className="p-3.5 sm:p-6">
        <div className="flex gap-2.5 sm:gap-5">
          <motion.div
            animate={isVoteShaking ? { x: [-3, 3, -3, 3, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-0.5 pt-1 shrink-0"
          >
            <button
              onClick={() => handleVote("up")}
              className={cn(
                "p-1 sm:p-2 rounded-xl transition-all duration-200",
                vote === "up"
                  ? "bg-green-600/10 text-green-600"
                  : "text-muted-foreground/30 hover:bg-green-600/5 hover:text-green-600"
              )}
            >
              <ArrowFatUpIcon size={16} className="sm:w-5 sm:h-5" weight={vote === "up" ? "fill" : "regular"} />
            </button>
            <span
              className={cn(
                "text-[12px] sm:text-[15px] font-bold tabular-nums min-w-[2ch] sm:min-w-[2.5ch] text-center",
                localScore > 0
                  ? "text-primary"
                  : localScore < 0
                    ? "text-red-500"
                    : "text-muted-foreground/50"
              )}
            >
              {localScore}
            </span>
            <button
              onClick={() => handleVote("down")}
              className={cn(
                "p-1 sm:p-2 rounded-xl transition-all duration-200",
                vote === "down"
                  ? "bg-red-500/10 text-red-500"
                  : "text-muted-foreground/30 hover:bg-red-500/5 hover:text-red-500"
              )}
            >
              <ArrowFatDownIcon size={16} className="sm:w-5 sm:h-5" weight={vote === "down" ? "fill" : "regular"} />
            </button>
          </motion.div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mb-1.5 sm:mb-2.5">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Avatar author={question.author} gender={question.author.gender} />
                <span className="text-[11px] sm:text-[12.5px] font-semibold text-primary truncate max-w-[80px] sm:max-w-none">
                  {question.author.name}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground/40 hidden xs:inline">·</span>
              <span className="text-[10.5px] sm:text-[12px] text-muted-foreground/60">
                {timeAgo(question.createdAt)}
              </span>
              <div className="ml-auto flex items-center gap-1.5 shrink-0">
                <ReputationBadge reputation={localAuthorReputation} />
                <span className="text-[9px] sm:text-[10.5px] text-white bg-blue-600 px-1.5 sm:px-2 py-0.5 rounded-md">
                  {localViewCount.toLocaleString()}<span className="hidden md:inline ml-1">views</span>
                </span>
              </div>
            </div>
            <div className="flex items-start justify-between mb-4 gap-2">
              <motion.h3
                initial={false}
                animate={{ height: isTitleExpanded ? "auto" : "26px" }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className={cn(
                  "text-[14px] sm:text-[19px] font-semibold text-foreground leading-snug cursor-pointer min-w-0 wrap-break-word overflow-hidden",
                  !isTitleExpanded && "truncate"
                )}
                onClick={handleToggleTitle}
              >
                <LinkifiedText text={question.title} />
              </motion.h3>
              <button
                onClick={handleToggleTitle}
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors whitespace-nowrap pt-1"
              >
                <CaretDownIcon
                  size={12}
                  className={cn("transition-transform duration-300", isTitleExpanded && "rotate-180")}
                />
              </button>
            </div>
            <div className="flex items-center flex-wrap gap-2.5 sm:gap-5 border-t border-gray-100 pt-1.5 sm:pt-2">
              <button
                onClick={handleToggleContext}
                className={cn(
                  "flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-[12.5px] font-medium transition-colors",
                  isBodyExpanded
                    ? "text-primary"
                    : "text-muted-foreground/50 hover:text-primary/70"
                )}
              >
                <LightbulbIcon size={14} className="sm:w-[16px] sm:h-[16px]" weight={isBodyExpanded ? "fill" : "regular"} />
                <span className="hidden sm:inline">Context</span>
                <CaretDownIcon
                  size={10}
                  className={cn("transition-transform duration-200", isBodyExpanded && "rotate-180")}
                />
              </button>
              <button
                onClick={handleToggleTags}
                className={cn(
                  "flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-[12.5px] font-medium transition-colors",
                  showTags
                    ? "text-primary"
                    : "text-muted-foreground/50 hover:text-primary/70"
                )}
              >
                <TagIcon size={14} className="sm:w-[16px] sm:h-[16px]" weight={showTags ? "fill" : "regular"} />
                <span className="hidden sm:inline">Tags</span>
                <CaretDownIcon
                  size={10}
                  className={cn("transition-transform duration-200", showTags && "rotate-180")}
                />
              </button>
              <button
                onClick={handleToggleComments}
                className={cn(
                  "flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-[12.5px] font-medium transition-colors",
                  showComments
                    ? "text-primary"
                    : "text-muted-foreground/50 hover:text-primary/70",
                )}
              >
                <ChatCircleDotsIcon size={14} className="sm:w-[16px] sm:h-[16px]" weight={showComments ? "fill" : "regular"} />
                <span>{localCommentCount}<span className="hidden sm:inline ml-1">Comments</span></span>
                <CaretDownIcon
                  size={10}
                  className={cn("transition-transform duration-200", showComments && "rotate-180")}
                />
              </button>

              <button
                onClick={handleToggleAnswers}
                className={cn(
                  "flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-[12.5px] font-medium transition-colors relative",
                  showAnswers
                    ? "text-primary"
                    : "text-muted-foreground/50 hover:text-primary/70",
                )}
              >
                <SealCheckIcon size={14} className={cn("sm:w-[16px] sm:h-[16px]", localAnswers.some(a => a.isAccepted) && "text-purple-600")} weight={showAnswers || localAnswers.some(a => a.isAccepted) ? "fill" : "regular"} />
                <span>{localAnswerCount}<span className="hidden sm:inline ml-1">Answers</span></span>
                <CaretDownIcon
                  size={10}
                  className={cn("transition-transform duration-200", showAnswers && "rotate-180")}
                />
              </button>
            </div>


            <AnimatePresence>
              {isBodyExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="py-4">
                    <div className="">
                      <p className="text-[13px] max-h-[100px] overflow-auto sm:text-[14px] text-muted-foreground leading-[1.7] selection:bg-primary/10 wrap-break-word">
                        <LinkifiedText text={question.body} />
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showTags && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="py-4">
                    <div className="flex flex-wrap gap-2">
                      {question.tags.map((tag) => (
                        <span
                          key={tag}
                          className="border border-gray-200/50 text-black/50 px-2.5 py-1 text-[11px] cursor-default"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showComments && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="py-4">
                    <motion.div
                      animate={isCommentShaking ? { x: [-3, 3, -3, 3, 0] } : {}}
                      transition={{ duration: 0.4 }}
                      className="flex items-center gap-2 bg-gray-100 shadow-inner border border-gray-100/50 rounded-xl px-2 py-1 mb-4 group/input w-full"
                    >
                      <Input
                        className="bg-transparent border-0! outline-0! ring-0! flex-1 text-[13px] h-8 px-1"
                        placeholder="Add a comment..."
                        value={commentBody}
                        onChange={(e) => setCommentBody(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handlePostComment();
                        }}
                        disabled={isSubmittingComment}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-primary hover:bg-white hover:shadow-sm active:scale-95"
                        onClick={handlePostComment}
                        disabled={isSubmittingComment || !commentBody.trim()}
                      >
                        {isSubmittingComment ? (
                          <SpinnerGapIcon size={14} className="animate-spin" />
                        ) : (
                          <PaperPlaneIcon size={14} className="rotate-45" />
                        )}
                      </Button>
                    </motion.div>

                    <div className="space-y-1 pl-1">
                      {isLoadingComments && localComments.length === 0 ? (
                        <div className="flex justify-center py-6">
                          <SpinnerGapIcon size={20} className="animate-spin text-primary/30" />
                        </div>
                      ) : localComments.length === 0 ? (
                        <p className="text-[12px] text-muted-foreground/30 py-2">No comments yet.</p>
                      ) : (
                        <>
                          {localComments.map((c) => (
                            <CommentItem key={c.id} comment={c} />
                          ))}
                          {isLoadingComments && (
                            <div className="flex justify-center py-4">
                              <SpinnerGapIcon size={18} className="animate-spin text-primary/30" />
                            </div>
                          )}
                          {hasMoreComments && !isLoadingComments && (
                            <Button
                              variant="light"
                              onClick={() => fetchComments(commentPage + 1)}
                              className="w-full text-black flex items-center gap-2 mt-2"
                            >
                              Load more comments
                              <PlusCircleIcon />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showAnswers && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="py-4">
                    <motion.div
                      animate={isAnswerShaking ? { x: [-3, 3, -3, 3, 0] } : {}}
                      transition={{ duration: 0.4 }}
                      className={cn(
                        "flex items-center gap-2 bg-gray-100 shadow-inner border border-gray-100/50 rounded-xl px-2 py-1 mb-4 group/input w-full",
                        isAuthor && "opacity-60 cursor-not-allowed"
                      )}
                    >
                      <Input
                        className="bg-transparent border-0! outline-0! ring-0! flex-1 text-[13px] h-8 px-1"
                        placeholder={isAuthor ? "Wait for community members to answer your question." : "Write your answer..."}
                        value={isAuthor ? "" : answerBody}
                        onChange={(e) => !isAuthor && setAnswerBody(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !isAuthor) handlePostAnswer();
                        }}
                        disabled={isSubmittingAnswer || isAuthor}
                      />
                      {!isAuthor && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-primary hover:bg-white hover:shadow-sm active:scale-95"
                          onClick={handlePostAnswer}
                          disabled={isSubmittingAnswer || !answerBody.trim()}
                        >
                          {isSubmittingAnswer ? (
                            <SpinnerGapIcon size={14} className="animate-spin" />
                          ) : (
                            <PaperPlaneIcon size={14} className="rotate-45" />
                          )}
                        </Button>
                      )}
                    </motion.div>

                    <div className="space-y-4 px-2">
                      {isLoadingAnswers && localAnswers.length === 0 ? (
                        <div className="flex justify-center py-10">
                          <SpinnerGapIcon size={24} className="animate-spin text-primary/30" />
                        </div>
                      ) : localAnswers.length === 0 ? (
                        <p className="text-[12px] text-muted-foreground/30 py-2 px-1">No answers yet.</p>

                      ) : (
                        <>
                          {localAnswers.map((answer) => (
                            <AnswerCard
                              key={answer.id}
                              answer={answer}
                              onAuthRequired={onAuthRequired}
                              questionAuthorId={question.authorId}
                              onAccept={handleAcceptAnswer}
                            />
                          ))}
                          {isLoadingAnswers && (
                            <div className="flex justify-center py-6">
                              <SpinnerGapIcon size={22} className="animate-spin text-primary/30" />
                            </div>
                          )}
                          {hasMoreAnswers && !isLoadingAnswers && (
                            <Button
                              variant="light"
                              onClick={() => fetchAnswers(answerPage + 1)}
                              className="w-full text-black flex items-center gap-2 mt-2"
                            >
                              Load more answers
                              <PlusCircleIcon />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
