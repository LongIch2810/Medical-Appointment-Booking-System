import { Card } from "@/components/ui/card";

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <Card className="rounded-lg border-[#d9d9dd] p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between pb-4 border-b border-[#d9d9dd] dark:border-slate-800">
        <div className="h-9 w-64 animate-pulse rounded-lg bg-[#eeece7] dark:bg-slate-800" />
        <div className="flex gap-2">
          <div className="h-9 w-20 animate-pulse rounded-lg bg-[#eeece7] dark:bg-slate-800" />
          <div className="h-9 w-24 animate-pulse rounded-lg bg-[#eeece7] dark:bg-slate-800" />
        </div>
      </div>
      <div className="divide-y divide-[#d9d9dd] dark:divide-slate-800">
        <div className="flex items-center gap-4 py-3 bg-[#f7f6f2] px-3 dark:bg-slate-950">
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-4 flex-1 animate-pulse rounded bg-[#eeece7] dark:bg-slate-800" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, rIndex) => (
          <div key={rIndex} className="flex items-center gap-4 py-4 px-3">
            {Array.from({ length: cols }).map((_, cIndex) => (
              <div key={cIndex} className="h-4 flex-1 animate-pulse rounded bg-[#eeece7]/70 dark:bg-slate-800/60" />
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}
