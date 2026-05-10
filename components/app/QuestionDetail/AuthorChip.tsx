import { timeAgo } from "@/lib/utils";
import { UniversalAvatar } from "@/components/app/Avatar";

export function AuthorChip({ author, createdAt }: { author: any; createdAt: string }) {
  if (!author) return <span className="text-[11px] text-black/30">anonymous</span>;
  return (
    <div className="flex items-center gap-2">
      {author.image ? (
        <img src={author.image} alt={author.name} className="w-6 h-6 rounded-full object-cover" />
      ) : (
        <UniversalAvatar name={author.name || "?"} gender={author.gender || "other"} size={24} />
      )}
      <span className="text-[12px] text-secondary">{author.name}</span>
      <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">{author.reputation} SR</span>
      <span className="text-[10px] text-secondary/30">{timeAgo(createdAt)}</span>
    </div>
  );
}
