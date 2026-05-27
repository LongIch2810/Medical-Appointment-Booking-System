import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  createNotification,
  deleteNotification,
  fetchNotificationDetail,
  fetchNotifications,
  markNotificationAsNotified,
  updateNotification,
} from "@/api/notificationApi";
import type {
  NotificationListPayload,
  UpdateNotificationPayload,
} from "@/types/interface/notification.interface";

export const notificationQueryKeys = {
  list: (filters: NotificationListPayload) =>
    ["notifications", filters] as const,
  detail: (notificationId: number) =>
    ["notification-detail", notificationId] as const,
};

export function useNotifications(filters: NotificationListPayload) {
  return useQuery({
    queryKey: notificationQueryKeys.list(filters),
    queryFn: () => fetchNotifications(filters),
  });
}

export function useNotificationDetail(notificationId: number) {
  return useQuery({
    queryKey: notificationQueryKeys.detail(notificationId),
    queryFn: () => fetchNotificationDetail(notificationId),
    enabled: notificationId > 0,
  });
}

export function useCreateNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createNotification,
    onSuccess: () => {
      toast.success("Tạo thông báo thành công");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: () => {
      toast.error("Tạo thông báo thất bại");
    },
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
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.detail(variables.notificationId),
      });
    },
    onError: () => {
      toast.error("Cập nhật thông báo thất bại");
    },
  });
}

export function useMarkNotificationAsNotified() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationAsNotified,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      toast.success("Xóa thông báo thành công");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: () => {
      toast.error("Xóa thông báo thất bại");
    },
  });
}
