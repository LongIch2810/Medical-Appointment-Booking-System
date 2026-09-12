import {
  fetchMyNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/api/notificationApi";
import type {
  AppNotification,
  NotificationListParams,
} from "@/types/interface/notification.interface";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

export const notificationQueryKeys = {
  all: ["my-notifications"] as const,
  list: (params: NotificationListParams) =>
    [...notificationQueryKeys.all, "list", params] as const,
  unread: () => [...notificationQueryKeys.all, "unread-count"] as const,
};

export function useMyNotifications(
  params: NotificationListParams,
  enabled = true,
) {
  return useQuery({
    queryKey: notificationQueryKeys.list(params),
    queryFn: () => fetchMyNotifications(params),
    enabled,
  });
}

export function useUnreadNotificationCount(enabled = true) {
  return useQuery({
    queryKey: notificationQueryKeys.unread(),
    queryFn: fetchUnreadNotificationCount,
    enabled,
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all }),
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all }),
  });
}

export function isInternalPath(path: string | null): path is string {
  return Boolean(path && /^\/(?!\/)/.test(path));
}

export function useOpenNotification() {
  const navigate = useNavigate();
  const markRead = useMarkNotificationAsRead();

  return useCallback(
    async (notification: AppNotification) => {
      if (!notification.isRead) {
        await markRead.mutateAsync(notification.id);
      }
      if (isInternalPath(notification.actionUrl)) {
        navigate(notification.actionUrl);
      }
    },
    [markRead, navigate],
  );
}
