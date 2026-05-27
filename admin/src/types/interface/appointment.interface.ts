import type {
  AppointmentStatus,
  BookingMode,
  PaginationMeta,
  PaginationPayload,
} from "./api.interface";

export interface AppointmentParticipant {
  id?: number;
  fullname?: string;
  picture?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface AppointmentExaminationResult {
  id: number;
  symptoms?: string;
  diagnosis?: string;
  treatment?: string;
  prescription?: string;
}

export interface AppointmentSatisfactionRating {
  id: number;
  rating_score: number;
  feedback?: string;
}

export interface Appointment {
  id: number;
  appointment_status: AppointmentStatus;
  status?: AppointmentStatus;
  appointment_date: string;
  booking_mode?: BookingMode;
  start_time?: string;
  end_time?: string;
  symptoms?: string;
  notes?: string;
  doctor?: AppointmentParticipant | null;
  patient?: AppointmentParticipant | null;
  booker?: AppointmentParticipant | null;
  relative?: AppointmentParticipant | null;
  examination_result?: AppointmentExaminationResult | null;
  satisfaction_rating?: AppointmentSatisfactionRating | null;
  created_at?: string;
  updated_at?: string;
}

export interface AppointmentListPayload extends PaginationPayload {
  appointmentStatus?: AppointmentStatus;
  relativeId?: number;
  appointmentDate?: string;
}

export interface AdminAppointmentListPayload extends AppointmentListPayload {
  doctorId?: number;
  bookerId?: number;
}

export interface AppointmentListResponse extends PaginationMeta {
  appointments: Appointment[];
}

export interface CreateAppointmentPayload {
  appointment_date: string;
  doctor_schedule_id: number;
  relative_id: number;
  booking_mode: BookingMode;
}

export interface UpdateAppointmentStatusPayload {
  status: AppointmentStatus;
}
