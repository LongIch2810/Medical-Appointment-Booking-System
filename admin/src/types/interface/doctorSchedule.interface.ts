export interface DoctorSchedule {
  id: number;
  doctor_id: number;
  day_of_week?: string;
  start_time?: string;
  end_time?: string;
  is_active?: boolean;
  appointment_date?: string;
  duration?: number;
  notes?: string;
  created_at?: string | null;
  updated_at?: string | null;
}

export type GroupedDoctorSchedules = Record<
  string,
  Pick<DoctorSchedule, "id" | "start_time" | "end_time" | "is_active">[]
>;

export interface CreateDoctorSchedulePayload {
  appointment_date: string;
  start_time: string;
  end_time: string;
  duration?: number;
  notes?: string;
}

export type UpdateDoctorSchedulePayload = Partial<CreateDoctorSchedulePayload>;
