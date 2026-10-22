import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* 1. Header Skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/70">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-56 rounded-md" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
      </div>

      {/* 2. 4 Metrik Stat Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-elevation-1 flex flex-col justify-between gap-3 min-h-[148px]"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-5 w-16 rounded-md" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-7 w-36 rounded-lg" />
              <Skeleton className="h-3.5 w-44 rounded-md" />
            </div>
            <div className="pt-2 border-t border-border/70 flex items-center justify-between">
              <Skeleton className="h-3 w-20 rounded-md" />
              <Skeleton className="h-3 w-24 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* 3. Radar Pooling Skeleton */}
      <div className="space-y-4">
        <div className="flex justify-between items-center pb-1 border-b border-border/70">
          <Skeleton className="h-5 w-48 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-surface shadow-elevation-1 p-5 sm:p-6 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16 rounded-md" />
                  <Skeleton className="h-5 w-44 rounded-md" />
                  <Skeleton className="h-3 w-28 rounded-md" />
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-24 rounded-md" />
                  <Skeleton className="h-3 w-20 rounded-md" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
              <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-surface-subtle/80 border border-border/80">
                <div className="space-y-1">
                  <Skeleton className="h-2.5 w-16 rounded-md" />
                  <Skeleton className="h-4 w-24 rounded-md" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-2.5 w-16 rounded-md" />
                  <Skeleton className="h-4 w-20 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
