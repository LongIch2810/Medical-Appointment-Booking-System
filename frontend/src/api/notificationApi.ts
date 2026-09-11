import axiosInstance from "@/configs/axios";
import type { ApiResponse } from "@/types/interface/patient.interface";
import type {
  AppNotification,
  NotificationListData,
  NotificationListParams,
} from "@/types/interface/notification.interface";

export async function fetchMyNotifications(params: NotificationListParams) {
  const response = await axiosInstance.get<ApiResponse<NotificationListData>>(
    "/notifications/me",
    { params },
  );
  return response.data;
}

export async function fetchUnreadNotificationCount() {
  const response = await axiosInstance.get<ApiResponse<{ count: number }>>(
    "/notifications/me/unread-count",
  );
  return response.data;
}

export async function markNotificationAsRead(notificationId: number) {
  const response = await axiosInstance.patch<ApiResponse<AppNotification>>(
    `/notifications/me/${notificationId}/read`,
  );
  return response.data;
}

export async function markAllNotificationsAsRead() {
  const response = await axiosInstance.patch<
    ApiResponse<{ unreadCount: number }>
  >("/notifications/me/read-all");
  return response.data;
}
