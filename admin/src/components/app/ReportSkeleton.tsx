export function ReportSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-3">
        <div className="h-6 w-2/3 rounded-lg bg-slate-200/80 dark:bg-slate-800" />
        <div className="h-4 w-full rounded-md bg-slate-100 dark:bg-slate-800/80" />
        <div className="h-4 w-5/6 rounded-md bg-slate-100 dark:bg-slate-800/80" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-24 rounded-2xl border border-slate-200/80 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900"
          />
        ))}
      </div>
      <div className="h-72 rounded-2xl border border-slate-200/80 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900" />
      <div className="h-64 rounded-2xl border border-slate-200/80 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900" />
    </div>
  );
}
