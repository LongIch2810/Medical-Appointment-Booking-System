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

function isInternalPath(path: string | null): path is string {
  return Boolean(path && /^\/(?!\/)/.test(path));
}

export default function Notifications() {
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
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">Thông báo</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Bạn có {unreadQuery.data?.data.count ?? 0} thông báo chưa đọc.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={markAll.isPending || (unreadQuery.data?.data.count ?? 0) === 0}
          onClick={() => markAll.mutate()}
          className="gap-2 rounded-xl"
        >
          <CheckCheck className="h-4 w-4" />
          Đánh dấu tất cả đã đọc
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant={unreadOnly ? "outline" : "default"}
          onClick={() => {
            setUnreadOnly(false);
            setPage(1);
          }}
          className="rounded-xl"
        >
          Tất cả
        </Button>
        <Button
          size="sm"
          variant={unreadOnly ? "default" : "outline"}
          onClick={() => {
            setUnreadOnly(true);
            setPage(1);
          }}
          className="rounded-xl"
        >
          Chưa đọc
        </Button>
      </div>

      {query.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : !data?.notifications.length ? (
        <StateCard
          icon={<Bell className="h-8 w-8" />}
          title="Chưa có thông báo"
          description={
            unreadOnly
              ? "Bạn đã đọc tất cả thông báo."
              : "Thông báo lịch hẹn và thông tin từ hệ thống sẽ xuất hiện tại đây."
          }
        />
      ) : (
        <div className="space-y-3">
          {data.notifications.map((notification) => (
            <Card
              key={notification.id}
              onClick={() => void openNotification(notification)}
              className={`cursor-pointer rounded-2xl border transition-colors hover:border-primary/30 ${
                notification.isRead
                  ? "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                  : "border-primary/20 bg-primary/5 dark:border-primary/40 dark:bg-primary/10"
              }`}
            >
              <CardContent className="flex gap-3 p-4 sm:p-5">
                <span
                  className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${
                    notification.isRead ? "bg-slate-200 dark:bg-slate-700" : "bg-primary"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100">
                      {notification.title}
                    </h3>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {notification.createdAt}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {notification.content}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {(data?.totalPages ?? 0) > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
            className="rounded-xl"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Trang {page}/{data?.totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={page >= (data?.totalPages ?? 1)}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-xl"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
