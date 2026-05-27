import type { PaginationMeta, PaginationPayload, SortOrder } from "./api.interface";

export interface Relationship {
  relationship_code: string;
  relationship_name?: string;
  /** Backwards-compat alias. */
  name?: string;
  description?: string | null;
}

export interface Relative {
  id: number;
  fullname: string;
  phone?: string | null;
  date_of_birth?: string | null;
  gender?: boolean;
  picture?: string | null;
  relationship?: Relationship | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface RelativeListPayload extends PaginationPayload {
  search?: string;
  relationshipCode?: string;
  arrange?: SortOrder;
}

export interface RelativeListResponse extends PaginationMeta {
  relatives: Relative[];
}

export interface CreateRelativePayload {
  fullname: string;
  phone?: string;
  date_of_birth?: string;
  gender?: boolean;
  relationship_code: string;
}

export interface UpdateRelativePayload {
  fullname?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: boolean;
  relationship_code?: string;
}
