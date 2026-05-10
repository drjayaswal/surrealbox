"use client";

import { Answer, Comment, VoteDirection } from "@/app/types/home.type";
import { Avatar } from "./Avatar";
import { CommentItem } from "./CommentItem";
import { timeAgo, cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowFatUpIcon,
  ArrowFatDownIcon,
  ChatCircleDotsIcon,
  CheckCircleIcon,
  CaretDownIcon,
  PaperPlaneIcon,
  SpinnerGapIcon,
  PlusCircleIcon,
  SealCheckIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useSession } from "@/app/lib/auth-client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { ReputationBadge } from "./ReputationBadge";
import { Button } from "@/components/ui/button";

export function AnswerCard({
  answer,
  onAuthRequired,
  questionAuthorId,
  onAccept,
}: {
  answer: Answer;
  onAuthRequired: (config?: { title: string; description: string }) => void;
  questionAuthorId: string | null;
  onAccept: (answerId: string, isAccepted: boolean) => void;
}) {
  const { data: session } = useSession();
  const { adjustReputation } = useUser();
  const isAnswerAuthor = session?.user?.id === answer.authorId;
  const isQuestionAuthor = session?.user?.id === questionAuthorId;

  const [showComments, setShowComments] = useState(false);
  const [localScore, setLocalScore] = useState(answer.score);
  const [vote, setVote] = useState<VoteDirection>(answer.userVote);
  const [commentBody, setCommentBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isVoteShaking, setIsVoteShaking] = useState(false);
  const [isCommentShaking, setIsCommentShaking] = useState(false);
  const [localIsAccepted, setLocalIsAccepted] = useState(answer.isAccepted);
  const [localAuthorReputation, setLocalAuthorReputation] = useState(answer.author.reputation);

  const [localComments, setLocalComments] = useState<Comment[]>([]);
  const [commentPage, setCommentPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentsFetched, setCommentsFetched] = useState(false);
  const [localCommentCount, setLocalCommentCount] = useState(answer.commentCount);

  useEffect(() => {
    setLocalAuthorReputation(answer.author.reputation);
  }, [answer.id, answer.author.reputation]);

  useEffect(() => {
    const handleRep = (e: CustomEvent<{ userId: string, delta: number }>) => {
      if (e.detail.userId === answer.authorId) {
        setLocalAuthorReputation(prev => prev + e.detail.delta);
      }
    };
    window.addEventListener('reputationUpdate', handleRep as EventListener);
    return () => window.removeEventListener('reputationUpdate', handleRep as EventListener);
  }, [answer.authorId]);

  async function fetchComments(page: number) {
    setIsLoadingComments(true);
    try {
      const res = await fetch(
        `/api/comments?parentId=${answer.id}&parentType=answer&page=${page}&limit=5`
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load comments");
      }
      const data = await res.json();
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

  function handleToggleComments() {
    if (!session) {
      onAuthRequired({
        title: "Join the discussion",
        description: "Sign in to view comments on answers and engage with the community.",
      });
      return;
    }
    const nextOpen = !showComments;
    setShowComments(nextOpen);
    if (nextOpen && !commentsFetched) {
      fetchComments(1);
    }
  }

  async function handleVote(dir: "up" | "down") {
    if (!session) {
      onAuthRequired({
        title: "Recognize good help",
        description: "Join the community to upvote helpful answers and recognize contributors.",
      });
      return;
    }
    if (isAnswerAuthor) {
      setIsVoteShaking(true);
      setTimeout(() => setIsVoteShaking(false), 400);
      return;
    }

    const prevVote = vote;
    const prevScore = localScore;
    let authorDelta = 0;
    let userDelta = 0;

    if (vote === dir) {
      setVote(null);
      setLocalScore((s) => s + (dir === "up" ? -1 : 1));
      if (dir === "up") {
        authorDelta = -10;
      } else {
        authorDelta = 10;
        userDelta = 1;
      }
    } else {
      const prev = vote;
      setVote(dir);
      setLocalScore((s) => s + (dir === "up" ? 1 : -1) + (prev ? (prev === "up" ? -1 : 1) : 0));

      if (prev === "up") {
        authorDelta -= 10;
      } else if (prev === "down") {
        authorDelta += 10;
        userDelta += 1;
      }

      if (dir === "up") {
        authorDelta += 10;
      } else {
        authorDelta -= 10;
        userDelta -= 1;
      }
    }

    if (authorDelta !== 0) {
      window.dispatchEvent(new CustomEvent('reputationUpdate', { detail: { userId: answer.authorId, delta: authorDelta } }));
    }
    if (userDelta !== 0 && session?.user?.id) {
      window.dispatchEvent(new CustomEvent('reputationUpdate', { detail: { userId: session.user.id, delta: userDelta } }));
      adjustReputation(userDelta);
    }

    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ votableId: answer.id, votableType: "answer", direction: dir }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to vote");
    } catch (err: any) {
      setVote(prevVote);
      setLocalScore(prevScore);
      if (authorDelta !== 0) {
        window.dispatchEvent(new CustomEvent('reputationUpdate', { detail: { userId: answer.authorId, delta: -authorDelta } }));
      }
      if (userDelta !== 0 && session?.user?.id) {
        window.dispatchEvent(new CustomEvent('reputationUpdate', { detail: { userId: session.user.id, delta: -userDelta } }));
        adjustReputation(-userDelta);
      }
      toast.error(err.message || "Failed to vote");
    }
  }

  async function handleAccept() {
    if (!isQuestionAuthor) return;

    const prevAccepted = localIsAccepted;
    const nextAccepted = !localIsAccepted;

    setLocalIsAccepted(nextAccepted);
    onAccept(answer.id, nextAccepted);

    // Adjust reputation: Answer author +15, Question author (me) +2
    const repDelta = nextAccepted ? 15 : -15;
    const userRepDelta = nextAccepted ? 2 : -2;

    window.dispatchEvent(new CustomEvent('reputationUpdate', { detail: { userId: answer.authorId, delta: repDelta } }));
    if (session?.user?.id) {
      window.dispatchEvent(new CustomEvent('reputationUpdate', { detail: { userId: session.user.id, delta: userRepDelta } }));
    }
    adjustReputation(userRepDelta);

    setIsAccepting(true);

    try {
      const res = await fetch(`/api/answers/${answer.id}/accept`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to accept answer");

      setLocalIsAccepted(data.isAccepted);
      onAccept(answer.id, data.isAccepted);
      toast.success(data.isAccepted ? "Answer accepted!" : "Acceptance removed");
    } catch (err: any) {
      setLocalIsAccepted(prevAccepted);
      onAccept(answer.id, prevAccepted);

      const repDelta = prevAccepted ? 15 : -15; // To rollback, we apply the inverse. Actually, if we accepted, repDelta was 15, so to rollback we want -15.
      const rollbackRepDelta = nextAccepted ? -15 : 15;
      const rollbackUserRepDelta = nextAccepted ? -2 : 2;

      window.dispatchEvent(new CustomEvent('reputationUpdate', { detail: { userId: answer.authorId, delta: rollbackRepDelta } }));
      if (session?.user?.id) {
        window.dispatchEvent(new CustomEvent('reputationUpdate', { detail: { userId: session.user.id, delta: rollbackUserRepDelta } }));
      }
      adjustReputation(rollbackUserRepDelta);

      toast.error(err.message || "Failed to accept answer");
    } finally {
      setIsAccepting(false);
    }
  }

  async function handlePostComment() {
    if (!session) {
      onAuthRequired({
        title: "Join the discussion",
        description: "Sign in to share your thoughts and engage with others.",
      });
      return;
    }
    if (isAnswerAuthor) {
      setIsCommentShaking(true);
      setTimeout(() => setIsCommentShaking(false), 400);
      return;
    }
    if (!commentBody.trim()) return;
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
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId: answer.id, parentType: "answer", content: tempComment.content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post comment");

      setLocalComments((prev) => prev.map(c => c.id === tempId ? data : c));
      setCommentsFetched(true);
      toast.success("Comment added!");
    } catch (err: any) {
      setLocalComments(prevComments);
      setLocalCommentCount(prevCount);
      setCommentBody(tempComment.content);
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className={cn(
        "rounded-xl p-3.5 sm:p-4 border border-gray-100 shadow-sm transition-all duration-200 relative bg-white"
      )}
    >
      {localIsAccepted && (
        <>
          <div className="absolute -top-2 -left-2 text-green-600 z-10">
            <SealCheckIcon size={20} weight="fill" />
          </div>
          {isAnswerAuthor && (
            <div className="absolute top-0 right-30 bg-green-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-b-lg shadow-sm animate-in fade-in slide-in-from-top-1 duration-500">
              ANSWER ACCEPTED
            </div>
          )}
        </>
      )}

      <div className="flex gap-2.5 sm:gap-4">
        <motion.div
          animate={isVoteShaking ? { x: [-3, 3, -3, 3, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-0.5 pt-0.5"
        >
          <button
            onClick={() => handleVote("up")}
            className={cn(
              "p-1 sm:p-1.5 rounded-lg transition-all duration-200",
              vote === "up"
                ? "bg-green-600/10 text-green-600"
                : "text-muted-foreground/40 hover:text-green-700 hover:bg-green-600/5"
            )}
          >
            <ArrowFatUpIcon size={14} className="sm:w-[16px] sm:h-[16px]" weight={vote === "up" ? "fill" : "regular"} />
          </button>
          <span
            className={cn(
              "text-[11px] sm:text-[13px] font-bold tabular-nums min-w-[2ch] text-center",
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
              "p-1 sm:p-1.5 rounded-lg transition-all duration-200",
              vote === "down"
                ? "bg-red-500/10 text-red-500"
                : "text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/5"
            )}
          >
            <ArrowFatDownIcon size={14} className="sm:w-[16px] sm:h-[16px]" weight={vote === "down" ? "fill" : "regular"} />
          </button>
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-1.5 sm:gap-2.5 mb-1.5 sm:mb-2.5">
            <Avatar author={answer.author} gender={answer.author.gender} />
            <span className="text-[11px] sm:text-[12.5px] font-semibold text-primary truncate max-w-[100px] sm:max-w-none">{answer.author.name}</span>
            <span className="text-[10px] text-muted-foreground/50">·</span>
            <span className="text-[10.5px] sm:text-[11.5px] text-muted-foreground/60">{timeAgo(answer.createdAt)}</span>
            <div className="ml-auto flex items-center gap-1 shrink-0">
              <ReputationBadge reputation={localAuthorReputation} />
              {isQuestionAuthor && (
                <button
                  onClick={handleAccept}
                  disabled={isAccepting}
                  className={cn(
                    "flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold px-1 py-0.5 rounded-md transition-all duration-200",
                    localIsAccepted
                      ? "text-green-600"
                      : "bg-gray-100 text-muted-foreground/60"
                  )}
                >
                  {isAccepting ? (
                    <SpinnerGapIcon size={10} className="animate-spin" />
                  ) : (
                    <CheckCircleIcon size={11} weight={localIsAccepted ? "fill" : "bold"} />
                  )}
                  <span className="hidden sm:inline">{localIsAccepted ? "Accepted" : "Accept"}</span>
                </button>
              )}
            </div>
          </div>

          <p className="text-[13px] sm:text-[14px] text-foreground/85 leading-[1.6] sm:leading-[1.75] mb-2.5 sm:mb-3 wrap-break-word">{answer.body}</p>

          <button
            onClick={handleToggleComments}
            className="flex items-center gap-1 sm:gap-1.5 text-[10.5px] sm:text-[12px] text-muted-foreground/60 hover:text-primary transition-colors mb-1.5 sm:mb-2"
          >
            <ChatCircleDotsIcon size={12} className="sm:w-[14px] sm:h-[14px]" />
            <span>
              {showComments ? (
                "Hide"
              ) : localCommentCount === 0 ? (
                <span className="hidden sm:inline">Add comment</span>
              ) : (
                <>
                  {localCommentCount}
                  <span className="hidden sm:inline ml-1">comments</span>
                </>
              )}
            </span>
            <CaretDownIcon
              size={10}
              className={cn("transition-transform duration-200", showComments && "rotate-180")}
            />
          </button>

          <AnimatePresence>
            {showComments && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-3 pt-1 pb-1 mb-2">
                  {isLoadingComments && localComments.length === 0 ? (
                    <div className="flex justify-center py-4">
                      <SpinnerGapIcon size={18} className="animate-spin text-primary/30" />
                    </div>
                  ) : localComments.length === 0 ? (
                    <p className="text-[12px] text-muted-foreground/30 py-2">No comments yet.</p>
                  ) : (
                    <>
                      {localComments.map((c) => (
                        <CommentItem key={c.id} comment={c} />
                      ))}
                      {isLoadingComments && (
                        <div className="flex justify-center py-3">
                          <SpinnerGapIcon size={16} className="animate-spin text-primary/30" />
                        </div>
                      )}
                      {hasMoreComments && !isLoadingComments && (
                        <Button
                          variant="light"
                          className="w-full text-black flex items-center gap-2 mt-2"
                          onClick={() => fetchComments(commentPage + 1)}
                        >
                          Load more comments
                          <PlusCircleIcon />
                        </Button>
                      )}
                    </>
                  )}
                </div>

                <motion.div
                  animate={isCommentShaking ? { x: [-3, 3, -3, 3, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  className={cn(
                    "flex items-center gap-2 bg-white border border-primary/8 rounded-4xl px-1 py-0.5 max-w-full sm:max-w-[320px] mb-2",
                    isAnswerAuthor && "opacity-60 cursor-not-allowed"
                  )}
                >
                  <Input
                    className="bg-transparent border-0! outline-0! ring-0! flex-1 text-[11px] sm:text-[12px] h-7 px-1"
                    placeholder={isAnswerAuthor ? "You cannot comment on your own answer" : "Add a comment..."}
                    value={isAnswerAuthor ? "" : commentBody}
                    onChange={(e) => !isAnswerAuthor && setCommentBody(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isAnswerAuthor) handlePostComment();
                    }}
                    disabled={isSubmitting || isAnswerAuthor}
                  />
                  {!isAnswerAuthor && (
                    <Button
                      size="icon"
                      variant="light"
                      className="h-6 w-6 text-primary rounded-4xl"
                      onClick={handlePostComment}
                      disabled={isSubmitting || !commentBody.trim()}
                    >
                      {isSubmitting ? (
                        <SpinnerGapIcon size={10} className="animate-spin" />
                      ) : (
                        <PaperPlaneIcon size={10} className="rotate-45" />
                      )}
                    </Button>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
