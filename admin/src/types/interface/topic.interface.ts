import type { PaginationMeta, PaginationPayload, SortOrder } from "./api.interface";

export interface Topic {
  id: number;
  name: string;
  description: string;
  slug?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface TopicListPayload extends PaginationPayload {
  search?: string;
  arrange?: SortOrder;
}

export interface TopicListResponse extends PaginationMeta {
  topics: Topic[];
}

export interface CreateTopicPayload {
  name: string;
  description: string;
}

export interface UpdateTopicPayload {
  name?: string;
  description?: string;
}
