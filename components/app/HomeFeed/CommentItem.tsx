import { Comment } from "@/app/types/home.type";
import { Avatar } from "./Avatar";
import { timeAgo } from "@/lib/utils";
import { motion } from "framer-motion";
import { LinkifiedText } from "./LinkifiedText";

export function CommentItem({ comment }: { comment: Comment }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-2.5 py-3 group border-b border-gray-50 last:border-0"
    >
      <div className="shrink-0 mt-0.5">
        <Avatar author={comment.author} gender={comment.author.gender} size={28} />
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] sm:text-[12px] font-bold text-primary truncate">
            {comment.author.name}
          </span>
          <span className="text-[9px] sm:text-[10px] text-muted-foreground/40 whitespace-nowrap">
            {timeAgo(comment.createdAt)}
          </span>
        </div>
        <div className="text-[11.5px] sm:text-[12.5px] text-foreground/80 leading-relaxed wrap-break-word whitespace-pre-wrap overflow-hidden">
          <LinkifiedText text={comment.content} />
        </div>
      </div>
    </motion.div>
  );
}
