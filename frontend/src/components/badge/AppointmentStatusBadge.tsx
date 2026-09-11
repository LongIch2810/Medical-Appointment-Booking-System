import { cn } from "@/lib/utils";
import type { AppointmentStatus } from "@/types/interface/patient.interface";

export const appointmentStatusLabelMap: Record<AppointmentStatus, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  COMPLETED: "Đã khám",
  CANCELLED: "Đã hủy",
  ABSENT: "Vắng mặt",
  EXPIRED: "Quá hạn khám",
};

const statusBadgeClassMap: Record<AppointmentStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60",
  CONFIRMED: "bg-sky-100 text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60",
  COMPLETED: "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
  CANCELLED: "bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60",
  ABSENT: "bg-slate-200 text-slate-700 border border-slate-300 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700",
  EXPIRED: "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60",
};

const statusDotClassMap: Record<AppointmentStatus, string> = {
  PENDING: "bg-amber-500",
  CONFIRMED: "bg-sky-500",
  COMPLETED: "bg-emerald-500",
  CANCELLED: "bg-rose-500",
  ABSENT: "bg-slate-500",
  EXPIRED: "bg-amber-600",
};

export const AppointmentStatusBadge: React.FC<{
  status: AppointmentStatus;
}> = ({ status }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
      statusBadgeClassMap[status],
    )}
  >
    <span
      className={cn("h-1.5 w-1.5 rounded-full", statusDotClassMap[status])}
    />
    {appointmentStatusLabelMap[status]}
  </span>
);
