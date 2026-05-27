import type { PaginationMeta, PaginationPayload, SortOrder } from "./api.interface";

export interface Notification {
  id: number;
  title: string;
  content: string;
  isNotified: boolean;
  is_notified?: boolean;
  user?: { id?: number; fullname?: string; email?: string } | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface NotificationListPayload extends PaginationPayload {
  search?: string;
  userId?: number;
  isNotified?: boolean;
  fromDate?: string;
  toDate?: string;
  arrange?: SortOrder;
}

export interface NotificationListResponse extends PaginationMeta {
  notifications: Notification[];
}

export interface CreateNotificationPayload {
  title: string;
  content: string;
  userId: number;
  isNotified?: boolean;
}

export interface UpdateNotificationPayload {
  title?: string;
  content?: string;
  isNotified?: boolean;
}
