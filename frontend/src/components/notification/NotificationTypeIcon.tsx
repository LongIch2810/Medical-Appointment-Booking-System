import type { NotificationType } from "@/types/interface/notification.interface";
import { cn } from "@/lib/utils";
import {
  AlarmClock,
  CalendarCheck2,
  CalendarPlus2,
  CalendarX2,
  Megaphone,
  TimerOff,
  type LucideIcon,
} from "lucide-react";

const NOTIFICATION_ICONS: Record<NotificationType, LucideIcon> = {
  MANUAL: Megaphone,
  APPOINTMENT_CREATED: CalendarPlus2,
  APPOINTMENT_CANCELLED: CalendarX2,
  APPOINTMENT_STATUS_UPDATED: CalendarCheck2,
  APPOINTMENT_EXPIRED: TimerOff,
  APPOINTMENT_REMINDER: AlarmClock,
};

const NOTIFICATION_TONES: Record<NotificationType, string> = {
  MANUAL:
    "bg-sky-50 text-sky-700 ring-sky-100 dark:bg-sky-950/50 dark:text-sky-300 dark:ring-sky-900/70",
  APPOINTMENT_CREATED:
    "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900/70",
  APPOINTMENT_CANCELLED:
    "bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-950/50 dark:text-rose-300 dark:ring-rose-900/70",
  APPOINTMENT_STATUS_UPDATED:
    "bg-teal-50 text-teal-700 ring-teal-100 dark:bg-teal-950/50 dark:text-teal-300 dark:ring-teal-900/70",
  APPOINTMENT_EXPIRED:
    "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
  APPOINTMENT_REMINDER:
    "bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-900/70",
};

interface NotificationTypeIconProps {
  type: NotificationType;
  compact?: boolean;
  className?: string;
}

export default function NotificationTypeIcon({
  type,
  compact = false,
  className,
}: NotificationTypeIconProps) {
  const Icon = NOTIFICATION_ICONS[type] ?? Megaphone;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset",
        compact ? "h-9 w-9 rounded-xl" : "h-12 w-12",
        NOTIFICATION_TONES[type] ?? NOTIFICATION_TONES.MANUAL,
        className,
      )}
    >
      <Icon className={compact ? "h-4 w-4" : "h-5 w-5"} strokeWidth={1.8} />
    </span>
  );
}
