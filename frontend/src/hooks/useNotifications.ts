import {
  fetchMyNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/api/notificationApi";
import type { NotificationListParams } from "@/types/interface/notification.interface";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
