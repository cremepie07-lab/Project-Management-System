import { cn } from "@/lib/cn";

interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-lg bg-surface-hover animate-shimmer",
        className
      )}
    />
  );
}

export function BoardCardSkeleton() {
  return (
    <div className="h-[100px] rounded-xl bg-surface-hover animate-shimmer" />
  );
}

export function ListSkeleton() {
  return (
    <div className="w-64 shrink-0 rounded-2xl bg-surface-secondary p-3 space-y-3">
      <div className="h-5 w-24 rounded-md bg-surface-hover animate-shimmer" />
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-surface-hover animate-shimmer" />
        ))}
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl bg-surface border border-border p-4 space-y-2">
      <div className="h-10 w-10 rounded-xl bg-surface-hover animate-shimmer" />
      <div className="h-7 w-16 rounded-md bg-surface-hover animate-shimmer" />
      <div className="h-3 w-24 rounded-md bg-surface-hover animate-shimmer" />
    </div>
  );
}

export function MemberRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="h-9 w-9 rounded-full bg-surface-hover animate-shimmer" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-28 rounded bg-surface-hover animate-shimmer" />
        <div className="h-3 w-36 rounded bg-surface-hover animate-shimmer" />
      </div>
    </div>
  );
}
