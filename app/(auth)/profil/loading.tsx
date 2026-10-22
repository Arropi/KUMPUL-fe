import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Hero Card Skeleton */}
      <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-elevation-1 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-border/70">
          <div className="flex items-center gap-4">
            <Skeleton className="size-16 sm:size-20 rounded-2xl shrink-0" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-44 rounded-md" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-3.5 w-60 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-10 w-32 rounded-xl self-start sm:self-center" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl bg-surface-subtle/80 border border-border/70 space-y-1.5"
            >
              <Skeleton className="h-3 w-16 rounded-md" />
              <Skeleton className="h-4 w-28 rounded-md" />
            </div>
          ))}
        </div>
      </div>

      {/* Metrics Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-surface p-5 shadow-elevation-1 space-y-3"
          >
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-5 w-16 rounded-md" />
            </div>
            <Skeleton className="h-8 w-36 rounded-lg" />
            <div className="pt-2 border-t border-border/70 flex justify-between">
              <Skeleton className="h-3 w-20 rounded-md" />
              <Skeleton className="h-3 w-24 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Storage & Bank Cards Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-elevation-1 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-border/70">
            <Skeleton className="h-5 w-40 rounded-md" />
            <Skeleton className="h-5 w-20 rounded-md" />
          </div>
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-elevation-1 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-border/70">
            <Skeleton className="h-5 w-36 rounded-md" />
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
