"use client";

import { Answer, Comment, VoteDirection } from "@/app/types/home.type";
import { Avatar } from "./Avatar";
import { CommentItem } from "./CommentItem";
import { ReportModal } from "./ReportModal";
import { timeAgo, cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowFatUpIcon,
  ArrowFatDownIcon,
  ChatCircleDotsIcon,
  SealCheckIcon,
  CaretDownIcon,
  PaperPlaneIcon,
  CircleNotchIcon,
  PlusCircleIcon,
} from "@phosphor-icons/react";
import { ActionMenu } from "./ActionMenu";
import { Input } from "@/components/ui/input";
import { useSession } from "@/app/lib/auth-client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { LinkifiedText } from "./LinkifiedText";
import { toast } from "sonner";

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
  const [showMenu, setShowMenu] = useState(false);
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
  const [showReportModal, setShowReportModal] = useState(false);
  const lastActionTime = useRef<number>(0);


  function checkCooldown(type: "vote" | "comment") {
    const now = Date.now();
    if (now - lastActionTime.current < 5000) {
      if (type === "vote") {
        setIsVoteShaking(true);
        setTimeout(() => setIsVoteShaking(false), 400);
      } else if (type === "comment") {
        setIsCommentShaking(true);
        setTimeout(() => setIsCommentShaking(false), 400);
      }
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(200);
      }
      return true;
    }
    lastActionTime.current = now;
    return false;
  }
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
      console.error(err.message || "Could not load comments");
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
    if (checkCooldown("vote")) return;

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
      }
      console.error(err.message || "Failed to vote");
    }
  }

  async function handleAccept() {
    if (!isQuestionAuthor) return;

    const prevAccepted = localIsAccepted;
    const nextAccepted = !localIsAccepted;

    setLocalIsAccepted(nextAccepted);
    onAccept(answer.id, nextAccepted);

    const repDelta = nextAccepted ? 15 : -15;
    const userRepDelta = nextAccepted ? 2 : -2;

    window.dispatchEvent(new CustomEvent('reputationUpdate', { detail: { userId: answer.authorId, delta: repDelta } }));
    if (session?.user?.id) {
      window.dispatchEvent(new CustomEvent('reputationUpdate', { detail: { userId: session.user.id, delta: userRepDelta } }));
    }

    setIsAccepting(true);

    try {
      const res = await fetch(`/api/answers/${answer.id}/accept`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to accept answer");

      setLocalIsAccepted(data.isAccepted);
      onAccept(answer.id, data.isAccepted);
    } catch (err: any) {
      setLocalIsAccepted(prevAccepted);
      onAccept(answer.id, prevAccepted);

      const rollbackRepDelta = nextAccepted ? -15 : 15;
      const rollbackUserRepDelta = nextAccepted ? -2 : 2;

      window.dispatchEvent(new CustomEvent('reputationUpdate', { detail: { userId: answer.authorId, delta: rollbackRepDelta } }));
      if (session?.user?.id) {
        window.dispatchEvent(new CustomEvent('reputationUpdate', { detail: { userId: session.user.id, delta: rollbackUserRepDelta } }));
      }

      console.error(err.message || "Failed to accept answer");
    } finally {
      setIsAccepting(false);
    }
  }

  async function handlePostComment() {
    if (checkCooldown("comment")) return;

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
      score: 0,
      userVote: null,
      replyToId: null,
      replyCount: 0,
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
      if (!res.ok) {
        if (data.details) {
          /*
          toast.error(data.error || "Inappropriate content", {
            description: `Flagged for: ${data.details} (${data.confidence})`,
          });
          */
          throw new Error("moderated");
        }
        throw new Error(data.error || "Failed to post comment");
      }

      setLocalComments((prev) => prev.map(c => c.id === tempId ? data : c));
      setCommentsFetched(true);
      // toast.success("Comment added!");
    } catch (err: any) {
      setLocalComments(prevComments);
      setLocalCommentCount(prevCount);
      setCommentBody(tempComment.content);
      if (err.message !== "moderated") {
        // toast.error(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleFlag() {
    setShowMenu(false);
    if (!session) {
      onAuthRequired({
        title: "Report content",
        description: "Sign in to report inappropriate content for review.",
      });
      return;
    }
    setShowReportModal(true);
  }

  return (
    <div
      className={cn(
        "py-5 border-t border-gray-200/75 transition-all duration-200 relative bg-white group/card"
      )}
    >
      {isAnswerAuthor && (
        <div className="absolute top-0 left-1/10 z-10">
          <div className="bg-purple-600/10 text-purple-600 text-[9px] font-bold px-2 py-0.5 rounded-b-md">
            ACCEPTED
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar author={answer.author} gender={answer.author.gender} size={28} />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] sm:text-[13px] font-bold text-primary truncate max-w-[120px] sm:max-w-[200px]">
                  {answer.author.name}
                </span>
                {answer.author.emailVerified && (
                  <SealCheckIcon
                    size={12}
                    weight="fill"
                    className="text-blue-500 shrink-0"
                  />
                )}
              </div>
              <span className="text-[10px] sm:text-[11px] text-muted-foreground/50 leading-none">
                {timeAgo(answer.createdAt)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {isQuestionAuthor && (
              <button
                onClick={handleAccept}
                disabled={isAccepting}
                className={cn(
                  "flex items-center gap-1 text-[10px] sm:text-[11px] px-2 py-1 rounded-full transition-all duration-200",
                  localIsAccepted
                    ? "text-purple-600 bg-purple-600/10"
                    : "bg-gray-100 text-muted-foreground/60 hover:bg-gray-200"
                )}
              >
                {isAccepting ? (
                  <CircleNotchIcon size={12} className="animate-spin" />
                ) : (
                  <SealCheckIcon size={12} weight={localIsAccepted ? "fill" : "regular"} />
                )}
                {localIsAccepted ? "Accepted" : "Accept"}
              </button>
            )}
            {session && (
              <ActionMenu
                author={answer.author}
                onFlag={handleFlag}
                verifiedLabel="Verified Expert"
                isAuthor={isAnswerAuthor}
              />
            )}
          </div>
        </div>

        <div className="text-[13px] sm:text-[14.5px] text-foreground/90 leading-relaxed wrap-break-word whitespace-pre-wrap pl-[38px] sm:pl-[38px]">
          <LinkifiedText text={answer.body} />
        </div>

        <div className="flex items-center gap-4 sm:gap-6 pl-[38px] sm:pl-[38px]">
          <motion.div
            animate={isVoteShaking ? { x: [-2, 2, -2, 2, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-1"
          >
            <button
              onClick={() => handleVote("up")}
              className={cn(
                "p-1 rounded-md transition-all duration-200",
                vote === "up"
                  ? "text-green-600 bg-green-600/5"
                  : "text-muted-foreground/30 hover:text-green-600 hover:bg-green-600/5"
              )}
            >
              <ArrowFatUpIcon size={14} weight={vote === "up" ? "fill" : "regular"} />
            </button>
            <span
              className={cn(
                "text-[12px] font-bold tabular-nums min-w-[2ch] text-center",
                localScore > 0
                  ? "text-primary"
                  : localScore < 0
                    ? "text-red-500"
                    : "text-muted-foreground/40"
              )}
            >
              {localScore}
            </span>
            <button
              onClick={() => handleVote("down")}
              className={cn(
                "p-1 rounded-md transition-all duration-200",
                vote === "down"
                  ? "text-red-500 bg-red-500/5"
                  : "text-muted-foreground/30 hover:text-red-500 hover:bg-red-500/5"
              )}
            >
              <ArrowFatDownIcon size={14} weight={vote === "down" ? "fill" : "regular"} />
            </button>
          </motion.div>

          <button
            onClick={handleToggleComments}
            className="flex items-center gap-1.5 text-[11px] sm:text-[12px] text-muted-foreground/50 hover:text-primary transition-colors py-1"
          >
            <ChatCircleDotsIcon size={14} />
            <span>{localCommentCount}<span className="hidden sm:inline ml-1">{localCommentCount === 1 ? "Comment" : "Comments"}</span></span>
            <CaretDownIcon
              size={12}
              className={cn("transition-transform duration-200", showComments && "rotate-180")}
            />
          </button>
        </div>
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="pl-[38px] sm:pl-[38px]">
                <div className="pt-2 pb-1">
                  {isLoadingComments && localComments.length === 0 ? (
                    <div className="flex justify-center py-4">
                      <CircleNotchIcon size={20} className="animate-spin text-primary/20" />
                    </div>
                  ) : localComments.length === 0 ? (
                    <p className="text-[12px] text-muted-foreground/30 px-2 italic">No comments yet.</p>
                  ) : (
                    <div className="space-y-1">
                      {localComments.map((c) => (
                        <CommentItem
                          key={c.id}
                          comment={c}
                          parentId={answer.id}
                          parentType="answer"
                          onAuthRequired={onAuthRequired}
                        />
                      ))}
                      {isLoadingComments && (
                        <div className="flex justify-center py-3">
                          <CircleNotchIcon size={18} className="animate-spin text-primary/20" />
                        </div>
                      )}
                      {hasMoreComments && !isLoadingComments && (
                        <Button
                          variant="ghost"
                          className="w-full text-muted-foreground text-[11px] hover:text-primary hover:bg-primary/5 mt-2"
                          onClick={() => fetchComments(commentPage + 1)}
                        >
                          Load more comments
                          <PlusCircleIcon className="ml-1" size={12} />
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {!isAnswerAuthor && (
                  <motion.div
                    animate={isCommentShaking ? { x: [-2, 2, -2, 2, 0] } : {}}
                    transition={{ duration: 0.4 }}
                    className="mt-4 mb-2"
                  >
                    <div className="flex items-center gap-1.5 bg-gray-100 shadow-inner my-4 rounded-4xl pl-2 pr-1 py-1 group/input w-full">
                      <Input
                        className="bg-transparent border-0! outline-0! ring-0! flex-1 text-[10.5px] sm:text-[11.5px] h-6"
                        placeholder="Add a comment..."
                        value={commentBody}
                        onChange={(e) => setCommentBody(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handlePostComment();
                        }}
                        disabled={isSubmitting}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-black cursor-pointer rounded-4xl sm:border-transparent hover:border-gray-200/20 border-gray-200/20 hover:bg-white sm:bg-transparent bg-white sm:shadow-none shadow-sm hover:shadow-sm active:scale-95 shrink-0"
                        onClick={handlePostComment}
                        disabled={isSubmitting || !commentBody.trim()}
                      >
                        {isSubmitting ? (
                          <CircleNotchIcon size={9} className="animate-spin" />
                        ) : (
                          <PaperPlaneIcon size={9} className="rotate-45" />
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ReportModal
        open={showReportModal}
        onClose={() => setShowReportModal(false)}
        referenceId={answer.id}
        referenceType="answer"
        reportedUserId={answer.authorId}
        title={answer.body}
      />
    </div>
  );
}
