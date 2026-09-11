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
  useMarkNotificationAsRead,
  useMyNotifications,
  useUnreadNotificationCount,
} from "@/hooks/useNotifications";
import type { AppNotification } from "@/types/interface/notification.interface";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

function isInternalPath(path: string | null): path is string {
  return Boolean(path && /^\/(?!\/)/.test(path));
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const notificationsQuery = useMyNotifications({ page: 1, limit: 5 });
  const unreadQuery = useUnreadNotificationCount();
  const markRead = useMarkNotificationAsRead();
  const markAll = useMarkAllNotificationsAsRead();
  const notifications = notificationsQuery.data?.data.notifications ?? [];
  const unreadCount = unreadQuery.data?.data.count ?? 0;

  const openNotification = async (notification: AppNotification) => {
    if (!notification.isRead) {
      await markRead.mutateAsync(notification.id);
    }
    if (isInternalPath(notification.actionUrl)) {
      navigate(notification.actionUrl);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="relative h-10 w-10 rounded-xl border-slate-200 bg-white"
          aria-label={`Thông báo, ${unreadCount} chưa đọc`}
        >
          <Bell className="h-4.5 w-4.5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 min-w-5 rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-5 text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[min(92vw,380px)] rounded-2xl border-slate-200 p-2 shadow-xl"
      >
        <div className="flex items-center justify-between gap-3 px-2 py-1.5">
          <DropdownMenuLabel className="p-0 text-sm font-bold">
            Thông báo
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={markAll.isPending}
              onClick={() => markAll.mutate()}
              className="h-8 gap-1.5 text-[11px] text-primary"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Đọc tất cả
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notificationsQuery.isLoading ? (
          <div className="flex items-center justify-center py-8 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <p className="px-3 py-8 text-center text-xs text-slate-500">
            Chưa có thông báo nào.
          </p>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              onClick={() => void openNotification(notification)}
              className="mb-1 cursor-pointer items-start gap-2 rounded-xl p-3 focus:bg-slate-50"
            >
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                  notification.isRead ? "bg-slate-200" : "bg-primary"
                }`}
              />
              <span className="min-w-0">
                <span className="block text-xs font-bold text-slate-800">
                  {notification.title}
                </span>
                <span className="mt-0.5 line-clamp-2 block text-[11px] leading-4 text-slate-500">
                  {notification.content}
                </span>
                <span className="mt-1 block text-[10px] text-slate-400">
                  {notification.createdAt}
                </span>
              </span>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => navigate("/patient/notifications")}
          className="cursor-pointer justify-center rounded-xl py-2 text-xs font-semibold text-primary"
        >
          Xem tất cả thông báo
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
