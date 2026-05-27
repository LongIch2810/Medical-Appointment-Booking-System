import type { PaginationMeta, PaginationPayload } from "./api.interface";

export interface ExaminationResult {
  id: number;
  diagnosis?: string;
  treatment?: string;
  prescription?: string;
  notes?: string;
  symptoms?: string;
  examined_at?: string | null;
  appointment?: unknown;
  doctor?: { id?: number; fullname?: string } | null;
  patient?: { id?: number; fullname?: string } | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ExaminationResultListPayload extends PaginationPayload {
  search?: string;
  relativeId?: number;
  doctorId?: number;
  date?: string;
  fromDate?: string;
  toDate?: string;
}

export interface ExaminationResultListResponse extends PaginationMeta {
  examinationResults: ExaminationResult[];
}

export interface CreateExaminationResultPayload {
  appointment_id: number;
  symptoms: string;
  diagnosis: string;
  treatment: string;
  prescription: string;
}

export interface UpdateExaminationResultPayload {
  symptoms?: string;
  diagnosis?: string;
  treatment?: string;
  prescription?: string;
}
