import { useTranslation } from "react-i18next";
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
  PENDING: "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-[#FBBF24]/15 dark:text-[#FBBF24] dark:border-[#FBBF24]/40",
  CONFIRMED: "bg-sky-100 text-sky-800 border border-sky-200 dark:bg-[#60A5FA]/15 dark:text-[#60A5FA] dark:border-[#60A5FA]/40",
  COMPLETED: "bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-[#34D399]/15 dark:text-[#34D399] dark:border-[#34D399]/40",
  CANCELLED: "bg-rose-100 text-rose-800 border border-rose-200 dark:bg-[#FB7185]/15 dark:text-[#FB7185] dark:border-[#FB7185]/40",
  ABSENT: "bg-slate-200 text-slate-700 border border-slate-300 dark:bg-[#1E293B] dark:text-[#94A3B8] dark:border-[#293548]",
  EXPIRED: "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-[#FBBF24]/15 dark:text-[#FBBF24] dark:border-[#FBBF24]/40",
};

const statusDotClassMap: Record<AppointmentStatus, string> = {
  PENDING: "bg-amber-500 dark:bg-[#FBBF24]",
  CONFIRMED: "bg-sky-500 dark:bg-[#60A5FA]",
  COMPLETED: "bg-emerald-500 dark:bg-[#34D399]",
  CANCELLED: "bg-rose-500 dark:bg-[#FB7185]",
  ABSENT: "bg-slate-500 dark:bg-[#94A3B8]",
  EXPIRED: "bg-amber-600 dark:bg-[#FBBF24]",
};

export const AppointmentStatusBadge: React.FC<{
  status: AppointmentStatus;
}> = ({ status }) => {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        statusBadgeClassMap[status],
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", statusDotClassMap[status])}
      />
      {t(`status.appointment.${status}`, { defaultValue: appointmentStatusLabelMap[status] })}
    </span>
  );
};
