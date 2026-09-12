import NotificationTypeIcon from "@/components/notification/NotificationTypeIcon";
import { isInternalPath } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/types/interface/notification.interface";
import { X } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import type { CloseButtonProps } from "react-toastify";

interface NotificationToastProps {
  notification: AppNotification;
  onOpen: (notification: AppNotification) => void;
  openLabel: string;
}

export default function NotificationToast({
  notification,
  onOpen,
  openLabel,
}: NotificationToastProps) {
  const clickable = isInternalPath(notification.actionUrl);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen(notification);
    }
  };

  return (
    <div
      {...(clickable
        ? {
            role: "button" as const,
            tabIndex: 0,
            onClick: () => onOpen(notification),
            onKeyDown: handleKeyDown,
            "aria-label": `${notification.title}. ${openLabel}`,
          }
        : {})}
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 pr-9 shadow-lg outline-none dark:border-[#293548] dark:bg-[#172033]",
        clickable &&
          "cursor-pointer transition-colors hover:border-primary/30 hover:bg-primary/[0.035] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:hover:bg-primary/10",
      )}
    >
      <NotificationTypeIcon type={notification.type} compact />
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="font-heading line-clamp-1 text-sm font-bold leading-5 text-slate-900 dark:text-[#F1F5F9]">
          {notification.title}
        </p>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-[#94A3B8]">
          {notification.content}
        </p>
      </div>
    </div>
  );
}

export function NotificationToastCloseButton({ closeToast }: CloseButtonProps) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      aria-label={t("notifications.dismiss")}
      onClick={(event) => {
        event.stopPropagation();
        closeToast(event);
      }}
      className="absolute right-1 top-1 z-10 flex h-11 w-11 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-[#64748B] dark:hover:bg-white/10 dark:hover:text-[#F1F5F9]"
    >
      <X className="h-4 w-4" strokeWidth={2} />
    </button>
  );
}
