import type { Appointment } from "./appointment.interface";

export interface PatientDashboardHealthProfileDto {
  id: number;
  weight: number | null;
  height: number | null;
  blood_type: string | null;
  medical_history: string | null;
  allergies: string | null;
  heart_rate: number | null;
  blood_pressure: string | null;
  glucose_level: number | null;
  cholesterol_level: number | null;
  medications: string | null;
  vaccinations: string | null;
  smoking: boolean | null;
  alcohol_consumption: boolean | null;
  exercise_frequency: string | null;
  last_checkup_date: string | null;
  patient?: {
    id?: number;
    fullname?: string;
    relationship?: {
      relationship_code?: string;
      relationship_name?: string;
      name?: string;
    } | null;
  } | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface PatientDashboardResponseDto {
  healthProfilesCount: number;
  upcomingAppointmentsCount: number;
  relativesCount: number;
  examinationResultsCount: number;
  personalHealthProfile: PatientDashboardHealthProfileDto | null;
}

export interface DoctorDashboardResponseDto {
  totalAppointmentsToDayCount: number;
  upcomingAppointmentsCount: number;
  totalMessagesUnreadInAllChannelsCount: number;
  appointmentToDayEarly: Appointment | null;
}

export interface AdminDashboardResponseDto {
  totalUsersCount: number;
  totalDoctorsActiveCount: number;
  totalPatientsActiveCount: number;
  totalAppointmentsToDayCount: number;
  totalAppointmentsToDayCancelled: number;
}

// Backwards compatible aliases used by existing api/hooks code.
export type PatientDashboardHealthProfile = PatientDashboardHealthProfileDto;
export type PatientDashboard = PatientDashboardResponseDto;
export type DoctorDashboard = DoctorDashboardResponseDto;
export type AdminDashboard = AdminDashboardResponseDto;
