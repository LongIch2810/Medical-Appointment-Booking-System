import { Skeleton } from "../ui/skeleton";
import DoctorScheduleCardSkeleton from "./DoctorScheduleCardSkeleton";

const DoctorScheduleListSkeleton = () => {
  return (
    <div className="space-y-4">
      <div
        className="
          max-h-[500px]
          overflow-y-auto
          pr-2
          space-y-2
          rounded-lg
          border
          border-slate-200
          dark:border-slate-800
          bg-white
          dark:bg-slate-900/60
          shadow-sm
          p-2
        "
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <DoctorScheduleCardSkeleton key={i} />
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-3 text-sm">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-28" />
      </div>
    </div>
  );
};

export default DoctorScheduleListSkeleton;
