"use client";

import { Comment, VoteDirection } from "@/app/types/home.type";
import { Avatar } from "./Avatar";
import { timeAgo, cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { LinkifiedText } from "./LinkifiedText";
import { useSession } from "@/app/lib/auth-client";
import { useState, useRef, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ArrowFatUpIcon,
  ArrowFatDownIcon,
  ArrowBendUpLeftIcon,
  PaperPlaneIcon,
  CircleNotchIcon,
  SealCheckIcon,
  CaretDownIcon,
} from "@phosphor-icons/react";
import { ActionMenu } from "./ActionMenu";

interface CommentItemProps {
  comment: Comment;
  parentId: string;
  parentType: "question" | "answer";
  onAuthRequired: (config?: { title: string; description: string }) => void;
  depth?: number;
}

export function CommentItem({
  comment,
  parentId,
  parentType,
  onAuthRequired,
  depth = 0,
}: CommentItemProps) {
  const { data: session } = useSession();

  const [localScore, setLocalScore] = useState(comment.score ?? 0);
  const [vote, setVote] = useState<VoteDirection>(comment.userVote);
  const [showMenu, setShowMenu] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<Comment[]>([]);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [repliesFetched, setRepliesFetched] = useState(false);
  const [localReplyCount, setLocalReplyCount] = useState(comment.replyCount ?? 0);
  const [isVoteShaking, setIsVoteShaking] = useState(false);
  const [localAuthorReputation, setLocalAuthorReputation] = useState(comment.author.reputation);
  const { adjustReputation } = useUser();
  const lastActionTime = useRef<number>(0);

  function checkCooldown() {
    const now = Date.now();
    if (now - lastActionTime.current < 5000) {
      setIsVoteShaking(true);
      setTimeout(() => setIsVoteShaking(false), 400);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(200);
      }
      return true;
    }
    lastActionTime.current = now;
    return false;
  }


  useEffect(() => {
    setLocalAuthorReputation(comment.author.reputation);
  }, [comment.id, comment.author.reputation]);

  useEffect(() => {
    const handleRep = (e: CustomEvent<{ userId: string, delta: number }>) => {
      if (e.detail.userId === comment.authorId) {
        setLocalAuthorReputation(prev => prev + e.detail.delta);
      }
    };
    window.addEventListener('reputationUpdate', handleRep as EventListener);
    return () => window.removeEventListener('reputationUpdate', handleRep as EventListener);
  }, [comment.authorId]);

  async function handleVote(dir: "up" | "down") {
    if (checkCooldown()) return;
    if (!session) {
      onAuthRequired({
        title: "Vote on comments",
        description: "Sign in to vote on comments and support great discussions.",
      });
      return;
    }
    if (session.user.id === comment.authorId) {
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
      if (dir === "up") authorDelta = -2;
      else {
        authorDelta = 1;
        userDelta = 1;
      }
    } else {
      const prev = vote;
      setVote(dir);
      setLocalScore(
        (s) => s + (dir === "up" ? 1 : -1) + (prev ? (prev === "up" ? -1 : 1) : 0)
      );

      if (prev === "up") authorDelta -= 2;
      else if (prev === "down") {
        authorDelta += 1;
        userDelta += 1;
      }

      if (dir === "up") authorDelta += 2;
      else {
        authorDelta -= 1;
        userDelta -= 1;
      }
    }

    if (authorDelta !== 0) {
      window.dispatchEvent(new CustomEvent('reputationUpdate', { detail: { userId: comment.authorId, delta: authorDelta } }));
    }
    if (userDelta !== 0 && session?.user?.id) {
      window.dispatchEvent(new CustomEvent('reputationUpdate', { detail: { userId: session.user.id, delta: userDelta } }));
    }

    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ votableId: comment.id, votableType: "comment", direction: dir }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to vote");
    } catch (err: any) {
      setVote(prevVote);
      setLocalScore(prevScore);
      if (authorDelta !== 0) {
        window.dispatchEvent(new CustomEvent('reputationUpdate', { detail: { userId: comment.authorId, delta: -authorDelta } }));
      }
      if (userDelta !== 0 && session?.user?.id) {
        window.dispatchEvent(new CustomEvent('reputationUpdate', { detail: { userId: session.user.id, delta: -userDelta } }));
      }
      // toast.error(err.message || "Failed to vote");
    }
  }

  async function fetchReplies() {
    setIsLoadingReplies(true);
    try {
      const res = await fetch(
        `/api/comments?parentId=${comment.id}&parentType=comment&page=1&limit=20`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load replies");
      setReplies(data.items);
      setRepliesFetched(true);
    } catch (err: any) {
      // toast.error(err.message || "Could not load replies");
    } finally {
      setIsLoadingReplies(false);
    }
  }

  function handleToggleReplies() {
    const nextOpen = !showReplies;
    setShowReplies(nextOpen);
    if (nextOpen && !repliesFetched) fetchReplies();
  }

  async function handlePostReply() {
    if (!session) {
      onAuthRequired({
        title: "Reply to comment",
        description: "Sign in to reply to comments and join the discussion.",
      });
      return;
    }
    if (!replyBody.trim()) return;

    const tempId = Math.random().toString(36).substring(7);
    const tempReply: Comment = {
      id: tempId,
      authorId: session.user.id,
      author: {
        id: session.user.id,
        name: session.user.name || "You",
        username: (session.user as any).username || session.user.name?.toLowerCase().replace(/\s/g, "_") || "you",
        reputation: 0,
        gender: "other",
        emailVerified: session.user.emailVerified ?? false,
      },
      content: replyBody.trim(),
      score: 0,
      userVote: null,
      replyToId: comment.id,
      replyCount: 0,
      createdAt: new Date().toISOString(),
    };

    const prevReplies = replies;
    const prevCount = localReplyCount;

    setReplies((prev) => [...prev, tempReply]);
    setLocalReplyCount((c) => c + 1);
    setReplyBody("");
    setShowReplies(true);
    setIsSubmittingReply(true);

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: comment.id,
          parentType: "comment",
          replyToId: comment.id,
          content: tempReply.content,
        }),
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
        throw new Error(data.error || "Failed to post reply");
      }
      setReplies((prev) => prev.map((r) => (r.id === tempId ? data : r)));
      setRepliesFetched(true);
      setShowReplyInput(false);
      // toast.success("Reply posted!");
    } catch (err: any) {
      setReplies(prevReplies);
      setLocalReplyCount(prevCount);
      setReplyBody(tempReply.content);
      // if (err.message !== "moderated") toast.error(err.message);
    } finally {
      setIsSubmittingReply(false);
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
      await fetch(`/api/comments/${comment.id}/flag`, { method: "POST" });
      // toast.success("Content flagged for review. Thank you.");
    } catch {
      // toast.error("Failed to flag content.");
    }
  }

  const authorUsername =
    (comment.author as any).username ||
    comment.author.name?.toLowerCase().replace(/\s+/g, "_") ||
    "unknown";

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-start gap-2.5 py-4 border-t border-gray-200/75 group relative"
      )}
    >
      <div className={cn("shrink-0", depth > 0 ? "mt-1" : "mt-0.5")}>
        <Avatar author={comment.author} gender={comment.author.gender} size={depth > 0 ? 20 : 24} />
      </div>

      <div className={cn("flex-1 min-w-0")}>
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 flex-wrap">
            <span className="text-[10px] sm:text-[11px] font-bold text-primary truncate max-w-[80px] sm:max-w-[140px]">
              {comment.author.name}
            </span>
            {comment.author.emailVerified && (
              <SealCheckIcon size={10} weight="fill" className="text-blue-500 shrink-0" />
            )}
            <span className="text-[9px] sm:text-[9.5px] text-muted-foreground/40 whitespace-nowrap">
              {timeAgo(comment.createdAt)}
            </span>
          </div>

          {session && (
            <ActionMenu
              author={comment.author}
              onFlag={handleFlag}
              verifiedLabel="Verified Account"
              buttonClassName="p-0.5 sm:p-1"
              dropdownClassName="w-[160px] sm:w-[190px]"
            />
          )}
        </div>

        <div className="text-[10.5px] sm:text-[11.5px] text-foreground/80 leading-relaxed wrap-break-word whitespace-pre-wrap overflow-hidden mb-1.5">
          <LinkifiedText text={comment.content} />
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <motion.div
            animate={isVoteShaking ? { x: [-2, 2, -2, 2, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-0.5"
          >
            <button
              onClick={() => handleVote("up")}
              className={cn(
                "p-0.5 rounded transition-all duration-150",
                vote === "up"
                  ? "text-green-600"
                  : "text-muted-foreground/30 hover:text-green-600"
              )}
            >
              <ArrowFatUpIcon size={10} weight={vote === "up" ? "fill" : "regular"} />
            </button>
            <span
              className={cn(
                "text-[9.5px] sm:text-[10.5px] font-semibold tabular-nums min-w-[1.5ch] text-center",
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
                "p-0.5 rounded transition-all duration-150",
                vote === "down"
                  ? "text-red-500"
                  : "text-muted-foreground/30 hover:text-red-500"
              )}
            >
              <ArrowFatDownIcon size={10} weight={vote === "down" ? "fill" : "regular"} />
            </button>
          </motion.div>

          {depth === 0 && (
            <button
              onClick={() => {
                if (!session) {
                  onAuthRequired({
                    title: "Reply to comment",
                    description: "Sign in to reply to comments.",
                  });
                  return;
                }
                setShowReplyInput((prev) => !prev);
              }}
              className="flex items-center gap-1 text-[9.5px] sm:text-[10px] text-muted-foreground/50 hover:text-primary transition-colors"
            >
              <ArrowBendUpLeftIcon size={10} />
              <span>Reply</span>
            </button>
          )}

          {localReplyCount > 0 && depth === 0 && (
            <button
              onClick={handleToggleReplies}
              className="text-[9.5px] sm:text-[10px] flex items-center gap-1 text-black/70 hover:text-black transition-colors"
            >
              <span>Show {localReplyCount} {localReplyCount > 1 ? "replies" : "reply"}</span>
              <motion.div
                animate={{ rotate: showReplies ? 180 : 0 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              >
                <CaretDownIcon size={10} />
              </motion.div>
            </button>
          )}
        </div>

        <AnimatePresence>
          {showReplyInput && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-2"
            >
              <div className="flex items-center gap-1.5 bg-gray-100 shadow-inner my-4 rounded-4xl pl-2 pr-1 py-1">
                <Input
                  className="bg-transparent border-0! outline-0! ring-0! flex-1 text-[10.5px] sm:text-[11.5px] h-6"
                  placeholder={`Reply to ${comment.author.name}…`}
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handlePostReply();
                  }}
                  disabled={isSubmittingReply}
                  autoFocus
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-black cursor-pointer rounded-4xl sm:border-transparent hover:border-gray-200/20 border-gray-200/20 hover:bg-white sm:bg-transparent bg-white sm:shadow-none shadow-sm hover:shadow-sm active:scale-95 shrink-0"
                  onClick={handlePostReply}
                  disabled={isSubmittingReply || !replyBody.trim()}
                >
                  {isSubmittingReply ? (
                    <CircleNotchIcon size={9} className="animate-spin" />
                  ) : (
                    <PaperPlaneIcon size={9} className="rotate-45" />
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showReplies && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-6 ml-6 sm:ml-8"
            >
              {isLoadingReplies ? (
                <div className="flex justify-center py-2">
                  <CircleNotchIcon size={12} className="animate-spin text-primary/30" />
                </div>
              ) : (
                <div className="flex flex-col">
                  {replies.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      parentId={parentId}
                      parentType={parentType}
                      onAuthRequired={onAuthRequired}
                      depth={depth + 1}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
