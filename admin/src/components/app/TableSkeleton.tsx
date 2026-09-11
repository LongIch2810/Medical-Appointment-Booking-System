import { Card } from "@/components/ui/card";

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <Card className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="h-9 w-64 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
        <div className="flex gap-2">
          <div className="h-9 w-20 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
          <div className="h-9 w-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        <div className="flex items-center gap-4 py-3 bg-slate-50/80 px-3 dark:bg-slate-950/60">
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-4 flex-1 animate-pulse rounded-md bg-slate-200/80 dark:bg-slate-800" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, rIndex) => (
          <div key={rIndex} className="flex items-center gap-4 py-4 px-3">
            {Array.from({ length: cols }).map((_, cIndex) => (
              <div key={cIndex} className="h-4 flex-1 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800/60" />
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}
