import { Comment } from "@/app/types/home.type";
import { Avatar } from "./Avatar";
import { timeAgo } from "@/lib/utils";
import { motion } from "framer-motion";

export function CommentItem({ comment }: { comment: Comment }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 py-2"
    >
      <Avatar author={comment.author} gender={comment.author.gender} />
      <div className="flex-1 min-w-0 mb-1">
        <span className="text-[11px] sm:text-[12px] font-semibold text-primary mr-1.5">{comment.author.name}</span>
        <p className="text-[11.5px] sm:text-[12.5px] text-foreground/75 leading-relaxed inline wrap-break-word">{comment.content}</p>
        <span className="text-[10px] sm:text-[11px] text-muted-foreground/40 ml-2 shrink-0">{timeAgo(comment.createdAt)}</span>
      </div>
    </motion.div>
  );
}
