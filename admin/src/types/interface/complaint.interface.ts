import type {
  ComplaintStatus,
  PaginationMeta,
  PaginationPayload,
  SortOrder,
} from "./api.interface";

export interface ComplaintUser {
  id?: number;
  fullname?: string;
  email?: string;
  picture?: string | null;
}

export interface Complaint {
  id: number;
  title: string;
  description: string;
  complaint_status: ComplaintStatus;
  response?: string | null;
  user?: ComplaintUser | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ComplaintListPayload extends PaginationPayload {
  search?: string;
  status?: ComplaintStatus;
  userId?: number;
  fromDate?: string;
  toDate?: string;
  arrange?: SortOrder;
}

export interface ComplaintListResponse extends PaginationMeta {
  complaints: Complaint[];
}

export interface CreateComplaintPayload {
  title: string;
  description: string;
  userId?: number;
}

export interface UpdateComplaintPayload {
  title?: string;
  description?: string;
  status?: ComplaintStatus;
  response?: string;
}
