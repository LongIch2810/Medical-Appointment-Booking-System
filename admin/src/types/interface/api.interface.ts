export interface ApiResponse<T> {
  statusCode: number;
  success: boolean;
  data: T;
  error: unknown;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationPayload {
  page: number;
  limit: number;
}

export type SortOrder = "asc" | "desc";

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "ABSENT";

export type BookingMode = "user_select" | "ai_select";

export type ComplaintStatus =
  | "pending"
  | "in_progress"
  | "resolved"
  | "rejected";

export type DoctorLevel =
  | "Bác sĩ đa khoa"
  | "Bác sĩ chuyên khoa I"
  | "Bác sĩ chuyên khoa II"
  | "Thạc sĩ"
  | "Tiến sĩ"
  | "Phó Giáo sư"
  | "Giáo sư";
