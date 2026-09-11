import { Separator } from "../ui/separator";
import { Skeleton } from "../ui/skeleton";

const DoctorInfoSkeleton = () => {
  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl mt-16 md:mt-28 space-y-8">
      {/* Profile skeleton */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs p-6 space-y-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <Skeleton className="w-28 h-28 rounded-full" />

          <div className="flex-1 text-center sm:text-left space-y-3">
            <Skeleton className="h-6 w-48 mx-auto sm:mx-0" />
            <Skeleton className="h-4 w-72 mx-auto sm:mx-0" />
            <Skeleton className="h-4 w-56 mx-auto sm:mx-0" />
            <Skeleton className="h-6 w-32 mx-auto sm:mx-0" />
          </div>
        </div>

        <Separator className="dark:bg-slate-800" />

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-20 w-full" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>

      {/* Schedules skeleton */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs p-6 space-y-6">
        <Skeleton className="h-6 w-40" />

        <div className="flex flex-col md:flex-row gap-6">
          <Skeleton className="h-64 w-full md:w-1/2 rounded-xl" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-32" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorInfoSkeleton;
