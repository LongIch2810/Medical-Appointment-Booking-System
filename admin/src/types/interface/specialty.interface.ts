import type { PaginationMeta, PaginationPayload, SortOrder } from "./api.interface";

export interface Specialty {
  id: number;
  name: string;
  description: string;
  img_url: string | null;
  slug?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface SpecialtyListPayload extends PaginationPayload {
  search?: string;
  arrange?: SortOrder;
}

export interface SpecialtyListResponse extends PaginationMeta {
  specialties: Specialty[];
}

export interface UpdateSpecialtyPayload {
  name?: string;
  description?: string;
  img_url?: string;
}
