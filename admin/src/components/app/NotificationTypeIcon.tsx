import { cn } from "@/lib/utils";
import type { NotificationType } from "@/types/interface/notification.interface";
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
  MANUAL: "bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400",
  APPOINTMENT_CREATED:
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
  APPOINTMENT_CANCELLED:
    "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400",
  APPOINTMENT_STATUS_UPDATED: "bg-primary/10 text-primary dark:bg-primary/15",
  APPOINTMENT_EXPIRED:
    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  APPOINTMENT_REMINDER:
    "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
};

interface NotificationTypeIconProps {
  type: NotificationType;
  compact?: boolean;
  className?: string;
}

export function NotificationTypeIcon({
  type,
  compact = false,
  className,
}: NotificationTypeIconProps) {
  const Icon = NOTIFICATION_ICONS[type] ?? Megaphone;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full",
        compact ? "size-9" : "size-12",
        NOTIFICATION_TONES[type] ?? NOTIFICATION_TONES.MANUAL,
        className,
      )}
    >
      <Icon className={compact ? "size-4" : "size-5"} strokeWidth={1.8} />
    </span>
  );
}
