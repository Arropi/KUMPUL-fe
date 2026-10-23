import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* 1. Header / AI Recommendations Skeleton */}
      <div className="rounded-3xl border border-border bg-surface p-6 sm:p-7 shadow-elevation-1 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-52 rounded-md" />
            <Skeleton className="h-4 w-72 rounded-md" />
          </div>
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 rounded-2xl border border-border bg-surface-subtle/70 space-y-3"
            >
              <div className="flex justify-between items-start">
                <Skeleton className="h-4 w-20 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-5 w-40 rounded-md" />
              <div className="pt-2 border-t border-border/60 flex justify-between">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-4 w-20 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Catalog Filter & Search Bar Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Skeleton className="h-10 w-full sm:w-80 rounded-xl" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>

      {/* 3. Commodity Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-surface shadow-elevation-1 overflow-hidden flex flex-col justify-between"
          >
            <Skeleton className="h-44 w-full rounded-none" />
            <div className="p-5 space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-20 rounded-md" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-5 w-3/4 rounded-md" />
              <Skeleton className="h-3.5 w-1/2 rounded-md" />
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-16 rounded-md" />
                  <Skeleton className="h-3 w-20 rounded-md" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
              <div className="pt-3 border-t border-border/70 flex justify-between items-center">
                <Skeleton className="h-5 w-28 rounded-md" />
                <Skeleton className="h-8 w-24 rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
