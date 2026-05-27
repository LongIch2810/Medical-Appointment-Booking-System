import type {
  DoctorLevel,
  PaginationMeta,
  PaginationPayload,
} from "./api.interface";

export interface DoctorSpecialtySummary {
  id?: number;
  name?: string | null;
  specialty_name?: string | null;
  description?: string | null;
  img_url?: string | null;
  slug?: string | null;
}

export interface Doctor {
  id: number;
  user_id: number;
  fullname: string;
  picture: string | null;
  workplace: string;
  experience: number;
  doctor_level: DoctorLevel | string;
  avg_rating: number;
  appointments_completed: number;
  specialty: string | DoctorSpecialtySummary | null;
  address: string;
  phone: string;
  isOutstanding: boolean;
  about_me?: string;
  email?: string;
  gender?: boolean;
  date_of_birth?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DoctorListPayload extends PaginationPayload {
  specialty_id?: number;
  min_experience?: number;
  max_experience?: number;
  workplace?: string;
  area?: string;
  search?: string;
}

export interface DoctorListResponse extends PaginationMeta {
  doctors: Doctor[];
}

export interface CreateDoctorPayload {
  user_id: number;
  specialty_id: number;
  experience: number;
  about_me: string;
  workplace: string;
  doctor_level: DoctorLevel | string;
}

export interface UpdateDoctorPayload {
  specialty_id?: number;
  experience?: number;
  about_me?: string;
  workplace?: string;
  doctor_level?: DoctorLevel | string;
}
