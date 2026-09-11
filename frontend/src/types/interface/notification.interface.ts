export type NotificationType =
  | "MANUAL"
  | "APPOINTMENT_CREATED"
  | "APPOINTMENT_CANCELLED"
  | "APPOINTMENT_STATUS_UPDATED"
  | "APPOINTMENT_EXPIRED"
  | "APPOINTMENT_REMINDER";

export interface AppNotification {
  id: number;
  title: string;
  content: string;
  type: NotificationType;
  isRead: boolean;
  actionUrl: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListData {
  notifications: AppNotification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NotificationListParams {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: NotificationType;
}
