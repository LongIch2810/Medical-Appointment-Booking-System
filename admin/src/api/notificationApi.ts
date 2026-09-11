import axiosInstance from "@/configs/axios";
import type { ApiResponse } from "@/types/interface/api.interface";
import { normalizeUserListResponse } from "@/api/userApi";
import type { UserListResponse } from "@/types/interface/user.interface";
import type {
  CreateNotificationPayload,
  MyNotificationListPayload,
  Notification,
  NotificationListPayload,
  NotificationListResponse,
  NotificationRecipientListPayload,
  UpdateNotificationPayload,
} from "@/types/interface/notification.interface";

export async function fetchNotificationRecipients(
  params: NotificationRecipientListPayload,
) {
  const response = await axiosInstance.get<ApiResponse<UserListResponse>>(
    "/notifications/recipients",
    { params },
  );
  return {
    ...response.data,
    data: normalizeUserListResponse(response.data.data),
  };
}

export async function fetchNotifications(data: NotificationListPayload) {
  const response = await axiosInstance.post<
    ApiResponse<NotificationListResponse>
  >("/notifications", data);
  return response.data;
}

export async function fetchNotificationDetail(notificationId: number) {
  const response = await axiosInstance.get<ApiResponse<Notification>>(
    `/notifications/${notificationId}`,
  );
  return response.data;
}

export async function createNotification(data: CreateNotificationPayload) {
  const response = await axiosInstance.post<ApiResponse<Notification>>(
    "/notifications/create",
    data,
  );
  return response.data;
}

export async function updateNotification(
  notificationId: number,
  data: UpdateNotificationPayload,
) {
  const response = await axiosInstance.patch<ApiResponse<Notification>>(
    `/notifications/${notificationId}`,
    data,
  );
  return response.data;
}

export async function deleteNotification(notificationId: number) {
  const response = await axiosInstance.delete<ApiResponse<{ message: string }>>(
    `/notifications/${notificationId}`,
  );
  return response.data;
}

export async function fetchMyNotifications(params: MyNotificationListPayload) {
  const response = await axiosInstance.get<
    ApiResponse<NotificationListResponse>
  >("/notifications/me", { params });
  return response.data;
}

export async function fetchUnreadNotificationCount() {
  const response = await axiosInstance.get<ApiResponse<{ count: number }>>(
    "/notifications/me/unread-count",
  );
  return response.data;
}

export async function markMyNotificationAsRead(notificationId: number) {
  const response = await axiosInstance.patch<ApiResponse<Notification>>(
    `/notifications/me/${notificationId}/read`,
  );
  return response.data;
}

export async function markAllMyNotificationsAsRead() {
  const response = await axiosInstance.patch<
    ApiResponse<{ unreadCount: number }>
  >("/notifications/me/read-all");
  return response.data;
}
