import ErrorState from "@/components/notification/ErrorState";
import NotificationTypeIcon from "@/components/notification/NotificationTypeIcon";
import StateCard from "@/components/notification/StateCard";
import { Button } from "@/components/ui/button";
import {
  useMarkAllNotificationsAsRead,
  useMyNotifications,
  useOpenNotification,
  useUnreadNotificationCount,
} from "@/hooks/useNotifications";
import {
  Bell,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export default function Notifications() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const query = useMyNotifications({
    page,
    limit: 10,
    ...(unreadOnly ? { isRead: false } : {}),
  });
  const unreadQuery = useUnreadNotificationCount();
  const markAll = useMarkAllNotificationsAsRead();
  const data = query.data?.data;
  const unreadCount = unreadQuery.data?.data.count ?? 0;
  const openNotification = useOpenNotification();

  if (query.isError) {
    return <ErrorState onRetry={() => void query.refetch()} />;
  }

  return (
    <section className="space-y-5" aria-labelledby="notifications-heading">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-xs sm:p-6">
        <div className="absolute inset-y-0 left-0 w-1 bg-primary" aria-hidden="true" />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/15">
              <Bell className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="notifications-heading"
                  className="font-heading text-xl font-bold tracking-tight text-foreground"
                >
                  {t("notifications.pageTitle")}
                </h2>
                {unreadCount > 0 && (
                  <span
                    aria-live="polite"
                    className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-extrabold text-primary ring-1 ring-inset ring-primary/15"
                  >
                    {t("notifications.newCount", { count: unreadCount })}
                  </span>
                )}
              </div>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {t("notifications.pageSubtitle")}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            disabled={markAll.isPending || unreadCount === 0}
            onClick={() => markAll.mutate()}
            className="min-h-11 shrink-0 gap-2 rounded-xl px-4 text-sm font-semibold"
          >
            {markAll.isPending ? (
              <Loader2 className="h-4 w-4 motion-safe:animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4 text-primary" />
            )}
            <span>{t("notifications.markAllAsRead")}</span>
          </Button>
        </div>
        <div className="mt-5 flex items-center gap-2 border-t border-border/70 pt-4 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-primary ring-4 ring-primary/10" />
          <span>
            {unreadCount > 0
              ? t("notifications.inboxSummary", { count: unreadCount })
              : t("notifications.allCaughtUp")}
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        role="group"
        aria-label={t("notifications.filterLabel")}
        className="inline-flex w-full items-center gap-1 rounded-2xl border border-border bg-muted/50 p-1 sm:w-auto"
      >
        <button
          type="button"
          aria-pressed={!unreadOnly}
          onClick={() => {
            setUnreadOnly(false);
            setPage(1);
          }}
          className={cn(
            "min-h-11 flex-1 rounded-xl px-4 text-sm font-bold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:flex-none",
            !unreadOnly
              ? "bg-card text-primary shadow-xs ring-1 ring-border"
              : "text-muted-foreground hover:bg-card/70 hover:text-foreground",
          )}
        >
          {t("notifications.allFilter")}
        </button>
        <button
          type="button"
          aria-pressed={unreadOnly}
          onClick={() => {
            setUnreadOnly(true);
            setPage(1);
          }}
          className={cn(
            "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:flex-none",
            unreadOnly
              ? "bg-card text-primary shadow-xs ring-1 ring-border"
              : "text-muted-foreground hover:bg-card/70 hover:text-foreground",
          )}
        >
          <span>{t("notifications.unreadFilter")}</span>
          {(unreadQuery.data?.data.count ?? 0) > 0 && (
            <span
              className={cn(
                "min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] font-extrabold tabular-nums",
                unreadOnly
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary/10 text-primary",
              )}
            >
              {unreadQuery.data?.data.count}
            </span>
          )}
        </button>
      </div>

      {/* Notification List */}
      {query.isLoading ? (
        <div className="space-y-3" aria-label={t("notifications.loading")} aria-busy="true">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="flex items-start gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5"
            >
              <span className="h-12 w-12 shrink-0 rounded-2xl bg-muted motion-safe:animate-pulse" />
              <span className="min-w-0 flex-1 space-y-3 pt-1">
                <span className="block h-4 w-2/5 rounded-full bg-muted motion-safe:animate-pulse" />
                <span className="block h-3 w-full rounded-full bg-muted motion-safe:animate-pulse" />
                <span className="block h-3 w-3/4 rounded-full bg-muted motion-safe:animate-pulse" />
              </span>
            </div>
          ))}
        </div>
      ) : !data?.notifications.length ? (
        <StateCard
          icon={<Bell className="h-8 w-8" />}
          title={t("notifications.emptyTitle")}
          description={
            unreadOnly
              ? t("notifications.emptyUnread")
              : t("notifications.emptyAll")
          }
        />
      ) : (
        <ul className="space-y-3" aria-live="polite">
          {data.notifications.map((notification) => (
            <li key={notification.id}>
              <button
                type="button"
                onClick={() => void openNotification(notification)}
                aria-label={`${notification.title}. ${t("notifications.openNotification")}`}
                className={cn(
                  "group relative flex min-h-24 w-full items-start gap-3 overflow-hidden rounded-2xl border p-4 text-left outline-none transition-[border-color,background-color,box-shadow] duration-200 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:gap-4 sm:p-5",
                  notification.isRead
                    ? "border-border bg-card hover:border-primary/25"
                    : "border-primary/30 bg-primary/[0.045] shadow-xs hover:border-primary/55 dark:bg-primary/10",
                )}
              >
                {!notification.isRead && (
                  <span className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-primary" aria-hidden="true" />
                )}
                <NotificationTypeIcon type={notification.type} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                    <span
                      className={cn(
                        "font-heading text-sm leading-snug text-foreground sm:text-[15px]",
                        notification.isRead ? "font-semibold" : "font-bold",
                      )}
                    >
                      {notification.title}
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                      <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                      {notification.createdAt}
                    </span>
                  </span>
                  <span className="mt-1.5 line-clamp-2 block text-sm leading-relaxed text-muted-foreground sm:line-clamp-none">
                    {notification.content}
                  </span>
                  {!notification.isRead && (
                    <span className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-primary">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                      {t("notifications.unreadLabel")}
                    </span>
                  )}
                </span>
                <ChevronRight
                  className="mt-3 h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
      {(data?.totalPages ?? 0) > 1 && (
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="icon"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
            aria-label={t("notifications.previousPage")}
            className="h-11 w-11 rounded-xl"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-16 text-center text-xs font-semibold tabular-nums text-muted-foreground">
            {t("common.page")} {page}/{data?.totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={page >= (data?.totalPages ?? 1)}
            onClick={() => setPage((current) => current + 1)}
            aria-label={t("notifications.nextPage")}
            className="h-11 w-11 rounded-xl"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </section>
  );
}
