import type { PaginationMeta, PaginationPayload, SortOrder } from "./api.interface";

export interface Relationship {
  relationship_code: string;
  relationship_name?: string;
  /** Backwards-compat alias do trước đây admin dùng `name`. */
  name?: string;
  description?: string | null;
}

export interface RelationshipListPayload extends PaginationPayload {
  search?: string;
  arrange?: SortOrder;
}

export interface RelationshipListResponse extends PaginationMeta {
  relationships: Relationship[];
}

export interface CreateRelationshipPayload {
  relationship_code: string;
  relationship_name: string;
  description?: string;
}

export interface UpdateRelationshipPayload {
  relationship_name?: string;
  description?: string;
}
