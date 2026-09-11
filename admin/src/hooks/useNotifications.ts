import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  createNotification,
  deleteNotification,
  fetchMyNotifications,
  fetchNotificationDetail,
  fetchNotificationRecipients,
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllMyNotificationsAsRead,
  markMyNotificationAsRead,
  updateNotification,
} from "@/api/notificationApi";
import type {
  MyNotificationListPayload,
  NotificationListPayload,
  NotificationRecipientListPayload,
  UpdateNotificationPayload,
} from "@/types/interface/notification.interface";

export const notificationQueryKeys = {
  all: ["notifications"] as const,
  list: (filters: NotificationListPayload) =>
    [...notificationQueryKeys.all, "management", filters] as const,
  detail: (notificationId: number) =>
    [...notificationQueryKeys.all, "detail", notificationId] as const,
  mine: (filters: MyNotificationListPayload) =>
    [...notificationQueryKeys.all, "mine", filters] as const,
  unread: () => [...notificationQueryKeys.all, "unread-count"] as const,
  recipients: (filters: NotificationRecipientListPayload) =>
    [...notificationQueryKeys.all, "recipients", filters] as const,
  infiniteRecipients: (
    filters: Omit<NotificationRecipientListPayload, "page">,
  ) => [...notificationQueryKeys.all, "recipients", "infinite", filters] as const,
};

export function useNotifications(filters: NotificationListPayload) {
  return useQuery({
    queryKey: notificationQueryKeys.list(filters),
    queryFn: () => fetchNotifications(filters),
  });
}

export function useNotificationRecipients(
  filters: NotificationRecipientListPayload,
) {
  return useQuery({
    queryKey: notificationQueryKeys.recipients(filters),
    queryFn: () => fetchNotificationRecipients(filters),
  });
}

export function useInfiniteNotificationRecipients(
  filters: Omit<NotificationRecipientListPayload, "page">,
) {
  return useInfiniteQuery({
    queryKey: notificationQueryKeys.infiniteRecipients(filters),
    queryFn: ({ pageParam }) =>
      fetchNotificationRecipients({ ...filters, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.data;
      return page < totalPages ? page + 1 : undefined;
    },
  });
}

export function useNotificationDetail(notificationId: number) {
  return useQuery({
    queryKey: notificationQueryKeys.detail(notificationId),
    queryFn: () => fetchNotificationDetail(notificationId),
    enabled: notificationId > 0,
  });
}

export function useMyNotifications(
  filters: MyNotificationListPayload,
  enabled = true,
) {
  return useQuery({
    queryKey: notificationQueryKeys.mine(filters),
    queryFn: () => fetchMyNotifications(filters),
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

export function useCreateNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createNotification,
    onSuccess: () => {
      toast.success("Tạo thông báo thành công");
      void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
    },
    onError: () => toast.error("Tạo thông báo thất bại"),
  });
}

export function useUpdateNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      notificationId,
      payload,
    }: {
      notificationId: number;
      payload: UpdateNotificationPayload;
    }) => updateNotification(notificationId, payload),
    onSuccess: (_, variables) => {
      toast.success("Cập nhật thông báo thành công");
      void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
      void queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.detail(variables.notificationId),
      });
    },
    onError: () => toast.error("Cập nhật thông báo thất bại"),
  });
}

export function useMarkMyNotificationAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markMyNotificationAsRead,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all }),
  });
}

export function useMarkAllMyNotificationsAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllMyNotificationsAsRead,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all }),
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      toast.success("Xóa thông báo thành công");
      void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
    },
    onError: () => toast.error("Xóa thông báo thất bại"),
  });
}
