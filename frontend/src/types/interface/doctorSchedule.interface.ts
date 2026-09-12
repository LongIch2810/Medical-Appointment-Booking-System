import type { AppointmentStatus } from "./patient.interface";

export interface DoctorScheduleAppointmentSlot {
  id: number;
  appointment_date: string;
  status: AppointmentStatus;
}

export interface DoctorSchedule {
  id: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  appointments: DoctorScheduleAppointmentSlot[];
}
