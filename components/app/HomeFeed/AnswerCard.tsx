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
  SealCheckIcon,
  CaretDownIcon,
  PaperPlaneIcon,
  SpinnerGapIcon,
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
        title: "Flag content",
        description: "Sign in to flag inappropriate content for review.",
      });
      return;
    }
    try {
      await fetch(`/api/answers/${answer.id}/flag`, { method: "POST" });
      // toast.success("Answer flagged for review. Thank you.");
    } catch {
      // toast.error("Failed to flag answer.");
    }
  }

  return (
    <div
      className={cn(
        "p-3 py-4 border border-transparent border-t-gray-200/75 transition-all duration-200 relative bg-white",
        localIsAccepted && "border-purple-600"
      )}
    >
      {localIsAccepted && (
        <>
          <div className="absolute -top-1.5 -left-1.5 text-purple-600 z-10">
            <SealCheckIcon size={20} weight="fill" className="bg-white rounded-4xl" />
          </div>
          {isAnswerAuthor && (
            <div className="absolute top-0 right-30 bg-purple-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-b-lg shadow-sm animate-in fade-in slide-in-from-top-1 duration-500">
              ANSWER ACCEPTED
            </div>
          )}
        </>
      )}

      <div className="flex gap-2.5 sm:gap-4">
        <motion.div
          animate={isVoteShaking ? { x: [-3, 3, -3, 3, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-0.5 pt-1"
        >
          <button
            onClick={() => handleVote("up")}
            className={cn(
              "p-1 rounded-lg transition-all duration-200",
              vote === "up"
                ? "bg-green-600/10 text-green-600"
                : "text-muted-foreground/40 hover:text-green-700 hover:bg-green-600/5"
            )}
          >
            <ArrowFatUpIcon size={15} className="sm:w-[17px] sm:h-[17px]" weight={vote === "up" ? "fill" : "regular"} />
          </button>
          <span
            className={cn(
              "text-[10px] sm:text-[12px] font-bold tabular-nums min-w-[2ch] text-center",
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
              "p-1 rounded-lg transition-all duration-200",
              vote === "down"
                ? "bg-red-500/10 text-red-500"
                : "text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/5"
            )}
          >
            <ArrowFatDownIcon size={15} className="sm:w-[17px] sm:h-[17px]" weight={vote === "down" ? "fill" : "regular"} />
          </button>
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-1.5 sm:gap-2.5 mb-1.5 sm:mb-2.5">
            <Avatar author={answer.author} gender={answer.author.gender} />
            <span className="text-[11px] sm:text-[12.5px] font-semibold text-primary truncate max-w-[80px] xs:max-w-[120px] sm:max-w-none">{answer.author.name}</span>

            {answer.author.emailVerified && (
              <SealCheckIcon
                size={11}
                weight="fill"
                className="text-blue-500 shrink-0"
              />
            )}
            <span className="text-[10px] sm:text-[11.5px] text-muted-foreground/50 truncate">{timeAgo(answer.createdAt)}</span>
            <div className="ml-auto flex items-center gap-1 sm:gap-2 shrink-0">
              {isQuestionAuthor && (
                <button
                  onClick={handleAccept}
                  disabled={isAccepting}
                  className={cn(
                    "flex items-center gap-1 text-[9.5px] sm:text-[11px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-md transition-all duration-200",
                    localIsAccepted
                      ? "text-green-600 bg-green-600/10"
                      : "bg-gray-100 text-muted-foreground/60"
                  )}
                >
                  {isAccepting ? (
                    <SpinnerGapIcon size={10} className="animate-spin" />
                  ) : (
                    <SealCheckIcon size={10} className="sm:w-[11px] sm:h-[11px]" weight={localIsAccepted ? "fill" : "bold"} />
                  )}
                  <span className="hidden xs:inline">{localIsAccepted ? "Accepted" : "Accept"}</span>
                </button>
              )}
              {session && (
                <ActionMenu
                  author={answer.author}
                  onFlag={handleFlag}
                  verifiedLabel="Verified Expert"
                />
              )}
            </div>
          </div>

          <p className="text-[10px] sm:text-[14px] text-foreground/85 leading-[1.6] sm:leading-[1.75] mb-2.5 sm:mb-3 wrap-break-word">
            <LinkifiedText text={answer.body} />
          </p>

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
                className=""
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
                {isAnswerAuthor ||
                  <motion.div
                    animate={isCommentShaking ? { x: [-3, 3, -3, 3, 0] } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="flex items-center gap-1.5 bg-gray-100 shadow-inner my-4 rounded-4xl pl-2 pr-1 py-1 group/input w-full">
                      <Input
                        className="bg-transparent border-0! outline-0! ring-0! flex-1 text-[10.5px] sm:text-[11.5px] h-6"
                        placeholder="Add a comment..."
                        value={commentBody}
                        onChange={(e) => !isAnswerAuthor && setCommentBody(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !isAnswerAuthor) handlePostComment();
                        }}
                        disabled={isSubmitting || isAnswerAuthor}
                      />
                      {!isAnswerAuthor && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-black cursor-pointer rounded-4xl border-transparent hover:border-gray-200/20 hover:bg-white hover:shadow-sm active:scale-95 shrink-0"
                          onClick={handlePostComment}
                          disabled={isSubmitting || !commentBody.trim()}
                        >
                          {isSubmitting ? (
                            <SpinnerGapIcon size={9} className="animate-spin" />
                          ) : (
                            <PaperPlaneIcon size={9} className="rotate-45" />
                          )}
                        </Button>
                      )}
                    </div>
                  </motion.div>
                }
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
