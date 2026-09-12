import { NotificationTypeIcon } from "@/components/app/NotificationTypeIcon";
import { isInternalPath } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types/interface/notification.interface";
import { X } from "lucide-react";
import type { KeyboardEvent } from "react";
import type { CloseButtonProps } from "react-toastify";

interface NotificationToastProps {
  notification: Notification;
  onOpen: (notification: Notification) => void;
  openLabel: string;
}

export function NotificationToast({
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
        "flex w-full items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 pr-9 shadow-lg outline-none dark:border-slate-800/80 dark:bg-slate-900",
        clickable &&
          "cursor-pointer transition-colors hover:border-primary/30 hover:bg-primary/[0.035] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:hover:bg-primary/10",
      )}
    >
      <NotificationTypeIcon type={notification.type} compact />
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="line-clamp-1 text-sm font-bold leading-5 text-slate-900 dark:text-slate-100">
          {notification.title}
        </p>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          {notification.content}
        </p>
      </div>
    </div>
  );
}

export function NotificationToastCloseButton({ closeToast }: CloseButtonProps) {
  return (
    <button
      type="button"
      aria-label="Đóng thông báo"
      onClick={(event) => {
        event.stopPropagation();
        closeToast(event);
      }}
      className="absolute right-1 top-1 z-10 flex h-11 w-11 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-slate-100"
    >
      <X className="h-4 w-4" strokeWidth={2} />
    </button>
  );
}
