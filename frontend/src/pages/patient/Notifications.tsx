import ErrorState from "@/components/notification/ErrorState";
import StateCard from "@/components/notification/StateCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useMyNotifications,
  useUnreadNotificationCount,
} from "@/hooks/useNotifications";
import type { AppNotification } from "@/types/interface/notification.interface";
import { Bell, CheckCheck, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

function isInternalPath(path: string | null): path is string {
  return Boolean(path && /^\/(?!\/)/.test(path));
}

export default function Notifications() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const query = useMyNotifications({
    page,
    limit: 10,
    ...(unreadOnly ? { isRead: false } : {}),
  });
  const unreadQuery = useUnreadNotificationCount();
  const markRead = useMarkNotificationAsRead();
  const markAll = useMarkAllNotificationsAsRead();
  const data = query.data?.data;

  const openNotification = async (notification: AppNotification) => {
    if (!notification.isRead) await markRead.mutateAsync(notification.id);
    if (isInternalPath(notification.actionUrl)) navigate(notification.actionUrl);
  };

  if (query.isError) {
    return <ErrorState onRetry={() => void query.refetch()} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Bell className="h-5.5 w-5.5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {t("notifications.pageTitle")}
              </h2>
              {(unreadQuery.data?.data.count ?? 0) > 0 && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-extrabold text-white">
                  {t("notifications.newCount", { count: unreadQuery.data?.data.count })}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("notifications.pageSubtitle")}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={markAll.isPending || (unreadQuery.data?.data.count ?? 0) === 0}
          onClick={() => markAll.mutate()}
          className="gap-2 rounded-xl text-xs font-semibold cursor-pointer"
        >
          <CheckCheck className="h-3.5 w-3.5 text-primary" />
          <span>{t("notifications.markAllAsRead")}</span>
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setUnreadOnly(false);
            setPage(1);
          }}
          className={cn(
            "rounded-full border px-4 py-1.5 text-xs font-bold transition-all cursor-pointer",
            !unreadOnly
              ? "border-primary bg-primary text-white shadow-xs"
              : "border-slate-200 bg-white text-slate-600 hover:border-primary/40 hover:text-primary dark:border-slate-800 dark:bg-slate-800/70 dark:text-slate-300",
          )}
        >
          {t("notifications.allFilter")}
        </button>
        <button
          type="button"
          onClick={() => {
            setUnreadOnly(true);
            setPage(1);
          }}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-bold transition-all cursor-pointer",
            unreadOnly
              ? "border-primary bg-primary text-white shadow-xs"
              : "border-slate-200 bg-white text-slate-600 hover:border-primary/40 hover:text-primary dark:border-slate-800 dark:bg-slate-800/70 dark:text-slate-300",
          )}
        >
          <span>{t("notifications.unreadFilter")}</span>
          {(unreadQuery.data?.data.count ?? 0) > 0 && (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.2 text-[10px] font-extrabold",
                unreadOnly
                  ? "bg-white/20 text-white"
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
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
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
        <div className="space-y-3">
          {data.notifications.map((notification) => (
            <Card
              key={notification.id}
              onClick={() => void openNotification(notification)}
              className={cn(
                "group cursor-pointer rounded-2xl border transition-all hover:shadow-sm py-0",
                notification.isRead
                  ? "border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                  : "border-primary/30 bg-primary/3 hover:border-primary/60 dark:border-primary/40 dark:bg-primary/10",
              )}
            >
              <CardContent className="flex items-start gap-4 p-4.5 sm:p-5">
                <span
                  className={cn(
                    "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
                    notification.isRead
                      ? "bg-slate-200 dark:bg-slate-700"
                      : "bg-primary ring-4 ring-primary/20",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3
                      className={cn(
                        "text-sm font-bold",
                        notification.isRead
                          ? "text-slate-800 dark:text-slate-200"
                          : "text-slate-900 dark:text-slate-100",
                      )}
                    >
                      {notification.title}
                    </h3>
                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                      {notification.createdAt}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {notification.content}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {(data?.totalPages ?? 0) > 1 && (
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="icon"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
            className="rounded-xl h-9 w-9 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            {t("common.page")} {page}/{data?.totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={page >= (data?.totalPages ?? 1)}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-xl h-9 w-9 cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
