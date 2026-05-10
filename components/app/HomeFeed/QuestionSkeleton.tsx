import { cn } from "@/lib/utils";

export function QuestionSkeleton() {
  return (
    <div className="bg-white rounded-md p-4 sm:p-6 animate-pulse">
      <div className="flex gap-3 sm:gap-5">
        {/* Voting Skeleton */}
        <div className="flex flex-col items-center gap-2 pt-1 shrink-0">
          <div className="w-8 h-8 bg-gray-100 rounded-xl" />
          <div className="w-6 h-4 bg-gray-50 rounded" />
          <div className="w-8 h-8 bg-gray-100 rounded-xl" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Header Skeleton */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-gray-100 rounded-full" />
            <div className="w-24 h-3 bg-gray-100 rounded" />
            <div className="w-12 h-3 bg-gray-50 rounded ml-auto" />
          </div>

          {/* Title Skeleton */}
          <div className="w-3/4 h-5 bg-gray-100 rounded mb-2" />
          
          {/* Body Skeleton */}
          <div className="space-y-2 mb-4">
            <div className="w-full h-3 bg-gray-50 rounded" />
            <div className="w-5/6 h-3 bg-gray-50 rounded" />
          </div>

          {/* Footer Skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <div className="w-12 h-4 bg-gray-50 rounded-md" />
              <div className="w-16 h-4 bg-gray-50 rounded-md" />
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-4 bg-gray-100 rounded" />
              <div className="w-8 h-4 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
