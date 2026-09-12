import NotificationTypeIcon from "@/components/notification/NotificationTypeIcon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useMarkAllNotificationsAsRead,
  useMyNotifications,
  useOpenNotification,
  useUnreadNotificationCount,
} from "@/hooks/useNotifications";
import {
  ArrowRight,
  Bell,
  CheckCheck,
  Clock3,
  Inbox,
  Loader2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export default function NotificationBell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const notificationsQuery = useMyNotifications({ page: 1, limit: 5 });
  const unreadQuery = useUnreadNotificationCount();
  const markAll = useMarkAllNotificationsAsRead();
  const notifications = notificationsQuery.data?.data.notifications ?? [];
  const unreadCount = unreadQuery.data?.data.count ?? 0;
  const openNotification = useOpenNotification();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="relative h-11 w-11 rounded-xl border-border bg-card text-foreground shadow-xs transition-colors hover:border-primary/30 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={t("notifications.bellAria", { count: unreadCount })}
        >
          <Bell className="h-[18px] w-[18px]" strokeWidth={1.8} />
          {unreadCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-extrabold leading-none text-white ring-2 ring-background tabular-nums">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-[min(94vw,410px)] overflow-hidden rounded-3xl border-border bg-popover p-0 shadow-2xl"
      >
        <div className="bg-primary/[0.045] px-4 pb-3 pt-4 dark:bg-primary/10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/15">
                <Bell className="h-[18px] w-[18px]" strokeWidth={1.8} />
              </span>
              <DropdownMenuLabel className="p-0">
                <span className="font-heading block text-base font-bold tracking-tight text-foreground">
                  {t("notifications.bellTitle")}
                </span>
                <span className="mt-0.5 block text-[11px] font-medium text-muted-foreground">
                  {unreadCount > 0
                    ? t("notifications.inboxSummary", { count: unreadCount })
                    : t("notifications.allCaughtUp")}
                </span>
              </DropdownMenuLabel>
            </div>
            {unreadCount > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={markAll.isPending}
                onClick={() => markAll.mutate()}
                className="min-h-10 shrink-0 gap-1.5 rounded-xl px-2.5 text-[11px] font-bold text-primary hover:bg-primary/10 hover:text-primary"
              >
                {markAll.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 motion-safe:animate-spin" />
                ) : (
                  <CheckCheck className="h-3.5 w-3.5" />
                )}
                {t("notifications.markAllShort")}
              </Button>
            )}
          </div>
        </div>

        <DropdownMenuSeparator className="m-0" />

        <div className="max-h-[min(60vh,420px)] overflow-y-auto p-2">
          {notificationsQuery.isLoading ? (
            <div
              className="space-y-2 p-1"
              aria-label={t("notifications.loading")}
              aria-busy="true"
            >
              {[0, 1, 2].map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl p-2.5">
                  <span className="h-9 w-9 shrink-0 rounded-xl bg-muted motion-safe:animate-pulse" />
                  <span className="flex-1 space-y-2 pt-1">
                    <span className="block h-3 w-2/3 rounded-full bg-muted motion-safe:animate-pulse" />
                    <span className="block h-2.5 w-full rounded-full bg-muted motion-safe:animate-pulse" />
                    <span className="block h-2.5 w-1/3 rounded-full bg-muted motion-safe:animate-pulse" />
                  </span>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center px-5 py-9 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <Inbox className="h-5 w-5" strokeWidth={1.7} />
              </span>
              <p className="mt-3 text-sm font-bold text-foreground">
                {t("notifications.emptyTitle")}
              </p>
              <p className="mt-1 max-w-64 text-xs leading-relaxed text-muted-foreground">
                {t("notifications.emptyAll")}
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                onClick={() => void openNotification(notification)}
                aria-label={`${notification.title}. ${t("notifications.openNotification")}`}
                className="group mb-1 min-h-20 cursor-pointer items-start gap-3 rounded-2xl p-3 outline-none transition-colors focus:bg-primary/[0.055] dark:focus:bg-primary/10"
              >
                <NotificationTypeIcon type={notification.type} compact />
                <span className="min-w-0 flex-1">
                  <span className="flex items-start gap-2">
                    <span className="line-clamp-1 flex-1 text-xs font-bold leading-5 text-foreground">
                      {notification.title}
                    </span>
                    {!notification.isRead && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary ring-4 ring-primary/10" />
                    )}
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-[11px] leading-[1.45] text-muted-foreground">
                    {notification.content}
                  </span>
                  <span className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-muted-foreground/80">
                    <Clock3 className="h-3 w-3" aria-hidden="true" />
                    {notification.createdAt}
                  </span>
                </span>
              </DropdownMenuItem>
            ))
          )}
        </div>

        <DropdownMenuSeparator className="m-0" />
        <div className="p-2">
          <DropdownMenuItem
            onClick={() => navigate("/patient/notifications")}
            className="group min-h-11 cursor-pointer justify-center gap-2 rounded-xl text-xs font-bold text-primary focus:bg-primary/10 focus:text-primary"
          >
            {t("notifications.viewAll")}
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none" />
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
