import type {
  PaginationMeta,
  PaginationPayload,
  SortOrder,
} from "./api.interface";

export type NotificationType =
  | "MANUAL"
  | "APPOINTMENT_CREATED"
  | "APPOINTMENT_CANCELLED"
  | "APPOINTMENT_STATUS_UPDATED"
  | "APPOINTMENT_EXPIRED"
  | "APPOINTMENT_REMINDER";

export interface Notification {
  id: number;
  title: string;
  content: string;
  type: NotificationType;
  isRead: boolean;
  actionUrl: string | null;
  metadata: Record<string, unknown>;
  user?: { id?: number; fullname?: string; email?: string } | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface NotificationListPayload extends PaginationPayload {
  search?: string;
  userId?: number;
  isRead?: boolean;
  fromDate?: string;
  toDate?: string;
  arrange?: SortOrder;
}

export interface MyNotificationListPayload {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: NotificationType;
}

export interface NotificationRecipientListPayload {
  page?: number;
  limit?: number;
  search?: string;
  roleName?: string;
}

export interface NotificationListResponse extends PaginationMeta {
  notifications: Notification[];
}

export interface CreateNotificationPayload {
  title: string;
  content: string;
  userId: number;
  actionUrl?: string;
}

export interface UpdateNotificationPayload {
  title?: string;
  content?: string;
  actionUrl?: string;
}
