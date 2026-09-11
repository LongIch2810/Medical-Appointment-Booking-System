import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const PatientContentSkeleton: React.FC = () => {
  return (
    <div
      role="status"
      aria-label="Đang tải nội dung..."
      className="space-y-6 w-full animate-in fade-in-50 duration-200"
    >
      {/* Header bar placeholder */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 sm:w-64 rounded-xl" />
          <Skeleton className="h-4 w-72 sm:w-96 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      {/* Top summary metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-xl" />
            </div>
            <Skeleton className="h-7 w-24 rounded-lg" />
            <Skeleton className="h-3.5 w-36 rounded-md" />
          </div>
        ))}
      </div>

      {/* Main content body placeholder */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <Skeleton className="h-6 w-44 rounded-lg" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </div>
        <div className="space-y-3 pt-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80"
            >
              <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
              <div className="space-y-1.5 flex-1 min-w-0">
                <Skeleton className="h-4 w-1/3 rounded-md" />
                <Skeleton className="h-3.5 w-2/3 rounded-md" />
              </div>
              <Skeleton className="h-8 w-24 rounded-xl shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PatientContentSkeleton;
