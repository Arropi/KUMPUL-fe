import { Skeleton } from "@/components/ui/skeleton";

export default function PesananLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-48 rounded-md" />
          <Skeleton className="h-4 w-64 rounded-md" />
        </div>
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>

      {/* Filter Tabs & Search Bar Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto py-1">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-xl shrink-0" />
          ))}
        </div>
        <Skeleton className="h-9 w-full md:w-72 rounded-xl" />
      </div>

      {/* Order Rows Skeleton */}
      <div className="rounded-2xl border border-border bg-surface shadow-elevation-1 px-4 sm:px-6">
        <div className="divide-y divide-border/70">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:gap-5"
            >
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3.5 w-28 rounded-md" />
                  <Skeleton className="h-3 w-16 rounded-md" />
                  <Skeleton className="h-4 w-20 rounded-full" />
                </div>
                <div className="flex items-baseline gap-2">
                  <Skeleton className="h-5 w-44 rounded-md" />
                  <Skeleton className="h-3.5 w-14 rounded-md" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-3.5 w-32 rounded-md" />
                  <Skeleton className="h-3.5 w-24 rounded-md" />
                </div>
              </div>
              <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-9 w-24 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
