import type { PaginationMeta, PaginationPayload } from "./api.interface";

export interface SatisfactionRating {
  id: number;
  rating: number;
  rating_score?: number;
  comment?: string | null;
  feedback?: string | null;
  doctor?: { id?: number; fullname?: string } | null;
  patient?: { id?: number; fullname?: string } | null;
  appointment_id?: number | null;
  appointment?: unknown;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface SatisfactionRatingListPayload extends PaginationPayload {
  search?: string;
  doctorId?: number;
  minRating?: number;
  maxRating?: number;
  fromDate?: string;
  toDate?: string;
}

export interface SatisfactionRatingListResponse extends PaginationMeta {
  satisfactionRatings: SatisfactionRating[];
}

export interface CreateSatisfactionRatingPayload {
  appointment_id: number;
  rating: number;
  comment?: string;
}

export interface UpdateSatisfactionRatingPayload {
  rating?: number;
  comment?: string;
}
