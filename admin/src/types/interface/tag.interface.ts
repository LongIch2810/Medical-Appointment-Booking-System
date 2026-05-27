import type { PaginationMeta, PaginationPayload, SortOrder } from "./api.interface";

export interface Tag {
  id: number;
  name: string;
  slug?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface TagListPayload extends PaginationPayload {
  search?: string;
  arrange?: SortOrder;
}

export interface TagListResponse extends PaginationMeta {
  tags: Tag[];
}

export interface CreateTagPayload {
  name: string;
}

export interface UpdateTagPayload {
  name?: string;
}
