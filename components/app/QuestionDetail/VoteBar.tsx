import { cn } from "@/lib/utils";
import { ArrowFatUpIcon, ArrowFatDownIcon } from "@phosphor-icons/react";

export function VoteBar({
  score,
  userVote,
  onVote,
  disabled,
}: {
  score: number;
  userVote: "up" | "down" | null;
  onVote: (dir: "up" | "down") => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onVote("up")}
        disabled={disabled}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] transition-all cursor-pointer disabled:opacity-40",
          userVote === "up" ? "bg-main/10 text-main" : "bg-accent/50 text-secondary hover:text-main hover:bg-main/5"
        )}
      >
        <ArrowFatUpIcon size={14} weight={userVote === "up" ? "fill" : "regular"} />
        Upvote
      </button>
      <span className={cn("text-sm tabular-nums px-1", score > 0 ? "text-main" : score < 0 ? "text-secondary" : "text-secondary/40")}>
        {score}
      </span>
      <button
        onClick={() => onVote("down")}
        disabled={disabled}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] transition-all cursor-pointer disabled:opacity-40",
          userVote === "down" ? "bg-secondary/10 text-secondary" : "bg-accent/50 text-secondary hover:text-secondary hover:bg-secondary/5"
        )}
      >
        <ArrowFatDownIcon size={14} weight={userVote === "down" ? "fill" : "regular"} />
        Downvote
      </button>
    </div>
  );
}
