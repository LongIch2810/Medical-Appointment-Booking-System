import { CheckCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { EmptyState } from "@/components/app/EmptyState";
import { ErrorState } from "@/components/app/ErrorState";
import { LoadingState } from "@/components/app/LoadingState";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  useMarkAllMyNotificationsAsRead,
  useMarkMyNotificationAsRead,
  useMyNotifications,
  useUnreadNotificationCount,
} from "@/hooks/useNotifications";
import type { Notification } from "@/types/interface/notification.interface";

function isInternalPath(path: string | null): path is string {
  return Boolean(path && /^\/(?!\/)/.test(path));
}

export function MyNotificationsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const notificationsQuery = useMyNotifications({
    page,
    limit: 10,
    ...(unreadOnly ? { isRead: false } : {}),
  });
  const unreadQuery = useUnreadNotificationCount();
  const markRead = useMarkMyNotificationAsRead();
  const markAll = useMarkAllMyNotificationsAsRead();
  const data = notificationsQuery.data?.data;

  const openNotification = async (notification: Notification) => {
    if (!notification.isRead) {
      await markRead.mutateAsync(notification.id);
    }
    if (isInternalPath(notification.actionUrl)) {
      navigate(notification.actionUrl);
    }
  };

  if (notificationsQuery.isError) {
    return <ErrorState onRetry={() => void notificationsQuery.refetch()} />;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Thông báo của tôi"
        description={`Bạn có ${unreadQuery.data?.data.count ?? 0} thông báo chưa đọc.`}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={unreadOnly ? "outline" : "default"}
            onClick={() => {
              setUnreadOnly(false);
              setPage(1);
            }}
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
          >
            Chưa đọc
          </Button>
        </div>
        <Button
          variant="outline"
          disabled={markAll.isPending || (unreadQuery.data?.data.count ?? 0) === 0}
          onClick={() => markAll.mutate()}
        >
          <CheckCheck />
          Đánh dấu tất cả đã đọc
        </Button>
      </div>

      {notificationsQuery.isLoading ? (
        <LoadingState label="Đang tải thông báo..." />
      ) : !data?.notifications.length ? (
        <EmptyState
          title="Chưa có thông báo"
          description={
            unreadOnly
              ? "Bạn đã đọc tất cả thông báo."
              : "Thông báo lịch hẹn và vận hành sẽ xuất hiện tại đây."
          }
        />
      ) : (
        <div className="space-y-3">
          {data.notifications.map((notification) => (
            <Card
              key={notification.id}
              role="button"
              tabIndex={0}
              onClick={() => void openNotification(notification)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  void openNotification(notification);
                }
              }}
              className={`cursor-pointer hover:border-primary/30 ${
                notification.isRead ? "" : "border-primary/20 bg-primary/5"
              }`}
            >
              <CardContent className="flex gap-3 py-5">
                <span
                  className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${
                    notification.isRead ? "bg-slate-300 dark:bg-slate-600" : "bg-primary"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100">{notification.title}</h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
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

      {(data?.totalPages ?? 0) > 1 ? (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
            aria-label="Trang trước"
          >
            <ChevronLeft />
          </Button>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Trang {page}/{data?.totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={page >= (data?.totalPages ?? 1)}
            onClick={() => setPage((current) => current + 1)}
            aria-label="Trang sau"
          >
            <ChevronRight />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
