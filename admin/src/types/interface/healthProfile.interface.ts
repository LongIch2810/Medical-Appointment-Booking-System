import type { PaginationMeta, PaginationPayload } from "./api.interface";

export interface HealthProfile {
  id: number;
  blood_type?: string | null;
  height?: number | null;
  weight?: number | null;
  allergies?: string | null;
  medical_history?: string | null;
  patient?: {
    id?: number;
    fullname?: string;
    relationship?: {
      relationship_code?: string;
      relationship_name?: string;
      name?: string;
    } | null;
  } | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface HealthProfileListPayload extends PaginationPayload {
  search?: string;
}

export interface HealthProfileListResponse extends PaginationMeta {
  healthProfiles: HealthProfile[];
}

export interface UpdateHealthProfilePayload {
  blood_type?: string;
  height?: number;
  weight?: number;
  allergies?: string;
  medical_history?: string;
}
