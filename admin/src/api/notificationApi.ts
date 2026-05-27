import axiosInstance from "@/configs/axios";
import type { ApiResponse } from "@/types/interface/api.interface";
import type {
  CreateNotificationPayload,
  Notification,
  NotificationListPayload,
  NotificationListResponse,
  UpdateNotificationPayload,
} from "@/types/interface/notification.interface";

function normalizeNotification(notification: Notification): Notification {
  return {
    ...notification,
    isNotified: notification.isNotified ?? notification.is_notified ?? false,
  };
}

function normalizeNotificationListResponse(
  data: NotificationListResponse,
): NotificationListResponse {
  return {
    ...data,
    notifications: data.notifications.map(normalizeNotification),
  };
}

export const fetchNotifications = async (data: NotificationListPayload) => {
  const res = await axiosInstance.post<ApiResponse<NotificationListResponse>>(
    "/notifications",
    data,
  );
  return {
    ...res.data,
    data: normalizeNotificationListResponse(res.data.data),
  };
};

export const fetchNotificationDetail = async (notificationId: number) => {
  const res = await axiosInstance.get<ApiResponse<Notification>>(
    `/notifications/${notificationId}`,
  );
  return {
    ...res.data,
    data: normalizeNotification(res.data.data),
  };
};

export const createNotification = async (data: CreateNotificationPayload) => {
  const res = await axiosInstance.post<ApiResponse<Notification>>(
    "/notifications/create",
    data,
  );
  return {
    ...res.data,
    data: normalizeNotification(res.data.data),
  };
};

export const updateNotification = async (
  notificationId: number,
  data: UpdateNotificationPayload,
) => {
  const res = await axiosInstance.patch<ApiResponse<Notification>>(
    `/notifications/${notificationId}`,
    data,
  );
  return {
    ...res.data,
    data: normalizeNotification(res.data.data),
  };
};

export const markNotificationAsNotified = async (notificationId: number) => {
  const res = await axiosInstance.patch<ApiResponse<Notification>>(
    `/notifications/${notificationId}/notified`,
  );
  return {
    ...res.data,
    data: normalizeNotification(res.data.data),
  };
};

export const deleteNotification = async (notificationId: number) => {
  const res = await axiosInstance.delete<ApiResponse<{ message: string }>>(
    `/notifications/${notificationId}`,
  );
  return res.data;
};
